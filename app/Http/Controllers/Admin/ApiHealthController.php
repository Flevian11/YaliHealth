<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\RunApiHealthChecks;
use App\Models\ApiHealthCheck;
use App\Services\ApiHealthChecker;
use App\Support\AuditLogger;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ApiHealthController extends Controller
{
    public function index(): Response
    {
        $catalog = config('hie_endpoints.groups', []);
        $base = Settings::get('hie.base_url');
        $environment = Settings::get('hie.environment', 'uat');

        // Latest check per endpoint
        $latest = ApiHealthCheck::query()
            ->orderByDesc('checked_at')
            ->get()
            ->groupBy('endpoint_key')
            ->map(fn ($checks) => $checks->first());

        // Last 24h uptime per endpoint
        $since = Carbon::now()->subDay();
        $uptime = ApiHealthCheck::query()
            ->where('checked_at', '>=', $since)
            ->selectRaw('endpoint_key, COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as up_count', [ApiHealthChecker::STATUS_UP])
            ->groupBy('endpoint_key')
            ->get()
            ->keyBy('endpoint_key');

        // Avg latency last 24h
        $latency = ApiHealthCheck::query()
            ->where('checked_at', '>=', $since)
            ->whereNotNull('latency_ms')
            ->selectRaw('endpoint_key, AVG(latency_ms) as avg_latency')
            ->groupBy('endpoint_key')
            ->get()
            ->keyBy('endpoint_key');

        $groups = [];
        foreach ($catalog as $groupKey => $group) {
            $endpoints = [];
            foreach ($group['endpoints'] as $key => $meta) {
                $check = $latest->get($key);
                $stat = $uptime->get($key);
                $lat = $latency->get($key);

                $uptimePercent = $stat && $stat->total > 0
                    ? round(($stat->up_count / $stat->total) * 100, 1)
                    : null;

                $endpoints[] = [
                    'key' => $key,
                    'label' => $meta['label'],
                    'method' => strtoupper($meta['method']),
                    'path' => $meta['path'],
                    'url' => $base . $meta['path'],
                    'status' => $check?->status ?? ApiHealthChecker::STATUS_UNKNOWN,
                    'latency_ms' => $check?->latency_ms,
                    'http_status' => $check?->http_status,
                    'error' => $check?->error_message,
                    'last_checked' => $check?->checked_at?->toIso8601String(),
                    'uptime_24h' => $uptimePercent,
                    'avg_latency_24h' => $lat ? (int) round($lat->avg_latency) : null,
                ];
            }

            $groups[] = [
                'key' => $groupKey,
                'label' => $group['label'],
                'description' => $group['description'] ?? null,
                'endpoints' => $endpoints,
            ];
        }

        // Global stats
        $totalChecks = ApiHealthCheck::where('checked_at', '>=', $since)->count();
        $upChecks = ApiHealthCheck::where('checked_at', '>=', $since)
            ->where('status', ApiHealthChecker::STATUS_UP)
            ->count();
        $globalUptime = $totalChecks > 0 ? round(($upChecks / $totalChecks) * 100, 1) : null;

        $allEndpoints = collect($groups)->flatMap(fn ($g) => $g['endpoints']);
        $upCount = $allEndpoints->where('status', ApiHealthChecker::STATUS_UP)->count();
        $downCount = $allEndpoints->where('status', ApiHealthChecker::STATUS_DOWN)->count();
        $degradedCount = $allEndpoints->where('status', ApiHealthChecker::STATUS_DEGRADED)->count();
        $unknownCount = $allEndpoints->where('status', ApiHealthChecker::STATUS_UNKNOWN)->count();

        $avgLatency = $allEndpoints
            ->pluck('avg_latency_24h')
            ->filter()
            ->avg();

        return Inertia::render('admin/ApiHealth', [
            'groups' => $groups,
            'environment' => $environment,
            'base_url' => $base,
            'stats' => [
                'up' => $upCount,
                'down' => $downCount,
                'degraded' => $degradedCount,
                'unknown' => $unknownCount,
                'total' => $allEndpoints->count(),
                'global_uptime_24h' => $globalUptime,
                'avg_latency_24h' => $avgLatency ? (int) round($avgLatency) : null,
            ],
        ]);
    }

        public function refresh(): RedirectResponse
    {
        \App\Support\ApiHealthBatch::start();
        RunApiHealthChecks::dispatch();

        AuditLogger::log('api_health.refresh_requested', []);

        return back();
    }

    public function progress(): \Illuminate\Http\JsonResponse
    {
        return response()->json(\App\Support\ApiHealthBatch::progress());
    }

    public function show(string $key): Response
    {
        $endpoint = ApiHealthCheck::where('endpoint_key', $key)
            ->orderByDesc('checked_at')
            ->limit(100)
            ->get();

        $catalog = config('hie_endpoints.groups', []);
        $meta = null;
        foreach ($catalog as $group) {
            if (isset($group['endpoints'][$key])) {
                $meta = $group['endpoints'][$key];
                break;
            }
        }

        abort_if(! $meta, 404);

        return Inertia::render('admin/ApiHealthDetail', [
            'endpoint' => [
                'key' => $key,
                'label' => $meta['label'],
                'method' => strtoupper($meta['method']),
                'path' => $meta['path'],
            ],
            'checks' => $endpoint->map(fn (ApiHealthCheck $c) => [
                'id' => $c->id,
                'status' => $c->status,
                'latency_ms' => $c->latency_ms,
                'http_status' => $c->http_status,
                'error' => $c->error_message,
                'checked_at' => $c->checked_at->toIso8601String(),
            ])->all(),
        ]);
    }
}