<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));
        $event = (string) $request->input('event', '');

        $paginator = AuditLog::query()
            ->when($query !== '', function ($q) use ($query) {
                $like = '%' . $query . '%';
                $q->where(function ($sub) use ($like) {
                    $sub->where('actor_email', 'ILIKE', $like)
                        ->orWhere('ip_address', 'ILIKE', $like)
                        ->orWhere('event', 'ILIKE', $like);
                });
            })
            ->when($event !== '', fn ($q) => $q->where('event', $event))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $l) => [
                'id' => $l->id,
                'event' => $l->event,
                'actor_email' => $l->actor_email,
                'actor_type' => $l->actor_type,
                'ip_address' => $l->ip_address,
                'metadata' => $l->metadata,
                'created_at' => $l->created_at->toIso8601String(),
            ]);

        return Inertia::render('admin/AuditLogs', [
            'logs' => $paginator,
            'events' => AuditLog::query()
                ->distinct()
                ->orderBy('event')
                ->pluck('event')
                ->all(),
            'stats' => [
                'total' => AuditLog::count(),
                'logins' => AuditLog::where('event', 'auth.login')->count(),
                'logouts' => AuditLog::where('event', 'auth.logout')->count(),
                'failed' => AuditLog::where('event', 'auth.failed')->count(),
            ],
            'filters' => ['q' => $query, 'event' => $event],
        ]);
    }
}