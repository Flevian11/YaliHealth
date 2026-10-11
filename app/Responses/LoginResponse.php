<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Services\EmailOtpService;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function __construct(private EmailOtpService $otp) {}

    public function toResponse($request): Response
    {
        /** @var Request $request */
        $user = Auth::guard('web')->user();

        if (! $user instanceof User) {
            return redirect()->route('login');
        }

        // Passkey logins skip OTP entirely — the whole point of a passkey
        if ($this->isPasskeyLogin($request)) {
            $this->recordLogin($user, $request);

            AuditLogger::log('auth.login.passkey', [
                'user_id' => $user->id,
                'email' => $user->email,
            ], $user);

            return redirect()->intended($this->dashboardUrl());
        }

        // If OTP is required for this user, hold them in a pending state
        if ($user->require_email_otp) {
            Auth::guard('web')->logout();

            $request->session()->put('auth.otp_pending_user_id', $user->id);

            $this->otp->send($user);

            AuditLogger::log('auth.login.otp_challenge_issued', [
                'user_id' => $user->id,
                'email' => $user->email,
            ], $user);

            return redirect()->route('auth.verify-otp');
        }

        // OTP disabled — log them in normally
        $this->recordLogin($user, $request);

        return redirect()->intended($this->dashboardUrl());
    }

    private function dashboardUrl(): string
    {
        return tenant()
            ? route('tenant.dashboard')
            : route('dashboard');
    }

    private function isPasskeyLogin(Request $request): bool
    {
        return $request->path() === 'passkeys/login'
            || $request->routeIs('passkey.login')
            || $request->header('X-Passkey-Auth') === '1';
    }

    private function recordLogin(User $user, Request $request): void
    {
        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();
    }
}