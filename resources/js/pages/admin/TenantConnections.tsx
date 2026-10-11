import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    LoaderCircle,
    Plug,
    RefreshCw,
    Search,
    ShieldAlert,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ConnectionSummary = {
    id: number;
    environment: string;
    status: 'healthy' | 'failing' | 'incomplete' | 'unverified' | 'inactive';
    is_ready: boolean;
    last_verified_at: string | null;
    last_verified_status: string | null;
    last_verified_latency_ms: number | null;
    last_verified_error: string | null;
    facility_fr_code: string | null;
    facility_name: string | null;
};

type Row = {
    tenant_id: string;
    name: string;
    plan: string | null;
    subscription_status: string;
    connection: ConnectionSummary | null;
};

type Stats = {
    total: number;
    healthy: number;
    failing: number;
    incomplete: number;
    unverified: number;
    not_configured: number;
    inactive: number;
};

function statusMeta(status: string) {
    return {
        healthy: {
            label: 'Healthy',
            Icon: CheckCircle2,
            tint: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        failing: {
            label: 'Failing',
            Icon: ShieldAlert,
            tint: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        },
        incomplete: {
            label: 'Incomplete',
            Icon: AlertTriangle,
            tint: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        },
        unverified: {
            label: 'Not tested',
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        inactive: {
            label: 'Disabled',
            Icon: WifiOff,
            tint: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        not_configured: {
            label: 'Not configured',
            Icon: WifiOff,
            tint: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        },
    }[status] ?? {
        label: status,
        Icon: AlertTriangle,
        tint: 'bg-muted text-muted-foreground',
    };
}

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <span>{label}</span>;
}

export default function TenantConnections({
    connections,
    filters,
    stats,
}: {
    connections: Row[];
    filters: { q: string; status: string };
    stats: Stats;
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();

    const [query, setQuery] = useState(filters.q ?? '');
    const [testingAll, setTestingAll] = useState(false);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/tenant-connections',
                {
                    q: query,
                    status: filters.status || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['connections', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const applyFilter = (value: string) => {
        router.get(
            '/admin/tenant-connections',
            {
                q: filters.q || undefined,
                status: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['connections', 'filters'],
            },
        );
    };

    const testAll = () => {
        setTestingAll(true);
        router.post(
            '/admin/tenant-connections/test-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setTestingAll(false),
            },
        );
    };

    const coverage = stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0;

    return (
        <>
            <Head title="Tenant Connections" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Tenant Connections
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        HIE credentials and connection health for every hospital.
                    </p>
                </div>
                {can('settings.edit') && (
                    <Button onClick={testAll} disabled={testingAll}>
                        {testingAll ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-1.5 h-4 w-4" />
                        )}
                        {testingAll ? 'Testing...' : 'Test all connections'}
                    </Button>
                )}
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {props.errors?.test && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {props.errors.test}
                </div>
            )}

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatTile
                    label="Total hospitals"
                    value={stats.total}
                    icon={Building2}
                    tint="slate"
                    sub={`${stats.not_configured} not configured`}
                />
                <StatTile
                    label="Healthy"
                    value={stats.healthy}
                    icon={CheckCircle2}
                    tint="emerald"
                    sub={`${coverage}% of all`}
                />
                <StatTile
                    label="Failing"
                    value={stats.failing}
                    icon={ShieldAlert}
                    tint="rose"
                    sub={`${stats.incomplete} incomplete`}
                />
                <StatTile
                    label="Not tested"
                    value={stats.unverified}
                    icon={Clock}
                    tint="amber"
                    sub={`${stats.inactive} disabled`}
                />
            </div>

            {/* Filter pills */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search hospital name or ID..."
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
                    {[
                        { v: '', label: 'All' },
                        { v: 'healthy', label: 'Healthy' },
                        { v: 'failing', label: 'Failing' },
                        { v: 'incomplete', label: 'Incomplete' },
                        { v: 'unverified', label: 'Not tested' },
                        { v: 'not_configured', label: 'Not configured' },
                    ].map(({ v, label }) => (
                        <button
                            key={v || 'all'}
                            onClick={() => applyFilter(v)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                (filters.status || '') === v
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {connections.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Plug className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        No connections match
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Try clearing the search or filter.
                    </p>
                </div>
            ) : (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Hospital</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="hidden px-5 py-3 font-semibold md:table-cell">Environment</th>
                                    <th className="hidden px-5 py-3 font-semibold lg:table-cell">Facility</th>
                                    <th className="hidden px-5 py-3 font-semibold xl:table-cell">Last checked</th>
                                    <th className="px-5 py-3 text-right font-semibold">Latency</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {connections.map((row) => {
                                    const status = row.connection?.status ?? 'not_configured';
                                    const meta = statusMeta(status);
                                    const StatusIcon = meta.Icon;

                                    return (
                                        <tr
                                            key={row.tenant_id}
                                            className="group transition hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={`/admin/tenant-connections/${row.tenant_id}`}
                                                    className="flex min-w-0 items-center gap-3"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary">
                                                        {row.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium group-hover:text-primary">
                                                            {row.name}
                                                        </p>
                                                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                            {row.tenant_id}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tint}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {meta.label}
                                                </span>
                                                {row.connection?.last_verified_error && status === 'failing' && (
                                                    <p className="mt-1 max-w-xs truncate text-[11px] text-rose-600 dark:text-rose-400">
                                                        {row.connection.last_verified_error}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3 md:table-cell">
                                                {row.connection ? (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                                        row.connection.environment === 'production'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                    }`}>
                                                        {row.connection.environment}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3 lg:table-cell">
                                                {row.connection?.facility_fr_code ? (
                                                    <div className="min-w-0">
                                                        <p className="truncate font-mono text-[11px]">
                                                            {row.connection.facility_fr_code}
                                                        </p>
                                                        {row.connection.facility_name && (
                                                            <p className="truncate text-[11px] text-muted-foreground">
                                                                {row.connection.facility_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3 text-xs text-muted-foreground xl:table-cell">
                                                {row.connection?.last_verified_at ? (
                                                    <RelativeTime iso={row.connection.last_verified_at} />
                                                ) : (
                                                    'Never'
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right text-xs tabular-nums">
                                                {row.connection?.last_verified_latency_ms ? (
                                                    <span className={row.connection.last_verified_latency_ms >= 2000 ? 'text-amber-600 dark:text-amber-400' : ''}>
                                                        {row.connection.last_verified_latency_ms}ms
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link
                                                    href={`/admin/tenant-connections/${row.tenant_id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition group-hover:text-primary"
                                                >
                                                    Open
                                                    <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
}

function StatTile({
    label,
    value,
    sub,
    icon: Icon,
    tint,
}: {
    label: string;
    value: number;
    sub?: string;
    icon: any;
    tint: 'emerald' | 'rose' | 'amber' | 'slate';
}) {
    const tints: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        slate: 'bg-muted text-muted-foreground',
    };

    return (
        <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    {label}
                </p>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${tints[tint]}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
                {value.toLocaleString()}
            </p>
            {sub && (
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                    {sub}
                </p>
            )}
        </Card>
    );
}