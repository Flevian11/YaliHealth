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
        public static function roleOptions(): array
    {
        return collect(array_keys(config('tenant_permissions.roles', [])))
            ->mapWithKeys(fn ($slug) => [$slug => static::roleLabel($slug)])
            ->all();
    }

        public static function roleTone(string $role): string
    {
        return match ($role) {
            'hospital_admin' => 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            'doctor'         => 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
            'nurse'          => 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
            'receptionist'   => 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
            'billing'        => 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
            default          => 'bg-muted text-muted-foreground',
        };
    }
}