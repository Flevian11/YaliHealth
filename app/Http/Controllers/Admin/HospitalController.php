<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ProvisionHospital;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHospitalRequest;
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

        $paginator = Tenant::query()
            ->with('domains')
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
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Tenant $t) => $this->serialize($t));

        return Inertia::render('admin/Hospitals', [
            'hospitals' => $paginator,
            'filters' => ['q' => $query, 'status' => $status],
            'tenantBase' => env('TENANCY_TENANT_SUFFIX', 'localhost'),
            'stats' => [
                'total' => Tenant::count(),
                'active' => Tenant::whereRaw("data->>'status' = 'active'")->count(),
                'suspended' => Tenant::whereRaw("data->>'status' = 'suspended'")->count(),
            ],
        ]);
    }

    public function store(StoreHospitalRequest $request, ProvisionHospital $provision): RedirectResponse
    {
        $tenant = $provision->execute($request->validated());

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
        ];
    }
}