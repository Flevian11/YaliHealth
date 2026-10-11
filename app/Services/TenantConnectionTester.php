<?php

namespace App\Services;

use App\Models\TenantConnection;
use App\Models\TenantConnectionLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TenantConnectionTester
{
    /**
     * Test a tenant's HIE credentials by attempting a token exchange.
     */
    public function test(TenantConnection $connection, ?int $actorId = null, ?string $actorEmail = null): array
    {
        $started = microtime(true);

        if (! $connection->isReady()) {
            return $this->record($connection, 'failed', 'Credentials are incomplete', null, null, null, 0, $actorId, $actorEmail);
        }

        $url = rtrim($connection->hie_base_url, '/') . '/api/v1/tenants/token';

        try {
            $response = Http::timeout(15)
                ->connectTimeout(5)
                ->withOptions(['http_errors' => false])
                ->acceptJson()
                ->post($url, [
                    'client_id' => $connection->client_id,
                    'client_secret' => $connection->getClientSecretAttribute(),
                ]);

            $latency = (int) round((microtime(true) - $started) * 1000);
            $status = $response->status();

            // Success = 200 with access_token
            if ($status === 200 && $response->json('access_token')) {
                $expires = $response->json('expires_in');

                return $this->record(
                    $connection,
                    'success',
                    'Token issued successfully',
                    $latency,
                    $status,
                    null,
                    $expires,
                    $actorId,
                    $actorEmail,
                );
            }

            // Any other status = failure
            $error = $this->extractError($response->json(), $status);

            return $this->record(
                $connection,
                'failed',
                $error,
                $latency,
                $status,
                null,
                null,
                $actorId,
                $actorEmail,
            );
        } catch (Throwable $e) {
            $latency = (int) round((microtime(true) - $started) * 1000);

            Log::warning('tenant_connection.test_failed', [
                'tenant_id' => $connection->tenant_id,
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return $this->record(
                $connection,
                'failed',
                $e->getMessage(),
                $latency,
                null,
                null,
                null,
                $actorId,
                $actorEmail,
            );
        }
    }

    private function record(
        TenantConnection $connection,
        string $status,
        string $message,
        ?int $latency,
        ?int $httpStatus,
        ?array $meta,
        ?int $expiresIn,
        ?int $actorId,
        ?string $actorEmail,
    ): array {
        $connection->update([
            'last_verified_at' => now(),
            'last_verified_status' => $status,
            'last_verified_latency_ms' => $latency,
            'last_verified_http_status' => $httpStatus,
            'last_verified_error' => $status === 'failed' ? $message : null,
        ]);

        TenantConnectionLog::create([
            'tenant_id' => $connection->tenant_id,
            'action' => 'tested',
            'status' => $status,
            'message' => $message,
            'meta' => array_filter([
                'latency_ms' => $latency,
                'http_status' => $httpStatus,
                'expires_in' => $expiresIn,
                'meta' => $meta,
            ]),
            'actor_id' => $actorId,
            'actor_email' => $actorEmail,
            'ip_address' => request()->ip(),
        ]);

        return [
            'status' => $status,
            'message' => $message,
            'latency_ms' => $latency,
            'http_status' => $httpStatus,
            'expires_in' => $expiresIn,
        ];
    }

    private function extractError(?array $json, int $status): string
    {
        if (! $json) {
            return "HTTP {$status} — no response body";
        }

        if (isset($json['message'])) {
            return (string) $json['message'];
        }

        if (isset($json['error'])) {
            return is_string($json['error']) ? $json['error'] : json_encode($json['error']);
        }

        return "HTTP {$status}";
    }
}