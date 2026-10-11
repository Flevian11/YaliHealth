<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\SuperAdmin;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $r) => [
                'id' => $r->id,
                'slug' => $r->slug,
                'name' => $r->name,
                'description' => $r->description,
                'permissions' => $r->permissions ?? [],
                'is_system' => $r->is_system,
                'sort_order' => $r->sort_order,
                'users_count' => SuperAdmin::where('role', $r->slug)->count(),
            ])
            ->all();

        return Inertia::render('admin/Roles', [
            'roles' => $roles,
            'catalog' => Role::catalog(),
            'stats' => [
                'total' => count($roles),
                'system' => collect($roles)->where('is_system', true)->count(),
                'custom' => collect($roles)->where('is_system', false)->count(),
                'total_permissions' => count(Role::allPermissionKeys()),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRole($request);

        $role = Role::create($data);

        AuditLogger::log('role.created', [
            'id' => $role->id,
            'slug' => $role->slug,
        ], $role);

        return back()->with('success', "Role \"{$role->name}\" created.");
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $data = $this->validateRole($request, $role);

        // Prevent changing the slug of a system role
        if ($role->is_system) {
            unset($data['slug']);
        }

        $role->update($data);

        AuditLogger::log('role.updated', [
            'id' => $role->id,
            'slug' => $role->slug,
        ], $role);

        return back()->with('success', "Role \"{$role->name}\" updated.");
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return back()->withErrors(['role' => 'System roles cannot be deleted.']);
        }

        if ($role->users_count > 0) {
            return back()->withErrors(['role' => 'Reassign users before deleting this role.']);
        }

        $name = $role->name;
        $id = $role->id;
        $role->delete();

        AuditLogger::log('role.deleted', ['id' => $id, 'name' => $name]);

        return back()->with('success', "Role \"{$name}\" deleted.");
    }

    private function validateRole(Request $request, ?Role $role = null): array
    {
        $slug = $request->input('slug') ?: Str::slug($request->input('name'));

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'max:60',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('roles', 'slug')->ignore($role?->id),
            ],
            'description' => ['nullable', 'string', 'max:300'],
            'permissions' => ['array'],
            'permissions.*' => ['string'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $data['slug'] = $slug;
        $data['permissions'] = array_values(array_unique($data['permissions'] ?? []));
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }
}