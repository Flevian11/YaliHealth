<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/Plans', [
            'plans' => Plan::query()
                ->withCount('tenants')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (Plan $p) => $this->serialize($p))
                ->all(),
            'featureCatalog' => config('features.groups'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $plan = Plan::create($data);

        AuditLogger::log('plan.created', [
            'id' => $plan->id,
            'slug' => $plan->slug,
            'name' => $plan->name,
        ]);

        return back()->with('success', "Plan \"{$plan->name}\" created.");
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $this->validated($request, $plan);

        $plan->update($data);

        AuditLogger::log('plan.updated', [
            'id' => $plan->id,
            'slug' => $plan->slug,
        ], $plan);

        return back()->with('success', "Plan \"{$plan->name}\" updated.");
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->tenants()->exists()) {
            return back()->withErrors([
                'plan' => 'Cannot delete a plan that has active hospitals on it.',
            ]);
        }

        $name = $plan->name;
        $id = $plan->id;

        $plan->delete();

        AuditLogger::log('plan.deleted', ['id' => $id, 'name' => $name]);

        return back()->with('success', "Plan \"{$name}\" deleted.");
    }

        private function validated(Request $request, ?Plan $plan = null): array
    {
        $slug = $request->input('slug') ?: Str::slug($request->input('name'));

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'max:60',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('plans', 'slug')->ignore($plan?->id),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'price_monthly' => ['required', 'integer', 'min:0'],
            'price_yearly' => ['required', 'integer', 'min:0'],
            'setup_fee' => ['required', 'integer', 'min:0'],
            'billing_cycle' => ['required', 'in:monthly,quarterly,semi_annual,annual'],
            'billing_cycle_months' => ['required', 'integer', 'in:1,3,6,12'],
            'currency' => ['required', 'string', 'size:3'],
            'trial_days' => ['required', 'integer', 'min:0', 'max:365'],
            'is_active' => ['boolean'],
            'is_public' => ['boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'features' => ['array'],
            'features.*' => ['string'],
            'limits' => ['array'],
            'limits.max_users' => ['nullable', 'integer', 'min:0'],
            'limits.max_branches' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['slug'] = $slug;
        $data['features'] = array_values($data['features'] ?? []);
        $data['limits'] = array_filter($data['limits'] ?? [], fn ($v) => $v !== null);

        return $data;
    }

        private function serialize(Plan $p): array
    {
        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'description' => $p->description,
            'price_monthly' => $p->price_monthly,
            'price_yearly' => $p->price_yearly,
            'setup_fee' => $p->setup_fee,
            'billing_cycle' => $p->billing_cycle,
            'billing_cycle_months' => $p->billing_cycle_months,
            'currency' => $p->currency,
            'trial_days' => $p->trial_days,
            'is_active' => $p->is_active,
            'is_public' => $p->is_public,
            'sort_order' => $p->sort_order,
            'features' => $p->features ?? [],
            'limits' => $p->limits ?? [],
            'tenants_count' => $p->tenants_count ?? 0,
        ];
    }
}