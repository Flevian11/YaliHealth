import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<{
        auth?: { permissions?: string[] };
    }>().props;

    const perms = auth?.permissions ?? [];

    const can = (key: string): boolean => perms.includes(key);

    return {
        permissions: perms,
        can,
        any: (keys: string[]) => keys.some(can),
        all: (keys: string[]) => keys.every(can),
    };
}