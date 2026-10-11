<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class TenantConnection extends Model
{
    protected $fillable = [
        'tenant_id',
        'environment',
        'hie_base_url',
        'client_id',
        'client_secret_encrypted',
        'api_key_encrypted',
        'facility_fr_code',
        'facility_name',
        'is_active',
        'last_verified_at',
        'last_verified_status',
        'last_verified_latency_ms',
        'last_verified_http_status',
        'last_verified_error',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_verified_at' => 'datetime',
    ];

    protected $hidden = [
        'client_secret_encrypted',
        'api_key_encrypted',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /* ───── Encrypted secret handling ───── */

    public function setClientSecretAttribute(?string $value): void
    {
        $this->attributes['client_secret_encrypted'] = $value === null || $value === ''
            ? null
            : Crypt::encryptString($value);
    }

    public function getClientSecretAttribute(): ?string
    {
        $raw = $this->attributes['client_secret_encrypted'] ?? null;
        return $raw ? Crypt::decryptString($raw) : null;
    }

    public function hasClientSecret(): bool
    {
        return ! empty($this->attributes['client_secret_encrypted']);
    }

    public function maskedClientSecret(): ?string
    {
        if (! $this->hasClientSecret()) {
            return null;
        }
        $secret = $this->getClientSecretAttribute();
        $len = strlen($secret);
        if ($len <= 8) {
            return str_repeat('•', $len);
        }
        return substr($secret, 0, 4) . str_repeat('•', max(4, $len - 8)) . substr($secret, -4);
    }

    public function setApiKeyAttribute(?string $value): void
    {
        $this->attributes['api_key_encrypted'] = $value === null || $value === ''
            ? null
            : Crypt::encryptString($value);
    }

    public function getApiKeyAttribute(): ?string
    {
        $raw = $this->attributes['api_key_encrypted'] ?? null;
        return $raw ? Crypt::decryptString($raw) : null;
    }

    public function hasApiKey(): bool
    {
        return ! empty($this->attributes['api_key_encrypted']);
    }

    public function maskedApiKey(): ?string
    {
        if (! $this->hasApiKey()) {
            return null;
        }
        $key = $this->getApiKeyAttribute();
        $len = strlen($key);
        if ($len <= 8) {
            return str_repeat('•', $len);
        }
        return substr($key, 0, 4) . str_repeat('•', max(4, $len - 8)) . substr($key, -4);
    }

    /* ───── Status helpers ───── */

    public function isReady(): bool
    {
        return $this->is_active
            && ! empty($this->attributes['client_id'])
            && $this->hasClientSecret()
            && ! empty($this->facility_fr_code);
    }

    public function isHealthy(): bool
    {
        return $this->last_verified_status === 'success';
    }

    public function isFailing(): bool
    {
        return $this->last_verified_status === 'failed';
    }

    public function status(): string
    {
        if (! $this->is_active) return 'inactive';
        if (! $this->isReady()) return 'incomplete';
        if ($this->isFailing()) return 'failing';
        if ($this->isHealthy()) return 'healthy';
        return 'unverified';
    }
}