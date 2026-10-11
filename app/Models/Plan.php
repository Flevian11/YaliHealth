<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'price_monthly',
        'price_yearly',
        'setup_fee',
        'billing_cycle',
        'billing_cycle_months',
        'currency',
        'trial_days',
        'is_active',
        'is_public',
        'sort_order',
        'features',
        'limits',
    ];

    protected $casts = [
        'features' => 'array',
        'limits' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
    ];

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }

    public function hasFeature(string $key): bool
    {
        return in_array($key, $this->features ?? [], true);
    }

    public function cycleLabel(): string
    {
        return match ($this->billing_cycle) {
            'monthly' => 'Monthly',
            'quarterly' => 'Quarterly',
            'semi_annual' => 'Every 6 months',
            'annual' => 'Yearly',
            default => ucfirst($this->billing_cycle),
        };
    }
}