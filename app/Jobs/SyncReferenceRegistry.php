<?php

namespace App\Jobs;

use App\Services\ReferenceSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncReferenceRegistry implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(
        public string $registryKey,
        public ?int $triggeredBy = null,
        public string $source = 'manual',
    ) {}

    public function handle(ReferenceSyncService $service): void
    {
        try {
            $service->sync($this->registryKey, $this->triggeredBy, $this->source);
        } catch (Throwable $e) {
            Log::error('reference.sync.job_failed', [
                'registry' => $this->registryKey,
                'error' => $e->getMessage(),
            ]);
        }
    }
}