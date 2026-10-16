<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\TenantConnection;
use App\Models\User;
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

        $totalPatients = Patient::count();
        $patientsToday = Patient::whereDate('created_at', today())->count();
        $patientsWeek = Patient::where('created_at', '>=', now()->subDays(7))->count();
        $staff = User::count();

        // Verification mix — the SHA-onboarding funnel
        $verificationMix = Patient::query()
            ->selectRaw('verification_status, count(*) as c')
            ->groupBy('verification_status')
            ->pluck('c', 'verification_status')
            ->all();

        // 7-day registration trend
        $trend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            return [
                'date' => $date->format('D'),
                'full_date' => $date->format('j M'),
                'patients' => Patient::whereDate('created_at', $date)->count(),
            ];
        })->all();

        $recentPatients = Patient::orderByDesc('id')
            ->limit(5)
            ->get(['id', 'patient_number', 'first_name', 'middle_name', 'last_name', 'verification_status', 'created_at'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'number' => $p->patient_number,
                'name' => trim("{$p->first_name} {$p->middle_name} {$p->last_name}"),
                'verification_status' => $p->verification_status,
                'created_at' => $p->created_at?->toIso8601String(),
            ])
            ->all();

        $recentActivity = AuditLog::orderByDesc('id')
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
                'verified_patients' => $verificationMix['verified'] ?? 0,
                'unverified_patients' => $verificationMix['unverified'] ?? 0,
                'local_only_patients' => $verificationMix['local_only'] ?? 0,
            ],
            'verification_mix' => $verificationMix,
            'trend' => $trend,
            'recent_patients' => $recentPatients,
            'recent_activity' => $recentActivity,
        ]);
    }
}