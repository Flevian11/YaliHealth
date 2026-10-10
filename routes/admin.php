<?php

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

    Route::get('admin/hospitals', [HospitalController::class, 'index'])->name('admin.hospitals.index');
    Route::get('admin/hospitals/create', [HospitalController::class, 'create'])->name('admin.hospitals.create');
    Route::post('admin/hospitals', [HospitalController::class, 'store'])->name('admin.hospitals.store');
    Route::get('admin/hospitals/{id}', [HospitalController::class, 'show'])->name('admin.hospitals.show');
});