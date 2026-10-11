<?php

namespace App\Providers;

use App\Listeners\RecordLoginActivity;
use App\Models\Setting;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        View::composer('app', function ($view) {
            $view->with('theme', Setting::theme());
        });

        Event::listen(Login::class, RecordLoginActivity::class);

        /* ─── Rate limiters ─── */

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('passkeys-login', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });
    }
}