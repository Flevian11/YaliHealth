<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_hospitals' => Tenant::count(),
                'active_hospitals' => Tenant::whereRaw("data->>'status' = 'active'")->count(),
                'recent' => Tenant::with('domains')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
                    ->map(fn ($t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'domain' => $t->domains->first()?->domain,
                        'created_at' => $t->created_at?->toIso8601String(),
                    ])
                    ->all(),
            ],
        ]);
    }
}