<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendAnnouncementEmail;
use App\Models\Announcement;
use App\Models\Plan;
use App\Models\Tenant;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public const CATEGORIES = ['general', 'billing', 'usage', 'feature', 'advert', 'maintenance'];
    public const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    public const CHANNELS = ['in_app', 'email'];

    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));
        $status = (string) $request->input('status', '');
        $category = (string) $request->input('category', '');

        $paginator = Announcement::query()
            ->withCount('reads')
            ->when($query !== '', fn ($q) => $q->where(function ($sub) use ($query) {
                $like = "%{$query}%";
                $sub->where('title', 'ILIKE', $like)->orWhere('body', 'ILIKE', $like);
            }))
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($category !== '', fn ($q) => $q->where('category', $category))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Announcement $a) => $this->serialize($a));

        return Inertia::render('admin/Announcements', [
            'announcements' => $paginator,
            'filters' => ['q' => $query, 'status' => $status, 'category' => $category],
            'tenants' => Tenant::query()
                ->orderByRaw("data->>'name'")
                ->get()
                ->map(fn (Tenant $t) => [
                    'id' => $t->id,
                    'name' => $t->name ?? $t->id,
                ])
                ->all(),
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name'])->all(),
            'categories' => self::CATEGORIES,
            'stats' => [
                'total' => Announcement::count(),
                'published' => Announcement::where('status', 'published')->count(),
                'draft' => Announcement::where('status', 'draft')->count(),
                'scheduled' => Announcement::where('status', 'scheduled')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateAnnouncement($request);

        $data['created_by'] = Auth::guard('super_admin')->id();
        $data['status'] = $this->resolveStatus($data);

        if ($data['status'] === 'published') {
            $data['published_at'] = now();
        }

        $announcement = Announcement::create($data);

        if ($announcement->status === 'published') {
            $this->dispatchEmails($announcement);
        }

        AuditLogger::log('announcement.created', [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'status' => $announcement->status,
            'category' => $announcement->category,
        ], $announcement);

        return redirect()
            ->route('admin.announcements.index')
            ->with('success', "Announcement \"{$announcement->title}\" created.");
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $wasDraft = $announcement->status !== 'published';
        $data = $this->validateAnnouncement($request);
        $data['status'] = $this->resolveStatus($data, $announcement);

        if ($data['status'] === 'published' && ! $announcement->published_at) {
            $data['published_at'] = now();
        }

        $announcement->update($data);

        // Fire emails only on the transition from non-published to published
        if ($wasDraft && $announcement->status === 'published') {
            $this->dispatchEmails($announcement);
        }

        AuditLogger::log('announcement.updated', [
            'id' => $announcement->id,
            'status' => $announcement->status,
        ], $announcement);

        return back()->with('success', 'Announcement updated.');
    }

    public function publish(Announcement $announcement): RedirectResponse
    {
        if ($announcement->status === 'published') {
            return back()->with('success', 'Announcement was already published.');
        }

        $announcement->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->dispatchEmails($announcement);

        AuditLogger::log('announcement.published', [
            'id' => $announcement->id,
            'title' => $announcement->title,
        ], $announcement);

        return back()->with('success', 'Announcement published.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $title = $announcement->title;
        $id = $announcement->id;
        $announcement->delete();

        AuditLogger::log('announcement.deleted', ['id' => $id, 'title' => $title]);

        return back()->with('success', "Announcement \"{$title}\" deleted.");
    }

    private function validateAnnouncement(Request $request): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'target_type' => ['required', Rule::in(['all', 'plan', 'tenant'])],
            'target_ids' => ['array'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => [Rule::in(self::CHANNELS)],
            'scheduled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'publish_now' => ['boolean'],
        ];

        $data = $request->validate($rules);

        // Type-check target_ids based on the targeting mode
        $targetType = $data['target_type'];
        $targetIds = $data['target_ids'] ?? [];

        if ($targetType === 'plan' && ! empty($targetIds)) {
            $request->validate([
                'target_ids.*' => ['integer', 'exists:plans,id'],
            ]);
            $data['target_ids'] = array_map('intval', $targetIds);
        } elseif ($targetType === 'tenant' && ! empty($targetIds)) {
            $request->validate([
                'target_ids.*' => ['string'],
            ]);
            $data['target_ids'] = array_values(array_map('strval', $targetIds));
        } else {
            // 'all' targeting ignores target_ids
            $data['target_ids'] = [];
        }

        return $data;
    }

    private function resolveStatus(array $data, ?Announcement $existing = null): string
    {
        if (! empty($data['publish_now'])) {
            return 'published';
        }
        if (! empty($data['scheduled_at'])) {
            return 'scheduled';
        }
        return $existing->status ?? 'draft';
    }

    private function dispatchEmails(Announcement $announcement): void
    {
        if (! in_array('email', $announcement->channels ?? [], true)) {
            return;
        }

        $tenantIds = $this->recipientTenantIds($announcement);

        foreach ($tenantIds as $tenantId) {
            SendAnnouncementEmail::dispatch($announcement, $tenantId);
        }

        AuditLogger::log('announcement.emails.dispatched', [
            'id' => $announcement->id,
            'count' => count($tenantIds),
        ], $announcement);
    }

    private function recipientTenantIds(Announcement $a): array
    {
        return match ($a->target_type) {
            'all' => Tenant::pluck('id')->all(),
            'plan' => Tenant::whereIn('plan_id', $a->target_ids ?? [])
                ->pluck('id')
                ->all(),
            'tenant' => Tenant::whereIn('id', $a->target_ids ?? [])
                ->pluck('id')
                ->all(),
            default => [],
        };
    }

    private function serialize(Announcement $a): array
    {
        $recipients = match ($a->target_type) {
            'all' => Tenant::count(),
            'plan' => Tenant::whereIn('plan_id', $a->target_ids ?? [])->count(),
            'tenant' => count($a->target_ids ?? []),
            default => 0,
        };

        return [
            'id' => $a->id,
            'title' => $a->title,
            'body' => $a->body,
            'category' => $a->category,
            'priority' => $a->priority,
            'status' => $a->status,
            'target_type' => $a->target_type,
            'target_ids' => $a->target_ids ?? [],
            'channels' => $a->channels ?? [],
            'scheduled_at' => $a->scheduled_at?->toIso8601String(),
            'published_at' => $a->published_at?->toIso8601String(),
            'expires_at' => $a->expires_at?->toIso8601String(),
            'created_at' => $a->created_at?->toIso8601String(),
            'reads_count' => $a->reads_count ?? 0,
            'recipients_count' => $recipients,
            'emails_sent' => $a->emails_sent ?? 0,
            'emails_failed' => $a->emails_failed ?? 0,
        ];
    }
}