<?php

namespace App\Services;

use App\Models\Patient;
use App\Services\Hie\HieClient;
use App\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\Hie\HieException;
use App\Services\Hie\RegistryService;

class PatientRegistrationService
{
    public function __construct(
        private PatientNumberGenerator $numbers,
        private RegistryService $registry,
    ) {}

    /**
     * Register a patient as SHA-seeking. Attempts MPI lookup; falls
     * back to unverified if HIE is unreachable.
     */
    /**
     * Register a patient as SHA-seeking.
     *
     * Idempotent by CR number: if a local patient already has the
     * resolved CR, that record is returned untouched.
     *
     * @param  array  $data  Form data. May include 'resolved_cr_number',
     *                       'resolved_principal_cr_number', 'resolved_principal_name',
     *                       'resolved_relationship' when the UI has already
     *                       performed a lookup and the operator picked a record.
     */
    public function registerWithSha(array $data): Patient
    {
        // If the UI resolved an identity, trust it; else do an MPI lookup.
        if (! empty($data['resolved_cr_number'])) {
            $mpiResult = [
                'success' => true,
                'not_found' => false,
                'cr_number' => $data['resolved_cr_number'],
                'principal_cr_number' => $data['resolved_principal_cr_number'] ?? null,
                'principal_name' => $data['resolved_principal_name'] ?? null,
                'relationship_to_principal' => $data['resolved_relationship'] ?? null,
                'record' => null,
                'error' => null,
            ];
        } else {
            $mpiResult = $this->tryMpiLookup($data);
        }

        // Idempotence: if the CR already exists locally, return that patient.
        if ($mpiResult['success'] && ! empty($mpiResult['cr_number'])) {
            $existing = Patient::where('cr_number', $mpiResult['cr_number'])
                ->notMerged()
                ->first();

            if ($existing) {
                AuditLogger::log('patient.lookup.duplicate_prevented', [
                    'cr_number' => $mpiResult['cr_number'],
                    'existing_patient_id' => $existing->id,
                ]);

                return $existing;
            }
        }

        $patient = DB::transaction(function () use ($data, $mpiResult) {
            $attributes = $this->baseAttributes($data);
            $attributes['patient_number'] = $this->numbers->next();

            if ($mpiResult['success']) {
                $attributes['cr_number'] = $mpiResult['cr_number'];
                $attributes['verification_status'] = 'verified';
                $attributes['last_verified_at'] = now();
                $attributes['verification_attempts'] = 1;

                // Dependant linkage
                $attributes['principal_cr_number'] = $mpiResult['principal_cr_number'] ?? null;
                $attributes['principal_name'] = $mpiResult['principal_name'] ?? null;
                $attributes['relationship_to_principal'] = $mpiResult['relationship_to_principal'] ?? null;

                // Enrich from MPI record when the UI didn't already fill these
                if ($mpiResult['record']) {
                    foreach (['sha_id', 'phone', 'date_of_birth', 'gender'] as $field) {
                        if (! empty($mpiResult['record'][$field]) && empty($attributes[$field])) {
                            $attributes[$field] = $mpiResult['record'][$field];
                        }
                    }
                }
            } elseif ($mpiResult['not_found']) {
                $attributes['verification_status'] = 'not_found';
                $attributes['last_verification_error'] = 'Not found in national registry';
            } else {
                $attributes['verification_status'] = 'unverified';
                $attributes['verification_attempts'] = 1;
                $attributes['last_verification_error'] = $mpiResult['error'];
            }

            return Patient::create($attributes);
        });

        AuditLogger::log('patient.created', [
            'patient_id' => $patient->id,
            'patient_number' => $patient->patient_number,
            'verification_status' => $patient->verification_status,
            'is_dependant' => $patient->isDependant(),
            'source' => 'sha',
        ], $patient);

        return $patient;
    }

    /**
     * Register a patient as local-only (cash or private insurance).
     * No HIE interaction at all.
     */
    public function registerLocalOnly(array $data): Patient
    {
        $data['verification_status'] = 'local_only';

        $patient = DB::transaction(function () use ($data) {
            $attributes = $this->baseAttributes($data);
            $attributes['patient_number'] = $this->numbers->next();
            $attributes['verification_status'] = 'local_only';

            return Patient::create($attributes);
        });

        AuditLogger::log('patient.created', [
            'patient_id' => $patient->id,
            'patient_number' => $patient->patient_number,
            'verification_status' => 'local_only',
            'source' => 'local',
        ], $patient);

        return $patient;
    }

