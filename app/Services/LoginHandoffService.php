<?php

namespace App\Services;

use App\Models\LoginHandoffToken;
use Illuminate\Support\Str;

class LoginHandoffService
{
    public const TTL_SECONDS = 60;

    public function create(int $userId, string $tenantId, ?string $ip = null): string
    {
        // Cleanup expired tokens on every create — cheap and keeps the table small
        LoginHandoffToken::where('expires_at', '<', now()->subHour())->delete();

        $token = $this->generateToken();

        LoginHandoffToken::create([
            'token' => $token,
            'user_id' => $userId,
            'tenant_id' => $tenantId,
            'ip_address' => $ip,
            'expires_at' => now()->addSeconds(self::TTL_SECONDS),
        ]);

        return $token;
    }

    public function consume(string $token, string $expectedTenantId): ?LoginHandoffToken
    {
        // Runs in the central context — we always hit the central DB
        return tenancy()->central(function () use ($token, $expectedTenantId) {
            $record = LoginHandoffToken::find($token);

            if (! $record) {
                return null;
            }

            if ($record->tenant_id !== $expectedTenantId) {
                return null;
            }

            if (! $record->isValid()) {
                return null;
            }

            $record->forceFill(['used_at' => now()])->save();

            return $record;
        });
    }

    private function generateToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}