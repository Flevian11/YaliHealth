<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\LoginHandoffService;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdoptSessionController extends Controller
{
    public function __invoke(
        Request $request,
        string $token,
        LoginHandoffService $handoff,
    ): RedirectResponse {
        $tenant = tenant();

        if (! $tenant) {
            abort(400, 'No tenant context.');
        }

        $record = $handoff->consume($token, $tenant->id);

        if (! $record) {
            return redirect()
                ->route('login')
                ->with('status', 'That sign-in link has expired or already been used. Please sign in again.');
        }

        $user = User::find($record->user_id);

        if (! $user) {
            return redirect()
                ->route('login')
                ->with('status', 'We could not find your account in this hospital. Please sign in again.');
        }

        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();

        AuditLogger::log('auth.login.cross_domain_adopted', [
            'user_id' => $user->id,
            'email' => $user->email,
            'tenant_id' => $tenant->id,
        ], $user);

        return redirect()->intended(route('tenant.dashboard'));
    }
}