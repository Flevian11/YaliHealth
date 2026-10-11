<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Central — must be first so /register, /login resolve on localhost
            Route::middleware('web')
                ->domain(env('APP_DOMAIN', 'localhost'))
                ->group(base_path('routes/web.php'));

            // Admin console
            Route::middleware('web')
                ->domain(env('TENANCY_ADMIN_DOMAIN', 'admin.localhost'))
                ->group(base_path('routes/admin.php'));

            // Tenant routes — no domain constraint, tenancy middleware handles identification
            Route::middleware('web')
                ->group(base_path('routes/tenant.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant.active' => \App\Http\Middleware\EnsureTenantIsActive::class,
            'feature' => \App\Http\Middleware\EnsureFeatureEnabled::class,
            'perm' => \App\Http\Middleware\EnsureSuperAdminHasPermission::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request) {
            $host = $request->getHost();
            $adminDomain = env('TENANCY_ADMIN_DOMAIN', 'admin.localhost');

            return $host === $adminDomain
                ? route('admin.login')
                : route('login');
        });

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();