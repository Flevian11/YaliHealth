<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitConsent extends Model
{
    protected $fillable = [
        'visit_id', 'patient_id', 'purpose', 'method',
        'contact_id', 'contact_masked',
        'otp_sent_at', 'otp_verified_at',
        'auth_guid', 'authorization_status',
        'consent_token', 'status',
        'hie_response', 'expires_at',
        'captured_by',
    ];

    protected $casts = [
        'hie_response' => 'array',
        'otp_sent_at' => 'datetime',
        'otp_verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified' && ! empty($this->consent_token);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function scopeVerified(Builder $q): Builder
    {
        return $q->where('status', 'verified');
    }
}