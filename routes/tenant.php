<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AdoptSessionController;
use App\Http\Controllers\Auth\EmailOtpController;
use App\Http\Controllers\Tenant\AnnouncementsController;
use App\Http\Controllers\Tenant\AnnouncementsPageController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\PatientController;
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

    Route::get('register', [StaffAccessController::class, 'show'])->name('register');

    Route::middleware(['auth', 'verified', 'tenant.active'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('tenant.home');
        Route::get('dashboard', [DashboardController::class, 'index'])->name('tenant.dashboard');

        Route::get('announcements', [AnnouncementsPageController::class, 'index'])->name('announcements.index');
        Route::get('announcements/recent', [AnnouncementsController::class, 'recent'])->name('announcements.recent');

        Route::prefix('patients')->name('patients.')->group(function () {
            Route::get('/', [PatientController::class, 'index'])->name('index');
            Route::get('check-duplicates', [PatientController::class, 'checkDuplicates'])->name('check-duplicates');
            Route::post('/', [PatientController::class, 'store'])->name('store');
            Route::get('{patient}', [PatientController::class, 'show'])->name('show');
            Route::post('{patient}/upgrade', [PatientController::class, 'upgrade'])->name('upgrade');
        });

        Route::inertia('settings', 'tenant/Settings')->name('settings.index');
    });

    require __DIR__ . '/settings.php';
});
