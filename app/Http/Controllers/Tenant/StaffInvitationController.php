<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\StaffInvitation;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StaffInvitationController extends Controller
{
    /**
     * Public. No auth — the token IS the credential.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = StaffInvitation::with('user')
            ->where('token', $token)
            ->first();

        if (! $invitation) {
            return Inertia::render('auth/InvitationInvalid', [
                'reason' => 'not_found',
            ]);
        }

        if (! $invitation->isValid()) {
            return Inertia::render('auth/InvitationInvalid', [
                'reason' => $invitation->accepted_at !== null
                    ? 'accepted'
                    : 'expired',
            ]);
        }

        return Inertia::render('auth/AcceptInvitation', [
            'token' => $token,
            'user' => [
                'name' => $invitation->user->name,
                'email' => $invitation->user->email,
            ],
            'hospital' => tenant()?->name,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $invitation = StaffInvitation::with('user')
            ->where('token', $token)
            ->first();

        if (! $invitation || ! $invitation->isValid()) {
            return back()->with(
                'error',
                'This invitation has expired or has already been used.',
            );
        }

        $invitation->user->update([
            'password' => Hash::make($data['password']),
        ]);

        $invitation->update(['accepted_at' => now()]);

        AuditLogger::log('staff.invitation.accepted', [
            'user_id' => $invitation->user->id,
            'email' => $invitation->user->email,
        ], $invitation->user);

        return redirect()
            ->route('login')
            ->with(
                'success',
                'Password set. Sign in with your email and password to continue.',
            );
    }
}