<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\PatientRegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
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
                'verification_status' => $patient->verification_status,
                'verification_attempts' => $patient->verification_attempts,
                'last_verified_at' => $patient->last_verified_at?->toIso8601String(),
                'last_verification_error' => $patient->last_verification_error,
                'next_of_kin' => $patient->next_of_kin,
                'allergies' => $patient->allergies,
                'notes' => $patient->notes,
                'first_visit_at' => $patient->first_visit_at?->toIso8601String(),
                'created_at' => $patient->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function store(Request $request, PatientRegistrationService $registration): RedirectResponse
    {
        $mode = $request->input('mode', 'sha'); // sha | local

        $rules = [
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
        ];

        $data = $request->validate($rules);

        $patient = $mode === 'sha'
            ? $registration->registerWithSha($data)
            : $registration->registerLocalOnly($data);

        $message = match ($patient->verification_status) {
            'verified' => "Patient {$patient->full_name} registered and verified with SHA.",
            'unverified' => "Patient {$patient->full_name} registered. SHA link is being processed.",
            'not_found' => "Patient {$patient->full_name} registered locally. Not found in the national registry.",
            'local_only' => "Patient {$patient->full_name} registered as {$patient->patient_number}.",
            default => "Patient {$patient->full_name} registered.",
        };

        return redirect()
            ->route('patients.show', $patient->id)
            ->with('success', $message);
    }

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

    public function upgrade(Patient $patient, PatientRegistrationService $registration): RedirectResponse
    {
        $result = $registration->tryUpgradeToVerified($patient);

        if ($result['success'] ?? false) {
            return back()->with('success', "Patient verified. CR number: {$patient->fresh()->cr_number}");
        }

        $message = ($result['not_found'] ?? false)
            ? 'Patient not found in the national SHA registry.'
            : 'Could not reach the HIE. We will keep trying in the background.';

        return back()->with('error', $message);
    }
}