<?php

use App\Http\Controllers\Auth\UniversalLoginController;
use App\Http\Controllers\LandingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('home');

Route::get('/get-started', [LandingController::class, 'getStarted'])->name('get-started');

Route::get('/terms', [LandingController::class, 'terms'])->name('terms');
Route::get('/privacy', [LandingController::class, 'privacy'])->name('privacy');
Route::get('/gdpr', [LandingController::class, 'gdpr'])->name('gdpr');
Route::get('/contact', [LandingController::class, 'contact'])->name('contact');
Route::post('/contact', [LandingController::class, 'submitContact'])->name('contact.submit');
Route::get('/careers', [LandingController::class, 'careers'])->name('careers');
Route::get('/blog', [LandingController::class, 'blog'])->name('blog');
Route::get('/blog/{slug}', [LandingController::class, 'blogPost'])->name('blog.post');

/*
|--------------------------------------------------------------------------
| Central universal login
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/login', [UniversalLoginController::class, 'show'])->name('central.login');
    Route::post('/login', [UniversalLoginController::class, 'authenticate'])->name('central.login.attempt');
});

/*
|--------------------------------------------------------------------------
| Central registration is not open — redirect to the onboarding page
|--------------------------------------------------------------------------
*/

Route::redirect('/register', '/get-started');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});