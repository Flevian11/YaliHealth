<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Jobs\RunApiHealthChecks;
use Illuminate\Support\Facades\Schedule;

Schedule::command('patients:reconcile-all')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();


Schedule::job(new RunApiHealthChecks)
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('api-health:prune --days=30')
    ->daily()
    ->at('03:00')
    ->onOneServer();

Schedule::job(new RunApiHealthChecks)
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

    Schedule::command('login-handoff:prune')->everyFifteenMinutes();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
