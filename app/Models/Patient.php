<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'national_id',
        'sha_id',
        'cr_number',
        'insurance_type',
        'county',
        'village',
        'next_of_kin',
        'allergies',
        'notes',
        'registered_by',
        'first_visit_at',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'next_of_kin' => 'array',
        'allergies' => 'array',
        'first_visit_at' => 'datetime',
    ];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}