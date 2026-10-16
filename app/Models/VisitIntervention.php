<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitIntervention extends Model
{
    protected $fillable = [
        'visit_id', 'intervention_code', 'name',
        'fund', 'payment_mechanism', 'access_point',
        'needs_preauth', 'needs_elective_preauth', 'tariff',
        'flags', 'status',
        'preauth_code', 'preauth_finalised_at',
        'added_by', 'retired_at',
    ];

    protected $casts = [
        'needs_preauth' => 'boolean',
        'needs_elective_preauth' => 'boolean',
        'flags' => 'array',
        'preauth_finalised_at' => 'datetime',
        'retired_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isRetired(): bool
    {
        return $this->status === 'retired';
    }

    public function isPreauthFinalised(): bool
    {
        return $this->preauth_finalised_at !== null;
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('status', 'active');
    }
}