import { usePage } from '@inertiajs/react';

export function useFeatures() {
    const { features } = usePage<{ features?: Record<string, boolean> }>().props;

    const has = (key: string): boolean => features?.[key] === true;

    return {
        features: features ?? {},
        has,
        any: (keys: string[]) => keys.some(has),
        all: (keys: string[]) => keys.every(has),
    };
}