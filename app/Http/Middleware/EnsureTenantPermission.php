<?php

namespace App\Http\Middleware;

use App\Support\TenantPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantPermission
{
    /**
     * Usage in routes:
     *   ->middleware('tenant.perm:staff.manage')
     *
     * Checks the authenticated tenant user against the given permission
     * key from config/tenant_permissions.php. Aborts with 403 on failure.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if (! TenantPermissions::can($user, $permission)) {
            abort(403, "You do not have permission to access this area ({$permission}).");
        }

        return $next($request);
    }
}