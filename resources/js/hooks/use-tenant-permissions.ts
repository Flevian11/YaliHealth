import { usePage } from '@inertiajs/react';

export function useTenantPermissions() {
    const { tenant_permissions, tenant_role } = usePage<{
        tenant_permissions?: string[];
        tenant_role?: string;
    }>().props;

    const perms = tenant_permissions ?? [];

    const can = (key: string): boolean => perms.includes(key);

    return {
        permissions: perms,
        role: tenant_role,
        can,
        any: (keys: string[]) => keys.some(can),
        all: (keys: string[]) => keys.every(can),
    };
}