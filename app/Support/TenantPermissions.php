<?php

namespace App\Support;

use App\Models\User;

class TenantPermissions
{
    public static function catalog(): array
    {
        return config('tenant_permissions.catalog', []);
    }

    public static function allKeys(): array
    {
        $keys = [];
        $catalog = static::catalog();

        foreach ($catalog as $group) {
            foreach (array_keys($group) as $k) {
                $keys[] = $k;
            }
        }

        return $keys;
    }

    public static function forRole(string $role): array
    {
        $roles = config('tenant_permissions.roles', []);
        $perms = $roles[$role] ?? [];

        if (in_array('*', $perms, true)) {
            return static::allKeys();
        }

        $allKeys = static::allKeys();
        $expanded = [];

        foreach ($perms as $p) {
            if (str_ends_with($p, '.*')) {
                $prefix = substr($p, 0, -2) . '.';

                foreach ($allKeys as $k) {
                    if (str_starts_with($k, $prefix)) {
                        $expanded[] = $k;
                    }
                }
            } else {
                $expanded[] = $p;
            }
        }

        return array_values(array_unique($expanded));
    }

    public static function can(User $user, string $key): bool
    {
        return in_array($key, static::forRole($user->role), true);
    }

    public static function roleLabel(string $role): string
    {
        $labels = [
            'hospital_admin' => 'Hospital Administrator',
            'doctor' => 'Doctor',
            'nurse' => 'Nurse',
            'receptionist' => 'Receptionist',
            'billing' => 'Billing Officer',
        ];

        if (isset($labels[$role])) {
            return $labels[$role];
        }

        return ucfirst($role);
    }
}