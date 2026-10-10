<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ProvisionHospital;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHospitalRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class HospitalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/hospitals/index', [
            'hospitals' => $this->serializeAll(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/hospitals/create');
    }

    public function store(StoreHospitalRequest $request, ProvisionHospital $provision): RedirectResponse
    {
        try {
            $tenant = $provision->execute($request->validated());
        } catch (RuntimeException $e) {
            return back()->withErrors(['name' => $e->getMessage()])->withInput();
        }

        return redirect()
            ->route('admin.hospitals.show', $tenant->id)
            ->with('success', "Hospital \"{$tenant->name}\" created successfully.");
    }

    public function show(string $id): Response
    {
        $tenant = Tenant::with('domains')->findOrFail($id);

        return Inertia::render('admin/hospitals/show', [
            'hospital' => $this->serialize($tenant),
            'tenantBase' => env('TENANCY_TENANT_SUFFIX', 'localhost'),
        ]);
    }

    private function serializeAll(): array
    {
        return Tenant::with('domains')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Tenant $t) => $this->serialize($t))
            ->all();
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
        ];
    }
}