<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AdoptSessionController;
use App\Http\Controllers\Auth\EmailOtpController;
use App\Http\Controllers\Tenant\StaffAccessController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyBySubdomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    Route::get('auth/adopt/{token}', AdoptSessionController::class)
        ->name('auth.adopt')
        ->where('token', '[A-Za-z0-9_-]+');

    Route::get('auth/verify-otp', [EmailOtpController::class, 'show'])->name('auth.verify-otp');
    Route::post('auth/verify-otp', [EmailOtpController::class, 'verify'])->name('auth.verify-otp.submit');
    Route::post('auth/verify-otp/resend', [EmailOtpController::class, 'resend'])->name('auth.verify-otp.resend');
    Route::post('auth/verify-otp/cancel', [EmailOtpController::class, 'cancel'])->name('auth.verify-otp.cancel');

    // Staff cannot self-register. Show the hospital admin's contact info instead.
    Route::get('register', [StaffAccessController::class, 'show'])->name('register');

    Route::middleware(['auth', 'verified', 'tenant.active'])->group(function () {
        Route::get('/', fn () => 'Tenant dashboard — ' . tenant('id'))->name('tenant.home');
        Route::get('dashboard', fn () => 'Tenant dashboard — ' . tenant('id'))->name('tenant.dashboard');
    });

    require __DIR__ . '/settings.php';
});