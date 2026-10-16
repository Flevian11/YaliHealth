<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\Hie\HieException;
use App\Services\Hie\RegistryService;
use App\Services\PatientRegistrationService;
use App\Support\AuditLogger;
use App\Support\TenantPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    /* ═══════════════════════════════════════════════════
       INDEX
       ═══════════════════════════════════════════════════ */

    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));

        $patients = Patient::query()
            ->notMerged()
            ->when($query !== '', fn ($q) => $q->search($query))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Patient $p) => [
                'id' => $p->id,
                'patient_number' => $p->patient_number,
                'name' => $p->full_name,
                'initials' => $p->initials,
                'date_of_birth' => $p->date_of_birth?->format('Y-m-d'),
                'gender' => $p->gender,
                'phone' => $p->phone,
                'national_id' => $p->national_id,
                'cr_number' => $p->cr_number,
                'verification_status' => $p->verification_status,
                'first_visit_at' => $p->first_visit_at?->toIso8601String(),
            ]);

        return Inertia::render('tenant/Patients', [
            'patients' => $patients,
            'filters' => ['q' => $query],
        ]);
    }

    /* ═══════════════════════════════════════════════════
       SHOW
       ═══════════════════════════════════════════════════ */

    public function show(Patient $patient): Response
    {
        abort_if($patient->isMerged(), 404);

        return Inertia::render('tenant/PatientDetail', [
            'patient' => [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'full_name' => $patient->full_name,
                'initials' => $patient->initials,
                'date_of_birth' => $patient->date_of_birth?->format('Y-m-d'),
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'county' => $patient->county,
                'village' => $patient->village,
                'national_id' => $patient->national_id,
                'sha_id' => $patient->sha_id,
                'cr_number' => $patient->cr_number,
                'principal_cr_number' => $patient->principal_cr_number,
                'principal_name' => $patient->principal_name,
                'relationship_to_principal' => $patient->relationship_to_principal,
                'is_dependant' => $patient->isDependant(),
                'hie_patient_id' => $patient->hiePatientId(),
                'verification_status' => $patient->verification_status,
                'verification_attempts' => $patient->verification_attempts,
                'last_verified_at' => $patient->last_verified_at?->toIso8601String(),
                'last_verification_error' => $patient->last_verification_error,
                'next_of_kin' => $patient->next_of_kin,
                'allergies' => $patient->allergies,
                'notes' => $patient->notes,
                'first_visit_at' => $patient->first_visit_at?->toIso8601String(),
                'created_at' => $patient->created_at?->toIso8601String(),
                'visits_count' => $patient->visits()->count(),
                'recent_visits' => $patient->visits()
                    ->orderByDesc('id')
                    ->limit(5)
                    ->get(['id', 'visit_number', 'visit_type', 'service_type', 'fund', 'scenario', 'claim_status', 'created_at'])
                    ->map(fn ($v) => [
                        'id' => $v->id,
                        'visit_number' => $v->visit_number,
                        'visit_type' => $v->visit_type,
                        'service_type' => $v->service_type,
                        'fund' => $v->fund,
                        'scenario' => $v->scenario,
                        'claim_status' => $v->claim_status,
                        'opened_at' => $v->created_at?->toIso8601String(),
                    ])
                    ->all(),
            ],
        ]);
    }

    /* ═══════════════════════════════════════════════════
       STORE
       ═══════════════════════════════════════════════════ */

    public function store(Request $request, PatientRegistrationService $registration): RedirectResponse
    {
        $data = $request->validate([
            'mode' => ['required', 'in:sha,local'],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'county' => ['nullable', 'string', 'max:80'],
            'village' => ['nullable', 'string', 'max:80'],
            'national_id' => ['nullable', 'string', 'max:40'],
            'sha_id' => ['nullable', 'string', 'max:60'],
            'next_of_kin' => ['nullable', 'array'],
            'next_of_kin.name' => ['nullable', 'string', 'max:120'],
            'next_of_kin.phone' => ['nullable', 'string', 'max:40'],
            'next_of_kin.relationship' => ['nullable', 'string', 'max:60'],
            'allergies' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:1000'],

            'resolved_cr_number' => ['nullable', 'string', 'max:60'],
            'resolved_principal_cr_number' => ['nullable', 'string', 'max:60'],
            'resolved_principal_name' => ['nullable', 'string', 'max:200'],
            'resolved_relationship' => ['nullable', 'string', 'max:40'],
        ]);

        if ($data['mode'] === 'sha') {
            $patient = $registration->registerWithSha($data);

            $message = $patient->isDependant()
                ? "Dependant {$patient->full_name} registered under {$patient->principal_name}."
                : match ($patient->verification_status) {
                    'verified' => "Patient {$patient->full_name} registered and verified with SHA.",
                    'unverified' => "Patient {$patient->full_name} registered. SHA link is being processed.",
                    'not_found' => "Patient {$patient->full_name} registered locally. Not found in the national registry.",
                    default => "Patient {$patient->full_name} registered.",
                };
        } else {
            $patient = $registration->registerLocalOnly($data);
            $message = "Patient {$patient->full_name} registered as {$patient->patient_number}.";
        }

        return redirect()
            ->route('patients.show', $patient->id)
            ->with('success', $message);
    }

    /* ═══════════════════════════════════════════════════
       LOOKUP
       ═══════════════════════════════════════════════════ */

    public function lookup(Request $request, RegistryService $registry): JsonResponse
    {
        $data = $request->validate([
            'identification_number' => ['required', 'string', 'max:40'],
            'identification_type' => ['required', 'string', 'max:40'],
        ]);

        try {
            $record = $registry->findPatient(
                $data['identification_number'],
                $data['identification_type'],
            );
        } catch (HieException $e) {
            AuditLogger::log('patient.lookup.failed', [
                'identification_number' => $data['identification_number'],
                'identification_type' => $data['identification_type'],
                'reason' => $e->reason,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'found' => false,
                'reason' => $e->reason,
                'error' => $e->userMessage(),
            ]);
        }

        $allCrs = array_merge(
            [$record['cr_number']],
            array_column($record['dependants'], 'cr_number'),
        );

        $existing = Patient::whereIn('cr_number', $allCrs)
            ->notMerged()
            ->get(['id', 'patient_number', 'cr_number', 'first_name', 'last_name', 'verification_status']);

        $existingByCr = $existing->keyBy('cr_number');

        AuditLogger::log('patient.lookup.success', [
            'identification_number' => $data['identification_number'],
            'cr_number' => $record['cr_number'],
            'dependants_count' => count($record['dependants']),
            'local_matches' => $existing->count(),
        ]);

        return response()->json([
            'found' => true,
            'record' => [
                'cr_number' => $record['cr_number'],
                'sha_id' => $record['sha_id'],
                'first_name' => $record['first_name'],
                'middle_name' => $record['middle_name'],
                'last_name' => $record['last_name'],
                'date_of_birth' => $record['date_of_birth'],
                'gender' => $record['gender'],
                'phone' => $record['phone'],
                'alive' => $record['alive'],
                'is_dependant' => false,
                'relationship' => null,
                'existing_local' => $existingByCr->get($record['cr_number'])
                    ?->only(['id', 'patient_number', 'verification_status']),
            ],
            'dependants' => array_map(function ($d) use ($existingByCr) {
                return array_merge($d, [
                    'is_dependant' => true,
                    'sha_id' => null,
                    'phone' => null,
                    'alive' => true,
                    'existing_local' => $existingByCr->get($d['cr_number'])
                        ?->only(['id', 'patient_number', 'verification_status']),
                ]);
            }, $record['dependants']),
        ]);
    }

    /* ═══════════════════════════════════════════════════
       SEARCH JSON
       ═══════════════════════════════════════════════════ */

    public function searchJson(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('q', ''));

        if (strlen($query) < 2) {
            return response()->json(['patients' => []]);
        }

        $patients = Patient::query()
            ->notMerged()
            ->search($query)
            ->orderByDesc('id')
            ->limit(10)
            ->get([
                'id', 'patient_number', 'first_name', 'middle_name', 'last_name',
                'date_of_birth', 'gender', 'verification_status', 'cr_number',
                'principal_cr_number',
            ])
            ->map(fn (Patient $p) => [
                'id' => $p->id,
                'patient_number' => $p->patient_number,
                'name' => $p->full_name,
                'initials' => $p->initials,
                'date_of_birth' => $p->date_of_birth?->format('Y-m-d'),
                'gender' => $p->gender,
                'verification_status' => $p->verification_status,
                'cr_number' => $p->cr_number,
                'is_dependant' => $p->isDependant(),
            ]);

        return response()->json(['patients' => $patients]);
    }

    /* ═══════════════════════════════════════════════════
       CHECK DUPLICATES
       ═══════════════════════════════════════════════════ */

    public function checkDuplicates(Request $request, PatientRegistrationService $registration): JsonResponse
    {
        $data = $request->validate([
            'national_id' => ['nullable', 'string', 'max:40'],
            'phone' => ['nullable', 'string', 'max:40'],
            'first_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'date_of_birth' => ['nullable', 'date'],
        ]);

        return response()->json([
            'matches' => $registration->findPotentialDuplicates($data),
        ]);
    }

    /* ═══════════════════════════════════════════════════
       UPGRADE
       ═══════════════════════════════════════════════════ */

    public function upgrade(Patient $patient, PatientRegistrationService $registration): RedirectResponse
    {
        $result = $registration->tryUpgradeToVerified($patient);

        if ($result['success'] ?? false) {
            return back()->with(
                'success',
                "Patient verified. CR number: {$patient->fresh()->cr_number}",
            );
        }

        $message = ($result['not_found'] ?? false)
            ? 'Patient not found in the national SHA registry.'
            : 'Could not reach the HIE. We will keep trying in the background.';

        return back()->with('error', $message);
    }

    /* ═══════════════════════════════════════════════════
       DESTROY — soft delete
       ═══════════════════════════════════════════════════ */

    public function destroy(Patient $patient): RedirectResponse
    {
        if (! TenantPermissions::can(auth()->user(), 'patients.delete')) {
            abort(403, 'You do not have permission to delete patients.');
        }

        $openVisits = $patient->visits()->whereNull('closed_at')->count();

        if ($openVisits > 0) {
            return back()->with(
                'error',
                "Cannot delete — this patient has {$openVisits} open " .
                    ($openVisits === 1 ? 'visit' : 'visits') .
                    '. Close them first.',
            );
        }

        $snapshot = [
            'patient_id' => $patient->id,
            'patient_number' => $patient->patient_number,
            'full_name' => $patient->full_name,
            'cr_number' => $patient->cr_number,
        ];

        $name = $patient->full_name;

        $patient->delete(); // soft delete

        AuditLogger::log('patient.deleted', $snapshot, $patient);

        return redirect()
            ->route('patients.index')
            ->with('success', "Patient {$name} deleted.");
    }
}