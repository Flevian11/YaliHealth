<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(): Response
    {
        $admin = Auth::guard('super_admin')->user();

        $activity = AuditLog::where('actor_type', get_class($admin))
            ->where('actor_id', $admin->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'event', 'ip_address', 'created_at'])
            ->map(fn ($l) => [
                'id' => $l->id,
                'event' => $l->event,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at->toIso8601String(),
            ])
            ->all();

        return Inertia::render('admin/Profile', [
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'role_name' => $admin->roleModel()?->name ?? $admin->role,
                'permissions' => $admin->permissions(),
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at?->toIso8601String(),
                'created_at' => $admin->created_at?->toIso8601String(),
            ],
            'activity' => $activity,
            'catalog' => \App\Models\Role::catalog(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $admin = Auth::guard('super_admin')->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', Rule::unique('super_admins')->ignore($admin->id)],
        ]);

        $admin->update($data);

        AuditLogger::log('profile.updated', [
            'name' => $admin->name,
            'email' => $admin->email,
        ], $admin);

        return back()->with('success', 'Profile updated.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $admin = Auth::guard('super_admin')->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($data['current_password'], $admin->password)) {
            return back()->withErrors([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $admin->update(['password' => $data['password']]);

        AuditLogger::log('profile.password.changed', [], $admin);

        return back()->with('success', 'Password changed.');
    }
}