<?php

namespace App\Support;

use App\Models\Tenant;

class Features
{
    public static function catalog(): array
    {
        return config('features.groups', []);
    }

    public static function allKeys(): array
    {
        $keys = [];
        foreach (static::catalog() as $group) {
            foreach (array_keys($group['features']) as $key) {
                $keys[] = $key;
            }
        }
        return $keys;
    }

    public static function label(string $key): string
    {
        foreach (static::catalog() as $group) {
            if (isset($group['features'][$key])) {
                return $group['features'][$key];
            }
        }
        return $key;
    }

    public static function for(Tenant $tenant): array
    {
        $resolved = [];
        $planFeatures = $tenant->plan?->features ?? [];
        $overrides = $tenant->feature_overrides; // already an array via accessor

        foreach (static::allKeys() as $key) {
            if (array_key_exists($key, $overrides)) {
                $resolved[$key] = (bool) $overrides[$key];
            } else {
                $resolved[$key] = in_array($key, $planFeatures, true);
            }
        }

        return $resolved;
    }

    public static function enabledFor(Tenant $tenant, string $key): bool
    {
        return static::for($tenant)[$key] ?? false;
    }
}