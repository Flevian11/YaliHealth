<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visit extends Model
{
    protected $fillable = [
        'visit_number',
        'patient_id', 'cr_number',
        'visit_type', 'payment_mode', 'service_type', 'scenario',
        'fund', 'payment_mechanism', 'needs_preauth', 'needs_elective_preauth',
        'consent_token', 'auth_guid', 'hie_visit_ref',
        'claim_status',
        'admitted_at', 'discharged_at', 'discharge_reason',
        'emergency_deadline_at', 'closed_at',
        'private_insurer_id',
        'opened_by', 'closed_by', 'notes',
        'claim_draft', 'invoice_number',
    ];

    protected $casts = [
        'needs_preauth' => 'boolean',
        'needs_elective_preauth' => 'boolean',
        'admitted_at' => 'datetime',
        'discharged_at' => 'datetime',
        'emergency_deadline_at' => 'datetime',
        'closed_at' => 'datetime',
        'claim_draft' => 'array',   // ← the missing piece
    ];

    /* ───── Relations ───── */

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(VisitIntervention::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(VisitConsent::class);
    }

    /* ───── Computed ───── */

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }

    public function isSha(): bool
    {
        return $this->payment_mode === 'sha';
    }

    public function isEmergency(): bool
    {
        return $this->fund === 'ECCIF' || $this->visit_type === 'EMERGENCY';
    }

    public function isOutpatient(): bool
    {
        return $this->visit_type === 'OP';
    }

    public function isInpatient(): bool
    {
        return $this->visit_type === 'IP';
    }

    public function isDispatched(): bool
    {
        return in_array(
            $this->claim_status,
            ['submitted', 'accepted', 'rejected', 'closed'],
            true,
        );
    }

    /**
     * Always return a well-formed draft structure, even if the column is
     * empty or was written as a bare JSON string by an older migration.
     */
    public function claimDraft(): array
    {
        $draft = $this->claim_draft;

        if (! is_array($draft)) {
            return ['lines' => [], 'diagnoses' => [], 'attachments' => []];
        }

        return array_merge(
            ['lines' => [], 'diagnoses' => [], 'attachments' => []],
            $draft,
        );
    }

    /* ───── Scopes ───── */

    public function scopeOpen(Builder $q): Builder
    {
        return $q->whereNull('closed_at');
    }

    public function scopeSha(Builder $q): Builder
    {
        return $q->where('payment_mode', 'sha');
    }

    public function scopeWithStatus(Builder $q, string $status): Builder
    {
        return $q->where('claim_status', $status);
    }
}