<?php

namespace Database\Seeders;

use App\Actions\ProvisionHospital;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HospitalSeeder extends Seeder
{
    private const ADMIN_PASSWORD = 'password';

    public function run(): void
    {
        $plans = Plan::all()->keyBy('slug');

        if ($plans->isEmpty()) {
            $this->command->error('No plans found. Run: php artisan db:seed --class=PlanSeeder');
            return;
        }

        $hospitals = [
            [
                'name' => 'Nairobi West Hospital',
                'plan' => 'monthly',
                'phone' => '+254 700 111 001',
                'admin_name' => 'Alice Mwangi',
                'admin_email' => 'alice@nairobwest.co.ke',
                'status' => 'active',
                'subscription' => 'trialing',
                'trial_days' => 12,
            ],
            [
                'name' => 'Mombasa Medical Centre',
                'plan' => 'annual',
                'phone' => '+254 700 111 002',
                'admin_name' => 'Brian Otieno',
                'admin_email' => 'brian@mombasamed.co.ke',
                'status' => 'active',
                'subscription' => 'active',
                'period_months' => 8, // months remaining
            ],
            [
                'name' => 'Kisumu County Referral',
                'plan' => 'semi-annual',
                'phone' => '+254 700 111 003',
                'admin_name' => 'Carol Achieng',
                'admin_email' => 'carol@kisumureferral.go.ke',
                'status' => 'active',
                'subscription' => 'trialing',
                'trial_days' => 2, // urgent
            ],
            [
                'name' => 'Nakuru Level 5 Hospital',
                'plan' => 'monthly',
                'phone' => '+254 700 111 004',
                'admin_name' => 'David Kariuki',
                'admin_email' => 'david@nakurul5.go.ke',
                'status' => 'active',
                'subscription' => 'active',
                'period_days' => 10, // expiring soon
            ],
            [
                'name' => 'Eldoret Specialist Clinic',
                'plan' => 'annual',
                'phone' => '+254 700 111 005',
                'admin_name' => 'Eva Chebet',
                'admin_email' => 'eva@eldoretclinic.co.ke',
                'status' => 'active',
                'subscription' => 'active',
                'period_months' => 11,
            ],
            [
                'name' => 'Thika Level 5 Hospital',
                'plan' => 'semi-annual',
                'phone' => '+254 700 111 006',
                'admin_name' => 'Felix Njoroge',
                'admin_email' => 'felix@thikal5.go.ke',
                'status' => 'active',
                'subscription' => 'trialing',
                'trial_days' => 14,
            ],
            [
                'name' => 'Meru Teaching Hospital',
                'plan' => 'monthly',
                'phone' => '+254 700 111 007',
                'admin_name' => 'Grace Kimani',
                'admin_email' => 'grace@meruteaching.go.ke',
                'status' => 'active',
                'subscription' => 'active',
                'period_days' => 20,
            ],
            [
                'name' => 'Machakos Level 5 Hospital',
                'plan' => 'annual',
                'phone' => '+254 700 111 008',
                'admin_name' => 'Henry Mutua',
                'admin_email' => 'henry@machakosl5.go.ke',
                'status' => 'suspended',
                'subscription' => 'active',
                'period_months' => 6,
            ],
            [
                'name' => 'Kiambu Health Centre',
                'plan' => 'monthly',
                'phone' => '+254 700 111 009',
                'admin_name' => 'Irene Wanjiru',
                'admin_email' => 'irene@kiambuhealth.co.ke',
                'status' => 'active',
                'subscription' => 'expired',
            ],
            [
                'name' => 'Kakamega County Hospital',
                'plan' => 'semi-annual',
                'phone' => '+254 700 111 010',
                'admin_name' => 'James Wekesa',
                'admin_email' => 'james@kakamegach.co.ke',
                'status' => 'active',
                'subscription' => 'active',
                'period_months' => 5,
            ],
        ];

        $provision = app(ProvisionHospital::class);
        $suffix = env('TENANCY_TENANT_SUFFIX', 'localhost');

        $created = 0;
        $skipped = 0;

        foreach ($hospitals as $h) {
            $slug = Str::slug($h['name']);
            $tenantId = str_replace('-', '_', $slug);

            if (Tenant::find($tenantId)) {
                $this->command->warn("Skipped: {$h['name']} (already exists)");
                $skipped++;
                continue;
            }

            $plan = $plans[$h['plan']] ?? $plans->first();

            $tenant = $provision->execute([
                'name' => $h['name'],
                'phone' => $h['phone'],
                'plan_id' => $plan->id,
                'admin_name' => $h['admin_name'],
                'admin_email' => $h['admin_email'],
                'admin_password' => self::ADMIN_PASSWORD,
            ]);

            $this->applySubscriptionState($tenant, $h, $plan);

            $domain = $tenant->domains()->first()?->domain;
            $this->command->info(
                "Created: {$h['name']} → http://{$domain}.{$suffix}:8000",
            );
            $created++;
        }

        $this->command->newLine();
        $this->command->info("Done. Created: {$created}, Skipped: {$skipped}.");
        $this->command->info('Admin login for every hospital:');
        $this->command->line('  Password: ' . self::ADMIN_PASSWORD);
    }

    private function applySubscriptionState(Tenant $tenant, array $h, Plan $plan): void
    {
        $status = $h['status'] ?? 'active';
        $sub = $h['subscription'] ?? 'active';

        $tenant->status = $status;
        $tenant->subscription_status = $sub;

        if ($sub === 'trialing') {
            $tenant->trial_ends_at = now()->addDays($h['trial_days'] ?? $plan->trial_days);
            $tenant->current_period_start = null;
            $tenant->current_period_end = null;
        } elseif ($sub === 'active') {
            $tenant->trial_ends_at = null;
            $tenant->current_period_start = now();

            if (isset($h['period_days'])) {
                $tenant->current_period_end = now()->addDays($h['period_days']);
            } elseif (isset($h['period_months'])) {
                $tenant->current_period_end = now()->addMonths($h['period_months']);
            } else {
                $tenant->current_period_end = now()->addMonths(
                    $plan->billing_cycle_months,
                );
            }
        } elseif ($sub === 'expired') {
            $tenant->trial_ends_at = null;
            $tenant->current_period_start = now()->subMonths(2);
            $tenant->current_period_end = now()->subDays(5);
        }

        $tenant->save();
    }
}