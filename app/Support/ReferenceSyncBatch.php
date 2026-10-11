<?php

namespace App\Support;

use App\Models\ReferenceSyncJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ReferenceSyncBatch
{
    private const CACHE_KEY = 'reference_sync:batch';
    private const TTL_SECONDS = 600;

    public static function start(array $keys): array
    {
        $batch = [
            'token' => (string) Str::uuid(),
            'started_at' => now()->toIso8601String(),
            'keys' => array_values($keys),
            'total' => count($keys),
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
                'total' => 0,
                'completed' => 0,
                'percent' => 0,
                'results' => [],
            ];
        }

        $startedAt = $batch['started_at'];
        $keys = $batch['keys'];
        $total = $batch['total'];

        $results = [];
        $completed = 0;

        $registries = config('reference.registries', []);

        foreach ($keys as $key) {
            $job = ReferenceSyncJob::where('registry_key', $key)
                ->where('created_at', '>=', $startedAt)
                ->orderByDesc('created_at')
                ->first();

            $isDone = $job && in_array($job->status, ['completed', 'failed'], true);
            if ($isDone) {
                $completed++;
            }

            $results[] = [
                'key' => $key,
                'label' => $registries[$key]['label'] ?? $key,
                'status' => $job?->status ?? 'waiting',
                'created' => $job?->records_created ?? 0,
                'updated' => $job?->records_updated ?? 0,
                'failed' => $job?->records_failed ?? 0,
                'duration_ms' => $job?->duration_ms,
                'error' => $job?->error_message,
            ];
        }

        return [
            'active' => $completed < $total,
            'total' => $total,
            'completed' => $completed,
            'percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            'results' => $results,
        ];
    }

    public static function clear(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}