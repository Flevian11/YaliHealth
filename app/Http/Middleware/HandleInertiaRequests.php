<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Support\Features;
use App\Support\TenantPermissions;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $tenant = tenant();
        $superAdmin = $request->user('super_admin');
        $tenantUser = $tenant ? $request->user() : null;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $superAdmin ?? $tenantUser,
            ],
            'theme' => fn () => Setting::theme(),
            'features' => fn () => $tenant ? Features::for($tenant) : null,
            'tenant_permissions' => fn () => $tenantUser
                ? TenantPermissions::forRole($tenantUser->role)
                : [],
            'tenant_role' => fn () => $tenantUser?->role,
            'hospital' => fn () => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name ?? $tenant->id,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}