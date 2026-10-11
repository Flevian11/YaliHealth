import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Globe,
    LoaderCircle,
    RefreshCw,
    Server,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Endpoint = {
    key: string;
    label: string;
    method: string;
    path: string;
    url: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latency_ms: number | null;
    http_status: number | null;
    error: string | null;
    last_checked: string | null;
    uptime_24h: number | null;
    avg_latency_24h: number | null;
};

type Group = {
    key: string;
    label: string;
    description: string | null;
    endpoints: Endpoint[];
};

type Stats = {
    up: number;
    down: number;
    degraded: number;
    unknown: number;
    total: number;
    global_uptime_24h: number | null;
    avg_latency_24h: number | null;
};

type ProgressResult = {
    key: string;
    label: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latency_ms: number | null;
    http_status: number | null;
};

type Progress = {
    active: boolean;
    completed: number;
    total: number;
    percent: number;
    results: ProgressResult[];
};

function statusMeta(status: Endpoint['status']) {
    return {
        up: {
            label: 'Operational',
            Icon: CheckCircle2,
            pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        degraded: {
            label: 'Degraded',
            Icon: AlertTriangle,
            pill: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        },
        down: {
            label: 'Down',
            Icon: XCircle,
            pill: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        },
        unknown: {
            label: 'Not checked',
            Icon: Clock,
            pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
    }[status];
}

function methodColor(method: string): string {
    return (
        {
            GET: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
            POST: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
            DELETE: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        }[method] ?? 'bg-muted text-muted-foreground'
    );
}

export default function ApiHealth({
    groups,
    environment,
    base_url,
    stats,
}: {
    groups: Group[];
    environment: string;
    base_url: string;
    stats: Stats;
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [running, setRunning] = useState(false);
    const pollRef = useRef<number | null>(null);
    const startedRef = useRef(false);

    const overallStatus: Endpoint['status'] =
        stats.down > 0
            ? 'down'
            : stats.degraded > 0
              ? 'degraded'
              : stats.unknown === stats.total
                ? 'unknown'
                : 'up';

    const OverallIcon = statusMeta(overallStatus).Icon;

    const stopPolling = () => {
        if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const startPolling = () => {
        stopPolling();
        pollRef.current = window.setInterval(async () => {
            try {
                const res = await fetch('/admin/api-health/progress', {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!res.ok) return;

                const data: Progress = await res.json();

                // Guarantee the shape — never let results be undefined
                const safe: Progress = {
                    active: !!data.active,
                    completed: data.completed ?? 0,
                    total: data.total ?? 0,
                    percent: data.percent ?? 0,
                    results: Array.isArray(data.results) ? data.results : [],
                };

                setProgress(safe);

                if (!safe.active && safe.completed > 0) {
                    stopPolling();
                    setRunning(false);
                    router.reload({ only: ['groups', 'stats'] });
                }
            } catch {
                // keep polling
            }
        }, 800);
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const openRefresh = () => {
        setProgress(null);
        setRunning(true);
        setDialogOpen(true);
        startedRef.current = false;

        router.post(
            '/admin/api-health/refresh',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (!startedRef.current) {
                        startedRef.current = true;
                        startPolling();
                    }
                },
            },
        );
    };

    const closeDialog = () => {
        stopPolling();
        setDialogOpen(false);
        setRunning(false);
        if (progress && progress.completed > 0) {
            router.reload({ only: ['groups', 'stats'] });
        }
    };

    const isComplete =
        !!progress && !progress.active && progress.completed > 0;

    return (
        <>
            <Head title="API Health" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        API Health
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Live status of the HIE integration endpoints.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs sm:flex">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{base_url}</span>
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                environment === 'production'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                        >
                            {environment}
                        </span>
                    </div>
                    {can('settings.edit') && (
                        <Button onClick={openRefresh}>
                            <RefreshCw className="mr-1.5 h-4 w-4" />
                            Refresh now
                        </Button>
                    )}
                </div>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            <Card
                className={`mb-6 overflow-hidden border-l-4 ${
                    overallStatus === 'up'
                        ? 'border-l-emerald-500'
                        : overallStatus === 'degraded'
                          ? 'border-l-amber-500'
                          : overallStatus === 'down'
                            ? 'border-l-rose-500'
                            : 'border-l-slate-400'
                }`}
            >
                <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            overallStatus === 'up'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : overallStatus === 'degraded'
                                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                  : overallStatus === 'down'
                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                        <OverallIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold">
                                {overallStatus === 'up'
                                    ? 'All systems operational'
                                    : overallStatus === 'degraded'
                                      ? 'Some endpoints are slow'
                                      : overallStatus === 'down'
                                        ? 'Service disruption detected'
                                        : 'Awaiting first check'}
                            </h2>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusMeta(overallStatus).pill}`}
                            >
                                {statusMeta(overallStatus).label}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {stats.up} of {stats.total} endpoints responding
                            normally
                            {stats.degraded > 0 && ` · ${stats.degraded} degraded`}
                            {stats.down > 0 && ` · ${stats.down} down`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Uptime 24h
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                {stats.global_uptime_24h !== null
                                    ? `${stats.global_uptime_24h}%`
                                    : '—'}
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Avg latency
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                {stats.avg_latency_24h !== null
                                    ? `${stats.avg_latency_24h}ms`
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Operational" value={stats.up} icon={CheckCircle2} tint="emerald" />
                <StatTile label="Degraded" value={stats.degraded} icon={AlertTriangle} tint="amber" />
                <StatTile label="Down" value={stats.down} icon={XCircle} tint="rose" />
                <StatTile label="Not checked" value={stats.unknown} icon={Clock} tint="slate" />
            </div>

            <div className="space-y-6">
                {groups.map((group) => (
                    <div key={group.key}>
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Server className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">
                                    {group.label}
                                </h2>
                                {group.description && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {group.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Card className="overflow-hidden p-0">
                            <div className="divide-y">
                                {group.endpoints.map((e) => (
                                    <EndpointRow key={e.key} endpoint={e} />
                                ))}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                            )}
                            {isComplete
                                ? 'Health check complete'
                                : 'Running health checks'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-3 space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    {progress
                                        ? `Checked ${progress.completed} of ${progress.total}`
                                        : 'Preparing...'}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {progress?.percent ?? 0}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${progress?.percent ?? 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border bg-card p-2">
                            {!progress || progress.results.length === 0 ? (
                                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                                    Waiting for first response...
                                </p>
                            ) : (
                                progress.results.map((r) => {
                                    const meta = statusMeta(r.status);
                                    const Icon = meta.Icon;
                                    return (
                                        <div
                                            key={r.key}
                                            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition"
                                        >
                                            <div
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.pill}`}
                                            >
                                                <Icon className="h-3 w-3" />
                                            </div>
                                            <span className="min-w-0 flex-1 truncate font-medium">
                                                {r.label}
                                            </span>
                                            <span className="shrink-0 tabular-nums text-muted-foreground">
                                                {r.http_status ?? '—'}
                                            </span>
                                            <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                                                {r.latency_ms !== null
                                                    ? `${r.latency_ms}ms`
                                                    : '—'}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                variant="outline"
                                onClick={closeDialog}
                                disabled={running && !isComplete}
                            >
                                {running && !isComplete ? 'Running...' : 'Close'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function EndpointRow({ endpoint }: { endpoint: Endpoint }) {
    const meta = statusMeta(endpoint.status);
    const StatusIcon = meta.Icon;
    const lastCheck = useRelativeTime(endpoint.last_checked);

    return (
        <Link
            href={`/admin/api-health/${endpoint.key}`}
            className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/40"
        >
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.pill}`}
            >
                <StatusIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                        {endpoint.label}
                    </p>
                    <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${methodColor(endpoint.method)}`}
                    >
                        {endpoint.method}
                    </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {endpoint.path}
                </p>
            </div>

            <div className="hidden items-center gap-6 text-xs sm:flex">
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Uptime 24h
                    </p>
                    <p className="font-semibold tabular-nums">
                        {endpoint.uptime_24h !== null
                            ? `${endpoint.uptime_24h}%`
                            : '—'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Latency
                    </p>
                    <p className="font-semibold tabular-nums">
                        {endpoint.latency_ms !== null
                            ? `${endpoint.latency_ms}ms`
                            : '—'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        HTTP
                    </p>
                    <p className="font-semibold tabular-nums">
                        {endpoint.http_status ?? '—'}
                    </p>
                </div>
                <div className="w-24 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Last check
                    </p>
                    <p className="text-muted-foreground">{lastCheck}</p>
                </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </Link>
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
    tint: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
    const tints: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        slate: 'bg-muted text-muted-foreground',
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tints[tint]}`}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {value.toLocaleString()}
            </p>
        </Card>
    );
}