<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\PatientNumberGenerator;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));

        $patients = Patient::query()
            ->when($query !== '', function ($q) use ($query) {
                $like = "%{$query}%";
                $q->where(function ($sub) use ($like) {
                    $sub->where('first_name', 'ILIKE', $like)
                        ->orWhere('last_name', 'ILIKE', $like)
                        ->orWhere('patient_number', 'ILIKE', $like)
                        ->orWhere('phone', 'ILIKE', $like)
                        ->orWhere('national_id', 'ILIKE', $like);
                });
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('tenant/patients/Index', [
            'patients' => $patients,
            'filters' => ['q' => $query],
        ]);
    }

    public function store(Request $request, PatientNumberGenerator $numbers): RedirectResponse
    {
        $data = $this->validated($request);

        $data['patient_number'] = $numbers->next();
        $data['registered_by'] = Auth::id();
        $data['first_visit_at'] = now();

        $patient = Patient::create($data);

        AuditLogger::log('patient.created', [
            'patient_id' => $patient->id,
            'patient_number' => $patient->patient_number,
            'name' => $patient->full_name,
        ], $patient);

        return redirect()
            ->route('tenant.dashboard')
            ->with('success', "Patient {$patient->full_name} registered as {$patient->patient_number}.");
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'national_id' => ['nullable', 'string', 'max:40'],
            'sha_id' => ['nullable', 'string', 'max:60'],
            'insurance_type' => ['required', Rule::in(['cash', 'sha', 'private'])],
            'county' => ['nullable', 'string', 'max:80'],
            'village' => ['nullable', 'string', 'max:80'],
            'next_of_kin' => ['nullable', 'array'],
            'next_of_kin.name' => ['nullable', 'string', 'max:120'],
            'next_of_kin.phone' => ['nullable', 'string', 'max:40'],
            'next_of_kin.relationship' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}