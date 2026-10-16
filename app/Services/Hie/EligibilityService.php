<?php

namespace App\Services\Hie;

use App\Models\Patient;
use App\Models\PatientHieSnapshot;
use App\Models\Visit;
use Illuminate\Support\Facades\Log;

class EligibilityService
{
    public function __construct(
        private HieClient $client,
    ) {}

    /**
     * Check a patient's SHA eligibility. Writes a snapshot as a side-effect.
     *
     * @return array{
     *     alive: bool,
     *     otp_consent_permitted: bool,
     *     biometrics_enforced: bool,
     *     schemes: array<int, array{scheme: string, status: string, member_number: ?string, effective_from: ?string}>,
     *     raw: array
     * }
     *
     * @throws HieException
     */
    public function check(Patient $patient, ?Visit $visit = null): array
    {
        $response = $this->call('GET', '/patients/eligibility', [
            'identification_number' => $patient->cr_number ?: $patient->national_id,
            'identification_type' => $patient->cr_number ? 'ClientRegistry ID' : 'National ID',
        ]);

        $snakified = HieArray::snakify($response);

        $result = [
            'alive' => (bool) ($snakified['alive'] ?? true),
            'otp_consent_permitted' => (bool) ($snakified['otp_consent_permitted'] ?? true),
            'biometrics_enforced' => (bool) ($snakified['biometrics_enforced'] ?? false),
            'schemes' => collect($snakified['results'] ?? [])
                ->map(fn ($s) => [
                    'scheme' => $s['scheme'] ?? '',
                    'status' => $s['status'] ?? 'UNKNOWN',
                    'member_number' => $s['member_number'] ?? null,
                    'effective_from' => $s['effective_from'] ?? null,
                ])
                ->all(),
            'raw' => $snakified,
        ];

        $this->snapshot($patient, $visit, 'eligibility', $result);

        return $result;
    }

    /**
     * Fetch a patient's SHA sub-benefit list.
     *
     * @return array<int, array{code: string, name: string, status: string}>
     *
     * @throws HieException
     */
    public function subBenefits(Patient $patient, ?Visit $visit = null): array
    {
        $response = $this->call('GET', '/patients/sub-benefits', [
            'patient_id' => $patient->cr_number,
        ]);

        $snakified = HieArray::snakify($response);

        $result = collect($snakified['results'] ?? [])
            ->map(fn ($s) => [
                'code' => $s['sub_benefit_code'] ?? '',
                'name' => $s['name'] ?? '',
                'status' => $s['status'] ?? 'UNKNOWN',
            ])
            ->all();

        $this->snapshot($patient, $visit, 'sub_benefits', [
            'sub_benefits' => $result,
            'raw' => $snakified,
        ]);

        return $result;
    }

    /**
     * Fetch the interventions available under a sub-benefit.
     * This is what the scenario router reads.
     *
     * @return array<int, array{
     *     code: string,
     *     name: string,
     *     fund: ?string,
     *     payment_mechanism: ?string,
     *     access_point: ?string,
     *     needs_preauth: bool,
     *     needs_elective_preauth: bool,
     *     requires_surgical_preauth: bool,
     *     requires_renal_preauth: bool,
     *     requires_oncology_preauth: bool,
     *     requires_radiology_preauth: bool,
     *     requires_optical_preauth: bool,
     *     tariffs: array<int, int>,
     *     raw: array
     * }>
     *
     * @throws HieException
     */
    public function interventions(Patient $patient, string $subBenefitCode, ?Visit $visit = null): array
    {
        $response = $this->call('GET', '/patients/benefits/interventions', [
            'patient_id' => $patient->cr_number,
            'sub_benefit_code' => $subBenefitCode,
        ]);

        $snakified = HieArray::snakify($response);

        $result = collect($snakified['results'] ?? [])
            ->map(fn ($i) => [
                'code' => $i['intervention_code'] ?? '',
                'name' => $i['name'] ?? '',
                'fund' => $i['fund'] ?? null,
                'payment_mechanism' => $i['payment_mechanism'] ?? null,
                'access_point' => $i['access_point'] ?? null,
                'needs_preauth' => (bool) ($i['needs_preauth'] ?? false),
                'needs_elective_preauth' => (bool) ($i['needs_manual_preauth_approval'] ?? false),
                'requires_surgical_preauth' => (bool) ($i['requires_surgical_preauth'] ?? false),
                'requires_renal_preauth' => (bool) ($i['requires_renal_preauth'] ?? false),
                'requires_oncology_preauth' => (bool) ($i['requires_oncology_preauth'] ?? false),
                'requires_radiology_preauth' => (bool) ($i['requires_radiology_preauth'] ?? false),
                'requires_optical_preauth' => (bool) ($i['requires_optical_preauth'] ?? false),
                'tariffs' => $this->extractTariffs($i),
                'raw' => $i,
            ])
            ->all();

        $this->snapshot($patient, $visit, 'interventions', [
            'sub_benefit_code' => $subBenefitCode,
            'interventions' => $result,
            'raw' => $snakified,
        ]);

        return $result;
    }

    /**
     * Return the freshest cached snapshot if one exists, else null.
     * Callers can use this to skip a network round-trip on second visits.
     */
    public function freshSnapshot(Patient $patient, string $type): ?array
    {
        $snapshot = PatientHieSnapshot::query()
            ->where('patient_id', $patient->id)
            ->where('snapshot_type', $type)
            ->fresh()
            ->orderByDesc('fetched_at')
            ->first();

        return $snapshot?->data;
    }

    /* ───── Internals ───── */

    private function extractTariffs(array $intervention): array
    {
        $tariffs = [];

        for ($level = 2; $level <= 6; $level++) {
            $key = "level{$level}_tariff";

            if (isset($intervention[$key]) && is_numeric($intervention[$key])) {
                $tariffs[$level] = (int) $intervention[$key];
            }
        }

        return $tariffs;
    }

    private function snapshot(Patient $patient, ?Visit $visit, string $type, array $data): void
    {
        try {
            $ttlMinutes = (int) config("hie.snapshot_ttl.{$type}", 30);

            PatientHieSnapshot::create([
                'patient_id' => $patient->id,
                'visit_id' => $visit?->id,
                'snapshot_type' => $type,
                'data' => $data,
                'fetched_at' => now(),
                'expires_at' => now()->addMinutes($ttlMinutes),
            ]);
        } catch (\Throwable $e) {
            // Never let caching break the request
            Log::warning('hie.snapshot.write_failed', [
                'patient_id' => $patient->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function call(string $method, string $path, array $payload = []): array
    {
        try {
            $response = $this->client->request($method, $path, $payload);
        } catch (\Throwable $e) {
            throw HieException::unreachable($e->getMessage());
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw HieException::unauthorized();
        }

        if ($response->failed()) {
            throw HieException::rejected(
                $response->status(),
                $response->json(),
                "{$method} {$path} failed"
            );
        }

        return $response->json() ?? [];
    }
}