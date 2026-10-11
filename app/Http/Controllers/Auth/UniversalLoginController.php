<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\LoginHandoffService;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UniversalLoginController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => false,
            'status' => session('status'),
        ]);
    }

    public function authenticate(
        Request $request,
        LoginHandoffService $handoff,
    ): Response {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $match = $this->findTenantForEmail($data['email']);

        if (! $match || ! Hash::check($data['password'], $match['user']->password)) {
            throw ValidationException::withMessages([
                'email' => 'We could not find an account with those credentials.',
            ]);
        }

        /** @var Tenant $tenant */
        $tenant = $match['tenant'];
        /** @var User $user */
        $user = $match['user'];

        $subdomain = $tenant->domains()->first()?->domain;

        if (! $subdomain) {
            throw ValidationException::withMessages([
                'email' => 'This hospital is not fully provisioned yet. Contact support.',
            ]);
        }

        // Create a one-time, short-lived token in the central DB
        $token = $handoff->create(
            $user->id,
            $tenant->id,
            $request->ip(),
        );

        // Build the target URL from the current request
        $suffix = env('TENANCY_TENANT_SUFFIX', 'localhost');
        $scheme = $request->getScheme();
        $port = $request->getPort();
        $portPart = in_array($port, [80, 443], true) ? '' : ":{$port}";

        $targetUrl = "{$scheme}://{$subdomain}.{$suffix}{$portPart}/auth/adopt/{$token}";

        AuditLogger::log('auth.login.cross_domain_issued', [
            'user_id' => $user->id,
            'email' => $user->email,
            'tenant_id' => $tenant->id,
            'token' => substr($token, 0, 8) . '…',
        ], $user);

        // Render a loading screen. The page navigates to $targetUrl
        // after a brief pause so the user sees a clean transition.
        return Inertia::render('auth/redirecting', [
            'target' => $targetUrl,
            'hospital' => $tenant->name ?? $tenant->id,
            'userName' => $user->name,
        ]);
    }

    private function findTenantForEmail(string $email): ?array
    {
        foreach (Tenant::all() as $tenant) {
            try {
                $user = $tenant->run(
                    fn () => User::where('email', $email)->first()
                );
            } catch (\Throwable) {
                continue;
            }

            if ($user) {
                return ['tenant' => $tenant, 'user' => $user];
            }
        }

        return null;
    }
}