<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ProvisionHospital;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Support\Features;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/Onboarding', [
            'plans' => Plan::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'description' => $p->description,
                    'billing_cycle' => $p->billing_cycle,
                    'billing_cycle_months' => $p->billing_cycle_months,
                    'price_yearly' => $p->price_yearly,
                    'price_monthly' => $p->price_monthly,
                    'setup_fee' => $p->setup_fee,
                    'currency' => $p->currency,
                    'trial_days' => $p->trial_days,
                    'features' => $p->features ?? [],
                ])
                ->all(),
            'catalog' => Features::catalog(),
        ]);
    }

    public function store(Request $request, ProvisionHospital $provision): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'plan_id' => ['required', 'exists:plans,id'],
            'admin_name' => ['required', 'string', 'max:120'],
            'admin_email' => ['required', 'email', 'max:150'],
            'admin_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $tenant = $provision->execute($data);

        return redirect()
            ->route('admin.hospitals.index')
            ->with('success', "Hospital \"{$tenant->name}\" onboarded successfully.");
    }
}