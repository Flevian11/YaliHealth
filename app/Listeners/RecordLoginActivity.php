<?php

namespace App\Listeners;

use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Auth\Events\Login;

class RecordLoginActivity
{
    public function handle(Login $event): void
    {
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        // Skip if the OTP controller already recorded this
        if (session('auth.otp_pending_user_id')) {
            return;
        }

        $method = $this->detectMethod();

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ])->save();

        AuditLogger::log("auth.login.{$method}", [
            'user_id' => $user->id,
            'email' => $user->email,
            'guard' => $event->guard,
            'remember' => $event->remember,
        ], $user);
    }

    private function detectMethod(): string
    {
        $path = request()->path();

        if (str_contains($path, 'passkey') || request()->header('X-Passkey-Auth') === '1') {
            return 'passkey';
        }

        if (session()->has('auth.otp_pending_user_id')) {
            return 'password_otp';
        }

        if (str_contains($path, 'login')) {
            return 'password';
        }

        return 'session';
    }
}