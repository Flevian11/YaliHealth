import { useEffect, useState } from 'react';

/**
 * Returns a relative time string that only renders after mount.
 * Never uses locale-dependent formatting, so server and client
 * always agree on the initial HTML.
 */
export function useRelativeTime(iso: string | null, fallback = '—'): string {
    const [label, setLabel] = useState(fallback);

    useEffect(() => {
        if (!iso) {
            setLabel(fallback);
            return;
        }

        const compute = () => {
            const diff = Math.floor(
                (Date.now() - new Date(iso).getTime()) / 1000,
            );
            if (diff < 10) return 'just now';
            if (diff < 60) return `${diff}s ago`;
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
            if (diff < 2592000)
                return `${Math.floor(diff / 604800)}w ago`;
            if (diff < 31536000)
                return `${Math.floor(diff / 2592000)}mo ago`;
            return `${Math.floor(diff / 31536000)}y ago`;
        };

        setLabel(compute());
        const interval = window.setInterval(
            () => setLabel(compute()),
            60000,
        );
        return () => window.clearInterval(interval);
    }, [iso, fallback]);

    return label;
}