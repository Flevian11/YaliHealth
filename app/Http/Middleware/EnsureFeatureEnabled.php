<?php

namespace App\Http\Middleware;

use App\Support\Features;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureEnabled
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $tenant = tenant();

        if (! $tenant) {
            abort(403, 'Feature check requires a tenant context.');
        }

        if (! Features::enabledFor($tenant, $feature)) {
            abort(403, "Your plan does not include: " . Features::label($feature));
        }

        return $next($request);
    }
}