<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function index(): Response
    {
        $admins = SuperAdmin::query()
            ->orderByRaw("CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END")
            ->orderBy('name')
            ->get()
            ->map(fn (SuperAdmin $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'email' => $a->email,
                'role' => $a->role,
                'is_active' => $a->is_active,
                'last_login_at' => $a->last_login_at?->toIso8601String(),
                'created_at' => $a->created_at?->toIso8601String(),
                'is_self' => $a->id === Auth::guard('super_admin')->id(),
            ])
            ->all();

        return Inertia::render('admin/SuperAdmins', [
            'admins' => $admins,
            'canManage' => Auth::guard('super_admin')->user()?->isOwner() ?? false,
            'stats' => [
                'total' => count($admins),
                'owners' => collect($admins)->where('role', 'owner')->count(),
                'active' => collect($admins)->where('is_active', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireOwner();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:super_admins,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', Rule::in(['owner', 'admin', 'viewer'])],
            'is_active' => ['boolean'],
        ]);

        $data['created_by'] = Auth::guard('super_admin')->id();

        $admin = SuperAdmin::create($data);

        AuditLogger::log('super_admin.created', [
            'id' => $admin->id,
            'email' => $admin->email,
            'role' => $admin->role,
        ]);

        return back()->with('success', "{$admin->name} added as {$admin->role}.");
    }

    public function update(Request $request, SuperAdmin $superAdmin): RedirectResponse
    {
        $this->requireOwner();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', Rule::unique('super_admins')->ignore($superAdmin->id)],
            'role' => ['required', Rule::in(['owner', 'admin', 'viewer'])],
            'is_active' => ['boolean'],
        ]);

        // Protect the last owner
        if ($superAdmin->role === 'owner' && ($data['role'] !== 'owner' || ! $data['is_active'])) {
            $otherOwners = SuperAdmin::where('role', 'owner')
                ->where('id', '!=', $superAdmin->id)
                ->where('is_active', true)
                ->count();
            if ($otherOwners === 0) {
                return back()->withErrors([
                    'role' => 'Cannot demote or deactivate the last active owner.',
                ]);
            }
        }

        $superAdmin->update($data);

        AuditLogger::log('super_admin.updated', [
            'id' => $superAdmin->id,
            'role' => $superAdmin->role,
        ], $superAdmin);

        return back()->with('success', "{$superAdmin->name} updated.");
    }

    public function destroy(SuperAdmin $superAdmin): RedirectResponse
    {
        $this->requireOwner();

        if ($superAdmin->id === Auth::guard('super_admin')->id()) {
            return back()->withErrors(['delete' => 'You cannot delete yourself.']);
        }

        if ($superAdmin->role === 'owner') {
            $otherOwners = SuperAdmin::where('role', 'owner')
                ->where('id', '!=', $superAdmin->id)
                ->count();
            if ($otherOwners === 0) {
                return back()->withErrors(['delete' => 'Cannot delete the last owner.']);
            }
        }

        $name = $superAdmin->name;
        $id = $superAdmin->id;
        $superAdmin->delete();

        AuditLogger::log('super_admin.deleted', ['id' => $id, 'name' => $name]);

        return back()->with('success', "{$name} removed.");
    }

    private function requireOwner(): void
    {
        if (! Auth::guard('super_admin')->user()?->isOwner()) {
            abort(403, 'Only owners can manage super admins.');
        }
    }
}
