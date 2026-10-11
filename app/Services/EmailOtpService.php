<?php

namespace App\Services;

use App\Mail\LoginOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class EmailOtpService
{
    public const CODE_LENGTH = 6;
    public const EXPIRY_MINUTES = 10;
    public const RESEND_COOLDOWN_SECONDS = 30;

    /**
     * Generate, persist, and email a new OTP for the user.
     */
    public function send(User $user): void
    {
        $code = $this->generateCode();

        $user->forceFill([
            'email_otp_code' => Hash::make($code),
            'email_otp_expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
        ])->save();

        try {
            Mail::to($user->email)->send(new LoginOtpMail($user, $code));
        } catch (Throwable $e) {
            Log::warning('auth.otp.mail_failed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            // We do not re-throw — the user can request a resend
        }
    }

    /**
     * Verify the submitted code against the stored hash.
     */
    public function verify(User $user, string $code): bool
    {
        if (! $user->email_otp_code || $user->otpIsExpired()) {
            return false;
        }

        if (! Hash::check($code, $user->email_otp_code)) {
            return false;
        }

        $user->forceFill([
            'email_otp_code' => null,
            'email_otp_expires_at' => null,
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ])->save();

        return true;
    }

    /**
     * Invalidate any pending OTP.
     */
    public function clear(User $user): void
    {
        $user->forceFill([
            'email_otp_code' => null,
            'email_otp_expires_at' => null,
        ])->save();
    }

    private function generateCode(): string
    {
        return str_pad(
            (string) random_int(0, 10 ** self::CODE_LENGTH - 1),
            self::CODE_LENGTH,
            '0',
            STR_PAD_LEFT,
        );
    }
}