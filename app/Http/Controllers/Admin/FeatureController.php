<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Support\AuditLogger;
use App\Support\Features;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeatureController extends Controller
{
    public function index(): Response
    {
        $catalog = Features::catalog();
        $plans = Plan::orderBy('sort_order')->get();
        $tenants = Tenant::with('plan')->get();

        $features = [];
        foreach ($catalog as $groupKey => $group) {
            foreach ($group['features'] as $key => $label) {
                $plansWith = $plans
                    ->filter(fn (Plan $p) => in_array($key, $p->features ?? [], true))
                    ->pluck('id')
                    ->all();

                $tenantsUsing = $tenants
                    ->filter(fn (Tenant $t) => $t->hasFeature($key))
                    ->count();

                $tenantsOverriding = $tenants
                    ->filter(fn (Tenant $t) => array_key_exists($key, $t->feature_overrides ?? []))
                    ->count();

                $features[] = [
                    'key' => $key,
                    'label' => $label,
                    'group' => $groupKey,
                    'group_label' => $group['label'],
                    'plans_with' => $plansWith,
                    'tenants_using' => $tenantsUsing,
                    'tenants_overriding' => $tenantsOverriding,
                ];
            }
        }

        return Inertia::render('admin/FeatureFlags', [
            'catalog' => $catalog,
            'features' => $features,
            'plans' => $plans
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'features' => $p->features ?? [],
                ])
                ->all(),
            'stats' => [
                'total_features' => count($features),
                'total_plans' => $plans->count(),
                'total_tenants' => $tenants->count(),
                'tenants_with_overrides' => $tenants
                    ->filter(fn (Tenant $t) => ! empty($t->feature_overrides))
                    ->count(),
            ],
        ]);
    }

    public function togglePlan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'feature_key' => ['required', 'string'],
            'enabled' => ['required', 'boolean'],
        ]);

        if (! in_array($data['feature_key'], Features::allKeys(), true)) {
            abort(422, 'Unknown feature key.');
        }

        $plan = Plan::findOrFail($data['plan_id']);
        $features = $plan->features ?? [];

        if ($data['enabled']) {
            if (! in_array($data['feature_key'], $features, true)) {
                $features[] = $data['feature_key'];
            }
        } else {
            $features = array_values(array_filter(
                $features,
                fn ($f) => $f !== $data['feature_key'],
            ));
        }

        $plan->features = $features;
        $plan->save();

        AuditLogger::log('plan.feature.toggled', [
            'plan_id' => $plan->id,
            'feature' => $data['feature_key'],
            'enabled' => $data['enabled'],
        ], $plan);

        return back();
    }

    public function bulkToggle(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'plan_ids' => ['required', 'array'],
            'plan_ids.*' => ['integer', 'exists:plans,id'],
            'feature_key' => ['required', 'string'],
            'enabled' => ['required', 'boolean'],
        ]);

        if (! in_array($data['feature_key'], Features::allKeys(), true)) {
            abort(422, 'Unknown feature key.');
        }

        foreach (Plan::whereIn('id', $data['plan_ids'])->get() as $plan) {
            $features = $plan->features ?? [];

            if ($data['enabled']) {
                if (! in_array($data['feature_key'], $features, true)) {
                    $features[] = $data['feature_key'];
                }
            } else {
                $features = array_values(array_filter(
                    $features,
                    fn ($f) => $f !== $data['feature_key'],
                ));
            }

            $plan->features = $features;
            $plan->save();
        }

        AuditLogger::log('plan.features.bulk_toggled', [
            'plan_ids' => $data['plan_ids'],
            'feature' => $data['feature_key'],
            'enabled' => $data['enabled'],
        ]);

        return back();
    }
}