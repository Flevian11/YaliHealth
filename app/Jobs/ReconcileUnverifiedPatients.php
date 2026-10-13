<?php

namespace App\Jobs;

use App\Models\Patient;
use App\Services\PatientRegistrationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReconcileUnverifiedPatients implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    /** Maximum retries before we give up on the record */
    public const MAX_ATTEMPTS = 288; // 24 hours of 5-minute retries

    public function handle(PatientRegistrationService $registration): void
    {
        $candidates = Patient::query()
            ->where('verification_status', 'unverified')
            ->where('verification_attempts', '<', self::MAX_ATTEMPTS)
            ->orderBy('verification_attempts')
            ->limit(50)
            ->get();

        foreach ($candidates as $patient) {
            try {
                $result = $registration->tryUpgradeToVerified($patient);

                if ($result['success'] ?? false) {
                    Log::info('patient.reconciled', [
                        'patient_id' => $patient->id,
                        'patient_number' => $patient->patient_number,
                        'cr_number' => $patient->fresh()->cr_number,
                    ]);
                } elseif ($patient->verification_attempts >= self::MAX_ATTEMPTS) {
                    $patient->forceFill([
                        'verification_status' => 'failed',
                    ])->save();

                    Log::warning('patient.reconciliation_gave_up', [
                        'patient_id' => $patient->id,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('patient.reconciliation.failed', [
                    'patient_id' => $patient->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}