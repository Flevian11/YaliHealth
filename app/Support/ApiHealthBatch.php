<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class ApiHealthBatch
{
    private const CACHE_KEY = 'api_health:batch';
    private const TTL_SECONDS = 120;

    public static function start(): array
    {
        $total = 0;
        foreach (config('hie_endpoints.groups', []) as $group) {
            $total += count($group['endpoints']);
        }

        $batch = [
            'started_at' => now()->toIso8601String(),
            'total' => $total,
            'token' => (string) \Illuminate\Support\Str::uuid(),
        ];

        Cache::put(self::CACHE_KEY, $batch, self::TTL_SECONDS);

        return $batch;
    }

    public static function current(): ?array
    {
        return Cache::get(self::CACHE_KEY);
    }

    public static function progress(): array
    {
        $batch = self::current();

        if (! $batch) {
            return [
                'active' => false,
                'completed' => 0,
                'total' => 0,
                'percent' => 0,
                'results' => [],
            ];
        }

        $startedAt = $batch['started_at'];
        $total = $batch['total'];

        $checks = \App\Models\ApiHealthCheck::where('checked_at', '>=', $startedAt)
            ->orderBy('id')
            ->get(['endpoint_key', 'endpoint_label', 'status', 'latency_ms', 'http_status']);

        $completed = $checks->count();

        return [
            'active' => $completed < $total,
            'completed' => $completed,
            'total' => $total,
            'percent' => $total > 0 ? round(($completed / $total) * 100) : 0,
            'results' => $checks->map(fn ($c) => [
                'key' => $c->endpoint_key,
                'label' => $c->endpoint_label,
                'status' => $c->status,
                'latency_ms' => $c->latency_ms,
                'http_status' => $c->http_status,
            ])->all(),
        ];
    }

    public static function clear(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}