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
    Activity,
    AlertTriangle,
    ArrowRight,
    BookOpen,
    Building2,
    CheckCircle2,
    Clock,
    Database,
    LoaderCircle,
    Pill,
    RefreshCw,
    Shield,
    UserCheck,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Registry = {
    key: string;
    label: string;
    singular: string;
    description: string;
    source: string;
    icon: string;
    records_count: number;
    records_estimate: number | null;
    code_label: string;
    name_label: string;
    is_syncing: boolean;
    last_sync: {
        id: number;
        status: string;
        completed_at: string | null;
        duration_ms: number | null;
        created: number;
        updated: number;
        failed: number;
        error: string | null;
    } | null;
};

type ActivityRow = {
    id: number;
    registry_key: string;
    registry_label: string;
    status: string;
    created: number;
    updated: number;
    failed: number;
    duration_ms: number | null;
    source: string;
    created_at: string;
    completed_at: string | null;
    error: string | null;
};

type Stats = {
    total_records: number;
    total_registries: number;
    synced_registries: number;
    recent_jobs: number;
};

type BatchResult = {
    key: string;
    label: string;
    status: 'waiting' | 'queued' | 'running' | 'completed' | 'failed';
    created: number;
    updated: number;
    failed: number;
    duration_ms: number | null;
    error: string | null;
};

type BatchProgress = {
    active: boolean;
    total: number;
    completed: number;
    percent: number;
    results: BatchResult[];
};

const ICONS: Record<string, any> = {
    building: Building2,
    'user-check': UserCheck,
    'book-open': BookOpen,
    activity: Activity,
    pill: Pill,
    shield: Shield,
    database: Database,
};

function iconFor(key: string): any {
    return ICONS[key] ?? Database;
}

