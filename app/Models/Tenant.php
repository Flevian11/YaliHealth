<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
    ];

    /* ─── Force real-column reads/writes for billing fields ─── */

    public function getPlanIdAttribute($value): ?int
    {
        return $value !== null ? (int) $value : null;
    }

    public function setPlanIdAttribute($value): void
    {
        $this->attributes['plan_id'] = $value;
    }

    public function getSubscriptionStatusAttribute($value): ?string
    {
        return $value;
    }

    public function setSubscriptionStatusAttribute($value): void
    {
        $this->attributes['subscription_status'] = $value;
    }

    public function setTrialEndsAtAttribute($value): void
    {
        $this->attributes['trial_ends_at'] = $value;
    }

    public function setCurrentPeriodStartAttribute($value): void
    {
        $this->attributes['current_period_start'] = $value;
    }

    public function setCurrentPeriodEndAttribute($value): void
    {
        $this->attributes['current_period_end'] = $value;
    }

    public function getFeatureOverridesAttribute($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    public function setFeatureOverridesAttribute($value): void
    {
        $this->attributes['feature_overrides'] = json_encode($value ?? []);
    }

    /* ─── Relations ─── */

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /* ─── Status helpers ─── */

    public function isActive(): bool
    {
        return ($this->status ?? 'active') === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->subscription_status === 'trialing'
            && $this->trial_ends_at
            && $this->trial_ends_at->isFuture();
    }

    public function isSubscriptionActive(): bool
    {
        if ($this->subscription_status === 'trialing') {
            return $this->trial_ends_at && $this->trial_ends_at->isFuture();
        }

        if ($this->subscription_status !== 'active') {
            return false;
        }

        if (! $this->current_period_end) {
            return true;
        }

        return $this->current_period_end->isFuture();
    }

    public function canAccessSystem(): bool
    {
        return $this->isActive() && $this->isSubscriptionActive();
    }

    public function hasFeature(string $key): bool
    {
        $overrides = $this->feature_overrides;

        if (array_key_exists($key, $overrides)) {
            return (bool) $overrides[$key];
        }

        return $this->plan?->hasFeature($key) ?? false;
    }

    public function features(): array
    {
        return $this->plan?->features ?? [];
    }

    public function trialDaysLeft(): int
    {
        if (! $this->isOnTrial()) return 0;
        return max(0, (int) Carbon::now()->diffInDays($this->trial_ends_at, false));
    }
}