<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Visit;

class Patient extends Model
{
    protected $fillable = [
        'patient_number',
        'first_name',
        'middle_name',
        'last_name',
        'date_of_birth',
        'gender',
        'phone',
        'email',
        'county',
        'village',
        'national_id',
        'sha_id',
        'cr_number',
        'verification_status',
        'verification_attempts',
        'last_verified_at',
        'last_verification_error',
        'next_of_kin',
        'allergies',
        'notes',
        'registered_by',
        'first_visit_at',
        'merged_into_id',
        'principal_cr_number',
        'principal_name',
        'relationship_to_principal',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'next_of_kin' => 'array',
        'allergies' => 'array',
        'last_verified_at' => 'datetime',
        'first_visit_at' => 'datetime',
    ];

    /* ───── Computed ───── */

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }

    public function getInitialsAttribute(): string
    {
        $a = $this->first_name ? $this->first_name[0] : '';
        $b = $this->last_name ? $this->last_name[0] : '';
        return strtoupper($a . $b) ?: 'PT';
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified'
            && ! empty($this->hiePatientId());
    }

    public function isUnverified(): bool
    {
        return $this->verification_status === 'unverified';
    }

    public function isLocalOnly(): bool
    {
        return $this->verification_status === 'local_only';
    }

    public function isMerged(): bool
    {
        return $this->merged_into_id !== null;
    }

    public function isDependant(): bool
    {
        return ! empty($this->principal_cr_number);
    }

    public function isPrincipal(): bool
    {
        return ! empty($this->cr_number) && empty($this->principal_cr_number);
    }

    /**
     * The CR number to send on every HIE call for this patient.
     * For a dependant, this is the principal's CR.
     */
    public function hiePatientId(): ?string
    {
        return $this->principal_cr_number ?: $this->cr_number;
    }

    /* ───── Relations ───── */

    public function mergedInto()
    {
        return $this->belongsTo(self::class, 'merged_into_id');
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    /* ───── Scopes ───── */

    public function scopeNotMerged(Builder $q): Builder
    {
        return $q->whereNull('merged_into_id');
    }

    public function scopeSearch(Builder $q, string $term): Builder
    {
        $like = "%{$term}%";

        return $q->where(function ($sub) use ($like) {
            $sub->where('first_name', 'ILIKE', $like)
                ->orWhere('middle_name', 'ILIKE', $like)
                ->orWhere('last_name', 'ILIKE', $like)
                ->orWhere('patient_number', 'ILIKE', $like)
                ->orWhere('national_id', 'ILIKE', $like)
                ->orWhere('phone', 'ILIKE', $like)
                ->orWhere('cr_number', 'ILIKE', $like);
        });
    }
}
