<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // Every plan gets every feature. The differentiator is the billing cycle.
        $allFeatures = [];
        foreach (config('features.groups') as $group) {
            foreach (array_keys($group['features']) as $key) {
                $allFeatures[] = $key;
            }
        }

        // Remove old plans that were tier-based
        Plan::whereIn('slug', ['starter', 'professional', 'enterprise'])->delete();

        $common = [
            'description' => 'Full platform access — every module included.',
            'setup_fee' => 10000,
            'currency' => 'KES',
            'trial_days' => 14,
            'is_active' => true,
            'is_public' => true,
            'features' => $allFeatures,
            'limits' => [
                'max_users' => 0,
                'max_branches' => 0,
            ],
        ];

        Plan::updateOrCreate(
            ['slug' => 'monthly'],
            array_merge($common, [
                'name' => 'Monthly',
                'billing_cycle' => 'monthly',
                'billing_cycle_months' => 1,
                'price_monthly' => 6500,
                'price_yearly' => 78000, // 6500 * 12 for reference
                'sort_order' => 1,
            ]),
        );

        Plan::updateOrCreate(
            ['slug' => 'semi-annual'],
            array_merge($common, [
                'name' => 'Semi-Annual',
                'billing_cycle' => 'semi_annual',
                'billing_cycle_months' => 6,
                'price_monthly' => 5000, // effective monthly equivalent
                'price_yearly' => 30000, // billed amount per cycle
                'sort_order' => 2,
            ]),
        );

        Plan::updateOrCreate(
            ['slug' => 'annual'],
            array_merge($common, [
                'name' => 'Yearly',
                'billing_cycle' => 'annual',
                'billing_cycle_months' => 12,
                'price_monthly' => 4500, // effective monthly equivalent
                'price_yearly' => 54000, // billed amount per cycle
                'sort_order' => 3,
            ]),
        );
    }
}