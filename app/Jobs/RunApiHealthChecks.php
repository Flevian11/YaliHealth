<?php

namespace App\Jobs;

use App\Services\ApiHealthChecker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class RunApiHealthChecks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function handle(ApiHealthChecker $checker): void
    {
        try {
            $checker->checkAll();
        } catch (Throwable $e) {
            Log::error('api_health.batch_failed', ['error' => $e->getMessage()]);
        }
    }
}