<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailOtpService;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmailOtpController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $userId = $request->session()->get('auth.otp_pending_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget('auth.otp_pending_user_id');
            return redirect()->route('login');
        }

        return Inertia::render('auth/verify-otp', [
            'email' => $this->maskEmail($user->email),
            'expiresInMinutes' => EmailOtpService::EXPIRY_MINUTES,
            'resendCooldown' => EmailOtpService::RESEND_COOLDOWN_SECONDS,
        ]);
    }

    public function verify(Request $request, EmailOtpService $otp): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $userId = $request->session()->get('auth.otp_pending_user_id');

        if (! $userId) {
            throw ValidationException::withMessages([
                'code' => 'Your session expired. Please sign in again.',
            ]);
        }

        $user = User::find($userId);

        if (! $user || ! $otp->verify($user, $request->string('code')->toString())) {
            throw ValidationException::withMessages([
                'code' => 'That code is incorrect or has expired.',
            ]);
        }

        // Clear the pending marker so the Login event listener can identify
        // this as a completed OTP sign-in (not a stray duplicate).
        $request->session()->forget('auth.otp_pending_user_id');
        $request->session()->regenerate();

        // The Login event fires here and RecordLoginActivity writes
        // last_login_at, last_login_ip, and the audit entry.
        Auth::guard('web')->login($user, remember: true);

                // ...

        AuditLogger::log('auth.login.otp_verified', [
            'user_id' => $user->id,
            'email' => $user->email,
        ], $user);

        $target = tenant() ? route('tenant.dashboard') : route('dashboard');

        return redirect()->intended($target);
    }

    public function resend(Request $request, EmailOtpService $otp): RedirectResponse
    {
        $userId = $request->session()->get('auth.otp_pending_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget('auth.otp_pending_user_id');
            return redirect()->route('login');
        }

        $otp->send($user);

        AuditLogger::log('auth.login.otp_resent', [
            'user_id' => $user->id,
        ], $user);

        return back()->with('success', 'A new code has been sent to your email.');
    }

    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget('auth.otp_pending_user_id');

        return redirect()->route('login');
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);

        if (strlen($local) <= 2) {
            $masked = str_repeat('•', strlen($local));
        } else {
            $masked = substr($local, 0, 1)
                . str_repeat('•', max(3, strlen($local) - 2))
                . substr($local, -1);
        }

        return $masked . '@' . $domain;
    }
}