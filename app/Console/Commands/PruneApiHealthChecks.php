<?php

namespace App\Console\Commands;

use App\Models\ApiHealthCheck;
use Illuminate\Console\Command;

class PruneApiHealthChecks extends Command
{
    protected $signature = 'api-health:prune {--days=30 : Delete checks older than this many days}';
    protected $description = 'Delete stale API health check records';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $deleted = ApiHealthCheck::where('checked_at', '<', $cutoff)->delete();

        $this->info("Pruned {$deleted} checks older than {$days} days.");

        return self::SUCCESS;
    }
}