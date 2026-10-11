<?php

namespace App\Jobs;

use App\Services\TerminologySyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncTerminologySource implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(
        public string $source,
        public ?int $triggeredBy = null,
        public string $trigger = 'manual',
    ) {}

    public function handle(TerminologySyncService $service): void
    {
        try {
            $service->sync($this->source, $this->triggeredBy, $this->trigger);
        } catch (Throwable $e) {
            Log::error('terminology.sync.job_failed', [
                'source' => $this->source,
                'error' => $e->getMessage(),
            ]);
        }
    }
}