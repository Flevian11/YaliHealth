<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Visit;
use App\Services\Hie\ConsentService;
use App\Services\Hie\EligibilityService;
use App\Services\Hie\HieException;
use App\Services\ScenarioRouter;
use App\Services\VisitService;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class VisitController extends Controller
{
    public function __construct(
        private VisitService $visits,
        private ScenarioRouter $router,
    ) {}

    /* ═══════════════════════════════════════════════════
       INDEX
       ═══════════════════════════════════════════════════ */

    public function index(Request $request): Response
    {
        $status = trim((string) $request->input('status', ''));
        $query  = trim((string) $request->input('q', ''));

        $visits = Visit::query()
            ->with(['patient:id,patient_number,first_name,middle_name,last_name'])
            ->when($status !== '', fn($q) => $q->where('claim_status', $status))
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('visit_number', 'ILIKE', "%{$query}%")
                        ->orWhere('cr_number', 'ILIKE', "%{$query}%")
                        ->orWhereHas('patient', function ($p) use ($query) {
                            $p->where('first_name', 'ILIKE', "%{$query}%")
                                ->orWhere('last_name', 'ILIKE', "%{$query}%")
                                ->orWhere('patient_number', 'ILIKE', "%{$query}%");
                        });
                });
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn(Visit $v) => [
                'id' => $v->id,
                'visit_number' => $v->visit_number,
                'patient_name' => $v->patient?->full_name,
                'patient_number' => $v->patient?->patient_number,
                'cr_number' => $v->cr_number,
                'visit_type' => $v->visit_type,
                'service_type' => $v->service_type,
                'fund' => $v->fund,
                'scenario' => $v->scenario,
                'claim_status' => $v->claim_status,
                'opened_at' => $v->created_at?->toIso8601String(),
                'closed_at' => $v->closed_at?->toIso8601String(),
            ]);

        return Inertia::render('tenant/Visits', [
            'visits' => $visits,
            'filters' => ['status' => $status, 'q' => $query],
            'scenarioLabels' => ScenarioRouter::SCENARIO_LABELS,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       CREATE
       ═══════════════════════════════════════════════════ */

    public function create(Request $request): Response|RedirectResponse
    {
        $patientId = (int) $request->input('patient_id');

        if (! $patientId) {
            return redirect()
                ->route('patients.index')
                ->with('error', 'Select a patient before starting a visit.');
        }

        $patient = Patient::findOrFail($patientId);

        if (! $patient->isVerified()) {
            return redirect()
                ->route('patients.show', $patient->id)
                ->with('error', 'Patient must be SHA-verified before starting a SHA visit.');
        }

        return Inertia::render('tenant/VisitCreate', [
            'patient' => [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'full_name' => $patient->full_name,
                'initials' => $patient->initials,
                'cr_number' => $patient->cr_number,
                'principal_cr_number' => $patient->principal_cr_number,
                'principal_name' => $patient->principal_name,
                'relationship_to_principal' => $patient->relationship_to_principal,
                'is_dependant' => $patient->isDependant(),
                'hie_patient_id' => $patient->hiePatientId(),
                'sha_id' => $patient->sha_id,
                'date_of_birth' => $patient->date_of_birth?->format('Y-m-d'),
                'gender' => $patient->gender,
            ],
            'scenarioLabels' => ScenarioRouter::SCENARIO_LABELS,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       INTERVENTIONS — for the picker
       ═══════════════════════════════════════════════════ */

    public function interventions(Request $request, EligibilityService $eligibility): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
        ]);

        $patient = Patient::findOrFail($data['patient_id']);

        if (! $patient->isVerified()) {
            return response()->json([
                'error' => 'Patient is not SHA-verified.',
            ], 422);
        }

        try {
            $subBenefits = $eligibility->subBenefits($patient);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        }

        $groups = [];

        foreach ($subBenefits as $sb) {
            $entry = [
                'sub_benefit' => $sb,
                'interventions' => [],
                'error' => null,
            ];

            try {
                $entry['interventions'] = $eligibility->interventions($patient, $sb['code']);
            } catch (HieException $e) {
                $entry['error'] = $e->userMessage();
            }

            $groups[] = $entry;
        }

        return response()->json([
            'patient_id' => $patient->id,
            'hie_patient_id' => $patient->hiePatientId(),
            'groups' => $groups,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       STORE — create the draft visit
       ═══════════════════════════════════════════════════ */

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'intervention_code' => ['required', 'string', 'max:60'],
            'intervention_flags' => ['nullable', 'array'],
        ]);

        $patient = Patient::findOrFail($data['patient_id']);

        try {
            $visit = $this->visits->prepare(
                $patient,
                $data['intervention_code'],
                ['intervention_flags' => $data['intervention_flags'] ?? null],
            );
        } catch (HieException $e) {
            return back()->with('error', $e->userMessage());
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('visits.show', $visit->id)
            ->with('success', "Visit {$visit->visit_number} prepared. Scenario {$visit->scenario}.");
    }

    /* ═══════════════════════════════════════════════════
       SHOW — workspace
       ═══════════════════════════════════════════════════ */

    public function show(Visit $visit): Response
    {
        $visit->load([
            'patient:id,patient_number,first_name,middle_name,last_name,date_of_birth,gender,cr_number,principal_cr_number,principal_name,relationship_to_principal',
            'interventions',
            'consents' => fn($q) => $q->orderByDesc('id'),
        ]);

        $spec = $visit->scenario ? $this->router->describe($visit->scenario) : null;

        return Inertia::render('tenant/VisitWorkspace', [
            'visit' => [
                'id' => $visit->id,
                'visit_number' => $visit->visit_number,
                'patient' => [
                    'id' => $visit->patient->id,
                    'patient_number' => $visit->patient->patient_number,
                    'full_name' => $visit->patient->full_name,
                    'initials' => $visit->patient->initials,
                    'date_of_birth' => $visit->patient->date_of_birth?->format('Y-m-d'),
                    'gender' => $visit->patient->gender,
                    'cr_number' => $visit->patient->cr_number,
                    'principal_name' => $visit->patient->principal_name,
                    'relationship_to_principal' => $visit->patient->relationship_to_principal,
                    'is_dependant' => ! empty($visit->patient->principal_cr_number),
                ],
                'visit_type' => $visit->visit_type,
                'service_type' => $visit->service_type,
                'scenario' => $visit->scenario,
                'fund' => $visit->fund,
                'payment_mechanism' => $visit->payment_mechanism,
                'payment_mode' => $visit->payment_mode,
                'needs_preauth' => $visit->needs_preauth,
                'needs_elective_preauth' => $visit->needs_elective_preauth,
                'claim_status' => $visit->claim_status,
                'consent_token' => $visit->consent_token,
                'auth_guid' => $visit->auth_guid,
                'hie_visit_ref' => $visit->hie_visit_ref,
                'invoice_number' => $visit->invoice_number,
                'claim_draft' => $visit->claim_draft ?? [
                    'lines' => [],
                    'diagnoses' => [],
                    'attachments' => [],
                ],
                'admitted_at' => $visit->admitted_at?->toIso8601String(),
                'discharged_at' => $visit->discharged_at?->toIso8601String(),
                'discharge_reason' => $visit->discharge_reason,
                'emergency_deadline_at' => $visit->emergency_deadline_at?->toIso8601String(),
                'closed_at' => $visit->closed_at?->toIso8601String(),
                'opened_at' => $visit->created_at?->toIso8601String(),
            ],
            'interventions' => $visit->interventions->map(fn($i) => [
                'id' => $i->id,
                'intervention_code' => $i->intervention_code,
                'name' => $i->name,
                'status' => $i->status,
                'fund' => $i->fund,
                'payment_mechanism' => $i->payment_mechanism,
                'needs_preauth' => $i->needs_preauth,
                'needs_elective_preauth' => $i->needs_elective_preauth,
                'preauth_code' => $i->preauth_code,
                'preauth_finalised_at' => $i->preauth_finalised_at?->toIso8601String(),
                'tariff' => $i->tariff,
            ])->all(),
            'consents' => $visit->consents->map(fn($c) => [
                'id' => $c->id,
                'purpose' => $c->purpose,
                'method' => $c->method,
                'status' => $c->status,
                'contact_masked' => $c->contact_masked,
                'otp_sent_at' => $c->otp_sent_at?->toIso8601String(),
                'otp_verified_at' => $c->otp_verified_at?->toIso8601String(),
                'auth_guid' => $c->auth_guid,
                'created_at' => $c->created_at?->toIso8601String(),
            ])->all(),
            'scenarioSpec' => $spec,
            'scenarioLabels' => ScenarioRouter::SCENARIO_LABELS,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       CONTACTS — for the OTP modal
       ═══════════════════════════════════════════════════ */

    public function contacts(Visit $visit, ConsentService $consent): JsonResponse
    {
        try {
            $contacts = $consent->contacts($visit->cr_number);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        }

        return response()->json(['contacts' => $contacts]);
    }

    /* ═══════════════════════════════════════════════════
       OTP — visit start
       ═══════════════════════════════════════════════════ */

    public function requestOtp(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'string', 'max:40'],
        ]);

        try {
            $result = $this->visits->requestOtp($visit, $data['contact_id'] ?? null);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'contacts' => $result['contacts'],
            'sent_to' => $result['consent']->contact_masked,
            'sent_at' => $result['consent']->otp_sent_at?->toIso8601String(),
        ]);
    }

    public function submitOtp(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'otp' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        try {
            $visit = $this->visits->submitOtp($visit, $data['otp']);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'visit_id' => $visit->id,
            'claim_status' => $visit->claim_status,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       BIOMETRIC — visit start
       ═══════════════════════════════════════════════════ */

    public function startBiometric(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'agent_id' => ['nullable', 'string', 'max:60'],
            'authorizing_device_os' => ['nullable', 'string', 'max:40'],
            'work_station_id' => ['nullable', 'string', 'max:120'],
            'factors' => ['nullable', 'array'],
            'factors.*' => ['string'],
        ]);

        try {
            $result = $this->visits->startBiometric($visit, $data);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'guid' => $result['guid'],
            'iframe_url' => $result['iframe_url'],
        ]);
    }

    public function pollBiometric(Visit $visit): JsonResponse
    {
        try {
            $result = $this->visits->pollBiometric($visit);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    /* ═══════════════════════════════════════════════════
       BILLING — lines, diagnoses, attachments
       ═══════════════════════════════════════════════════ */

    public function addLine(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'intervention_code' => ['required', 'string', 'max:60'],
            'service_name' => ['nullable', 'string', 'max:200'],
            'service_identifier' => ['nullable', 'string', 'max:60'],
            'unit_price' => ['nullable', 'string', 'max:20'],
            'quantity' => ['nullable', 'string', 'max:10'],
            'diagnoses' => ['nullable', 'array'],
            'diagnoses.*' => ['string'],
        ]);

        try {
            $response = $this->visits->addLine($visit, $data);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'response' => $response]);
    }

    /**
     * Add a single ICD-11 diagnosis to the visit's claim.
     * Kept separate from addLine so the UI never sends billing fields
     * by accident.
     */
    public function addDiagnosis(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'icd_code' => ['required', 'string', 'max:40'],
        ]);

        try {
            $response = $this->visits->addDiagnosis($visit, $data['icd_code']);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'icd_code' => $data['icd_code'],
            'response' => $response,
        ]);
    }

    public function preview(Visit $visit): JsonResponse
    {
        try {
            $response = $this->visits->preview($visit);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['preview' => $response]);
    }

    public function uploadAttachment(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'document_type' => [
                'required',
                'in:CLAIM_FORM,PREAUTH_FORM,DISCHARGE_SUMMARY,PRESCRIPTION,LAB_ORDER,INVOICE,BIO_DETAILS,IMAGING_ORDER,OTHER,FINAL_BILL,LAB_RESULTS,DEATH_NOTICE,THEATRE_NOTES',
            ],
            'intervention_code' => ['required', 'string', 'max:60'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $exists = $visit->interventions()
            ->where('intervention_code', $data['intervention_code'])
            ->exists();

        if (! $exists) {
            return response()->json([
                'error' => "Intervention {$data['intervention_code']} is not attached to this visit.",
            ], 422);
        }

        try {
            $response = $this->visits->addAttachment($visit, [
                'document_type' => $data['document_type'],
                'intervention_code' => $data['intervention_code'],
                'file' => $request->file('file'),
            ]);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'attachment' => [
                'id' => $response['attachment_id'] ?? null,
                'original_name' => $request->file('file')->getClientOriginalName(),
            ],
        ]);
    }

    /* ═══════════════════════════════════════════════════
       CLINICAL — ICD-11 picker support
       ═══════════════════════════════════════════════════ */

    public function searchIcd11(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('q', ''));

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = tenancy()->central(function () use ($query) {
            return \App\Models\TerminologyConcept::query()
                ->where('source', 'ICD-11')
                ->where(function ($q) use ($query) {
                    $q->where('code', 'ILIKE', "%{$query}%")
                        ->orWhere('title', 'ILIKE', "%{$query}%");
                })
                ->orderBy('code')
                ->limit(20)
                ->get(['code', 'title', 'chapter_title', 'block_title'])
                ->map(fn($c) => [
                    'code' => $c->code,
                    'title' => $c->title,
                    'chapter' => $c->chapter_title,
                    'block' => $c->block_title,
                ])
                ->all();
        });

        return response()->json(['results' => $results]);
    }

    /* ═══════════════════════════════════════════════════
       VISIT-END CONSENT — OTP
       ═══════════════════════════════════════════════════ */

    public function requestDischargeOtp(Visit $visit): JsonResponse
    {
        try {
            $response = $this->visits->requestDischargeOtp($visit);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'response' => $response]);
    }

    /* ═══════════════════════════════════════════════════
       VISIT-END CONSENT — BIOMETRIC
       ═══════════════════════════════════════════════════ */

    public function startDischargeBiometric(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'agent_id' => ['nullable', 'string', 'max:60'],
            'authorizing_device_os' => ['nullable', 'string', 'max:40'],
            'work_station_id' => ['nullable', 'string', 'max:120'],
            'factors' => ['nullable', 'array'],
            'factors.*' => ['string'],
        ]);

        try {
            $result = $this->visits->startDischargeBiometric($visit, $data);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'guid' => $result['guid'],
            'iframe_url' => $result['iframe_url'],
        ]);
    }

    public function pollDischargeBiometric(Visit $visit): JsonResponse
    {
        try {
            $result = $this->visits->pollDischargeBiometric($visit);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    /* ═══════════════════════════════════════════════════
       DISPATCH — submit (OP) or discharge (IP)
       ═══════════════════════════════════════════════════ */

    public function submit(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'discharge_reason' => ['required', 'in:RECOVERED,REFERRED,ABSCONDED,OTHER'],
            'otp' => ['nullable', 'string', 'min:4', 'max:10'],
            'discharge_auth_guid' => ['nullable', 'string', 'max:80'],
            'invoice_number' => ['nullable', 'string', 'max:60'],
        ]);

        try {
            $visit = $this->visits->submit($visit, $data);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'visit_id' => $visit->id,
            'claim_status' => $visit->claim_status,
            'invoice_number' => $visit->invoice_number,
        ]);
    }

    public function discharge(Request $request, Visit $visit): JsonResponse
    {
        $data = $request->validate([
            'discharge_reason' => ['required', 'in:RECOVERED,REFERRED,ABSCONDED,OTHER'],
            'otp' => ['nullable', 'string', 'min:4', 'max:10'],
            'discharge_auth_guid' => ['nullable', 'string', 'max:80'],
            'invoice_number' => ['nullable', 'string', 'max:60'],
        ]);

        try {
            $visit = $this->visits->discharge($visit, $data);
        } catch (HieException $e) {
            return response()->json(['error' => $e->userMessage()], 422);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'visit_id' => $visit->id,
            'claim_status' => $visit->claim_status,
            'invoice_number' => $visit->invoice_number,
        ]);
    }

    /* ═══════════════════════════════════════════════════
       CLOSE / ABANDON
       ═══════════════════════════════════════════════════ */

    public function close(Request $request, Visit $visit): RedirectResponse
    {
        if ($visit->claim_status !== 'draft') {
            return back()->with('error', 'Only draft visits can be abandoned.');
        }

        $reason = $request->input('reason');

        $visit->update([
            'closed_at' => now(),
            'closed_by' => auth()->id(),
            'claim_status' => 'closed',
            'notes' => trim(($visit->notes ?? '') . "\nAbandoned: {$reason}"),
        ]);

        $visit->consents()
            ->whereIn('status', ['pending', 'sent'])
            ->update(['status' => 'cancelled']);

        AuditLogger::log('visit.abandoned', [
            'visit_number' => $visit->visit_number,
            'reason' => $reason,
        ], $visit);

        return redirect()
            ->route('visits.index')
            ->with('success', "Visit {$visit->visit_number} closed.");
    }
}
