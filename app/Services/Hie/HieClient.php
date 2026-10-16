<?php

namespace App\Services\Hie;

use App\Models\TenantConnection;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HieClient
{
    public function __construct(
        private HieEnvironment $environment,
        private MockHieService $mock,
    ) {}

    public function request(string $method, string $path, array $payload = [], array $options = []): Response
    {
        $method = strtoupper($method);
        $authenticated = $options['authenticated'] ?? true;
        $multipart = $options['multipart'] ?? false;

        if ($this->environment->isMock()) {
            return $this->mock->handle($method, $path, $payload, $options);
        }

        $tenant = tenant();

        if (! $tenant) {
            throw new \RuntimeException('HIE calls require an active tenant context.');
        }

        $connection = $this->resolveConnection($tenant->id);
        $url = $this->environment->baseUrl() . $path;

        $headers = array_merge(
            [
                'Accept' => 'application/json',
                'X-Request-Id' => (string) \Illuminate\Support\Str::uuid(),
            ],
            $options['headers'] ?? [],
        );

        if ($authenticated) {
            $headers['Authorization'] = 'Bearer ' . $this->tokenFor($tenant->id, $connection);
        }

        if (config('hie.facility_context') === 'headers' && $connection->facility_fr_code) {
            $headers['X-Facility-Id'] = $connection->facility_fr_code;
            $headers['X-Facility-Id-Type'] = 'fr-code';
        }

        $request = Http::withHeaders($headers)
            ->timeout((int) config('hie.timeout_seconds'))
            ->connectTimeout((int) config('hie.connect_timeout_seconds'))
            ->withOptions(['http_errors' => false]);

        if ($multipart) {
            $request = $request->asMultipart();

            foreach ($options['attach'] ?? [] as $attachment) {
                $request = $request->attach(
                    $attachment['name'],
                    $attachment['contents'],
                    $attachment['filename'] ?? null,
                );
            }
        } else {
            $request = $request->asJson();
        }

        $response = match ($method) {
            'GET' => $request->get($url, $payload),
            'POST' => $request->post($url, $payload),
            'PUT' => $request->put($url, $payload),
            'DELETE' => $request->delete($url, $payload),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };

        if ($response->failed()) {
            Log::warning('hie.request.failed', [
                'tenant_id' => $tenant->id,
                'method' => $method,
                'url' => $url,
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500),
            ]);
        }

        return $response;
    }

    public function tokenFor(string $tenantId, ?TenantConnection $connection = null): string
    {
        $cacheKey = sprintf((string) config('hie.token_cache_key'), $tenantId);
        $cached = Cache::get($cacheKey);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $connection ??= $this->resolveConnection($tenantId);

        if (! $connection->client_id || ! $connection->hasClientSecret()) {
            throw new \RuntimeException("Tenant {$tenantId} has no HIE credentials configured.");
        }

        $baseUrl = $this->environment->baseUrl();
        $url = $baseUrl . '/tenants/token';

        $response = Http::asForm()
            ->timeout((int) config('hie.timeout_seconds'))
            ->connectTimeout((int) config('hie.connect_timeout_seconds'))
            ->post($url, [
                'client_id' => $connection->client_id,
                'client_secret' => $connection->getClientSecretAttribute(),
            ]);

        if ($response->failed()) {
            throw new \RuntimeException("HIE token request failed with status {$response->status()}");
        }

        $accessToken = (string) $response->json('access_token');
        $expiresIn = (int) $response->json('expires_in', 3600);

        if ($accessToken === '') {
            throw new \RuntimeException('HIE token response did not include access_token.');
        }

        $ttl = max(60, $expiresIn - (int) config('hie.token_refresh_buffer_seconds'));
        Cache::put($cacheKey, $accessToken, $ttl);

        return $accessToken;
    }

    public function forgetToken(string $tenantId): void
    {
        Cache::forget(sprintf((string) config('hie.token_cache_key'), $tenantId));
    }

    private function resolveConnection(string $tenantId): TenantConnection
    {
        return tenancy()->central(
            fn () => TenantConnection::where('tenant_id', $tenantId)->firstOrFail(),
        );
    }
}