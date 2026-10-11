<?php

namespace App\Http\Middleware;

use App\Models\Setting;
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
                return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user() ?? $request->user('super_admin'),
            ],
            'theme' => fn () => Setting::theme(),
            'features' => function () {
                $tenant = tenant();
                return $tenant ? \App\Support\Features::for($tenant) : null;
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
                        'auth' => [
                'user' => $request->user() ?? $request->user('super_admin'),
                'permissions' => function () use ($request) {
                    $admin = $request->user('super_admin');
                    return $admin ? $admin->permissions() : [];
                },
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}