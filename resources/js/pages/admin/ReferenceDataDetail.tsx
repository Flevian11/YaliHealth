import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Award,
    BarChart3,
    BookOpen,
    Building2,
    CheckCircle2,
    Clock,
    Database,
    ExternalLink,
    Gauge,
    Hash,
    Layers,
    LoaderCircle,
    Package,
    PieChart as PieIcon,
    Pill,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    TrendingDown,
    TrendingUp,
    UserCheck,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type RecordRow = {
    id: number;
    code: string | null;
    name: string;
    category: string | null;
    status: string | null;
    data: Record<string, any> | null;
    synced_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Registry = {
    key: string;
    label: string;
    singular: string;
    description: string;
    source: string;
    icon: string;
    code_label: string;
    name_label: string;
    records_estimate: number | null;
    columns: string[];
};

type Job = {
    id: number;
    status: string;
    created: number;
    updated: number;
    failed: number;
    fetched: number;
    duration_ms: number | null;
    source: string;
    created_at: string;
    completed_at: string | null;
    error: string | null;
};

type CategorySlice = { name: string; value: number };
type StatusSlice = { name: string; value: number };
type PerformancePoint = {
    idx: number;
    duration_ms: number;
    records: number;
    created_at: string;
};
type PerformanceStats = {
    avg_duration: number;
    min_duration: number;
    max_duration: number;
    total_jobs: number;
    total_created: number;
    total_updated: number;
    success_rate: number;
};
type Quality = {
    total: number;
    with_code: number;
    with_external_id: number;
    with_category: number;
    with_status: number;
    code_pct: number;
    external_id_pct: number;
    category_pct: number;
    status_pct: number;
};
type RecentRecord = {
    id: number;
    code: string | null;
    name: string;
    category: string | null;
    synced_at: string | null;
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

const CATEGORY_COLORS = [
    '#10B981',
    '#3B82F6',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
    '#14B8A6',
    '#84CC16',
    '#6366F1',
    '#EF4444',
    '#A855F7',
];

const STATUS_COLORS: Record<string, string> = {
    Active: '#10B981',
    Operational: '#10B981',
    Inactive: '#EF4444',
    Retired: '#94A3B8',
    Suspended: '#F59E0B',
    Unknown: '#CBD5E1',
};

function colorForStatus(name: string): string {
    return STATUS_COLORS[name] ?? '#94A3B8';
}

export default function ReferenceDataDetail({
    registry,
    records,
    filters,
    categories,
    statuses,
    stats,
    categoryDistribution,
    statusDistribution,
    quality,
    performance,
    performanceStats,
    recentlyAdded,
    jobs,
    is_syncing,
}: {
    registry: Registry;
    records: Paginator<RecordRow>;
    filters: { q: string; category: string; status: string };
    categories: string[];
    statuses: string[];
    stats: { total: number };
    categoryDistribution: CategorySlice[];
    statusDistribution: StatusSlice[];
    quality: Quality;
    performance: PerformancePoint[];
    performanceStats: PerformanceStats;
    recentlyAdded: RecentRecord[];
    jobs: Job[];
    is_syncing: boolean;
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [query, setQuery] = useState(filters.q ?? '');
    const [syncing, setSyncing] = useState(is_syncing);
    const pollRef = useRef<number | null>(null);
    const firstRender = useRef(true);
    const Icon = iconFor(registry.icon);

    /* Debounced search */
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                `/admin/reference-data/${registry.key}`,
                {
                    q: query,
                    category: filters.category || undefined,
                    status: filters.status || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['records', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    /* Sync polling */
    useEffect(() => {
        if (!syncing) {
            if (pollRef.current !== null) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        pollRef.current = window.setInterval(async () => {
            try {
                const res = await fetch(
                    `/admin/reference-data/${registry.key}/sync-status`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    },
                );
                if (!res.ok) return;
                const data = await res.json();

                if (!data.active) {
                    window.clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setSyncing(false);
                    router.reload();
                }
            } catch {
                /* keep polling */
            }
        }, 1500);

        return () => {
            if (pollRef.current !== null) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [syncing, registry.key]);

    const applyFilter = (key: string, value: string) => {
        router.get(
            `/admin/reference-data/${registry.key}`,
            {
                q: filters.q || undefined,
                category: filters.category || undefined,
                status: filters.status || undefined,
                [key]: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['records', 'filters'],
            },
        );
    };

    const triggerSync = () => {
        setSyncing(true);
        router.post(
            `/admin/reference-data/${registry.key}/sync`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const clearFilters = () => {
        setQuery('');
        router.get(
            `/admin/reference-data/${registry.key}`,
            {},
            { preserveState: true, replace: true },
        );
    };

    const coverage = registry.records_estimate
        ? Math.min(
              100,
              Math.round(
                  (stats.total / registry.records_estimate) * 100,
              ),
          )
        : null;

    const hasFilters = !!(filters.q || filters.category || filters.status);
    const lastJob = jobs[0];

    const statusTotal = statusDistribution.reduce((s, d) => s + d.value, 0);
    const categoryTotal = categoryDistribution.reduce((s, d) => s + d.value, 0);

    const maxCategoryValue = useMemo(
        () => Math.max(...categoryDistribution.map((c) => c.value), 1),
        [categoryDistribution],
    );

    /* Chart data for performance: sort oldest → newest for the chart */
    const performanceChart = useMemo(
        () => [...performance].sort((a, b) => a.idx - b.idx),
        [performance],
    );

    return (
        <>
            <Head title={`${registry.label} — Reference Data`} />

            {/* ─── Breadcrumb ─── */}
            <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Link
                    href="/admin/reference-data"
                    className="hover:text-foreground"
                >
                    Reference Data
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">
                    {registry.label}
                </span>
            </nav>

            {/* ─── Header ─── */}
            <div className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {registry.label}
                                </h1>
                                {syncing && (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                        <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                        Syncing
                                    </Badge>
                                )}
                                {!syncing &&
                                    lastJob?.status === 'failed' && (
                                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                            Last sync failed
                                        </Badge>
                                    )}
                                {performanceStats.success_rate >= 95 &&
                                    performanceStats.total_jobs > 3 && (
                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            <Award className="mr-1 h-3 w-3" />
                                            Healthy
                                        </Badge>
                                    )}
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                {registry.description}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    Source: {registry.source}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Key: {registry.key}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Database className="h-3 w-3" />
                                    Labels: {registry.code_label} / {registry.name_label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {can('settings.edit') && (
                        <Button
                            onClick={triggerSync}
                            disabled={syncing}
                            className="shrink-0"
                        >
                            {syncing ? (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Zap className="mr-1.5 h-4 w-4" />
                            )}
                            {syncing ? 'Syncing...' : 'Sync now'}
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

            {/* ─── Stat tiles (6) ─── */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <StatTile
                    label="Records"
                    value={stats.total.toLocaleString()}
                    sub={
                        registry.records_estimate
                            ? `of ~${registry.records_estimate.toLocaleString()}`
                            : undefined
                    }
                    icon={Database}
                    tint="emerald"
                />
                <StatTile
                    label="Categories"
                    value={categories.length.toString()}
                    sub="Distinct groupings"
                    icon={Layers}
                    tint="blue"
                />
                <StatTile
                    label="Coverage"
                    value={coverage !== null ? `${coverage}%` : '—'}
                    sub="Against estimate"
                    icon={Gauge}
                    tint={
                        coverage === null
                            ? 'slate'
                            : coverage >= 80
                              ? 'emerald'
                              : coverage >= 40
                                ? 'amber'
                                : 'rose'
                    }
                />
                <StatTile
                    label="Success rate"
                    value={`${performanceStats.success_rate}%`}
                    sub={`${performanceStats.total_jobs} syncs`}
                    icon={Award}
                    tint={
                        performanceStats.success_rate >= 95
                            ? 'emerald'
                            : performanceStats.success_rate >= 80
                              ? 'amber'
                              : 'rose'
                    }
                />
                <StatTile
                    label="Avg duration"
                    value={`${performanceStats.avg_duration}ms`}
                    sub={
                        performanceStats.max_duration
                            ? `max ${performanceStats.max_duration}ms`
                            : undefined
                    }
                    icon={Clock}
                    tint="blue"
                />
                <LastSyncTile job={lastJob} />
            </div>

            {/* ─── Coverage banner ─── */}
            {coverage !== null && (
                <Card className="mb-6">
                    <CardContent className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-semibold">
                                    Local cache coverage
                                </span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">
                                {stats.total.toLocaleString()} /{' '}
                                {registry.records_estimate?.toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    coverage >= 80
                                        ? 'bg-emerald-500'
                                        : coverage >= 40
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                }`}
                                style={{ width: `${coverage}%` }}
                            />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground sm:grid-cols-4">
                            <div>
                                <span className="block font-semibold text-foreground">
                                    {quality.with_code.toLocaleString()}
                                </span>
                                Codes present
                            </div>
                            <div>
                                <span className="block font-semibold text-foreground">
                                    {quality.with_category.toLocaleString()}
                                </span>
                                Categories set
                            </div>
                            <div>
                                <span className="block font-semibold text-foreground">
                                    {quality.with_status.toLocaleString()}
                                </span>
                                Statuses set
                            </div>
                            <div>
                                <span className="block font-semibold text-foreground">
                                    {quality.with_external_id.toLocaleString()}
                                </span>
                                External IDs
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Charts row ─── */}
            {(categoryDistribution.length > 0 ||
                statusDistribution.length > 0) && (
                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {categoryDistribution.length > 0 && (
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Category distribution
                                        </CardTitle>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Top {categoryDistribution.length} of{' '}
                                            {categories.length} categories
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div
                                    style={{
                                        height: Math.max(
                                            240,
                                            categoryDistribution.length * 32,
                                        ),
                                    }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={categoryDistribution}
                                            layout="vertical"
                                            margin={{
                                                top: 4,
                                                right: 32,
                                                left: 8,
                                                bottom: 4,
                                            }}
                                        >
                                            <CartesianGrid
                                                horizontal={false}
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                type="number"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 11,
                                                    fill: 'hsl(var(--muted-foreground))',
                                                }}
                                                allowDecimals={false}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 11,
                                                    fill: 'hsl(var(--muted-foreground))',
                                                }}
                                                width={140}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    border: '1px solid hsl(var(--border))',
                                                    background:
                                                        'hsl(var(--card))',
                                                }}
                                                formatter={(value: number) => [
                                                    value.toLocaleString(),
                                                    'Records',
                                                ]}
                                            />
                                            <Bar
                                                dataKey="value"
                                                radius={[0, 4, 4, 0]}
                                                maxBarSize={22}
                                            >
                                                {categoryDistribution.map(
                                                    (_, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={
                                                                CATEGORY_COLORS[
                                                                    i %
                                                                        CATEGORY_COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {statusDistribution.length > 0 && (
                        <Card
                            className={
                                categoryDistribution.length > 0
                                    ? 'lg:col-span-1'
                                    : 'lg:col-span-3'
                            }
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Status distribution
                                        </CardTitle>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Across {statusTotal.toLocaleString()}{' '}
                                            records
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                        <PieIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="relative h-[200px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={58}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {statusDistribution.map(
                                                    (d, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={colorForStatus(
                                                                d.name,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    border: '1px solid hsl(var(--border))',
                                                    background:
                                                        'hsl(var(--card))',
                                                }}
                                                formatter={(value: number) => [
                                                    value.toLocaleString(),
                                                    'Records',
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">
                                            {statusTotal.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {statusDistribution.map((d, i) => {
                                        const pct = statusTotal
                                            ? Math.round(
                                                  (d.value / statusTotal) * 100,
                                              )
                                            : 0;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            colorForStatus(
                                                                d.name,
                                                            ),
                                                    }}
                                                />
                                                <span className="flex-1 truncate text-muted-foreground">
                                                    {d.name}
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                    {d.value.toLocaleString()}
                                                </span>
                                                <span className="w-9 text-right text-muted-foreground tabular-nums">
                                                    {pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ─── Sync performance ─── */}
            {performanceChart.length > 0 && (
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Sync performance
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Duration of last{' '}
                                    {performanceChart.length} completed syncs
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <PerfStat
                                    label="Avg"
                                    value={`${performanceStats.avg_duration}ms`}
                                    icon={Activity}
                                    tint="blue"
                                />
                                <PerfStat
                                    label="Fastest"
                                    value={`${performanceStats.min_duration}ms`}
                                    icon={TrendingDown}
                                    tint="emerald"
                                />
                                <PerfStat
                                    label="Slowest"
                                    value={`${performanceStats.max_duration}ms`}
                                    icon={TrendingUp}
                                    tint="rose"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={performanceChart}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: -12,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="perf-grad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#3B82F6"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#3B82F6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="idx"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        tickFormatter={(v) => `#${v}`}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        width={48}
                                        tickFormatter={(v) => `${v}ms`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            fontSize: 12,
                                            border: '1px solid hsl(var(--border))',
                                            background: 'hsl(var(--card))',
                                        }}
                                        formatter={(
                                            value: number,
                                            name: string,
                                        ) => [
                                            name === 'duration_ms'
                                                ? `${value}ms`
                                                : value.toLocaleString(),
                                            name === 'duration_ms'
                                                ? 'Duration'
                                                : 'Records touched',
                                        ]}
                                        labelFormatter={(v) => `Sync #${v}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="duration_ms"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fill="url(#perf-grad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Data quality + Recent additions row ─── */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Data quality
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Field completeness across cached records
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <Shield className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <QualityBar
                                label="Code present"
                                subLabel={registry.code_label}
                                count={quality.with_code}
                                total={quality.total}
                                pct={quality.code_pct}
                            />
                            <QualityBar
                                label="Category set"
                                subLabel="Classification"
                                count={quality.with_category}
                                total={quality.total}
                                pct={quality.category_pct}
                            />
                            <QualityBar
                                label="Status set"
                                subLabel="Active / Inactive"
                                count={quality.with_status}
                                total={quality.total}
                                pct={quality.status_pct}
                            />
                            <QualityBar
                                label="External ID"
                                subLabel="Source reference"
                                count={quality.with_external_id}
                                total={quality.total}
                                pct={quality.external_id_pct}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Recently added
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Latest records in the local cache
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Package className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentlyAdded.length === 0 ? (
                            <p className="py-6 text-center text-xs text-muted-foreground">
                                No records cached yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {recentlyAdded.map((r) => (
                                    <RecentRecordRow key={r.id} record={r} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── Category breakdown table ─── */}
            {categoryDistribution.length > 0 && (
                <Card className="mb-6 overflow-hidden p-0">
                    <div className="flex items-center justify-between border-b px-5 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Category breakdown
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                All categories with record counts
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                            {categories.length} categories
                        </Badge>
                    </div>
                    <div className="divide-y">
                        {categoryDistribution.map((c, i) => {
                            const pct = categoryTotal
                                ? Math.round((c.value / categoryTotal) * 100)
                                : 0;
                            const barPct = Math.round(
                                (c.value / maxCategoryValue) * 100,
                            );
                            const color =
                                CATEGORY_COLORS[i % CATEGORY_COLORS.length];

                            return (
                                <div
                                    key={c.name}
                                    className="flex items-center gap-4 px-5 py-3"
                                >
                                    <span
                                        className="h-8 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div className="w-40 shrink-0 truncate text-sm font-medium sm:w-56">
                                        {c.name}
                                    </div>
                                    <div className="hidden flex-1 sm:block">
                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${barPct}%`,
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-4 text-xs tabular-nums">
                                        <span className="font-semibold">
                                            {c.value.toLocaleString()}
                                        </span>
                                        <span className="w-10 text-right text-muted-foreground">
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* ─── Filters ─── */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Search ${registry.code_label} or ${registry.name_label}...`}
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

                <div className="flex flex-wrap items-center gap-2">
                    {categories.length > 0 && (
                        <select
                            value={filters.category || ''}
                            onChange={(e) =>
                                applyFilter('category', e.target.value)
                            }
                            className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground outline-none transition hover:border-foreground/30"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    )}

                    {statuses.length > 0 && (
                        <select
                            value={filters.status || ''}
                            onChange={(e) =>
                                applyFilter('status', e.target.value)
                            }
                            className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground outline-none transition hover:border-foreground/30"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    )}

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Records table ─── */}
            {records.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        {hasFilters
                            ? 'No records match your filters'
                            : 'No records cached'}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {hasFilters
                            ? 'Try clearing the filters or search query.'
                            : `Sync ${registry.label} to populate the local cache.`}
                    </p>
                    {hasFilters ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-5"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </Button>
                    ) : (
                        can('settings.edit') &&
                        !syncing && (
                            <Button onClick={triggerSync} className="mt-5">
                                <Zap className="mr-1.5 h-4 w-4" />
                                Sync now
                            </Button>
                        )
                    )}
                </div>
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">
                                            {registry.code_label}
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            {registry.name_label}
                                        </th>
                                        {registry.columns.includes(
                                            'category',
                                        ) && (
                                            <th className="hidden px-5 py-3 font-semibold sm:table-cell">
                                                Category
                                            </th>
                                        )}
                                        {registry.columns.includes(
                                            'status',
                                        ) && (
                                            <th className="hidden px-5 py-3 font-semibold md:table-cell">
                                                Status
                                            </th>
                                        )}
                                        <th className="px-5 py-3 text-right font-semibold">
                                            Synced
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {records.data.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="transition hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                                                    {r.code ?? '—'}
                                                </code>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-medium">
                                                    {r.name}
                                                </span>
                                            </td>
                                            {registry.columns.includes(
                                                'category',
                                            ) && (
                                                <td className="hidden px-5 py-3 sm:table-cell">
                                                    {r.category ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            {r.category}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {registry.columns.includes(
                                                'status',
                                            ) && (
                                                <td className="hidden px-5 py-3 md:table-cell">
                                                    <StatusPill
                                                        status={r.status}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-5 py-3 text-right">
                                                <RelativeTimeCell
                                                    iso={r.synced_at}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={records.current_page}
                        lastPage={records.last_page}
                        total={records.total}
                        perPage={records.per_page}
                        baseUrl={`/admin/reference-data/${registry.key}`}
                        filters={{
                            q: filters.q,
                            category: filters.category,
                            status: filters.status,
                        }}
                    />
                </>
            )}

            {/* ─── Sync history ─── */}
            {jobs.length > 0 && (
                <Card className="mt-6 overflow-hidden p-0">
                    <div className="flex items-center justify-between border-b px-5 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Sync history
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                Most recent sync operations for{' '}
                                {registry.label}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                            {jobs.length} jobs
                        </Badge>
                    </div>
                    <div className="divide-y">
                        {jobs.map((j) => (
                            <JobRow key={j.id} job={j} />
                        ))}
                    </div>
                </Card>
            )}
        </>
    );
}

/* ─────── Status pill ─────── */
function StatusPill({ status }: { status: string | null }) {
    if (!status) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const lower = status.toLowerCase();
    const active = lower === 'active' || lower === 'operational';

    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                active
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
            }`}
        >
            {status}
        </span>
    );
}

/* ─────── Relative time cell ─────── */
function RelativeTimeCell({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <span className="text-[11px] text-muted-foreground">{label}</span>;
}

/* ─────── Last sync tile ─────── */
function LastSyncTile({ job }: { job: Job | undefined }) {
    const label = useRelativeTime(job?.created_at ?? null);

    return (
        <StatTile
            label="Last sync"
            value={job ? label : 'Never'}
            sub={
                job?.duration_ms
                    ? `${job.duration_ms}ms`
                    : job?.status === 'failed'
                      ? 'Failed'
                      : undefined
            }
            icon={Clock}
            tint={
                job?.status === 'failed' ? 'rose' : job ? 'emerald' : 'slate'
            }
        />
    );
}

/* ─────── Quality bar ─────── */
function QualityBar({
    label,
    subLabel,
    count,
    total,
    pct,
}: {
    label: string;
    subLabel: string;
    count: number;
    total: number;
    pct: number;
}) {
    const tone =
        pct >= 90
            ? 'bg-emerald-500'
            : pct >= 60
              ? 'bg-blue-500'
              : pct >= 30
                ? 'bg-amber-500'
                : 'bg-rose-500';

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
                <div>
                    <span className="font-medium">{label}</span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                        {subLabel}
                    </span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-muted-foreground">
                        {count.toLocaleString()} / {total.toLocaleString()}
                    </span>
                    <span className="w-10 text-right font-semibold">
                        {pct}%
                    </span>
                </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${tone}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ─────── Recent record row ─────── */
function RecentRecordRow({ record }: { record: RecentRecord }) {
    const when = useRelativeTime(record.synced_at);

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5 transition hover:bg-muted/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Hash className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{record.name}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {record.code ?? '—'}
                    {record.category && ` · ${record.category}`}
                </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
                {when}
            </span>
        </div>
    );
}

/* ─────── Performance stat pill ─────── */
function PerfStat({
    label,
    value,
    icon: Icon,
    tint,
}: {
    label: string;
    value: string;
    icon: any;
    tint: 'blue' | 'emerald' | 'rose';
}) {
    const tints: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${tints[tint]}`}
            >
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p className="font-semibold tabular-nums">{value}</p>
            </div>
        </div>
    );
}

/* ─────── Job row ─────── */
function JobRow({ job }: { job: Job }) {
    const when = useRelativeTime(job.created_at);

    const meta =
        {
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
        }[job.status] ?? {
            Icon: Activity,
            tint: 'bg-muted text-muted-foreground',
            label: job.status,
        };

    const Icon = meta.Icon;

    return (
        <div className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                >
                    <Icon
                        className={`h-3.5 w-3.5 ${job.status === 'running' ? 'animate-spin' : ''}`}
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                        Triggered by {job.source}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums sm:gap-4">
                {job.created > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">+{job.created}</span>
                        <span className="text-muted-foreground">new</span>
                    </span>
                )}
                {job.updated > 0 && (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <span className="font-semibold">↻{job.updated}</span>
                        <span className="text-muted-foreground">updated</span>
                    </span>
                )}
                {job.failed > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <span className="font-semibold">✗{job.failed}</span>
                        <span className="text-muted-foreground">failed</span>
                    </span>
                )}
                {job.duration_ms && (
                    <span className="text-muted-foreground">
                        {job.duration_ms}ms
                    </span>
                )}
                <span className="text-[11px] text-muted-foreground sm:w-20 sm:text-right">
                    {when}
                </span>
            </div>

            {job.error && (
                <p
                    className="mt-1 line-clamp-2 text-[11px] text-rose-600 dark:text-rose-400 sm:hidden"
                    title={job.error}
                >
                    {job.error}
                </p>
            )}
        </div>
    );
}

/* ─────── Stat tile ─────── */
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
    tint: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        slate: 'bg-muted text-muted-foreground',
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
            <p className="mt-2 text-lg font-bold tracking-tight tabular-nums sm:text-xl">
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