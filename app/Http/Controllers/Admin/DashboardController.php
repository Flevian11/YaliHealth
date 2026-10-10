<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SuperAdmin;
use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now();
        $prev = $now->copy()->subDays(30);

        $hospitals = $this->metric(
            now: Tenant::count(),
            then: Tenant::where('created_at', '<', $prev)->count(),
        );

        $active = $this->metric(
            now: Tenant::whereRaw("data->>'status' = 'active'")->count(),
            then: Tenant::whereRaw("data->>'status' = 'active'")
                ->where('created_at', '<', $prev)->count(),
        );

        $adminsNow = SuperAdmin::count() + Tenant::count();
        $adminsThen = SuperAdmin::where('created_at', '<', $prev)->count()
            + Tenant::where('created_at', '<', $prev)->count();

        $admins = $this->metric(now: $adminsNow, then: $adminsThen);

        $logins = $this->metric(
            now: AuditLog::where('event', 'auth.login')
                ->where('created_at', '>=', $now->copy()->subDay())->count(),
            then: AuditLog::where('event', 'auth.login')
                ->whereBetween('created_at', [
                    $now->copy()->subDays(2),
                    $now->copy()->subDay(),
                ])->count(),
        );

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'hospitals' => $hospitals,
                'active' => $active,
                'admins' => $admins,
                'logins' => $logins,
                'recent' => Tenant::with('domains')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
                    ->map(fn ($t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'domain' => $t->domains->first()?->domain,
                        'status' => $t->status ?? 'active',
                        'created_at' => $t->created_at?->toIso8601String(),
                    ])
                    ->all(),
                'activity' => AuditLog::orderByDesc('created_at')
                    ->limit(8)
                    ->get(['id', 'event', 'actor_email', 'created_at'])
                    ->map(fn ($a) => [
                        'id' => $a->id,
                        'event' => $a->event,
                        'actor_email' => $a->actor_email,
                        'created_at' => $a->created_at->toIso8601String(),
                    ])
                    ->all(),
                'trend' => $this->monthlyTrend(),
                'distribution' => [
                    ['name' => 'Active', 'value' => $active['value']],
                    ['name' => 'Inactive', 'value' => max($hospitals['value'] - $active['value'], 0)],
                    ['name' => 'Admins', 'value' => $admins['value']],
                    ['name' => 'Logins today', 'value' => $logins['value']],
                ],
            ],
        ]);
    }

    private function metric(int $now, int $then): array
    {
        if ($then === 0) {
            $delta = $now > 0 ? 100.0 : 0.0;
        } else {
            $delta = round((($now - $then) / $then) * 100, 1);
        }

        return [
            'value' => $now,
            'previous' => $then,
            'delta' => $delta,
        ];
    }

    private function monthlyTrend(): array
    {
        return collect(range(11, 0))->map(function ($monthsAgo) {
            $month = Carbon::now()->subMonths($monthsAgo);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            return [
                'month' => $month->format('M'),
                'hospitals' => Tenant::whereBetween('created_at', [$start, $end])->count(),
                'logins' => AuditLog::where('event', 'auth.login')
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),
            ];
        })->all();
    }
}