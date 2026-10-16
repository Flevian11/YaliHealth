<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Visit;
use App\Models\VisitConsent;
use App\Models\VisitIntervention;
use App\Services\Hie\ClaimsService;
use App\Services\Hie\ConsentService;
use App\Services\Hie\EligibilityService;
use App\Services\Hie\HieException;
use App\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VisitService
{
    public function __construct(
        private EligibilityService $eligibility,
        private ConsentService $consent,
        private ClaimsService $claims,
        private ScenarioRouter $router,
        private VisitNumberGenerator $numbers,
    ) {}

    /* ═══════════════════════════════════════════════════
       PREPARE
       ═══════════════════════════════════════════════════ */

    public function prepare(Patient $patient, string $interventionCode, array $options = []): Visit
    {
        $this->assertPatientCanStartShaVisit($patient);

        $flags = $options['intervention_flags']
            ?? $this->fetchInterventionFlags($patient, $interventionCode);

        $hiePatientId = $patient->hiePatientId();

        $scenario = $this->router->route($flags, hasCrId: ! empty($hiePatientId));
        $spec = $this->router->describe($scenario);

        return DB::transaction(function () use ($patient, $interventionCode, $flags, $scenario, $spec, $hiePatientId) {
            $visit = Visit::create([
                'visit_number' => $this->numbers->next(),
                'patient_id' => $patient->id,
                'cr_number' => $hiePatientId,
                'visit_type' => $spec['visit_type'],
                'payment_mode' => 'sha',
                'service_type' => $spec['service_type'],
                'scenario' => $scenario,
                'fund' => $spec['fund'],
                'payment_mechanism' => $spec['payment_mechanism'],
                'needs_preauth' => $spec['needs_preauth'],
                'needs_elective_preauth' => $spec['needs_elective_preauth'],
                'claim_status' => 'draft',
                'claim_draft' => ['lines' => [], 'diagnoses' => [], 'attachments' => []],
                'opened_by' => auth()->id(),
            ]);

            VisitIntervention::create([
                'visit_id' => $visit->id,
                'intervention_code' => $interventionCode,
                'name' => $flags['name'] ?? null,
                'fund' => $spec['fund'],
                'payment_mechanism' => $spec['payment_mechanism'],
                'access_point' => $flags['access_point'] ?? null,
                'needs_preauth' => $spec['needs_preauth'],
                'needs_elective_preauth' => $spec['needs_elective_preauth'],
                'tariff' => $this->resolveTariff($flags),
                'flags' => $flags,
                'status' => 'pending',
                'added_by' => auth()->id(),
            ]);

            AuditLogger::log('visit.prepared', [
                'visit_number' => $visit->visit_number,
                'scenario' => $scenario,
                'intervention_code' => $interventionCode,
                'is_dependant' => $patient->isDependant(),
            ], $visit);

            return $visit->load('interventions');
        });
    }

    /* ═══════════════════════════════════════════════════
       VISIT-START CONSENT — OTP
       ═══════════════════════════════════════════════════ */

    public function requestOtp(Visit $visit, ?string $contactId = null): array
    {
        $this->assertVisitIsDraft($visit);

        $contacts = $this->consent->contacts($visit->cr_number);

        if (empty($contacts)) {
            throw new HieException(
                'Patient has no confirmed contact for OTP delivery.',
                reason: 'rejected',
            );
        }

        if (! $contactId) {
            $contactId = collect($contacts)
                ->firstWhere('confirmed', true)['id']
                ?? $contacts[0]['id'];
        }

        $chosen = collect($contacts)->firstWhere('id', $contactId);

        $interventionCodes = $visit->interventions()->pluck('intervention_code')->all();

        $this->consent->sendOtp($visit->cr_number, $interventionCodes, $contactId);

        $consent = VisitConsent::create([
            'visit_id' => $visit->id,
            'patient_id' => $visit->patient_id,
            'purpose' => 'visit_start',
            'method' => 'otp',
            'contact_id' => $contactId,
            'contact_masked' => $chosen['masked'] ?? null,
            'otp_sent_at' => now(),
            'status' => 'sent',
            'captured_by' => auth()->id(),
        ]);

        AuditLogger::log('visit.otp.sent', [
            'contact_masked' => $consent->contact_masked,
        ], $visit);

        return ['contacts' => $contacts, 'consent' => $consent];
    }

    public function submitOtp(Visit $visit, string $otp): Visit
    {
        $this->assertVisitIsDraft($visit);

        $consent = $visit->consents()
            ->where('method', 'otp')
            ->where('purpose', 'visit_start')
            ->where('status', 'sent')
            ->orderByDesc('id')
            ->firstOrFail();

        $interventionCodes = $visit->interventions()->pluck('intervention_code')->all();

        $response = $this->claims->createVisit([
            'patient_id' => $visit->cr_number,
            'intervention_codes' => $interventionCodes,
            'service_type' => $visit->service_type,
            'otp' => $otp,
        ]);

        return $this->finaliseVisitCreation($visit, $consent, $response);
    }

    /* ═══════════════════════════════════════════════════
       VISIT-START CONSENT — BIOMETRIC
       ═══════════════════════════════════════════════════ */

    public function startBiometric(Visit $visit, array $biometricPayload = []): array
    {
        $this->assertVisitIsDraft($visit);

        $interventionCodes = $visit->interventions()->pluck('intervention_code')->all();

        $payload = array_merge($biometricPayload, [
            'patient_id' => $visit->cr_number,
            'intervention_codes' => $interventionCodes,
            'service_type' => $visit->service_type,
        ]);

        $response = $this->consent->createBiometricAuthorization($payload);

        $consent = VisitConsent::create([
            'visit_id' => $visit->id,
            'patient_id' => $visit->patient_id,
            'purpose' => 'visit_start',
            'method' => 'biometric',
            'auth_guid' => $response['guid'],
            'authorization_status' => $response['status'],
            'consent_token' => $response['token'],
            'status' => 'pending',
            'hie_response' => $response['raw'] ?? [],
            'captured_by' => auth()->id(),
        ]);

        return [
            'guid' => $response['guid'],
            'iframe_url' => $response['iframe_url'],
            'consent' => $consent,
        ];
    }

    public function pollBiometric(Visit $visit): array
    {
        $consent = $visit->consents()
            ->where('method', 'biometric')
            ->where('purpose', 'visit_start')
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->firstOrFail();

        $check = $this->consent->checkBiometricAuthorization(
            $consent->consent_token,
            $consent->auth_guid,
        );

        $consent->update(['authorization_status' => $check['status']]);

        if (! $check['authorized']) {
            return ['authorized' => false, 'visit' => null, 'status' => $check['status']];
        }

        $interventionCodes = $visit->interventions()->pluck('intervention_code')->all();

        $response = $this->claims->createVisit([
            'patient_id' => $visit->cr_number,
            'intervention_codes' => $interventionCodes,
            'service_type' => $visit->service_type,
            'auth_guid' => $consent->auth_guid,
        ]);

        return [
            'authorized' => true,
            'visit' => $this->finaliseVisitCreation($visit, $consent, $response),
            'status' => $check['status'],
        ];
    }

    /* ═══════════════════════════════════════════════════
       BILLING — combined lines + diagnoses + attachments
       ═══════════════════════════════════════════════════ */

    /* ═══════════════════════════════════════════════════
       BILLING — line items (with optional diagnoses)
       ═══════════════════════════════════════════════════ */

    public function addLine(Visit $visit, array $payload): array
    {
        $this->assertVisitIsOpen($visit);

        if (! $visit->isSha()) {
            throw new RuntimeException('Only SHA visits use the HIE billing pipeline.');
        }

        $payload['consent_token'] = $visit->consent_token;

        $response = $this->claims->addLine($payload);

        $draft = $visit->claimDraft();

        if (! empty($payload['diagnoses'])) {
            foreach ((array) $payload['diagnoses'] as $dx) {
                if (is_array($dx)) {
                    $draft['diagnoses'][] = $dx;
                } elseif (is_string($dx) && $dx !== '') {
                    $draft['diagnoses'][] = ['icd_code' => $dx];
                }
            }
        }

        if (! empty($payload['service_name']) || ! empty($payload['unit_price'])) {
            $draft['lines'][] = [
                'intervention_code' => $payload['intervention_code'] ?? null,
                'service_name' => $payload['service_name'] ?? null,
                'service_identifier' => $payload['service_identifier'] ?? null,
                'unit_price' => $payload['unit_price'] ?? null,
                'quantity' => $payload['quantity'] ?? 1,
            ];
        }

        $visit->update(['claim_draft' => $draft]);

        AuditLogger::log('visit.line.added', [
            'intervention_code' => $payload['intervention_code'] ?? null,
            'service_name' => $payload['service_name'] ?? null,
        ], $visit);

        return $response;
    }

    /* ═══════════════════════════════════════════════════
       DIAGNOSES — dedicated path (no billing fields)
       ═══════════════════════════════════════════════════ */

    /**
     * Attach a single ICD-11 diagnosis to the visit's claim.
     * Sends a minimal payload to HIE — consent token, intervention code,
     * diagnoses array. No billing line is created as a side-effect.
     */
    public function addDiagnosis(Visit $visit, string $icdCode): array
    {
        $this->assertVisitIsOpen($visit);

        if (! $visit->isSha()) {
            throw new RuntimeException('Only SHA visits use the HIE diagnosis pipeline.');
        }

        $icdCode = trim($icdCode);

        if ($icdCode === '') {
            throw new RuntimeException('ICD-11 code is required.');
        }

        // HIE's /claims/lines requires an intervention_code. Use the first
        // active intervention on this visit.
        $intervention = $visit->interventions()->first();

        if (! $intervention) {
            throw new RuntimeException(
                'This visit has no intervention attached. Cannot attach a diagnosis.',
            );
        }

        $response = $this->claims->addLine([
            'consent_token' => $visit->consent_token,
            'intervention_code' => $intervention->intervention_code,
            'diagnoses' => [$icdCode],
        ]);

        // Mirror locally so the UI can render without a reload round-trip.
        $draft = $visit->claimDraft();
        $draft['diagnoses'][] = [
            'icd_code' => $icdCode,
            'intervention_code' => $intervention->intervention_code,
            'added_at' => now()->toIso8601String(),
        ];
        $visit->update(['claim_draft' => $draft]);

        AuditLogger::log('visit.diagnosis.added', [
            'visit_number' => $visit->visit_number,
            'icd_code' => $icdCode,
            'intervention_code' => $intervention->intervention_code,
        ], $visit);

        return $response;
    }

    public function preview(Visit $visit): array
    {
        $this->assertVisitIsOpen($visit);

        return $this->claims->preview($visit->consent_token);
    }

    /* ═══════════════════════════════════════════════════
       VISIT-END CONSENT — OTP
       ═══════════════════════════════════════════════════ */

    public function requestDischargeOtp(Visit $visit): array
    {
        $this->assertVisitIsOpen($visit);

        $response = $this->claims->requestDischargeOtp(
            $visit->consent_token,
            $visit->cr_number,
        );

        VisitConsent::create([
            'visit_id' => $visit->id,
            'patient_id' => $visit->patient_id,
            'purpose' => 'visit_end',
            'method' => 'otp',
            'otp_sent_at' => now(),
            'status' => 'sent',
            'hie_response' => $response,
            'captured_by' => auth()->id(),
        ]);

        AuditLogger::log('visit.discharge_otp.sent', [], $visit);

        return $response;
    }

    /* ═══════════════════════════════════════════════════
       VISIT-END CONSENT — BIOMETRIC
       ═══════════════════════════════════════════════════ */

    public function startDischargeBiometric(Visit $visit, array $biometricPayload = []): array
    {
        $this->assertVisitIsOpen($visit);

        $payload = array_merge($biometricPayload, [
            'patient_id' => $visit->cr_number,
            'service_type' => $visit->service_type,
        ]);

        $response = $this->consent->createBiometricAuthorization($payload);

        $consent = VisitConsent::create([
            'visit_id' => $visit->id,
            'patient_id' => $visit->patient_id,
            'purpose' => 'visit_end',
            'method' => 'biometric',
            'auth_guid' => $response['guid'],
            'authorization_status' => $response['status'],
            'consent_token' => $response['token'],
            'status' => 'pending',
            'hie_response' => $response['raw'] ?? [],
            'captured_by' => auth()->id(),
        ]);

        return [
            'guid' => $response['guid'],
            'iframe_url' => $response['iframe_url'],
            'consent' => $consent,
        ];
    }

    public function pollDischargeBiometric(Visit $visit): array
    {
        $consent = $visit->consents()
            ->where('method', 'biometric')
            ->where('purpose', 'visit_end')
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->firstOrFail();

        $check = $this->consent->checkBiometricAuthorization(
            $consent->consent_token,
            $consent->auth_guid,
        );

        $consent->update(['authorization_status' => $check['status']]);

        if ($check['authorized']) {
            $consent->update(['status' => 'verified', 'otp_verified_at' => now()]);
        }

        return [
            'authorized' => $check['authorized'],
            'status' => $check['status'],
            'auth_guid' => $consent->auth_guid,
        ];
    }

    /* ═══════════════════════════════════════════════════
       DISPATCH — submit (OP) or discharge (IP)
       ═══════════════════════════════════════════════════ */

    /**
     * Submit an outpatient claim with visit-end consent.
     *
     * @param  array  $payload  ['discharge_reason' => 'RECOVERED', 'otp' => '...']
     *                          OR ['discharge_reason' => 'RECOVERED', 'discharge_auth_guid' => '...']
     */
    public function submit(Visit $visit, array $payload): Visit
    {
        $this->assertVisitIsOpen($visit);
        $this->assertConsentArtefact($payload, $visit);

        $payload['consent_token'] = $visit->consent_token;
        $payload['invoice_number'] = $payload['invoice_number']
            ?? $this->generateInvoiceNumber($visit);

        $response = $this->claims->submit($payload);

        return $this->finaliseDispatch($visit, $payload['invoice_number'], $response);
    }

    public function discharge(Visit $visit, array $payload): Visit
    {
        $this->assertVisitIsOpen($visit);
        $this->assertConsentArtefact($payload, $visit);

        $payload['consent_token'] = $visit->consent_token;
        $payload['invoice_number'] = $payload['invoice_number']
            ?? $this->generateInvoiceNumber($visit);

        $response = $this->claims->discharge($payload);

        return $this->finaliseDispatch($visit, $payload['invoice_number'], $response, discharged: true);
    }

    /* ═══════════════════════════════════════════════════
       Internals
       ═══════════════════════════════════════════════════ */

    private function finaliseVisitCreation(Visit $visit, VisitConsent $consent, array $response): Visit
    {
        return DB::transaction(function () use ($visit, $consent, $response) {
            $consent->update([
                'consent_token' => $response['consent_token'],
                'status' => 'verified',
                'otp_verified_at' => $consent->method === 'otp' ? now() : null,
                'hie_response' => $response['raw'] ?? [],
            ]);

            $visit->update([
                'consent_token' => $response['consent_token'],
                'hie_visit_ref' => $response['hie_visit_ref'],
                'claim_status' => 'visit_created',
                'admitted_at' => $visit->isInpatient() ? now() : null,
            ]);

            $visit->interventions()->update(['status' => 'active']);

            AuditLogger::log('visit.created', [
                'hie_visit_ref' => $response['hie_visit_ref'],
                'method' => $consent->method,
            ], $visit);

            return $visit->fresh(['interventions', 'consents']);
        });
    }

    private function finaliseDispatch(
        Visit $visit,
        string $invoiceNumber,
        array $response,
        bool $discharged = false,
    ): Visit {
        return DB::transaction(function () use ($visit, $invoiceNumber, $response, $discharged) {
            $visit->update([
                'invoice_number' => $invoiceNumber,
                'claim_status' => 'submitted',
                'discharged_at' => $discharged ? now() : null,
                'closed_at' => now(),
                'closed_by' => auth()->id(),
            ]);

            // Mark the visit-end consent as verified
            $visit->consents()
                ->where('purpose', 'visit_end')
                ->whereIn('status', ['pending', 'sent'])
                ->update(['status' => 'verified', 'otp_verified_at' => now()]);

            AuditLogger::log('visit.dispatched', [
                'visit_number' => $visit->visit_number,
                'invoice_number' => $invoiceNumber,
                'claim_number' => $response['claim_number'] ?? null,
                'method' => $discharged ? 'discharge' : 'submit',
            ], $visit);

            return $visit->fresh(['interventions', 'consents']);
        });
    }

    private function assertPatientCanStartShaVisit(Patient $patient): void
    {
        if (! $patient->isVerified()) {
            throw new RuntimeException(
                'Patient is not verified with SHA. Verify the patient before starting a SHA visit.'
            );
        }

        if (empty($patient->hiePatientId())) {
            throw new RuntimeException(
                'Patient has no SHA identifier. Cannot start a SHA visit.'
            );
        }

        if ($patient->isMerged()) {
            throw new RuntimeException(
                'Patient record has been merged. Use the surviving record.'
            );
        }
    }

    private function assertVisitIsDraft(Visit $visit): void
    {
        if ($visit->claim_status !== 'draft') {
            throw new RuntimeException(
                "Cannot modify visit {$visit->visit_number} — it is in status '{$visit->claim_status}'."
            );
        }
    }

    private function assertVisitIsOpen(Visit $visit): void
    {
        if ($visit->claim_status !== 'visit_created') {
            throw new RuntimeException(
                "Visit {$visit->visit_number} is not open (status: '{$visit->claim_status}')."
            );
        }

        if (empty($visit->consent_token)) {
            throw new RuntimeException(
                "Visit {$visit->visit_number} has no consent token. Re-consent the patient."
            );
        }
    }

    /**
     * HIE requires either an OTP or a discharge_auth_guid on dispatch.
     */
    private function assertConsentArtefact(array $payload, Visit $visit): void
    {
        if (empty($payload['otp']) && empty($payload['discharge_auth_guid'])) {
            throw new RuntimeException(
                "Visit {$visit->visit_number}: provide either an OTP or a biometric discharge authorization."
            );
        }
    }

    private function generateInvoiceNumber(Visit $visit): string
    {
        $prefix = $visit->patient?->patient_number
            ? explode('-', $visit->patient->patient_number)[0]
            : 'HMS';

        return "INV-{$prefix}-" . now()->format('ymd') . '-' . strtoupper(substr(md5($visit->id . microtime()), 0, 6));
    }

    private function fetchInterventionFlags(Patient $patient, string $interventionCode): array
    {
        $subBenefits = $this->eligibility->subBenefits($patient);

        foreach ($subBenefits as $sb) {
            $interventions = $this->eligibility->interventions($patient, $sb['code']);

            foreach ($interventions as $i) {
                if ($i['code'] === $interventionCode) {
                    return $i;
                }
            }
        }

        throw new HieException(
            "Intervention {$interventionCode} is not in the patient's benefit package.",
            reason: 'not_found',
        );
    }

    private function resolveTariff(array $flags): ?int
    {
        $tariffs = $flags['tariffs'] ?? [];

        if (empty($tariffs)) {
            return null;
        }

        return max($tariffs);
    }

    /**
     * Upload an attachment to the visit's claim. Stores a local copy for
     * audit and forwards to HIE.
     *
     * @param  array  $payload  [
     *     'document_type' => string,
     *     'intervention_code' => string,
     *     'file' => UploadedFile,
     * ]
     */
    public function addAttachment(Visit $visit, array $payload): array
    {
        $this->assertVisitIsOpen($visit);

        if (! $visit->isSha()) {
            throw new RuntimeException('Only SHA visits use the HIE attachment pipeline.');
        }

        $file = $payload['file'];

        // Store locally first — even if the HIE call fails, we keep the file.
        $storedName = $file->hashName();
        $storedPath = "visits/{$visit->id}/attachments/{$storedName}";
        $file->storeAs(
            "visits/{$visit->id}/attachments",
            $storedName,
            'local',
        );

        // Forward to HIE.
        $response = $this->claims->addAttachment([
            'consent_token' => $visit->consent_token,
            'document_type' => $payload['document_type'],
            'intervention_code' => $payload['intervention_code'],
            'file' => $file,
        ]);

        // Mirror metadata in the local draft.
        $draft = $visit->claim_draft ?? ['lines' => [], 'diagnoses' => [], 'attachments' => []];
        $draft['attachments'][] = [
            'id' => $response['attachment_id'] ?? null,
            'document_type' => $payload['document_type'],
            'original_name' => $file->getClientOriginalName(),
            'stored_path' => $storedPath,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'uploaded_at' => now()->toIso8601String(),
            'uploaded_by' => auth()->id(),
        ];
        $visit->update(['claim_draft' => $draft]);

        AuditLogger::log('visit.attachment.uploaded', [
            'visit_number' => $visit->visit_number,
            'document_type' => $payload['document_type'],
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
        ], $visit);

        return $response;
    }
}
