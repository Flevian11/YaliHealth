<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\TenantConnection;
use App\Models\User;
use App\Support\AuditLogger;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tenant = tenant();
        $user = auth()->user();

        $connection = tenancy()->central(
            fn () => TenantConnection::where('tenant_id', $tenant->id)->first()
        );

        // Patient counts (real when the module lands)
        $totalPatients = class_exists(Patient::class)
            ? Patient::count()
            : 0;
        $patientsToday = class_exists(Patient::class)
            ? Patient::whereDate('created_at', today())->count()
            : 0;
        $patientsWeek = class_exists(Patient::class)
            ? Patient::where('created_at', '>=', now()->subDays(7))->count()
            : 0;

        $staff = User::count();

        // 7-day patient registration trend (real when patients exist)
        $trend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            return [
                'date' => $date->format('D'),
                'full_date' => $date->format('j M'),
                'patients' => class_exists(Patient::class)
                    ? Patient::whereDate('created_at', $date)->count()
                    : 0,
            ];
        })->all();

        // Recent patients
        $recentPatients = class_exists(Patient::class)
            ? Patient::orderByDesc('id')->limit(5)->get(['id', 'patient_number', 'first_name', 'middle_name', 'last_name', 'created_at', 'insurance_type'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'number' => $p->patient_number,
                    'name' => trim("{$p->first_name} {$p->middle_name} {$p->last_name}"),
                    'insurance_type' => $p->insurance_type,
                    'created_at' => $p->created_at?->toIso8601String(),
                ])
                ->all()
            : [];

        // Recent audit activity (this tenant's only)
        $recentActivity = \App\Models\AuditLog::orderByDesc('id')
            ->limit(8)
            ->get(['id', 'event', 'actor_email', 'created_at'])
            ->map(fn ($a) => [
                'id' => $a->id,
                'event' => $a->event,
                'actor_email' => $a->actor_email,
                'created_at' => $a->created_at->toIso8601String(),
            ])
            ->all();

        return Inertia::render('tenant/Dashboard', [
            'hospital' => [
                'id' => $tenant->id,
                'name' => $tenant->name ?? $tenant->id,
                'plan' => $tenant->plan?->name,
                'subscription_status' => $tenant->subscription_status,
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            ],
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
            ],
            'connection' => $connection ? [
                'status' => $connection->status(),
                'environment' => $connection->environment,
                'last_verified_at' => $connection->last_verified_at?->toIso8601String(),
                'last_verified_latency_ms' => $connection->last_verified_latency_ms,
                'facility_fr_code' => $connection->facility_fr_code,
                'facility_name' => $connection->facility_name,
            ] : null,
            'stats' => [
                'staff' => $staff,
                'total_patients' => $totalPatients,
                'patients_today' => $patientsToday,
                'patients_week' => $patientsWeek,
            ],
            'trend' => $trend,
            'recent_patients' => $recentPatients,
            'recent_activity' => $recentActivity,
        ]);
    }
}