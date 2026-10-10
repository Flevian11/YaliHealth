<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HospitalController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest:super_admin')->group(function () {
    Route::get('admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
    Route::post('admin/login', [AuthController::class, 'login'])->name('admin.login.store');
});

Route::middleware('auth:super_admin')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::post('admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::prefix('admin/hospitals')->name('admin.hospitals.')->group(function () {
        Route::get('/', [HospitalController::class, 'index'])->name('index');
        Route::post('/', [HospitalController::class, 'store'])->name('store');
        Route::delete('{id}', [HospitalController::class, 'destroy'])->name('destroy');
        Route::post('{id}/suspend', [HospitalController::class, 'suspend'])->name('suspend');
        Route::post('{id}/activate', [HospitalController::class, 'activate'])->name('activate');
        Route::get('{id}/admins', [HospitalController::class, 'admins'])->name('admins.index');
        Route::post('{id}/admins', [HospitalController::class, 'storeAdmin'])->name('admins.store');
    });

    Route::get('admin/audit-logs', [AuditLogController::class, 'index'])->name('admin.audit-logs');

    Route::inertia('admin/profile', 'admin/Profile')->name('admin.profile');
    Route::inertia('admin/settings', 'admin/Settings')->name('admin.settings');
});