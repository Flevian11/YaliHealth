<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StaffAccessController extends Controller
{
    public function show(): Response
    {
        $tenant = tenant();

        return Inertia::render('auth/request-access', [
            'hospitalName' => $tenant?->name ?? $tenant?->id ?? 'Your hospital',
            'adminName' => $tenant?->admin_name,
            'adminEmail' => $tenant?->admin_email,
            'adminPhone' => $tenant?->phone,
        ]);
    }
}