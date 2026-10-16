<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AuditLogger;
use App\Support\TenantPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Mail\StaffInvitationMail;
use App\Models\StaffInvitation;
use Illuminate\Support\Facades\Mail;


class StaffController extends Controller
{
    /* ═══════════════════════════════════════════════════
       INDEX
       ═══════════════════════════════════════════════════ */

    public function index(Request $request): Response
    {
        $role   = trim((string) $request->input('role', ''));
        $query  = trim((string) $request->input('q', ''));
        $status = trim((string) $request->input('status', ''));

        $users = User::query()
            ->when($role !== '', fn($q) => $q->where('role', $role))
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('name', 'ILIKE', "%{$query}%")
                        ->orWhere('email', 'ILIKE', "%{$query}%");
                });
            })
            ->when($status === 'active', fn($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn($q) => $q->where('is_active', false))
            ->when($status === 'invited', fn($q) => $q
                ->whereNotNull('invited_at')
                ->whereNull('last_login_at'))
            ->orderByRaw("CASE WHEN role = 'hospital_admin' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn(User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'role_label' => TenantPermissions::roleLabel($u->role),
                'role_tone' => TenantPermissions::roleTone($u->role),
                'is_active' => $u->isActive(),
                'status' => $u->status(),
                'last_login_at' => $u->last_login_at?->toIso8601String(),
                'last_login_ip' => $u->last_login_ip,
                'invited_at' => $u->invited_at?->toIso8601String(),
                'created_at' => $u->created_at?->toIso8601String(),
                'is_self' => $u->id === auth()->id(),
            ]);

        return Inertia::render('tenant/Staff', [
            'users' => $users,
            'filters' => [
                'q' => $query,
                'role' => $role,
                'status' => $status,
            ],
            'roleOptions' => TenantPermissions::roleOptions(),
            'roleTones' => collect(TenantPermissions::roleOptions())
                ->mapWithKeys(fn($label, $slug) => [$slug => TenantPermissions::roleTone($slug)])
                ->all(),
        ]);
    }



    /* ═══════════════════════════════════════════════════
       UPDATE ROLE
       ═══════════════════════════════════════════════════ */

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', array_keys(TenantPermissions::roleOptions()))],
        ]);

        if ($user->id === auth()->id() && $user->role === 'hospital_admin' && $data['role'] !== 'hospital_admin') {
            return back()->with('error', 'You cannot demote yourself. Ask another administrator to do it.');
        }

        $this->assertAtLeastOneAdminRemains(
            removingAdmin: $user->role === 'hospital_admin' && $data['role'] !== 'hospital_admin',
            deactivating: false,
            targetUserId: $user->id,
        );

        $previous = $user->role;
        $user->update(['role' => $data['role']]);

        AuditLogger::log('staff.role.changed', [
            'user_id' => $user->id,
            'email' => $user->email,
            'from' => $previous,
            'to' => $data['role'],
        ], $user);

        return back()->with(
            'success',
            "{$user->name} is now a " . TenantPermissions::roleLabel($data['role']) . '.',
        );
    }

    /* ═══════════════════════════════════════════════════
       TOGGLE ACTIVE
       ═══════════════════════════════════════════════════ */

    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $willDeactivate = $user->is_active;

        $this->assertAtLeastOneAdminRemains(
            removingAdmin: false,
            deactivating: $willDeactivate && $user->role === 'hospital_admin',
            targetUserId: $user->id,
        );

        $user->update(['is_active' => ! $willDeactivate]);

        AuditLogger::log(
            $willDeactivate ? 'staff.deactivated' : 'staff.activated',
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            $user,
        );

        return back()->with(
            'success',
            $willDeactivate
                ? "{$user->name} deactivated."
                : "{$user->name} reactivated.",
        );
    }

    /* ═══════════════════════════════════════════════════
       STORE — invite a staff member
       ═══════════════════════════════════════════════════ */

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'role' => ['required', 'string', 'in:' . implode(',', array_keys(TenantPermissions::roleOptions()))],
        ]);

        $user = DB::transaction(function () use ($data) {
            return User::create([
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'password' => Hash::make(Str::random(48)),
                'role' => $data['role'],
                'is_active' => true,
                'invited_by' => auth()->id(),
                'invited_at' => now(),
                'email_verified_at' => now(),
            ]);
        });

        $this->sendInvitation($user);

        AuditLogger::log('staff.invited', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
        ], $user);

        return back()->with(
            'success',
            "Invitation sent to {$user->email}.",
        );
    }

    /* ═══════════════════════════════════════════════════
       RESEND INVITATION
       ═══════════════════════════════════════════════════ */

    public function sendReset(User $user): RedirectResponse
    {
        $this->sendInvitation($user);

        AuditLogger::log('staff.invitation.resent', [
            'user_id' => $user->id,
            'email' => $user->email,
        ], $user);

        return back()->with(
            'success',
            "New invitation sent to {$user->email}.",
        );
    }

    /* ═══════════════════════════════════════════════════
       Internals
       ═══════════════════════════════════════════════════ */

    /**
     * Generate a fresh invitation token and email it to the user.
     * Any previous un-accepted invitation is invalidated.
     */
    private function sendInvitation(User $user): StaffInvitation
    {
        // Invalidate any prior un-accepted invitations for this user.
        StaffInvitation::where('user_id', $user->id)
            ->whereNull('accepted_at')
            ->delete();

        $invitation = StaffInvitation::create([
            'token' => Str::random(64),
            'user_id' => $user->id,
            'invited_by' => auth()->id(),
            'expires_at' => now()->addDays(7),
        ]);

        $acceptUrl = route('staff.accept', ['token' => $invitation->token]);

        \Illuminate\Support\Facades\Mail::to($user->email)->send(
            new \App\Mail\StaffInvitationMail(
                user: $user,
                invitation: $invitation,
                acceptUrl: $acceptUrl,
                hospitalName: tenant()?->name ?? 'Hospital',
                invitedByName: auth()->user()?->name ?? 'An administrator',
            ),
        );

        return $invitation;
    }

    /**
     * Prevent the hospital from ending up with zero active admins.
     */
    /* ═══════════════════════════════════════════════════
       Internals
       ═══════════════════════════════════════════════════ */

    private function assertAtLeastOneAdminRemains(
        bool $removingAdmin,
        bool $deactivating,
        int $targetUserId,
    ): void {
        if (! $removingAdmin && ! $deactivating) {
            return;
        }

        $remaining = User::query()
            ->where('role', 'hospital_admin')
            ->where('is_active', true)
            ->where('id', '!=', $targetUserId)
            ->count();

        if ($remaining === 0) {
            abort(422, 'This hospital must always have at least one active administrator.');
        }
    }
}
