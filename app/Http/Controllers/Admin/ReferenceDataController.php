<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncReferenceRegistry;
use App\Models\ReferenceRecord;
use App\Models\ReferenceSyncJob;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReferenceDataController extends Controller
{
    public function index(): Response
    {
        $registries = config('reference.registries', []);

        $counts = ReferenceRecord::query()
            ->selectRaw('registry_key, COUNT(*) as total')
            ->groupBy('registry_key')
            ->pluck('total', 'registry_key');

        $latestSyncs = ReferenceSyncJob::query()
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('registry_key')
            ->map(fn ($jobs) => $jobs->first());

        $runningJobs = ReferenceSyncJob::whereIn('status', ['running', 'queued'])
            ->pluck('registry_key')
            ->all();

        $list = [];
        foreach ($registries as $key => $meta) {
            $lastSync = $latestSyncs->get($key);

            $list[] = [
                'key' => $key,
                'label' => $meta['label'],
                'singular' => $meta['singular'] ?? 'Record',
                'description' => $meta['description'],
                'source' => $meta['source'],
                'icon' => $meta['icon'] ?? 'database',
                'records_count' => (int) ($counts[$key] ?? 0),
                'records_estimate' => $meta['records_estimate'] ?? null,
                'code_label' => $meta['code_label'] ?? 'Code',
                'name_label' => $meta['name_label'] ?? 'Name',
                'is_syncing' => in_array($key, $runningJobs, true),
                'last_sync' => $lastSync ? [
                    'id' => $lastSync->id,
                    'status' => $lastSync->status,
                    'completed_at' => $lastSync->completed_at?->toIso8601String(),
                    'duration_ms' => $lastSync->duration_ms,
                    'created' => $lastSync->records_created,
                    'updated' => $lastSync->records_updated,
                    'failed' => $lastSync->records_failed,
                    'error' => $lastSync->error_message,
                ] : null,
            ];
        }

        // Global stats
        $totalRecords = ReferenceRecord::count();
        $totalRegistries = count($registries);
        $syncedRegistries = collect($list)->where('records_count', '>', 0)->count();
        $recentJobs = ReferenceSyncJob::where('created_at', '>=', now()->subDay())->count();

        // Recent sync activity
        $activity = ReferenceSyncJob::orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (ReferenceSyncJob $j) => [
                'id' => $j->id,
                'registry_key' => $j->registry_key,
                'registry_label' => $registries[$j->registry_key]['label'] ?? $j->registry_key,
                'status' => $j->status,
                'created' => $j->records_created,
                'updated' => $j->records_updated,
                'failed' => $j->records_failed,
                'duration_ms' => $j->duration_ms,
                'source' => $j->trigger_source,
                'created_at' => $j->created_at->toIso8601String(),
                'completed_at' => $j->completed_at?->toIso8601String(),
                'error' => $j->error_message,
            ])
            ->all();

        return Inertia::render('admin/ReferenceData', [
            'registries' => $list,
            'activity' => $activity,
            'stats' => [
                'total_records' => $totalRecords,
                'total_registries' => $totalRegistries,
                'synced_registries' => $syncedRegistries,
                'recent_jobs' => $recentJobs,
            ],
        ]);
    }

        public function show(Request $request, string $key): Response
    {
        $registries = config('reference.registries', []);
        abort_if(! isset($registries[$key]), 404);

        $meta = $registries[$key];
        $query = trim((string) $request->input('q', ''));
        $category = (string) $request->input('category', '');
        $status = (string) $request->input('status', '');

        $paginator = ReferenceRecord::query()
            ->forRegistry($key)
            ->when($query !== '', fn ($q) => $q->where(function ($sub) use ($query) {
                $like = "%{$query}%";
                $sub->where('code', 'ILIKE', $like)
                    ->orWhere('name', 'ILIKE', $like);
            }))
            ->when($category !== '', fn ($q) => $q->where('category', $category))
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (ReferenceRecord $r) => [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'category' => $r->category,
                'status' => $r->status,
                'data' => $r->data,
                'synced_at' => $r->synced_at?->toIso8601String(),
            ]);

        $categories = ReferenceRecord::forRegistry($key)
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->all();

        $statuses = ReferenceRecord::forRegistry($key)
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->all();

        $total = ReferenceRecord::forRegistry($key)->count();

        /* ─── Category distribution ─── */
        $categoryDistribution = ReferenceRecord::forRegistry($key)
            ->whereNotNull('category')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit(12)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->category,
                'value' => (int) $r->count,
            ])
            ->all();

        /* ─── Status distribution ─── */
        $statusDistribution = ReferenceRecord::forRegistry($key)
            ->selectRaw("COALESCE(status, 'Unknown') as status, COUNT(*) as count")
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->status,
                'value' => (int) $r->count,
            ])
            ->all();

        /* ─── Data quality ─── */
        $withCode = ReferenceRecord::forRegistry($key)->whereNotNull('code')->count();
        $withCategory = ReferenceRecord::forRegistry($key)->whereNotNull('category')->count();
        $withStatus = ReferenceRecord::forRegistry($key)->whereNotNull('status')->count();
        $withExternalId = ReferenceRecord::forRegistry($key)->whereNotNull('external_id')->count();

        $pct = fn (int $n) => $total > 0 ? round(($n / $total) * 100, 1) : 0.0;

        $quality = [
            'total' => $total,
            'with_code' => $withCode,
            'with_external_id' => $withExternalId,
            'with_category' => $withCategory,
            'with_status' => $withStatus,
            'code_pct' => $pct($withCode),
            'external_id_pct' => $pct($withExternalId),
            'category_pct' => $pct($withCategory),
            'status_pct' => $pct($withStatus),
        ];

        /* ─── Sync performance (last 20 completed jobs) ─── */
        $performance = ReferenceSyncJob::where('registry_key', $key)
            ->where('status', 'completed')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($j, $i) => [
                'idx' => $i + 1,
                'duration_ms' => $j->duration_ms ?? 0,
                'records' => $j->records_created + $j->records_updated,
                'created_at' => $j->created_at->toIso8601String(),
            ])
            ->all();

        $completedJobs = ReferenceSyncJob::where('registry_key', $key)
            ->where('status', 'completed')
            ->get();

        $performanceStats = [
            'avg_duration' => (int) round($completedJobs->avg('duration_ms') ?? 0),
            'min_duration' => (int) ($completedJobs->min('duration_ms') ?? 0),
            'max_duration' => (int) ($completedJobs->max('duration_ms') ?? 0),
            'total_jobs' => $completedJobs->count(),
            'total_created' => (int) $completedJobs->sum('records_created'),
            'total_updated' => (int) $completedJobs->sum('records_updated'),
            'success_rate' => $this->successRate($key),
        ];

        /* ─── Recently added records ─── */
        $recentlyAdded = ReferenceRecord::forRegistry($key)
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (ReferenceRecord $r) => [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'category' => $r->category,
                'synced_at' => $r->synced_at?->toIso8601String(),
            ])
            ->all();

        /* ─── Sync history (last 10) ─── */
        $recentJobs = ReferenceSyncJob::where('registry_key', $key)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (ReferenceSyncJob $j) => [
                'id' => $j->id,
                'status' => $j->status,
                'created' => $j->records_created,
                'updated' => $j->records_updated,
                'failed' => $j->records_failed,
                'fetched' => $j->records_fetched,
                'duration_ms' => $j->duration_ms,
                'source' => $j->trigger_source,
                'created_at' => $j->created_at->toIso8601String(),
                'completed_at' => $j->completed_at?->toIso8601String(),
                'error' => $j->error_message,
            ])
            ->all();

        $isSyncing = ReferenceSyncJob::where('registry_key', $key)
            ->whereIn('status', ['running', 'queued'])
            ->exists();

        return Inertia::render('admin/ReferenceDataDetail', [
            'registry' => [
                'key' => $key,
                'label' => $meta['label'],
                'singular' => $meta['singular'] ?? 'Record',
                'description' => $meta['description'],
                'source' => $meta['source'],
                'icon' => $meta['icon'] ?? 'database',
                'code_label' => $meta['code_label'] ?? 'Code',
                'name_label' => $meta['name_label'] ?? 'Name',
                'records_estimate' => $meta['records_estimate'] ?? null,
                'columns' => $meta['columns'] ?? ['code', 'name', 'category', 'status'],
            ],
            'records' => $paginator,
            'filters' => ['q' => $query, 'category' => $category, 'status' => $status],
            'categories' => $categories,
            'statuses' => $statuses,
            'stats' => [
                'total' => $total,
            ],
            'categoryDistribution' => $categoryDistribution,
            'statusDistribution' => $statusDistribution,
            'quality' => $quality,
            'performance' => $performance,
            'performanceStats' => $performanceStats,
            'recentlyAdded' => $recentlyAdded,
            'jobs' => $recentJobs,
            'is_syncing' => $isSyncing,
        ]);
    }

    private function successRate(string $key): float
    {
        $total = ReferenceSyncJob::where('registry_key', $key)
            ->whereIn('status', ['completed', 'failed'])
            ->count();

        if ($total === 0) {
            return 0.0;
        }

        $completed = ReferenceSyncJob::where('registry_key', $key)
            ->where('status', 'completed')
            ->count();

        return round(($completed / $total) * 100, 1);
    }

    public function sync(string $key): RedirectResponse
    {
        $registries = config('reference.registries', []);
        abort_if(! isset($registries[$key]), 404);

        SyncReferenceRegistry::dispatch(
            $key,
            Auth::guard('super_admin')->id(),
            'manual',
        );

        AuditLogger::log('reference.sync.requested', ['registry' => $key]);

        return back()->with('success', "Sync queued for {$registries[$key]['label']}.");
    }

        public function syncAll(): RedirectResponse
    {
        $keys = array_keys(config('reference.registries', []));

        \App\Support\ReferenceSyncBatch::start($keys);

        foreach ($keys as $key) {
            SyncReferenceRegistry::dispatch(
                $key,
                Auth::guard('super_admin')->id(),
                'manual',
            );
        }

        AuditLogger::log('reference.sync_all.requested', ['count' => count($keys)]);

        return back()->with('success', 'Sync queued for all registries.');
    }

    public function syncAllProgress(): JsonResponse
    {
        return response()->json(\App\Support\ReferenceSyncBatch::progress());
    }
    public function syncStatus(string $key): JsonResponse
    {
        $latest = ReferenceSyncJob::where('registry_key', $key)
            ->orderByDesc('created_at')
            ->first();

        if (! $latest) {
            return response()->json(['active' => false]);
        }

        return response()->json([
            'active' => in_array($latest->status, ['queued', 'running'], true),
            'status' => $latest->status,
            'job_id' => $latest->id,
            'created' => $latest->records_created,
            'updated' => $latest->records_updated,
            'failed' => $latest->records_failed,
            'duration_ms' => $latest->duration_ms,
            'completed_at' => $latest->completed_at?->toIso8601String(),
            'error' => $latest->error_message,
        ]);
    }
}