export default function ReferenceData({
    registries,
    activity,
    stats,
}: {
    registries: Registry[];
    activity: ActivityRow[];
    stats: Stats;
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [syncing, setSyncing] = useState<Set<string>>(
        new Set(registries.filter((r) => r.is_syncing).map((r) => r.key)),
    );
    const [batchDialogOpen, setBatchDialogOpen] = useState(false);
    const [batch, setBatch] = useState<BatchProgress | null>(null);

    const singlePollRef = useRef<number | null>(null);
    const batchPollRef = useRef<number | null>(null);

    const anySyncing = syncing.size > 0;

    /* ---- Single-registry polling ---- */
    useEffect(() => {
        if (!anySyncing) {
            if (singlePollRef.current !== null) {
                window.clearInterval(singlePollRef.current);
                singlePollRef.current = null;
            }
            return;
        }

        if (singlePollRef.current !== null) return;

        singlePollRef.current = window.setInterval(async () => {
            try {
                const results = await Promise.all(
                    registries.map(async (r) => {
                        const res = await fetch(
                            `/admin/reference-data/${r.key}/sync-status`,
                            {
                                headers: {
                                    Accept: 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                credentials: 'same-origin',
                            },
                        );
                        if (!res.ok) return { key: r.key, active: false };
                        const data = await res.json();
                        return { key: r.key, active: !!data.active };
                    }),
                );

                const stillActive = results
                    .filter((r) => r.active)
                    .map((r) => r.key);
                setSyncing(new Set(stillActive));

                if (stillActive.length === 0) {
                    router.reload({
                        only: ['registries', 'activity', 'stats'],
                    });
                }
            } catch {
                // keep polling
            }
        }, 1500);

        return () => {
            if (singlePollRef.current !== null) {
                window.clearInterval(singlePollRef.current);
                singlePollRef.current = null;
            }
        };
    }, [anySyncing]);

    /* ---- Batch (sync-all) polling ---- */
    useEffect(() => {
        if (!batchDialogOpen) {
            if (batchPollRef.current !== null) {
                window.clearInterval(batchPollRef.current);
                batchPollRef.current = null;
            }
            return;
        }

        batchPollRef.current = window.setInterval(async () => {
            try {
                const res = await fetch(
                    '/admin/reference-data/sync-all/progress',
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    },
                );
                if (!res.ok) return;

                const data: BatchProgress = await res.json();
                setBatch(data);

                if (!data.active && data.completed > 0) {
                    window.clearInterval(batchPollRef.current!);
                    batchPollRef.current = null;
                    router.reload({
                        only: ['registries', 'activity', 'stats'],
                    });
                }
            } catch {
                // keep polling
            }
        }, 1200);

        return () => {
            if (batchPollRef.current !== null) {
                window.clearInterval(batchPollRef.current);
                batchPollRef.current = null;
            }
        };
    }, [batchDialogOpen]);

    const syncOne = (key: string) => {
        setSyncing((s) => new Set(s).add(key));
        router.post(
            `/admin/reference-data/${key}/sync`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const openSyncAll = () => {
        setBatch(null);
        setBatchDialogOpen(true);
        setSyncing(new Set(registries.map((r) => r.key)));

        router.post(
            '/admin/reference-data/sync-all',
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const closeBatchDialog = () => {
        setBatchDialogOpen(false);
        if (batch && batch.completed > 0) {
            router.reload({ only: ['registries', 'activity', 'stats'] });
        }
    };

    const batchComplete = !!batch && !batch.active && batch.completed > 0;

    return (
        <>
            <Head title="Reference Data" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Reference Data
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        National registries mirrored locally so hospitals can
                        search and validate offline.
                    </p>
                </div>
                {can('settings.edit') && (
                    <Button onClick={openSyncAll} disabled={anySyncing}>
                        {anySyncing ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="mr-1.5 h-4 w-4" />
                        )}
                        {anySyncing ? 'Syncing...' : 'Sync all'}
                    </Button>
                )}
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatTile
                    label="Total records"
                    value={stats.total_records.toLocaleString()}
                    icon={Database}
                    tint="emerald"
                    sub={`across ${stats.total_registries} registries`}
                />
                <StatTile
                    label="Synced"
                    value={stats.synced_registries.toString()}
                    icon={CheckCircle2}
                    tint="blue"
                    sub={`of ${stats.total_registries} registries`}
                />
                <StatTile
                    label="Sync jobs 24h"
                    value={stats.recent_jobs.toString()}
                    icon={RefreshCw}
                    tint="amber"
                    sub="Queued or completed"
                />
                <StatTile
                    label="Coverage"
                    value={
                        stats.total_registries > 0
                            ? `${Math.round((stats.synced_registries / stats.total_registries) * 100)}%`
                            : '0%'
                    }
                    icon={Activity}
                    tint="emerald"
                    sub="Registry coverage"
                />
            </div>

            {/* Registry cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {registries.map((r) => (
                    <RegistryCard
                        key={r.key}
                        registry={r}
                        isSyncing={syncing.has(r.key) || r.is_syncing}
                        onSync={() => syncOne(r.key)}
                        canSync={can('settings.edit')}
                    />
                ))}
            </div>

            {/* Sync activity */}
            <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <div>
                        <h2 className="text-sm font-semibold">Sync activity</h2>
                        <p className="text-[11px] text-muted-foreground">
                            Latest 10 registry sync operations
                        </p>
                    </div>
                </div>
                <div className="divide-y">
                    {activity.length === 0 ? (
                        <p className="p-8 text-center text-xs text-muted-foreground">
                            No sync activity yet.
                        </p>
                    ) : (
                        activity.map((a) => (
                            <ActivityRowItem key={a.id} row={a} />
                        ))
                    )}
                </div>
            </Card>

            {/* Sync All dialog */}
            <Dialog
                open={batchDialogOpen}
                onOpenChange={(o) => !o && closeBatchDialog()}
            >
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            {batchComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                            )}
                            {batchComplete
                                ? 'Sync complete'
                                : 'Syncing all registries'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-3 space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    {batch
                                        ? `Completed ${batch.completed} of ${batch.total}`
                                        : 'Preparing...'}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {batch?.percent ?? 0}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{
                                        width: `${batch?.percent ?? 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border bg-card p-2">
                            {!batch || batch.results.length === 0 ? (
                                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                                    Waiting for first response...
                                </p>
                            ) : (
                                batch.results.map((r) => (
                                    <BatchRow key={r.key} row={r} />
                                ))
                            )}
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                variant="outline"
                                onClick={closeBatchDialog}
                                disabled={
                                    !!batch && batch.active && !batchComplete
                                }
                            >
                                {batch && batch.active && !batchComplete
                                    ? 'Running...'
                                    : 'Close'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function BatchRow({ row }: { row: BatchResult }) {
    const meta = {
        waiting: {
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            label: 'Waiting',
        },
        queued: {
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            label: 'Queued',
        },
        running: {
            Icon: LoaderCircle,
            tint: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
            label: 'Syncing',
        },
        completed: {
            Icon: CheckCircle2,
            tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            label: 'Done',
        },
        failed: {
            Icon: AlertTriangle,
            tint: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
            label: 'Failed',
        },
    }[row.status] ?? {
        Icon: Clock,
        tint: 'bg-muted text-muted-foreground',
        label: row.status,
    };

    const Icon = meta.Icon;

    return (
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs">
            <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${meta.tint}`}
            >
                <Icon
                    className={`h-3.5 w-3.5 ${row.status === 'running' ? 'animate-spin' : ''}`}
                />
            </div>
            <span className="min-w-0 flex-1 truncate font-medium">
                {row.label}
            </span>
            {row.status === 'completed' && (
                <span className="hidden shrink-0 items-center gap-2 tabular-nums text-muted-foreground sm:flex">
                    {row.created > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                            +{row.created}
                        </span>
                    )}
                    {row.updated > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">
                            ↻{row.updated}
                        </span>
                    )}
                    {row.duration_ms && <span>{row.duration_ms}ms</span>}
                </span>
            )}
            {row.status === 'failed' && row.error && (
                <span
                    className="hidden max-w-[120px] shrink-0 truncate text-rose-600 dark:text-rose-400 sm:inline"
                    title={row.error}
                >
                    {row.error}
                </span>
            )}
        </div>
    );
}

function RegistryCard({
    registry,
    isSyncing,
    onSync,
    canSync,
}: {
    registry: Registry;
    isSyncing: boolean;
    onSync: () => void;
    canSync: boolean;
}) {
    const Icon = iconFor(registry.icon);
    const lastSyncTime = useRelativeTime(
        registry.last_sync?.completed_at ?? null,
    );
    const coverage = registry.records_estimate
        ? Math.min(
              100,
              Math.round(
                  (registry.records_count / registry.records_estimate) * 100,
              ),
          )
        : null;

    const syncState = isSyncing
        ? 'syncing'
        : registry.last_sync?.status === 'failed'
          ? 'failed'
          : registry.records_count === 0
            ? 'empty'
            : 'synced';

    const tint = {
        syncing:
            'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        empty:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        synced:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    }[syncState];

    return (
        <Card className="flex flex-col">
            <div className="flex items-start gap-3 p-5 pb-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <Link
                        href={`/admin/reference-data/${registry.key}`}
                        className="block truncate text-base font-semibold hover:text-primary"
                    >
                        {registry.label}
                    </Link>
                    <p className="truncate text-[11px] text-muted-foreground">
                        {registry.source}
                    </p>
                </div>
                {isSyncing && (
                    <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
                )}
            </div>

            <div className="flex-1 px-5 pb-5">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                    {registry.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Records
                        </p>
                        <p className="text-lg font-bold tabular-nums">
                            {registry.records_count.toLocaleString()}
                        </p>
                        {registry.records_estimate && (
                            <p className="text-[10px] text-muted-foreground">
                                of ~{registry.records_estimate.toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Last sync
                        </p>
                        <p className="text-sm font-medium">
                            {registry.last_sync ? lastSyncTime : 'Never'}
                        </p>
                        {registry.last_sync?.duration_ms && (
                            <p className="text-[10px] text-muted-foreground">
                                {registry.last_sync.duration_ms}ms
                            </p>
                        )}
                    </div>
                </div>

                {coverage !== null && (
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">
                                Coverage
                            </span>
                            <span className="font-semibold tabular-nums">
                                {coverage}%
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${coverage}%` }}
                            />
                        </div>
                    </div>
                )}

                {registry.last_sync?.status === 'failed' &&
                    registry.last_sync.error && (
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">
                                {registry.last_sync.error}
                            </span>
                        </div>
                    )}
            </div>

            <div className="flex items-center gap-2 border-t px-5 py-3">
                <Link
                    href={`/admin/reference-data/${registry.key}`}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition hover:bg-muted"
                >
                    Browse
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {canSync && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onSync}
                        disabled={isSyncing}
                        className="h-8 px-2.5"
                    >
                        {isSyncing ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                        )}
                    </Button>
                )}
            </div>
        </Card>
    );
}

function ActivityRowItem({ row }: { row: ActivityRow }) {
    const when = useRelativeTime(row.created_at);

    const meta = {
        completed: {
            Icon: CheckCircle2,
            tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            label: 'Completed',
        },
        failed: {
            Icon: AlertTriangle,
            tint: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
            label: 'Failed',
        },
        running: {
            Icon: LoaderCircle,
            tint: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
            label: 'Running',
        },
        queued: {
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            label: 'Queued',
        },
    }[row.status] ?? {
        Icon: Activity,
        tint: 'bg-muted text-muted-foreground',
        label: row.status,
    };

    const Icon = meta.Icon;

    return (
        <div className="flex items-center gap-4 px-5 py-3 text-sm">
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
            >
                <Icon
                    className={`h-3.5 w-3.5 ${row.status === 'running' ? 'animate-spin' : ''}`}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {row.registry_label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                    {row.source} · {meta.label}
                </p>
            </div>
            <div className="hidden items-center gap-4 text-xs tabular-nums sm:flex">
                {row.created > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                        +{row.created}
                    </span>
                )}
                {row.updated > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                        ↻{row.updated}
                    </span>
                )}
                {row.failed > 0 && (
                    <span className="text-rose-600 dark:text-rose-400">
                        ✗{row.failed}
                    </span>
                )}
                {row.duration_ms && (
                    <span className="text-muted-foreground">
                        {row.duration_ms}ms
                    </span>
                )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
                {when}
            </span>
        </div>
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
    value: string;
    sub?: string;
    icon: any;
    tint: 'emerald' | 'blue' | 'amber';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    };

    return (
        <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    {label}
                </p>
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${tints[tint]}`}
                >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
                {value}
            </p>
            {sub && (
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                    {sub}
                </p>
            )}
        </Card>
    );
}