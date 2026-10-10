import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Building2,
    LogIn,
    LogOut,
    Search,
    ShieldAlert,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Log = {
    id: number;
    event: string;
    actor_email: string | null;
    actor_type: string | null;
    ip_address: string | null;
    created_at: string;
    metadata: Record<string, any> | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

function eventStyle(event: string) {
    if (event.includes('failed'))
        return {
            Icon: ShieldAlert,
            wrap: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        };
    if (event.includes('login') && !event.includes('logout'))
        return {
            Icon: LogIn,
            wrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        };
    if (event.includes('logout'))
        return {
            Icon: LogOut,
            wrap: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        };
    if (event.includes('hospital'))
        return {
            Icon: Building2,
            wrap: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        };
    return {
        Icon: Activity,
        wrap: 'bg-muted text-muted-foreground',
    };
}

function eventLabel(event: string): string {
    const map: Record<string, string> = {
        'auth.login': 'Signed in',
        'auth.logout': 'Signed out',
        'auth.failed': 'Failed sign-in',
        'hospital.created': 'Hospital created',
        'hospital.deleted': 'Hospital deleted',
        'hospital.suspended': 'Hospital suspended',
        'hospital.activated': 'Hospital activated',
        'hospital.admin.created': 'Admin added',
    };
    return map[event] ?? event;
}

function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });
}

function fullTime(iso: string): string {
    return new Date(iso).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function AuditLogs({
    logs,
    events,
    stats,
    filters,
}: {
    logs: Paginator<Log>;
    events: string[];
    stats: { total: number; logins: number; logouts: number; failed: number };
    filters: { q: string; event: string };
}) {
    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/audit-logs',
                { q: query, event: filters.event || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['logs', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const setEventFilter = (e: string) => {
        router.get(
            '/admin/audit-logs',
            { q: filters.q || undefined, event: e || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['logs', 'filters'],
            },
        );
    };

    const clearFilters = () => {
        setQuery('');
        router.get(
            '/admin/audit-logs',
            {},
            { preserveState: true, replace: true },
        );
    };

    const hasFilters = !!(filters.q || filters.event);

    return (
        <>
            <Head title="Audit Logs" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Audit logs</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Every authentication and system event, most recent first
                </p>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Total events" value={stats.total} icon={Activity} tint="slate" />
                <StatTile label="Sign-ins" value={stats.logins} icon={LogIn} tint="emerald" />
                <StatTile label="Sign-outs" value={stats.logouts} icon={LogOut} tint="slate" />
                <StatTile label="Failed" value={stats.failed} icon={ShieldAlert} tint="rose" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search email, IP, or event..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-9 w-full rounded-lg border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <FilterPill
                        active={filters.event === ''}
                        onClick={() => setEventFilter('')}
                    >
                        All
                    </FilterPill>
                    {events.map((e) => (
                        <FilterPill
                            key={e}
                            active={filters.event === e}
                            onClick={() => setEventFilter(e)}
                        >
                            {eventLabel(e)}
                        </FilterPill>
                    ))}
                </div>
            </div>

            {logs.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        {hasFilters ? 'No matching events' : 'No activity yet'}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {hasFilters
                            ? 'Try clearing the filters or search query.'
                            : 'Sign-ins, sign-outs, and system events will appear here.'}
                    </p>
                    {hasFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Event</th>
                                        <th className="px-5 py-3 font-semibold">Actor</th>
                                        <th className="px-5 py-3 font-semibold">IP address</th>
                                        <th className="px-5 py-3 font-semibold">When</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logs.data.map((l) => {
                                        const { Icon, wrap } = eventStyle(l.event);
                                        return (
                                            <tr
                                                key={l.id}
                                                className="transition hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${wrap}`}
                                                        >
                                                            <Icon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {eventLabel(l.event)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm">
                                                            {l.actor_email ?? 'System'}
                                                        </p>
                                                        {l.actor_type && (
                                                            <p className="truncate text-[11px] text-muted-foreground">
                                                                {l.actor_type.split('\\').pop()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                                                        {l.ip_address ?? '—'}
                                                    </code>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className="text-xs text-muted-foreground"
                                                        title={fullTime(l.created_at)}
                                                    >
                                                        {relativeTime(l.created_at)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={logs.current_page}
                        lastPage={logs.last_page}
                        total={logs.total}
                        perPage={logs.per_page}
                        baseUrl="/admin/audit-logs"
                        filters={{ q: filters.q, event: filters.event }}
                    />
                </>
            )}
        </>
    );
}

function StatTile({
    label,
    value,
    icon: Icon,
    tint,
}: {
    label: string;
    value: number;
    icon: any;
    tint: 'slate' | 'emerald' | 'rose';
}) {
    const tints: Record<string, string> = {
        slate: 'bg-muted text-muted-foreground',
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tints[tint]}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {value.toLocaleString()}
            </p>
        </Card>
    );
}

function FilterPill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}