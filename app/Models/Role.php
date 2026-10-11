<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'permissions',
        'is_system',
        'sort_order',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    public function superAdmins()
    {
        return $this->hasMany(SuperAdmin::class, 'role', 'slug');
    }

    public function hasPermission(string $key): bool
    {
        $perms = $this->permissions ?? [];
        return in_array('*', $perms, true) || in_array($key, $perms, true);
    }

    public static function catalog(): array
    {
        return config('permissions.groups', []);
    }

    public static function allPermissionKeys(): array
    {
        $keys = [];
        foreach (static::catalog() as $group) {
            foreach (array_keys($group['permissions']) as $key) {
                $keys[] = $key;
            }
        }
        return $keys;
    }

    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }
}