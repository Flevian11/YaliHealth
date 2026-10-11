<?php

namespace App\Services;

use App\Models\ApiHealthCheck;
use App\Support\Settings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ApiHealthChecker
{
    public const STATUS_UP = 'up';
    public const STATUS_DOWN = 'down';
    public const STATUS_DEGRADED = 'degraded';
    public const STATUS_UNKNOWN = 'unknown';

    public const DEGRADED_LATENCY_MS = 2000;

    public function check(string $key): ApiHealthCheck
    {
        $catalog = config('hie_endpoints.groups', []);
        $config = null;
        $category = null;

        foreach ($catalog as $catKey => $group) {
            if (isset($group['endpoints'][$key])) {
                $config = $group['endpoints'][$key];
                $category = $catKey;
                break;
            }
        }

        if (! $config) {
            throw new \InvalidArgumentException("Unknown endpoint key: {$key}");
        }

        $base = rtrim((string) Settings::get('hie.base_url', 'https://ilm-dev.dha.go.ke/uat-middleware'), '/');
        $url = $base . $config['path'];

        $started = microtime(true);
        $status = self::STATUS_UNKNOWN;
        $httpStatus = null;
        $latency = null;
        $error = null;
        $meta = null;

        try {
            $method = strtoupper($config['method']);
            $timeout = $config['timeout'] ?? 15;

            $request = Http::timeout($timeout)
                ->connectTimeout(min(5, $timeout))
                ->withOptions(['http_errors' => false])
                ->acceptJson();

            $response = match ($method) {
                'POST' => $request->post($url, []),
                'PUT' => $request->put($url, []),
                'DELETE' => $request->delete($url),
                default => $request->get($url),
            };

            $latency = (int) round((microtime(true) - $started) * 1000);
            $httpStatus = $response->status();

            $meta = [
                'content_type' => $response->header('Content-Type'),
                'server' => $response->header('Server'),
                'body_length' => strlen($response->body()),
            ];

            $expected = $config['expects'] ?? [200];
            $reachable = in_array($httpStatus, $expected, true);

            if (! $reachable) {
                $status = self::STATUS_DOWN;
                $error = "Unexpected HTTP {$httpStatus}";
            } elseif ($latency >= self::DEGRADED_LATENCY_MS) {
                $status = self::STATUS_DEGRADED;
            } else {
                $status = self::STATUS_UP;
            }
        } catch (Throwable $e) {
            $latency = (int) round((microtime(true) - $started) * 1000);
            $status = self::STATUS_DOWN;
            $error = $e->getMessage();

            Log::warning('api_health.check_failed', [
                'endpoint' => $key,
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
        }

        return ApiHealthCheck::create([
            'endpoint_key' => $key,
            'endpoint_label' => $config['label'] ?? $key,
            'method' => strtoupper($config['method']),
            'url' => $url,
            'category' => $category,
            'status' => $status,
            'latency_ms' => $latency,
            'http_status' => $httpStatus,
            'error_message' => $error,
            'response_meta' => $meta,
            'checked_at' => now(),
        ]);
    }

    public function checkAll(): array
    {
        $results = [];
        $catalog = config('hie_endpoints.groups', []);

        foreach ($catalog as $group) {
            foreach (array_keys($group['endpoints']) as $key) {
                $results[] = $this->check($key);
            }
        }

        return $results;
    }
}