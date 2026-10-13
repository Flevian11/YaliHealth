<?php

namespace App\Console\Commands;

use App\Jobs\ReconcileUnverifiedPatients;
use App\Models\Tenant;
use Illuminate\Console\Command;

class ReconcileAllTenants extends Command
{
    protected $signature = 'patients:reconcile-all';
    protected $description = 'Run reconciliation across every tenant';

    public function handle(): int
    {
        $count = 0;

        Tenant::query()->each(function (Tenant $tenant) use (&$count) {
            try {
                $tenant->run(function () {
                    ReconcileUnverifiedPatients::dispatchSync();
                });
                $count++;
            } catch (\Throwable $e) {
                $this->error("Tenant {$tenant->id}: {$e->getMessage()}");
            }
        });

        $this->info("Reconciled {$count} tenants.");

        return self::SUCCESS;
    }
}