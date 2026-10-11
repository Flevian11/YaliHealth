<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Plan;
use App\Models\SuperAdmin;
use App\Models\Tenant;
use App\Models\TenantConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $range = (string) $request->input('range', '12m');

        $trend = $this->buildTrend($range);
        $trendTotals = $this->trendTotals($trend);

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

                /* ─── Plan distribution ─── */
        $planDistribution = DB::table('plans')
            ->leftJoin('tenants', 'tenants.plan_id', '=', 'plans.id')
            ->select('plans.id', 'plans.name', DB::raw('COUNT(tenants.id) as total'))
            ->groupBy('plans.id', 'plans.name')
            ->havingRaw('COUNT(tenants.id) > 0')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'value' => (int) $r->total,
            ])
            ->all();

        /* ─── Subscription distribution ─── */
        $subsDistribution = Tenant::query()
            ->selectRaw("COALESCE(subscription_status, 'unknown') as status, COUNT(*) as count")
            ->groupBy('subscription_status')
            ->get()
            ->map(fn($r) => [
                'name' => ucfirst(str_replace('_', ' ', $r->status)),
                'value' => (int) $r->count,
            ])
            ->all();

        /* ─── Connection health ─── */
        $connections = TenantConnection::all();
        $connHealthy = 0;
        $connFailing = 0;
        $connIncomplete = 0;
        $connNotConfigured = Tenant::count() - $connections->count();

        foreach ($connections as $conn) {
            match ($conn->status()) {
                'healthy' => $connHealthy++,
                'failing' => $connFailing++,
                'incomplete' => $connIncomplete++,
                default => null,
            };
        }

        /* ─── Event type distribution ─── */
        $eventDistribution = AuditLog::query()
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->selectRaw('event, COUNT(*) as count')
            ->groupBy('event')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn($r) => [
                'name' => $r->event,
                'value' => (int) $r->count,
            ])
            ->all();

        /* ─── Top hospitals by activity ─── */
        $topHospitals = AuditLog::query()
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->whereNotNull('actor_email')
            ->selectRaw('actor_email, COUNT(*) as count')
            ->groupBy('actor_email')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'email' => $r->actor_email,
                'count' => (int) $r->count,
            ])
            ->all();

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
                    ->map(fn($t) => [
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
                    ->map(fn($a) => [
                        'id' => $a->id,
                        'event' => $a->event,
                        'actor_email' => $a->actor_email,
                        'created_at' => $a->created_at->toIso8601String(),
                    ])
                    ->all(),
                'trend' => $trend,
                'trend_totals' => $trendTotals,
                'distribution' => [
                    ['name' => 'Active', 'value' => $active['value']],
                    ['name' => 'Inactive', 'value' => max($hospitals['value'] - $active['value'], 0)],
                    ['name' => 'Admins', 'value' => $admins['value']],
                    ['name' => 'Logins today', 'value' => $logins['value']],
                ],
                'plan_distribution' => $planDistribution,
                'subs_distribution' => $subsDistribution,
                'event_distribution' => $eventDistribution,
                'top_hospitals' => $topHospitals,
                'connection_health' => [
                    'healthy' => $connHealthy,
                    'failing' => $connFailing,
                    'incomplete' => $connIncomplete,
                    'not_configured' => $connNotConfigured,
                    'total' => Tenant::count(),
                ],
            ],
            'range' => $range,
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

    private function buildTrend(string $range): array
    {
        [$start, $end, $bucket, $labelFormat] = $this->rangeConfig($range);

        $hospitalsByBucket = Tenant::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->groupBy(fn($t) => $t->created_at->format($labelFormat))
            ->map->count();

        $loginsByBucket = AuditLog::query()
            ->where('event', 'auth.login')
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->groupBy(fn($a) => $a->created_at->format($labelFormat))
            ->map->count();

        $signupsByBucket = SuperAdmin::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->groupBy(fn($s) => $s->created_at->format($labelFormat))
            ->map->count();

        $auditByBucket = AuditLog::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->groupBy(fn($a) => $a->created_at->format($labelFormat))
            ->map->count();

        // Generate the full list of buckets between start and end
        $buckets = $this->generateBuckets($start, $end, $bucket, $labelFormat);

        $trend = [];
        foreach ($buckets as $key => $label) {
            $trend[] = [
                'month' => $label,
                'key' => $key,
                'hospitals' => (int) ($hospitalsByBucket[$key] ?? 0),
                'logins' => (int) ($loginsByBucket[$key] ?? 0),
                'audits' => (int) ($auditByBucket[$key] ?? 0),
                'admins' => (int) ($signupsByBucket[$key] ?? 0),
            ];
        }

        return $trend;
    }

    private function trendTotals(array $trend): array
    {
        return [
            'hospitals' => array_sum(array_column($trend, 'hospitals')),
            'logins' => array_sum(array_column($trend, 'logins')),
            'audits' => array_sum(array_column($trend, 'audits')),
            'admins' => array_sum(array_column($trend, 'admins')),
        ];
    }

    private function rangeConfig(string $range): array
    {
        $now = Carbon::now();

        return match ($range) {
            '7d' => [
                $now->copy()->subDays(6)->startOfDay(),
                $now->copy()->endOfDay(),
                'day',
                'D j',
            ],
            '30d' => [
                $now->copy()->subDays(29)->startOfDay(),
                $now->copy()->endOfDay(),
                'day',
                'j M',
            ],
            '90d' => [
                $now->copy()->subDays(89)->startOfDay(),
                $now->copy()->endOfDay(),
                'week',
                'j M',
            ],
            'ytd' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfDay(),
                'month',
                'M Y',
            ],
            '12m' => [
                $now->copy()->subMonths(11)->startOfMonth(),
                $now->copy()->endOfMonth(),
                'month',
                'M Y',
            ],
            default => [
                $now->copy()->subMonths(11)->startOfMonth(),
                $now->copy()->endOfMonth(),
                'month',
                'M Y',
            ],
        };
    }

    private function generateBuckets(Carbon $start, Carbon $end, string $bucket, string $format): array
    {
        $buckets = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $key = $cursor->format($format);
            $label = match ($bucket) {
                'day' => $cursor->format('j M'),
                'week' => $cursor->format('j M'),
                'month' => $cursor->format('M'),
                default => $cursor->format('M'),
            };
            $buckets[$key] = $label;

            match ($bucket) {
                'day' => $cursor->addDay(),
                'week' => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
                default => $cursor->addMonth(),
            };
        }

        return $buckets;
    }
}
