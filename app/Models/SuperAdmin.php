<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class SuperAdmin extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'last_login_at',
        'created_by',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

        public function roleModel(): ?Role
    {
        // Static request-scoped cache (in-memory, no serialization)
        static $cache = [];

        if (! array_key_exists($this->role, $cache)) {
            $cache[$this->role] = Role::where('slug', $this->role)->first();
        }

        return $cache[$this->role];
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['owner', 'admin'], true);
    }

    public function hasPermission(string $key): bool
    {
        return $this->roleModel()?->hasPermission($key) ?? false;
    }

    public function permissions(): array
    {
        $perms = $this->roleModel()?->permissions ?? [];

        if (in_array('*', $perms, true)) {
            return Role::allPermissionKeys();
        }

        return $perms;
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}