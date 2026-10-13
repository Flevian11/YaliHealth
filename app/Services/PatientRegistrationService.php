<?php

namespace App\Services;

use App\Models\Patient;
use App\Services\Hie\HieClient;
use App\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PatientRegistrationService
{
    public function __construct(
        private PatientNumberGenerator $numbers,
        private HieClient $hie,
    ) {}

    /**
     * Register a patient as SHA-seeking. Attempts MPI lookup; falls
     * back to unverified if HIE is unreachable.
     */
    public function registerWithSha(array $data): Patient
    {
        $data['verification_status'] = 'unverified';
        $data['verification_attempts'] = 1;

        // Attempt MPI lookup first — but never block registration on it
        $mpiResult = $this->tryMpiLookup($data);

        $patient = DB::transaction(function () use ($data, $mpiResult) {
            $attributes = $this->baseAttributes($data);
            $attributes['patient_number'] = $this->numbers->next();

            // If MPI succeeded, upgrade immediately
            if ($mpiResult['success']) {
                $attributes['cr_number'] = $mpiResult['cr_number'];
                $attributes['verification_status'] = 'verified';
                $attributes['last_verified_at'] = now();
                $attributes['verification_attempts'] = 1;

                // Enrich with HIE-returned data
                foreach (['sha_id', 'phone', 'date_of_birth', 'gender'] as $field) {
                    if (! empty($mpiResult['record'][$field]) && empty($attributes[$field])) {
                        $attributes[$field] = $mpiResult['record'][$field];
                    }
                }
            } elseif ($mpiResult['not_found']) {
                $attributes['verification_status'] = 'not_found';
                $attributes['last_verification_error'] = 'Not found in national registry';
            } else {
                // HIE unreachable or errored
                $attributes['last_verification_error'] = $mpiResult['error'];
            }

            return Patient::create($attributes);
        });

        AuditLogger::log('patient.created', [
            'patient_id' => $patient->id,
            'patient_number' => $patient->patient_number,
            'verification_status' => $patient->verification_status,
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
            ->map(fn (Patient $p) => [
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
            $response = $this->hie->request('GET', '/patients', [
                'identification_number' => $identificationNumber,
                'identification_type' => $identificationType,
            ]);

            if (! $response->successful()) {
                return [
                    'success' => false,
                    'not_found' => false,
                    'cr_number' => null,
                    'record' => null,
                    'error' => "MPI returned HTTP {$response->status()}",
                ];
            }

            $results = $response->json('results') ?? [];

            if (empty($results)) {
                return [
                    'success' => false,
                    'not_found' => true,
                    'cr_number' => null,
                    'record' => null,
                    'error' => 'Patient not found in national registry.',
                ];
            }

            $first = $results[0];

            return [
                'success' => true,
                'not_found' => false,
                'cr_number' => $first['id'] ?? null,
                'record' => [
                    'sha_id' => $first['shaId'] ?? null,
                    'phone' => $first['phone'] ?? null,
                    'date_of_birth' => $first['dateOfBirth'] ?? null,
                    'gender' => $first['gender'] ?? null,
                ],
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::warning('patient.mpi_lookup.failed', [
                'identification_number' => $identificationNumber,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'not_found' => false,
                'cr_number' => null,
                'record' => null,
                'error' => 'HIE unreachable: ' . $e->getMessage(),
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