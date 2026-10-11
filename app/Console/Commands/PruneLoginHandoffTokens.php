<?php

namespace App\Console\Commands;

use App\Models\LoginHandoffToken;
use Illuminate\Console\Command;

class PruneLoginHandoffTokens extends Command
{
    protected $signature = 'login-handoff:prune';
    protected $description = 'Delete expired and used login handoff tokens';

    public function handle(): int
    {
        $deleted = LoginHandoffToken::query()
            ->where(function ($q) {
                $q->where('expires_at', '<', now()->subHours(2))
                  ->orWhere('used_at', '<', now()->subHours(2));
            })
            ->delete();

        $this->info("Pruned {$deleted} handoff tokens.");

        return self::SUCCESS;
    }
}