<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ProvisionHospital;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHospitalRequest;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HospitalController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->input('q', ''));
        $status = (string) $request->input('status', '');
        $planId = (string) $request->input('plan', '');

        $paginator = Tenant::query()
            ->with(['domains', 'plan'])
            ->when($query !== '', function ($q) use ($query) {
                $like = '%' . $query . '%';
                $q->where(function ($sub) use ($like) {
                    $sub->whereRaw("data->>'name' ILIKE ?", [$like])
                        ->orWhereRaw("data->>'admin_email' ILIKE ?", [$like])
                        ->orWhereRaw("data->>'admin_name' ILIKE ?", [$like])
                        ->orWhereHas('domains', function ($d) use ($like) {
                            $d->where('domain', 'ILIKE', $like);
                        });
                });
            })
            ->when($status === 'active', fn ($q) => $q->whereRaw("data->>'status' = 'active'"))
            ->when($status === 'suspended', fn ($q) => $q->whereRaw("data->>'status' = 'suspended'"))
            ->when($planId !== '', fn ($q) => $q->where('plan_id', $planId))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Tenant $t) => $this->serialize($t));

        return Inertia::render('admin/Hospitals', [
            'hospitals' => $paginator,
            'filters' => ['q' => $query, 'status' => $status, 'plan' => $planId],
            'tenantBase' => env('TENANCY_TENANT_SUFFIX', 'localhost'),
            'plans' => Plan::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'billing_cycle', 'price_yearly', 'currency', 'setup_fee', 'trial_days'])
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'billing_cycle' => $p->billing_cycle,
                    'price_yearly' => $p->price_yearly,
                    'currency' => $p->currency,
                    'setup_fee' => $p->setup_fee,
                    'trial_days' => $p->trial_days,
                ])
                ->all(),
            'stats' => [
                'total' => Tenant::count(),
                'active' => Tenant::whereRaw("data->>'status' = 'active'")->count(),
                'suspended' => Tenant::whereRaw("data->>'status' = 'suspended'")->count(),
                'expiring_soon' => Tenant::query()
                    ->where('subscription_status', 'active')
                    ->whereNotNull('current_period_end')
                    ->whereBetween('current_period_end', [now(), now()->addDays(14)])
                    ->count(),
            ],
        ]);
    }

    public function store(StoreHospitalRequest $request, ProvisionHospital $provision): RedirectResponse
    {
        $data = $request->validated();

        // Auto-assign first available plan if none provided
        $planId = $data['plan_id'] ?? Plan::where('is_active', true)
            ->orderBy('sort_order')
            ->value('id');

        $data['plan_id'] = $planId;

        $tenant = $provision->execute($data);

        return redirect()
            ->route('admin.hospitals.index')
            ->with('success', "Hospital \"{$tenant->name}\" created successfully.");
    }

    public function destroy(string $id): RedirectResponse
    {
        $tenant = Tenant::findOrFail($id);
        $name = $tenant->name;
        $slug = $tenant->domains()->first()?->domain;

        $tenant->delete();

        AuditLogger::log('hospital.deleted', [
            'id' => $id,
            'name' => $name,
            'domain' => $slug,
        ]);

        return back()->with('success', "Hospital \"{$name}\" deleted.");
    }

    public function suspend(string $id): RedirectResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->status = 'suspended';
        $tenant->suspended_at = now()->toIso8601String();
        $tenant->save();

        AuditLogger::log('hospital.suspended', [
            'id' => $id,
            'name' => $tenant->name,
        ], $tenant);

        return back()->with('success', "Hospital \"{$tenant->name}\" suspended.");
    }

    public function activate(string $id): RedirectResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->status = 'active';
        $tenant->suspended_at = null;
        $tenant->save();

        AuditLogger::log('hospital.activated', [
            'id' => $id,
            'name' => $tenant->name,
        ], $tenant);

        return back()->with('success', "Hospital \"{$tenant->name}\" activated.");
    }

    public function changePlan(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'reset_period' => ['boolean'],
        ]);

        $tenant = Tenant::findOrFail($id);
        $plan = Plan::findOrFail($data['plan_id']);

        $previousPlanId = $tenant->plan_id;
        $tenant->plan_id = $plan->id;

        // If the hospital was on trial and we're assigning a real plan, start the billing period
        if ($tenant->subscription_status === 'trialing' && ! $data['reset_period']) {
            // Keep them on trial if the new plan has a trial
            if ($plan->trial_days > 0) {
                $tenant->trial_ends_at = now()->addDays($plan->trial_days);
            } else {
                $tenant->subscription_status = 'active';
                $tenant->current_period_start = now();
                $tenant->current_period_end = now()->addMonths($plan->billing_cycle_months);
            }
        } elseif ($data['reset_period'] ?? false) {
            $tenant->subscription_status = 'active';
            $tenant->trial_ends_at = null;
            $tenant->current_period_start = now();
            $tenant->current_period_end = now()->addMonths($plan->billing_cycle_months);
        }

        $tenant->save();

        AuditLogger::log('hospital.plan.changed', [
            'id' => $tenant->id,
            'from_plan_id' => $previousPlanId,
            'to_plan_id' => $plan->id,
            'to_plan_slug' => $plan->slug,
            'reset_period' => $data['reset_period'] ?? false,
        ], $tenant);

        return back()->with('success', "Hospital switched to {$plan->name}.");
    }

    public function toggleTrial(string $id): RedirectResponse
    {
        $tenant = Tenant::findOrFail($id);

        if ($tenant->subscription_status === 'trialing') {
            $tenant->subscription_status = 'active';
            $tenant->trial_ends_at = null;
            $tenant->current_period_start = now();
            $tenant->current_period_end = now()->addMonths(
                $tenant->plan?->billing_cycle_months ?? 1
            );
        } else {
            $tenant->subscription_status = 'trialing';
            $tenant->trial_ends_at = now()->addDays(
                $tenant->plan?->trial_days ?? 14
            );
            $tenant->current_period_start = null;
            $tenant->current_period_end = null;
        }

        $tenant->save();

        AuditLogger::log('hospital.subscription.status.changed', [
            'id' => $tenant->id,
            'status' => $tenant->subscription_status,
        ], $tenant);

        return back()->with('success', 'Subscription status updated.');
    }

    public function admins(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $admins = $tenant->run(function () {
            return User::query()
                ->select(['id', 'name', 'email', 'role', 'created_at'])
                ->orderBy('created_at')
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'created_at' => $u->created_at?->toIso8601String(),
                ])
                ->all();
        });

        return response()->json(['admins' => $admins]);
    }

    public function storeAdmin(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $tenant = Tenant::findOrFail($id);

        $exists = $tenant->run(
            fn () => User::where('email', $data['email'])->exists()
        );

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => 'An admin with this email already exists for this hospital.',
            ]);
        }

        $tenant->run(function () use ($data) {
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'hospital_admin',
                'email_verified_at' => now(),
            ]);
        });

        AuditLogger::log('hospital.admin.created', [
            'hospital_id' => $tenant->id,
            'email' => $data['email'],
        ], $tenant);

        return back()->with('success', "Admin \"{$data['name']}\" added.");
    }

    private function serialize(Tenant $t): array
    {
        return [
            'id' => $t->id,
            'name' => $t->name,
            'admin_name' => $t->admin_name,
            'admin_email' => $t->admin_email,
            'phone' => $t->phone,
            'status' => $t->status ?? 'active',
            'domains' => $t->domains->pluck('domain')->all(),
            'created_at' => $t->created_at?->toIso8601String(),
            'plan' => $t->plan ? [
                'id' => $t->plan->id,
                'name' => $t->plan->name,
                'slug' => $t->plan->slug,
                'billing_cycle' => $t->plan->billing_cycle,
                'price_yearly' => $t->plan->price_yearly,
                'currency' => $t->plan->currency,
            ] : null,
            'subscription_status' => $t->subscription_status,
            'trial_ends_at' => $t->trial_ends_at?->toIso8601String(),
            'current_period_end' => $t->current_period_end?->toIso8601String(),
            'trial_days_left' => $t->trialDaysLeft(),
            'can_access_system' => $t->canAccessSystem(),
        ];
    }
}