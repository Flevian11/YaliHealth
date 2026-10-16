<?php

namespace App\Services;

use InvalidArgumentException;

class ScenarioRouter
{
    public const SCENARIO_LABELS = [
        1 => 'SHIF Inpatient — Per Diem (No Preauth)',
        2 => 'SHIF Inpatient — Fee for Service (Normal Preauth)',
        3 => 'SHIF Inpatient — Fee for Service (Elective Preauth)',
        4 => 'SHIF Outpatient — Fee for Service (Elective Preauth)',
        5 => 'SHIF Outpatient — Fee for Service (Normal Preauth)',
        6 => 'UHC Outpatient — Capitation',
        7 => 'ECCIF Emergency — Identified Patient',
        8 => 'ECCIF Emergency — Unidentified Patient',
    ];

    /**
     * Route an intervention's flags to a scenario number.
     *
     * Pure function. No network. No state. Can be safely called from the UI.
     *
     * @param  array{
     *     fund: ?string,
     *     access_point: ?string,
     *     payment_mechanism: ?string,
     *     needs_preauth: bool,
     *     needs_elective_preauth: bool,
     * }  $flags
     * @param  bool  $hasCrId  false → force scenario 8 if fund is ECCIF
     */
    public function route(array $flags, bool $hasCrId = true): int
    {
        $fund = $flags['fund'] ?? null;
        $accessPoint = $flags['access_point'] ?? null;
        $payment = $flags['payment_mechanism'] ?? null;
        $needsPreauth = (bool) ($flags['needs_preauth'] ?? false);
        $isElective = (bool) ($flags['needs_elective_preauth'] ?? false);

        // Emergency fund always bypasses the decision tree.
        if ($fund === 'ECCIF') {
            return $hasCrId ? 7 : 8;
        }

        // Outpatient
        if ($accessPoint === 'OP') {
            if ($fund === 'UHC' && $payment === 'CAPITATION') {
                return 6;
            }

            if ($fund === 'SHIF' && $payment === 'FEE_FOR_SERVICE' && $needsPreauth) {
                return $isElective ? 4 : 5;
            }
        }

        // Inpatient
        if ($accessPoint === 'IP') {
            if ($fund === 'SHIF' && $payment === 'PER_DIEM') {
                return 1;
            }

            if ($fund === 'SHIF' && $payment === 'FEE_FOR_SERVICE' && $needsPreauth) {
                return $isElective ? 3 : 2;
            }
        }

        throw new InvalidArgumentException(
            "Cannot route to a scenario. Flags: fund={$fund}, access={$accessPoint}, "
            . "payment={$payment}, preauth=" . ($needsPreauth ? 'yes' : 'no')
            . ", elective=" . ($isElective ? 'yes' : 'no')
        );
    }

    /**
     * Describe a scenario's operational expectations.
     */
    public function describe(int $scenario): array
    {
        if (! isset(self::SCENARIO_LABELS[$scenario])) {
            throw new InvalidArgumentException("Unknown scenario: {$scenario}");
        }

        return array_merge(
            ['number' => $scenario, 'label' => self::SCENARIO_LABELS[$scenario]],
            $this->spec($scenario),
        );
    }

    private function spec(int $scenario): array
    {
        return match ($scenario) {
            1 => [
                'fund' => 'SHIF',
                'service_type' => 'INPATIENT',
                'visit_type' => 'IP',
                'payment_mechanism' => 'PER_DIEM',
                'needs_preauth' => false,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'none',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'discharge',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Per diem line item is auto-generated. Do not add a manual line.',
            ],
            2 => [
                'fund' => 'SHIF',
                'service_type' => 'INPATIENT',
                'visit_type' => 'IP',
                'payment_mechanism' => 'FEE_FOR_SERVICE',
                'needs_preauth' => true,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'during_visit',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'discharge',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Billing is blocked until preauth reaches FINALISED.',
            ],
            3 => [
                'fund' => 'SHIF',
                'service_type' => 'INPATIENT',
                'visit_type' => 'IP',
                'payment_mechanism' => 'FEE_FOR_SERVICE',
                'needs_preauth' => true,
                'needs_elective_preauth' => true,
                'preauth_timing' => 'pre_visit',
                'consent_timing' => 'pre_visit',
                'dispatch_method' => 'discharge',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Doctor approval required. Preauth must be FINALISED before day of visit.',
            ],
            4 => [
                'fund' => 'SHIF',
                'service_type' => 'OUTPATIENT',
                'visit_type' => 'OP',
                'payment_mechanism' => 'FEE_FOR_SERVICE',
                'needs_preauth' => true,
                'needs_elective_preauth' => true,
                'preauth_timing' => 'pre_visit',
                'consent_timing' => 'pre_visit',
                'dispatch_method' => 'submit',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Doctor approval required. Same as scenario 3 but outpatient.',
            ],
            5 => [
                'fund' => 'SHIF',
                'service_type' => 'OUTPATIENT',
                'visit_type' => 'OP',
                'payment_mechanism' => 'FEE_FOR_SERVICE',
                'needs_preauth' => true,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'during_visit',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'submit',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Billing blocked until preauth FINALISED. Doctor info required.',
            ],
            6 => [
                'fund' => 'UHC',
                'service_type' => 'OUTPATIENT',
                'visit_type' => 'OP',
                'payment_mechanism' => 'CAPITATION',
                'needs_preauth' => false,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'none',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'submit',
                'has_cr_id' => true,
                'is_emergency' => false,
                'notes' => 'Flat capitation. Doctor required on claim before submit.',
            ],
            7 => [
                'fund' => 'ECCIF',
                'service_type' => 'EMERGENCY',
                'visit_type' => 'OP', // emergency can be either; treated as OP for dispatch
                'payment_mechanism' => null, // protocol-driven
                'needs_preauth' => false,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'none',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'submit',
                'has_cr_id' => true,
                'is_emergency' => true,
                'notes' => 'Care first. Doctor consent replaces preauth. Submit within 24 hours.',
            ],
            8 => [
                'fund' => 'ECCIF',
                'service_type' => 'EMERGENCY',
                'visit_type' => 'OP',
                'payment_mechanism' => null,
                'needs_preauth' => false,
                'needs_elective_preauth' => false,
                'preauth_timing' => 'none',
                'consent_timing' => 'visit_start',
                'dispatch_method' => 'submit',
                'has_cr_id' => false,
                'is_emergency' => true,
                'notes' => 'Unidentified patient. Link CR ID before submit. Doctor consent replaces preauth.',
            ],
        };
    }
}