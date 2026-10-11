<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdminHasPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $admin = $request->user('super_admin');

        if (! $admin) {
            abort(403, 'Authentication required.');
        }

        if (! $admin->is_active) {
            abort(403, 'Your account is inactive.');
        }

        foreach ($permissions as $key) {
            if (! $admin->hasPermission($key)) {
                abort(403, "Missing permission: {$key}");
            }
        }

        return $next($request);
    }
}