    /**
     * Attempt to upgrade a local-only patient to SHA-verified.
     * Used when a patient says "I have SHA now" on a return visit.
     */
    public function tryUpgradeToVerified(Patient $patient): array
    {
        if ($patient->verification_status === 'verified') {
            return ['success' => true, 'already_verified' => true];
        }

        $result = $this->tryMpiLookup([
            'national_id' => $patient->national_id,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'date_of_birth' => $patient->date_of_birth?->format('Y-m-d'),
        ]);

        if ($result['success']) {
            $patient->forceFill([
                'cr_number' => $result['cr_number'],
                'verification_status' => 'verified',
                'last_verified_at' => now(),
                'verification_attempts' => $patient->verification_attempts + 1,
                'last_verification_error' => null,
                'sha_id' => $patient->sha_id ?: ($result['record']['sha_id'] ?? null),
            ])->save();

            AuditLogger::log('patient.upgraded', [
                'patient_id' => $patient->id,
                'cr_number' => $patient->cr_number,
            ], $patient);

            return ['success' => true, 'patient' => $patient->fresh()];
        }

        $patient->forceFill([
            'verification_status' => $result['not_found'] ? 'not_found' : 'unverified',
            'verification_attempts' => $patient->verification_attempts + 1,
            'last_verification_error' => $result['error'],
        ])->save();

        return [
            'success' => false,
            'not_found' => $result['not_found'],
            'error' => $result['error'],
        ];
    }

    /**
     * Local duplicate detection. Runs before creating a new patient.
     * Returns candidate matches the receptionist must acknowledge.
     */
    public function findPotentialDuplicates(array $data): array
    {
        $matches = collect();

        if (! empty($data['national_id'])) {
            $matches = $matches->merge(
                Patient::notMerged()
                    ->where('national_id', $data['national_id'])
                    ->limit(5)
                    ->get()
            );
        }

        if (! empty($data['phone'])) {
            $matches = $matches->merge(
                Patient::notMerged()
                    ->where('phone', $data['phone'])
                    ->limit(5)
                    ->get()
            );
        }

        if (! empty($data['first_name']) && ! empty($data['last_name'])) {
            $dob = $data['date_of_birth'] ?? null;

            $query = Patient::notMerged()
                ->where('first_name', 'ILIKE', $data['first_name'])
                ->where('last_name', 'ILIKE', $data['last_name']);

            if ($dob) {
                $query->where('date_of_birth', $dob);
            }

            $matches = $matches->merge($query->limit(5)->get());
        }

        return $matches
            ->unique('id')
            ->take(5)
            ->map(fn(Patient $p) => [
                'id' => $p->id,
                'patient_number' => $p->patient_number,
                'name' => $p->full_name,
                'date_of_birth' => $p->date_of_birth?->format('Y-m-d'),
                'phone' => $p->phone,
                'national_id' => $p->national_id,
                'verification_status' => $p->verification_status,
                'first_visit_at' => $p->first_visit_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /* ───── Internals ───── */

    /**
     * Attempt an MPI lookup against the national registry.
     * Returns a result envelope — never throws.
     */
    private function tryMpiLookup(array $data): array
    {
        if (empty($data['national_id']) && empty($data['sha_id'])) {
            return [
                'success' => false,
                'not_found' => false,
                'cr_number' => null,
                'record' => null,
                'error' => 'No national ID or SHA ID supplied for lookup.',
            ];
        }

        $identificationNumber = $data['national_id'] ?? $data['sha_id'];
        $identificationType = ! empty($data['national_id']) ? 'National ID' : 'SHA ID';

        try {
            $record = $this->registry->findPatient($identificationNumber, $identificationType);

            return [
                'success' => true,
                'not_found' => false,
                'cr_number' => $record['cr_number'],
                'principal_cr_number' => null,
                'principal_name' => null,
                'relationship_to_principal' => null,
                'record' => [
                    'sha_id' => $record['sha_id'],
                    'phone' => $record['phone'],
                    'date_of_birth' => $record['date_of_birth'],
                    'gender' => $record['gender'],
                ],
                'error' => null,
            ];
        } catch (HieException $e) {
            \Illuminate\Support\Facades\Log::warning('patient.mpi_lookup.failed', [
                'identification_number' => $identificationNumber,
                'reason' => $e->reason,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'not_found' => $e->isNotFound(),
                'cr_number' => null,
                'record' => null,
                'error' => $e->isNotFound()
                    ? 'Patient not found in national registry.'
                    : 'HIE unreachable: ' . $e->getMessage(),
            ];
        }
    }

    private function baseAttributes(array $data): array
    {
        return [
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'county' => $data['county'] ?? null,
            'village' => $data['village'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'sha_id' => $data['sha_id'] ?? null,
            'next_of_kin' => $data['next_of_kin'] ?? [],
            'allergies' => $data['allergies'] ?? [],
            'notes' => $data['notes'] ?? null,
            'registered_by' => auth()->id(),
            'first_visit_at' => now(),
        ];
    }
}
