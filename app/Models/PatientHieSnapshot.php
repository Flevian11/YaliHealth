<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientHieSnapshot extends Model
{
    protected $fillable = [
        'patient_id', 'visit_id', 'snapshot_type',
        'data', 'fetched_at', 'expires_at',
    ];

    protected $casts = [
        'data' => 'array',
        'fetched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function isFresh(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    public function scopeFresh(Builder $q): Builder
    {
        return $q->where(function ($sub) {
            $sub->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeType(Builder $q, string $type): Builder
    {
        return $q->where('snapshot_type', $type);
    }
}