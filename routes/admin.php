<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\ApiHealthController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FeatureController;
use App\Http\Controllers\Admin\HospitalController;
use App\Http\Controllers\Admin\OnboardingController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ReferenceDataController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SuperAdminController;
use App\Http\Controllers\Admin\TenantConnectionController;
use App\Http\Controllers\Admin\TerminologyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Legacy path redirects (Fortify uses the same URIs on every domain)
|--------------------------------------------------------------------------
| On admin.localhost, Fortify's /login, /register, /forgot-password, etc.
| render the tenant-facing pages. These redirects catch those paths on the
| admin domain and send users to the correct admin console route.
*/

Route::redirect('login', '/admin/login');
Route::redirect('register', '/admin/login');
Route::redirect('forgot-password', '/admin/login');
Route::redirect('reset-password/{token}', '/admin/login');
Route::redirect('user/confirm-password', '/admin/login');
Route::redirect('two-factor-challenge', '/admin/login');

/*
|--------------------------------------------------------------------------
| Admin console routes
|--------------------------------------------------------------------------
*/

Route::middleware('guest:super_admin')->group(function () {
    Route::get('admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
    Route::post('admin/login', [AuthController::class, 'login'])->name('admin.login.store');
});

Route::middleware('auth:super_admin')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::post('admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

    // Profile
    Route::get('admin/profile', [ProfileController::class, 'edit'])->name('admin.profile');
    Route::put('admin/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
    Route::put('admin/profile/password', [ProfileController::class, 'updatePassword'])->name('admin.profile.password');

    // Hospitals
    Route::prefix('admin/hospitals')->name('admin.hospitals.')->group(function () {
        Route::get('/', [HospitalController::class, 'index'])->middleware('perm:hospitals.view')->name('index');
        Route::post('/', [HospitalController::class, 'store'])->middleware('perm:hospitals.create')->name('store');
        Route::delete('{id}', [HospitalController::class, 'destroy'])->middleware('perm:hospitals.delete')->name('destroy');
        Route::post('{id}/suspend', [HospitalController::class, 'suspend'])->middleware('perm:hospitals.suspend')->name('suspend');
        Route::post('{id}/activate', [HospitalController::class, 'activate'])->middleware('perm:hospitals.suspend')->name('activate');
        Route::post('{id}/plan', [HospitalController::class, 'changePlan'])->middleware('perm:hospitals.edit')->name('change-plan');
        Route::post('{id}/trial-toggle', [HospitalController::class, 'toggleTrial'])->middleware('perm:hospitals.edit')->name('trial-toggle');
        Route::get('{id}/admins', [HospitalController::class, 'admins'])->middleware('perm:hospitals.view')->name('admins.index');
        Route::post('{id}/admins', [HospitalController::class, 'storeAdmin'])->middleware('perm:hospitals.edit')->name('admins.store');
        Route::get('{id}/features', [HospitalController::class, 'features'])->middleware('perm:hospitals.view')->name('features.index');
        Route::post('{id}/features', [HospitalController::class, 'updateFeatures'])->middleware('perm:hospitals.features')->name('features.update');
    });

    // Plans
    Route::prefix('admin/plans')->name('admin.plans.')->group(function () {
        Route::get('/', [PlanController::class, 'index'])->middleware('perm:plans.view')->name('index');
        Route::post('/', [PlanController::class, 'store'])->middleware('perm:plans.create')->name('store');
        Route::put('{plan}', [PlanController::class, 'update'])->middleware('perm:plans.edit')->name('update');
        Route::delete('{plan}', [PlanController::class, 'destroy'])->middleware('perm:plans.delete')->name('destroy');
    });

    // Features
    Route::prefix('admin/features')->name('admin.features.')->group(function () {
        Route::get('/', [FeatureController::class, 'index'])->middleware('perm:features.view')->name('index');
        Route::post('toggle-plan', [FeatureController::class, 'togglePlan'])->middleware('perm:features.toggle')->name('toggle-plan');
        Route::post('bulk-toggle', [FeatureController::class, 'bulkToggle'])->middleware('perm:features.toggle')->name('bulk-toggle');
    });

    // Super Admins
    Route::prefix('admin/super-admins')->name('admin.super-admins.')->group(function () {
        Route::get('/', [SuperAdminController::class, 'index'])->middleware('perm:admins.view')->name('index');
        Route::post('/', [SuperAdminController::class, 'store'])->middleware('perm:admins.create')->name('store');
        Route::put('{superAdmin}', [SuperAdminController::class, 'update'])->middleware('perm:admins.edit')->name('update');
        Route::delete('{superAdmin}', [SuperAdminController::class, 'destroy'])->middleware('perm:admins.delete')->name('destroy');
    });

    // Roles
    Route::prefix('admin/roles')->name('admin.roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->middleware('perm:roles.view')->name('index');
        Route::post('/', [RoleController::class, 'store'])->middleware('perm:roles.create')->name('store');
        Route::put('{role}', [RoleController::class, 'update'])->middleware('perm:roles.edit')->name('update');
        Route::delete('{role}', [RoleController::class, 'destroy'])->middleware('perm:roles.delete')->name('destroy');
    });

    // Announcements
    Route::prefix('admin/announcements')->name('admin.announcements.')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index'])->middleware('perm:announcements.view')->name('index');
        Route::post('/', [AnnouncementController::class, 'store'])->middleware('perm:announcements.create')->name('store');
        Route::put('{announcement}', [AnnouncementController::class, 'update'])->middleware('perm:announcements.create')->name('update');
        Route::post('{announcement}/publish', [AnnouncementController::class, 'publish'])->middleware('perm:announcements.publish')->name('publish');
        Route::delete('{announcement}', [AnnouncementController::class, 'destroy'])->middleware('perm:announcements.delete')->name('destroy');
    });

    // Onboarding
    Route::get('admin/onboarding', [OnboardingController::class, 'index'])->middleware('perm:hospitals.create')->name('admin.onboarding');
    Route::post('admin/onboarding', [OnboardingController::class, 'store'])->middleware('perm:hospitals.create')->name('admin.onboarding.store');

    // Audit logs
    Route::get('admin/audit-logs', [AuditLogController::class, 'index'])->middleware('perm:audit.view')->name('admin.audit-logs');

    // Settings
    Route::get('admin/settings', [SettingsController::class, 'edit'])->middleware('perm:settings.view')->name('admin.settings');
    Route::put('admin/settings', [SettingsController::class, 'update'])->middleware('perm:settings.edit')->name('admin.settings.update');

    // API Health
    Route::prefix('admin/api-health')->name('admin.api-health.')->group(function () {
        Route::get('/', [ApiHealthController::class, 'index'])->middleware('perm:settings.view')->name('index');
        Route::post('refresh', [ApiHealthController::class, 'refresh'])->middleware('perm:settings.edit')->name('refresh');
        Route::get('progress', [ApiHealthController::class, 'progress'])->middleware('perm:settings.view')->name('progress');
        Route::get('{key}', [ApiHealthController::class, 'show'])->middleware('perm:settings.view')->name('show');
    });

    // Reference Data
    Route::prefix('admin/reference-data')->name('admin.reference-data.')->group(function () {
        Route::get('/', [ReferenceDataController::class, 'index'])->middleware('perm:settings.view')->name('index');
        Route::post('sync-all', [ReferenceDataController::class, 'syncAll'])->middleware('perm:settings.edit')->name('sync-all');
        Route::get('sync-all/progress', [ReferenceDataController::class, 'syncAllProgress'])->middleware('perm:settings.view')->name('sync-all-progress');
        Route::post('{key}/sync', [ReferenceDataController::class, 'sync'])->middleware('perm:settings.edit')->name('sync');
        Route::get('{key}/sync-status', [ReferenceDataController::class, 'syncStatus'])->middleware('perm:settings.view')->name('sync-status');
        Route::get('{key}', [ReferenceDataController::class, 'show'])->middleware('perm:settings.view')->name('show');
    });

    // Tenant Connections
    Route::prefix('admin/tenant-connections')->name('admin.tenant-connections.')->group(function () {
        Route::get('/', [TenantConnectionController::class, 'index'])->middleware('perm:settings.view')->name('index');
        Route::post('test-all', [TenantConnectionController::class, 'testAll'])->middleware('perm:settings.edit')->name('test-all');
        Route::get('{tenantId}', [TenantConnectionController::class, 'show'])->middleware('perm:settings.view')->name('show');
        Route::put('{tenantId}', [TenantConnectionController::class, 'upsert'])->middleware('perm:settings.edit')->name('upsert');
        Route::post('{tenantId}/test', [TenantConnectionController::class, 'test'])->middleware('perm:settings.edit')->name('test');
        Route::post('{tenantId}/toggle', [TenantConnectionController::class, 'toggleActive'])->middleware('perm:settings.edit')->name('toggle');
        Route::delete('{tenantId}', [TenantConnectionController::class, 'destroy'])->middleware('perm:settings.edit')->name('destroy');
    });

    // Terminology
    Route::prefix('admin/terminology')->name('admin.terminology.')->group(function () {
        Route::get('/', [TerminologyController::class, 'index'])->middleware('perm:settings.view')->name('index');
        Route::post('sync-all', [TerminologyController::class, 'syncAll'])->middleware('perm:settings.edit')->name('sync-all');
        Route::get('sync/{source}', [TerminologyController::class, 'syncStatus'])->middleware('perm:settings.view')->name('sync-status');
        Route::post('sync/{source}', [TerminologyController::class, 'sync'])->middleware('perm:settings.edit')->name('sync');
        Route::get('{source}/{code}', [TerminologyController::class, 'show'])->middleware('perm:settings.view')->name('show');
    });
});