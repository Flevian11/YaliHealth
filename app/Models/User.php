<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'email_verified_at',
    'require_email_otp',
    'last_login_at',
    'last_login_ip',
    'is_active',
    'invited_by',
    'invited_at',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
    'email_otp_code',
])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'require_email_otp' => 'boolean',
            'email_otp_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'invited_at' => 'datetime',
        ];
    }

    /* ═══════════════════════════════════════════════════
       Role helpers
       ═══════════════════════════════════════════════════ */

    public function isHospitalAdmin(): bool
    {
        return $this->role === 'hospital_admin';
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /* ═══════════════════════════════════════════════════
       Account status
       ═══════════════════════════════════════════════════ */

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * The staff-facing status label. Three states:
     *   active   — verified, active, has logged in
     *   invited  — active but never logged in (invite pending)
     *   inactive — deactivated by an admin
     */
    public function status(): string
    {
        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->invited_at !== null && $this->last_login_at === null) {
            return 'invited';
        }

        return 'active';
    }

    /* ═══════════════════════════════════════════════════
       OTP (existing)
       ═══════════════════════════════════════════════════ */

    public function otpIsExpired(): bool
    {
        if (! $this->email_otp_expires_at) {
            return true;
        }

        return $this->email_otp_expires_at->isPast();
    }

    /* ═══════════════════════════════════════════════════
       Relations
       ═══════════════════════════════════════════════════ */

    public function invitedBy()
    {
        return $this->belongsTo(self::class, 'invited_by');
    }

    public function invites()
    {
        return $this->hasMany(self::class, 'invited_by');
    }

    /* ═══════════════════════════════════════════════════
       Scopes
       ═══════════════════════════════════════════════════ */

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function scopeWithRole(Builder $q, string $role): Builder
    {
        return $q->where('role', $role);
    }
}