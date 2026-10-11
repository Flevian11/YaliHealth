<?php

namespace App\Providers;

use App\Http\Responses\LoginResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        /* ───────────── Views ───────────── */

        Fortify::loginView(fn () => Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => $this->passwordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn () => Inertia::render('auth/forgot-password', [
            'status' => session('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => $this->passwordRulesString(),
        ]));

        Fortify::verifyEmailView(fn () => Inertia::render('auth/verify-email', [
            'status' => session('status'),
        ]));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        /* ───────────── Custom login response ───────────── */

        /*
        | Fortify resolves its LoginResponse contract from the container
        | immediately after a successful password login. By binding our own
        | implementation, we intercept that moment to issue the email OTP
        | challenge instead of completing the sign-in.
        |
        | Note: passkey logins use a separate controller
        | (Laravel\Passkeys\Http\Controllers\PasskeyLoginController) which
        | calls the guard directly. It never reaches this response, so
        | passkey users skip OTP automatically.
        */

        $this->app->singleton(
            LoginResponseContract::class,
            LoginResponse::class,
        );
    }

    /**
     * Returns a pipe-delimited rule string for the frontend `passwordrules`
     * attribute, derived from the current Laravel password policy.
     */
    private function passwordRulesString(): string
    {
        $rules = Password::min(8)
            ->mixedCase()
            ->numbers()
            ->uncompromised();

        // The default Password rule exposes a `__toString()` for the
        // `passwordrules` HTML attribute. Fall back to a sensible static
        // string if the version in use doesn't support it.
        try {
            return (string) $rules;
        } catch (\Throwable) {
            return 'minlength: 8; required: lower; required: upper; required: digit;';
        }
    }
}