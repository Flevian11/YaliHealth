<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AdoptSessionController;
use App\Http\Controllers\Auth\EmailOtpController;
use App\Http\Controllers\Tenant\AnnouncementsController;
use App\Http\Controllers\Tenant\AnnouncementsPageController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\PatientController;
use App\Http\Controllers\Tenant\StaffAccessController;
use App\Http\Controllers\Tenant\StaffController;
use App\Http\Controllers\Tenant\StaffInvitationController;
use App\Http\Controllers\Tenant\VisitController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyBySubdomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    /* ═══════════════════════════════════════════════════════════════════
       PUBLIC TENANT ROUTES
       ═══════════════════════════════════════════════════════════════════
       No `auth` middleware, but still inside the tenancy group so tenant
       context is initialized before the controller touches the DB.
    */

    Route::get('auth/adopt/{token}', AdoptSessionController::class)
        ->name('auth.adopt')
        ->where('token', '[A-Za-z0-9_-]+');

    Route::get('auth/verify-otp', [EmailOtpController::class, 'show'])->name('auth.verify-otp');
    Route::post('auth/verify-otp', [EmailOtpController::class, 'verify'])->name('auth.verify-otp.submit');
    Route::post('auth/verify-otp/resend', [EmailOtpController::class, 'resend'])->name('auth.verify-otp.resend');
    Route::post('auth/verify-otp/cancel', [EmailOtpController::class, 'cancel'])->name('auth.verify-otp.cancel');

    Route::get('register', [StaffAccessController::class, 'show'])->name('register');

    /*
    |----------------------------------------------------------------------
    | Staff invitation acceptance
    |----------------------------------------------------------------------
    |
    | Deliberately public — the token IS the credential. Runs inside the
    | tenant group so InitializeTenancyBySubdomain has already switched
    | the DB connection before the controller reads staff_invitations.
    |
    | Note the ordering: literal segments must precede any {user} wildcard
    | declared elsewhere in the tenant namespace. These accept routes are
    | also distinct from /staff/{user}/... above because they use a
    | dedicated prefix (staff/accept) that does not collide.
    |
    */

    Route::get('staff/accept/{token}', [StaffInvitationController::class, 'show'])
        ->name('staff.accept')
        ->where('token', '[A-Za-z0-9]+');

    Route::post('staff/accept/{token}', [StaffInvitationController::class, 'accept'])
        ->name('staff.accept.submit')
        ->where('token', '[A-Za-z0-9]+');

    /* ═══════════════════════════════════════════════════════════════════
       AUTHENTICATED TENANT ROUTES
       ═══════════════════════════════════════════════════════════════════ */

    Route::middleware(['auth', 'verified', 'tenant.active'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('tenant.home');
        Route::get('dashboard', [DashboardController::class, 'index'])->name('tenant.dashboard');

        Route::get('announcements', [AnnouncementsPageController::class, 'index'])->name('announcements.index');
        Route::get('announcements/recent', [AnnouncementsController::class, 'recent'])->name('announcements.recent');

        /*
        |----------------------------------------------------------------------
        | Staff & Users
        |----------------------------------------------------------------------
        |
        | RBAC: only users with `staff.manage` can access these routes.
        | Enforced by EnsureTenantPermission via the `tenant.perm` alias.
        |
        */

        Route::prefix('staff')->name('staff.')
            ->middleware('tenant.perm:staff.manage')
            ->group(function () {
                Route::get('/', [StaffController::class, 'index'])->name('index');
                Route::post('/', [StaffController::class, 'store'])->name('store');
                Route::post('{user}/role', [StaffController::class, 'updateRole'])->name('role.update');
                Route::post('{user}/toggle', [StaffController::class, 'toggleActive'])->name('toggle');
                Route::post('{user}/send-reset', [StaffController::class, 'sendReset'])->name('send-reset');
            });

        /*
        |----------------------------------------------------------------------
        | Clinical
        |----------------------------------------------------------------------
        |
        | Terminology lookups used by the visit workspace.
        |
        */

        Route::prefix('clinical')->name('clinical.')->group(function () {
            Route::get('icd11/search', [VisitController::class, 'searchIcd11'])->name('icd11.search');
        });

        /*
        |----------------------------------------------------------------------
        | Patients
        |----------------------------------------------------------------------
        |
        | Note the ordering: literal segments ('check-duplicates', 'lookup',
        | 'search') must be declared before the {patient} wildcard, otherwise
        | Laravel would match them as patient IDs.
        |
        */

        Route::prefix('patients')->name('patients.')->group(function () {
            Route::get('/', [PatientController::class, 'index'])->name('index');
            Route::get('check-duplicates', [PatientController::class, 'checkDuplicates'])->name('check-duplicates');
            Route::get('search', [PatientController::class, 'searchJson'])->name('search');
            Route::post('lookup', [PatientController::class, 'lookup'])->name('lookup');
            Route::post('/', [PatientController::class, 'store'])->name('store');
            Route::get('{patient}', [PatientController::class, 'show'])->name('show');
            Route::post('{patient}/upgrade', [PatientController::class, 'upgrade'])->name('upgrade');
            Route::delete('{patient}', [PatientController::class, 'destroy'])->name('destroy');
        });

        /*
        |----------------------------------------------------------------------
        | Visits
        |----------------------------------------------------------------------
        |
        | A visit has two states that matter for routing:
        |   - Before HIE visit creation: it's a draft, and OTP / biometric
        |     consent endpoints are the only mutations.
        |   - After HIE visit creation: it's in the workspace, and billing,
        |     diagnoses, attachments, and dispatch all operate on the same
        |     consent token.
        |
        | Note the ordering: literal segments ('create', 'interventions') must
        | be declared before the {visit} wildcard.
        |
        */

        Route::prefix('visits')->name('visits.')->group(function () {
            Route::get('/', [VisitController::class, 'index'])->name('index');
            Route::get('create', [VisitController::class, 'create'])->name('create');
            Route::get('interventions', [VisitController::class, 'interventions'])->name('interventions');
            Route::post('/', [VisitController::class, 'store'])->name('store');
            Route::get('{visit}', [VisitController::class, 'show'])->name('show');

            // Contacts + OTP (visit start)
            Route::get('{visit}/contacts', [VisitController::class, 'contacts'])->name('contacts');
            Route::post('{visit}/otp', [VisitController::class, 'requestOtp'])->name('otp.request');
            Route::post('{visit}/otp/verify', [VisitController::class, 'submitOtp'])->name('otp.verify');

            // Biometric (visit start)
            Route::post('{visit}/biometric', [VisitController::class, 'startBiometric'])->name('biometric.start');
            Route::get('{visit}/biometric/poll', [VisitController::class, 'pollBiometric'])->name('biometric.poll');

            // Billing — lines, diagnoses, attachments
            Route::post('{visit}/lines', [VisitController::class, 'addLine'])->name('lines');
            Route::post('{visit}/attachments', [VisitController::class, 'uploadAttachment'])->name('attachments.upload');
            Route::post('{visit}/preview', [VisitController::class, 'preview'])->name('preview');
            Route::post('{visit}/diagnoses', [VisitController::class, 'addDiagnosis'])->name('diagnoses.add');

            // Visit-end consent
            Route::post('{visit}/otp/discharge', [VisitController::class, 'requestDischargeOtp'])->name('otp.discharge');
            Route::post('{visit}/biometric/discharge', [VisitController::class, 'startDischargeBiometric'])->name('biometric.discharge');
            Route::get('{visit}/biometric/discharge/poll', [VisitController::class, 'pollDischargeBiometric'])->name('biometric.discharge.poll');

            // Dispatch
            Route::post('{visit}/submit', [VisitController::class, 'submit'])->name('submit');
            Route::post('{visit}/discharge', [VisitController::class, 'discharge'])->name('discharge');

            // Close / abandon
            Route::post('{visit}/close', [VisitController::class, 'close'])->name('close');
        });

        Route::inertia('settings', 'tenant/Settings')->name('settings.index');
    });

    require __DIR__ . '/settings.php';
});