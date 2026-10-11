<?php

namespace App\Services;

use App\Models\ReferenceRecord;
use App\Models\ReferenceSyncJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Settings;
use Throwable;

class ReferenceSyncService
{
    public function sync(string $registryKey, ?int $triggeredBy = null, string $source = 'manual'): ReferenceSyncJob
    {
        $registries = config('reference.registries', []);

        if (! isset($registries[$registryKey])) {
            throw new \InvalidArgumentException("Unknown registry: {$registryKey}");
        }

        $job = ReferenceSyncJob::create([
            'registry_key' => $registryKey,
            'status' => 'running',
            'triggered_by' => $triggeredBy,
            'trigger_source' => $source,
            'started_at' => now(),
        ]);

        $startedAt = microtime(true);
        $created = 0;
        $updated = 0;
        $failed = 0;

        try {
            $records = $this->fetchRecords($registryKey);

            DB::transaction(function () use ($registryKey, $records, &$created, &$updated) {
                foreach ($records as $row) {
                    try {
                        $existing = ReferenceRecord::forRegistry($registryKey)
                            ->where('code', $row['code'])
                            ->first();

                        if ($existing) {
                            $existing->update([
                                'name' => $row['name'],
                                'category' => $row['category'] ?? null,
                                'status' => $row['status'] ?? null,
                                'data' => $row['data'] ?? [],
                                'synced_at' => now(),
                            ]);
                            $updated++;
                        } else {
                            ReferenceRecord::create([
                                'registry_key' => $registryKey,
                                'external_id' => $row['external_id'] ?? $row['code'],
                                'code' => $row['code'],
                                'name' => $row['name'],
                                'category' => $row['category'] ?? null,
                                'status' => $row['status'] ?? null,
                                'data' => $row['data'] ?? [],
                                'synced_at' => now(),
                            ]);
                            $created++;
                        }
                    } catch (Throwable $e) {
                        $failed++;
                        Log::warning('reference.sync.row_failed', [
                            'registry' => $registryKey,
                            'code' => $row['code'] ?? null,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

            $duration = (int) round((microtime(true) - $startedAt) * 1000);

            $job->update([
                'status' => 'completed',
                'records_fetched' => count($records),
                'records_created' => $created,
                'records_updated' => $updated,
                'records_failed' => $failed,
                'duration_ms' => $duration,
                'completed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $duration = (int) round((microtime(true) - $startedAt) * 1000);

            $job->update([
                'status' => 'failed',
                'duration_ms' => $duration,
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            Log::error('reference.sync.failed', [
                'registry' => $registryKey,
                'error' => $e->getMessage(),
            ]);
        }

        return $job->fresh();
    }

    /**
     * Fetch records from the source registry.
     *
     * When HIE credentials are available, replace the switch below with
     * real HTTP calls through the HIE client (HieClient::request(...)).
     * The shape of each record must remain: ['code', 'name', 'category', 'status', 'data'].
     */
    protected function fetchRecords(string $registryKey): array
    {
        return match ($registryKey) {
            'facilities' => $this->seedFacilities(),
            'practitioners' => $this->seedPractitioners(),
            'terminology' => $this->seedTerminology(),
            'interventions' => $this->seedInterventions(),
            'drugs' => $this->seedDrugs(),
            'schemes' => $this->seedSchemes(),
            default => [],
        };
    }

    private function seedFacilities(): array
    {
        $rows = [
            ['FID-47-105963-0', 'Nairobi West Hospital', 'Level 4 Hospital', 'Active'],
            ['FID-47-105964-1', 'Kenyatta National Hospital', 'Level 6 Referral', 'Active'],
            ['FID-47-105965-2', 'Moi Teaching and Referral Hospital', 'Level 6 Referral', 'Active'],
            ['FID-47-105966-3', 'Coast General Teaching Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105967-4', 'Nakuru Level 5 Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105968-5', 'Kisumu County Referral Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105969-6', 'Thika Level 5 Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105970-7', 'Meru Teaching and Referral Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105971-8', 'Machakos Level 5 Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105972-9', 'Kiambu Level 4 Hospital', 'Level 4 Hospital', 'Active'],
            ['FID-47-105973-0', 'Eldoret Specialist Clinic', 'Private Clinic', 'Active'],
            ['FID-47-105974-1', 'Mombasa Medical Centre', 'Level 4 Hospital', 'Active'],
            ['FID-47-105975-2', 'Kakamega County General Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105976-3', 'Garissa Referral Hospital', 'Level 5 Hospital', 'Active'],
            ['FID-47-105977-4', 'Kitale County Hospital', 'Level 4 Hospital', 'Active'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => $r[3],
            'data' => ['type' => 'facility'],
        ], $rows);
    }

    private function seedPractitioners(): array
    {
        $rows = [
            ['KMPDC/12345', 'Dr. Alice Mwangi', 'KMPDC — Medical', 'Active'],
            ['KMPDC/12346', 'Dr. Brian Otieno', 'KMPDC — Medical', 'Active'],
            ['KMPDC/12347', 'Dr. Carol Achieng', 'KMPDC — Medical', 'Active'],
            ['KMPDC/12348', 'Dr. David Kariuki', 'KMPDC — Medical', 'Active'],
            ['KMPDC/12349', 'Dr. Eva Chebet', 'KMPDC — Medical', 'Active'],
            ['NCK/2201', 'Nurse Grace Kimani', 'NCK — Nursing', 'Active'],
            ['NCK/2202', 'Nurse Henry Mutua', 'NCK — Nursing', 'Active'],
            ['NCK/2203', 'Nurse Irene Wanjiru', 'NCK — Nursing', 'Active'],
            ['PPB/8845', 'Pharm. James Wekesa', 'PPB — Pharmacy', 'Active'],
            ['PPB/8846', 'Pharm. Janet Nduta', 'PPB — Pharmacy', 'Active'],
            ['COC/4410', 'Clin. Officer Kevin Omondi', 'COC — Clinical Officers', 'Active'],
            ['COC/4411', 'Clin. Officer Lucy Kamau', 'COC — Clinical Officers', 'Active'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => $r[3],
            'data' => ['type' => 'practitioner'],
        ], $rows);
    }

    private function seedTerminology(): array
    {
        $rows = [
            ['1F40.Z', 'Malaria, unspecified', 'Infectious diseases'],
            ['5B5K.0', 'Type 1 diabetes mellitus', 'Endocrine'],
            ['5B5K.1', 'Type 2 diabetes mellitus', 'Endocrine'],
            ['CA40.Z', 'Pneumonia, unspecified organism', 'Respiratory'],
            ['BA00.Z', 'Essential hypertension', 'Circulatory'],
            ['1C62.Z', 'HIV disease, unspecified', 'Infectious diseases'],
            ['CA23.Z', 'Asthma, unspecified', 'Respiratory'],
            ['JA80.0', 'Sepsis, unspecified', 'Infectious diseases'],
            ['5A11.Z', 'Type 1 diabetes', 'Endocrine'],
            ['DB91.Z', 'Gastroenteritis', 'Digestive'],
            ['1A00.Z', 'Cholera', 'Infectious diseases'],
            ['6A70.Z', 'Depressive episode', 'Mental health'],
            ['CA22.Z', 'Chronic obstructive pulmonary disease', 'Respiratory'],
            ['BA01.Z', 'Heart failure', 'Circulatory'],
            ['JA40.Z', 'Puerperal sepsis', 'Maternal'],
            ['KA00.Z', 'Normal pregnancy', 'Maternal'],
            ['LD50.Z', 'Fracture of femur', 'Injury'],
            ['MB45.Z', 'Low back pain', 'Musculoskeletal'],
            ['1D80.Z', 'Tuberculosis, unspecified', 'Infectious diseases'],
            ['5B55.Z', 'Hypothyroidism', 'Endocrine'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => 'Active',
            'data' => ['system' => 'ICD-11'],
        ], $rows);
    }

    private function seedInterventions(): array
    {
        $rows = [
            ['SHA-01-001', 'General outpatient consultation', 'Outpatient'],
            ['SHA-01-007', 'Emergency casualty attendance', 'Emergency'],
            ['SHA-02-001', 'Normal vaginal delivery', 'Maternity'],
            ['SHA-02-002', 'Caesarean section', 'Maternity'],
            ['SHA-06-021', 'Oncology — chemotherapy session', 'Oncology'],
            ['SHA-09-001', 'CT scan — head', 'Imaging'],
            ['SHA-11-001', 'Physiotherapy session', 'Rehabilitation'],
            ['SHA-12-001', 'Renal dialysis session', 'Renal'],
            ['SHA-16-011', 'Renal — chronic management', 'Renal'],
            ['SHA-18-004', 'Minor surgical procedure', 'Surgery'],
            ['SHA-19-074', 'Comprehensive day-care procedure', 'Day-care'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => 'Active',
            'data' => ['payer' => 'SHA'],
        ], $rows);
    }

    private function seedDrugs(): array
    {
        $rows = [
            ['GE12047', 'Paracetamol 500mg tablet', 'Analgesics'],
            ['GE12048', 'Ibuprofen 400mg tablet', 'NSAIDs'],
            ['GE12049', 'Amoxicillin 500mg capsule', 'Antibiotics'],
            ['GE12050', 'Artemether/Lumefantrine 20/120mg', 'Antimalarials'],
            ['GE12051', 'Metformin 500mg tablet', 'Antidiabetics'],
            ['GE12052', 'Amlodipine 5mg tablet', 'Antihypertensives'],
            ['GE12053', 'Omeprazole 20mg capsule', 'PPIs'],
            ['GE12054', 'Ceftriaxone 1g injection', 'Antibiotics'],
            ['GE12055', 'Salbutamol inhaler 100mcg', 'Bronchodilators'],
            ['GE12056', 'Ferrous sulphate 200mg tablet', 'Haematinics'],
            ['GE12057', 'Folic acid 5mg tablet', 'Vitamins'],
            ['GE12058', 'Diazepam 5mg tablet', 'Sedatives'],
            ['GE12059', 'Insulin soluble 100IU/mL', 'Antidiabetics'],
            ['GE12060', 'ORS sachet', 'Rehydration'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => 'Active',
            'data' => ['formulary' => 'KEML'],
        ], $rows);
    }

    private function seedSchemes(): array
    {
        $rows = [
            ['SHA', 'Social Health Authority', 'Public'],
            ['POMSF', 'Public Officers Medical Scheme Fund', 'Public'],
            ['NHIF-LEGACY', 'National Health Insurance Fund (legacy)', 'Public'],
            ['JUBILEE', 'Jubilee Health Insurance', 'Private'],
            ['BRITAM', 'Britam Health Insurance', 'Private'],
            ['CIC', 'CIC Health Insurance', 'Private'],
            ['OLD-MUTUAL', 'Old Mutual Health', 'Private'],
            ['UAP', 'UAP Old Mutual', 'Private'],
            ['CASH', 'Cash / Self-pay', 'Cash'],
        ];

        return array_map(fn ($r) => [
            'code' => $r[0],
            'name' => $r[1],
            'category' => $r[2],
            'status' => 'Active',
            'data' => ['payer_type' => strtolower($r[2])],
        ], $rows);
    }
}