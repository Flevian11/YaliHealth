import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    BookOpen,
    CheckCircle2,
    Clock,
    Database,
    FlaskConical,
    Layers,
    LoaderCircle,
    Package,
    Pill,
    RefreshCw,
    Search,
    Sparkles,
    Tag,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
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

type Concept = {
    id: number;
    source: string;
    code: string;
    title: string;
    chapter_code: string | null;
    chapter_title: string | null;
    block_title: string | null;
    is_leaf: boolean;
    synonyms_count: number;
    synced_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type SourceCard = {
    key: string;
    label: string;
    full_label: string;
    description: string;
    icon: string;
    records_estimate: number;
    color: string;
    concepts: number;
    last_sync: string | null;
    is_syncing: boolean;
};

type Chapter = { code: string; title: string; count: number };
type Slice = { name: string; value: number };
type Stats = {
    total_concepts: number;
    total_sources: number;
    total_mappings: number;
    total_chapters: number;
    last_sync_at: string | null;
};

type Job = {
    id: number;
    source: string;
    status: string;
    concepts_created: number;
    concepts_updated: number;
    mappings_created: number;
    duration_ms: number | null;
    error: string | null;
    created_at: string;
    completed_at: string | null;
};

const ICONS: Record<string, any> = {
    'book-open': BookOpen,
    pill: Pill,
    flask: FlaskConical,
};

function iconFor(key: string): any {
    return ICONS[key] ?? Database;
}

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

export default function Terminology({
    concepts,
    sources,
    chapters,
    sourceDistribution,
    chapterDistribution,
    stats,
    jobs,
    filters,
}: {
    concepts: Paginator<Concept>;
    sources: SourceCard[];
    chapters: Chapter[];
    sourceDistribution: Slice[];
    chapterDistribution: Slice[];
    stats: Stats;
    jobs: Job[];
    filters: { q: string; source: string; chapter: string };
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [query, setQuery] = useState(filters.q ?? '');
    const [source, setSource] = useState(filters.source ?? 'ICD-11');
    const [chapter, setChapter] = useState(filters.chapter ?? '');
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [syncingSource, setSyncingSource] = useState<string | null>(null);
    const firstRender = useRef(true);
    const pollRef = useRef<number | null>(null);

    /* Debounced search */
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/terminology',
                {
                    q: query,
                    source,
                    chapter: chapter || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['concepts', 'filters', 'chapters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query, source, chapter]);

    /* Polling for sync completion */
    useEffect(() => {
        if (!syncingSource) {
            if (pollRef.current !== null) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        pollRef.current = window.setInterval(async () => {
            try {
                const res = await fetch(
                    `/admin/terminology/sync/${syncingSource}`,
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
                    setSyncingSource(null);
                    setSyncDialogOpen(false);
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
    }, [syncingSource]);

    const triggerSync = (key: string) => {
        setSyncingSource(key);
        setSyncDialogOpen(true);
        router.post(
            `/admin/terminology/sync/${key}`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const triggerSyncAll = () => {
        setSyncingSource('all');
        setSyncDialogOpen(true);
        router.post(
            '/admin/terminology/sync-all',
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const closeSyncDialog = () => {
        if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setSyncDialogOpen(false);
        setSyncingSource(null);
        router.reload({ only: ['sources', 'stats', 'jobs', 'concepts'] });
    };

    const activeSource = sources.find((s) => s.key === source);

    return (
        <>
            <Head title="Terminology" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Terminology
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Standardized clinical vocabulary — diagnoses, drugs, and
                        observations.
                    </p>
                </div>
                {can('settings.edit') && (
                    <Button onClick={triggerSyncAll} disabled={!!syncingSource}>
                        {syncingSource === 'all' ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="mr-1.5 h-4 w-4" />
                        )}
                        {syncingSource === 'all' ? 'Syncing...' : 'Sync all sources'}
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
                    label="Total concepts"
                    value={stats.total_concepts.toLocaleString()}
                    sub={`across ${stats.total_sources} sources`}
                    icon={Database}
                    tint="emerald"
                />
                <StatTile
                    label="ICD-11 chapters"
                    value={stats.total_chapters.toString()}
                    sub="Diagnostic groupings"
                    icon={Layers}
                    tint="blue"
                />
                <StatTile
                    label="Mappings"
                    value={stats.total_mappings.toLocaleString()}
                    sub="Parent-child relations"
                    icon={Tag}
                    tint="amber"
                />
                <LastSyncTile iso={stats.last_sync_at} />
            </div>

            {/* Source cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((s) => (
                    <SourceCardView
                        key={s.key}
                        source={s}
                        active={source === s.key}
                        onSelect={() => setSource(s.key)}
                        onSync={() => triggerSync(s.key)}
                        canSync={can('settings.edit')}
                    />
                ))}
            </div>

            {/* Charts */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Chapter distribution
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Top {chapterDistribution.length} chapters in{' '}
                                    {activeSource?.label ?? source}
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <BookOpen className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {chapterDistribution.length === 0 ? (
                            <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                                No chapter data yet
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: Math.max(
                                        240,
                                        chapterDistribution.length * 32,
                                    ),
                                }}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chapterDistribution}
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
                                            tick={{ fontSize: 11 }}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11 }}
                                            width={160}
                                            tickFormatter={(v: string) =>
                                                v.length > 22
                                                    ? v.substring(0, 20) + '…'
                                                    : v
                                            }
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                fontSize: 12,
                                                border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--card))',
                                            }}
                                            formatter={(v: number) => [
                                                v.toLocaleString(),
                                                'Concepts',
                                            ]}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#10B981"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={22}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    By source
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Concept count across vocabularies
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sourceDistribution.length === 0 ? (
                            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                                No data yet
                            </div>
                        ) : (
                            <>
                                <div className="relative h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sourceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {sourceDistribution.map((d, i) => {
                                                    const src = sources.find(
                                                        (s) => s.key === d.name,
                                                    );
                                                    return (
                                                        <Cell
                                                            key={i}
                                                            fill={
                                                                src?.color ??
                                                                '#94A3B8'
                                                            }
                                                        />
                                                    );
                                                })}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    border: '1px solid hsl(var(--border))',
                                                    background: 'hsl(var(--card))',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">
                                            {stats.total_concepts.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {sourceDistribution.map((d) => {
                                        const src = sources.find(
                                            (s) => s.key === d.name,
                                        );
                                        return (
                                            <div
                                                key={d.name}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            src?.color ?? '#94A3B8',
                                                    }}
                                                />
                                                <span className="flex-1 truncate text-muted-foreground">
                                                    {src?.label ?? d.name}
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                    {d.value.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search code or title..."
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

                {chapters.length > 0 && (
                    <select
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        className="h-9 max-w-md rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground outline-none transition hover:border-foreground/30"
                    >
                        <option value="">All chapters</option>
                        {chapters.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.code} · {c.title} ({c.count})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Table */}
            {concepts.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        {filters.q || filters.chapter
                            ? 'No concepts match'
                            : 'No concepts cached'}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {filters.q || filters.chapter
                            ? 'Try clearing the search or filter.'
                            : `Sync ${activeSource?.label} to populate.`}
                    </p>
                </div>
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">
                                            Code
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Title
                                        </th>
                                        <th className="hidden px-5 py-3 font-semibold md:table-cell">
                                            Chapter
                                        </th>
                                        <th className="hidden px-5 py-3 font-semibold lg:table-cell">
                                            Synonyms
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold">
                                            Synced
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {concepts.data.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="group cursor-pointer transition hover:bg-muted/40"
                                            onClick={() =>
                                                router.visit(
                                                    `/admin/terminology/${c.source}/${encodeURIComponent(c.code)}`,
                                                )
                                            }
                                        >
                                            <td className="px-5 py-3">
                                                <code className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    {c.code}
                                                </code>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                                                        {c.title}
                                                    </span>
                                                    {!c.is_leaf && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="shrink-0 text-[9px]"
                                                        >
                                                            Parent
                                                        </Badge>
                                                    )}
                                                </div>
                                                {c.block_title && (
                                                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                                        {c.block_title}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3 md:table-cell">
                                                {c.chapter_title ? (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                            {c.chapter_code}
                                                        </span>
                                                        <span className="line-clamp-1 text-muted-foreground">
                                                            {c.chapter_title}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3 lg:table-cell">
                                                {c.synonyms_count > 0 ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px]"
                                                    >
                                                        {c.synonyms_count}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <RelativeTime iso={c.synced_at} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={concepts.current_page}
                        lastPage={concepts.last_page}
                        total={concepts.total}
                        perPage={concepts.per_page}
                        baseUrl="/admin/terminology"
                        filters={{
                            q: filters.q,
                            source: filters.source,
                            chapter: filters.chapter,
                        }}
                    />
                </>
            )}

            {/* Sync history */}
            {jobs.length > 0 && (
                <Card className="mt-6 overflow-hidden p-0">
                    <div className="border-b px-5 py-3">
                        <h2 className="text-sm font-semibold">Sync history</h2>
                        <p className="text-[11px] text-muted-foreground">
                            Most recent sync operations across all sources
                        </p>
                    </div>
                    <div className="divide-y">
                        {jobs.map((j) => (
                            <JobRow key={j.id} job={j} />
                        ))}
                    </div>
                </Card>
            )}

            {/* Sync dialog */}
            <Dialog
                open={syncDialogOpen}
                onOpenChange={(o) => !o && closeSyncDialog()}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                            Syncing terminology
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-3 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {syncingSource === 'all'
                                ? 'Fetching concepts from all sources...'
                                : `Fetching concepts from ${syncingSource}...`}
                        </p>
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                            <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-muted-foreground">
                                The page will update automatically when
                                complete.
                            </span>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={closeSyncDialog}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SourceCardView({
    source,
    active,
    onSelect,
    onSync,
    canSync,
}: {
    source: SourceCard;
    active: boolean;
    onSelect: () => void;
    onSync: () => void;
    canSync: boolean;
}) {
    const Icon = iconFor(source.icon);
    const lastSync = useRelativeTime(source.last_sync);
    const coverage =
        source.records_estimate > 0
            ? Math.min(
                  100,
                  Math.round((source.concepts / source.records_estimate) * 100),
              )
            : null;

    return (
        <Card
            className={`flex flex-col transition ${
                active ? 'ring-2 ring-primary/40' : ''
            }`}
        >
            <button
                type="button"
                onClick={onSelect}
                className="flex items-start gap-3 p-5 pb-3 text-left"
            >
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: source.color }}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold">
                            {source.label}
                        </p>
                        {source.is_syncing && (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                        {source.full_label}
                    </p>
                </div>
            </button>

            <div className="flex-1 px-5 pb-4">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                    {source.description}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Concepts
                        </p>
                        <p className="text-lg font-bold tabular-nums">
                            {source.concepts.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Last sync
                        </p>
                        <p className="text-sm font-medium">
                            {source.last_sync ? lastSync : 'Never'}
                        </p>
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
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${coverage}%`,
                                    backgroundColor: source.color,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 border-t px-5 py-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onSelect}
                >
                    Browse
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                {canSync && (
                    <Button
                        size="sm"
                        onClick={onSync}
                        disabled={source.is_syncing}
                        className="h-8 px-2.5"
                    >
                        {source.is_syncing ? (
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
            Icon: Database,
            tint: 'bg-muted text-muted-foreground',
            label: job.status,
        };

    const Icon = meta.Icon;

    return (
        <div className="flex items-center gap-4 px-5 py-3 text-sm">
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
            >
                <Icon
                    className={`h-3.5 w-3.5 ${job.status === 'running' ? 'animate-spin' : ''}`}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{job.source}</p>
                <p className="text-[11px] text-muted-foreground">
                    {meta.label}
                </p>
            </div>
            <div className="hidden items-center gap-4 text-xs tabular-nums sm:flex">
                {job.concepts_created > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                        +{job.concepts_created}
                    </span>
                )}
                {job.concepts_updated > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                        ↻{job.concepts_updated}
                    </span>
                )}
                {job.mappings_created > 0 && (
                    <span className="text-violet-600 dark:text-violet-400">
                        {job.mappings_created} maps
                    </span>
                )}
                {job.duration_ms && (
                    <span className="text-muted-foreground">
                        {job.duration_ms}ms
                    </span>
                )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
                {when}
            </span>
        </div>
    );
}

function LastSyncTile({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return (
        <StatTile
            label="Last sync"
            value={iso ? label : 'Never'}
            sub="Across all sources"
            icon={Clock}
            tint={iso ? 'emerald' : 'slate'}
        />
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
    tint: 'emerald' | 'blue' | 'amber' | 'slate';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
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