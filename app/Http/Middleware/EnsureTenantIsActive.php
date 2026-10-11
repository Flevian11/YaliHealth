<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = tenant();

        if (! $tenant) {
            return $next($request);
        }

        if (! $tenant->isActive()) {
            abort(403, 'This hospital account has been suspended. Contact your administrator.');
        }

        if (! $tenant->isSubscriptionActive()) {
            abort(402, 'This hospital\'s subscription has expired or is inactive. Please contact the platform administrator.');
        }

        return $next($request);
    }
}