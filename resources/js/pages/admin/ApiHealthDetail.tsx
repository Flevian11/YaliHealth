import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Gauge,
    Server,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Check = {
    id: number;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latency_ms: number | null;
    http_status: number | null;
    error: string | null;
    checked_at: string;
};

type Endpoint = {
    key: string;
    label: string;
    method: string;
    path: string;
};

function statusMeta(status: Check['status']) {
    return {
        up: {
            Icon: CheckCircle2,
            tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            label: 'Up',
            color: '#10B981',
        },
        degraded: {
            Icon: AlertTriangle,
            tint: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
            label: 'Degraded',
            color: '#F59E0B',
        },
        down: {
            Icon: XCircle,
            tint: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
            label: 'Down',
            color: '#EF4444',
        },
        unknown: {
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            label: 'Unknown',
            color: '#94A3B8',
        },
    }[status];
}

export default function ApiHealthDetail({
    endpoint,
    checks,
}: {
    endpoint: Endpoint;
    checks: Check[];
}) {
    // Oldest first for the chart
    const chrono = [...checks].reverse();

    const upCount = checks.filter((c) => c.status === 'up').length;
    const downCount = checks.filter((c) => c.status === 'down').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;
    const uptime =
        checks.length > 0 ? Math.round((upCount / checks.length) * 100) : 0;

    const latencies = checks
        .filter((c) => c.latency_ms !== null)
        .map((c) => c.latency_ms as number);

    const avgLatency =
        latencies.length > 0
            ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
            : 0;

    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Latency =
        sortedLatencies.length > 0
            ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ??
              sortedLatencies[sortedLatencies.length - 1]
            : 0;

    const chartData = chrono.map((c, i) => ({
        idx: i,
        latency: c.latency_ms ?? 0,
        status: c.status,
        time: new Date(c.checked_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
    }));

    const distribution = [
        { name: 'Up', value: upCount, color: '#10B981' },
        { name: 'Degraded', value: degradedCount, color: '#F59E0B' },
        { name: 'Down', value: downCount, color: '#EF4444' },
    ].filter((d) => d.value > 0);

    // Consecutive failures from the most recent check backwards
    let consecutiveFailures = 0;
    for (const c of checks) {
        if (c.status === 'down') consecutiveFailures++;
        else break;
    }

    return (
        <>
            <Head title={`${endpoint.label} — API Health`} />

            <div className="mb-6">
                <Link
                    href="/admin/api-health"
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to API Health
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {endpoint.label}
                            </h1>
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                {endpoint.method}
                            </span>
                            {consecutiveFailures > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                    <XCircle className="h-3 w-3" />
                                    {consecutiveFailures} consecutive failure
                                    {consecutiveFailures === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {endpoint.path}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
                        <Server className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {checks.length} checks stored
                        </span>
                    </div>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile
                    label="Uptime"
                    value={`${uptime}%`}
                    sub={`${upCount} of ${checks.length}`}
                    icon={Activity}
                    tint={uptime >= 95 ? 'emerald' : uptime >= 80 ? 'amber' : 'rose'}
                />
                <StatTile
                    label="Avg latency"
                    value={`${avgLatency}ms`}
                    sub={p95Latency > 0 ? `p95 ${p95Latency}ms` : '—'}
                    icon={Gauge}
                    tint="blue"
                />
                <StatTile
                    label="Best"
                    value={`${minLatency}ms`}
                    sub="Fastest response"
                    icon={TrendingDown}
                    tint="emerald"
                />
                <StatTile
                    label="Worst"
                    value={`${maxLatency}ms`}
                    sub="Slowest response"
                    icon={TrendingUp}
                    tint="rose"
                />
            </div>

            {/* Charts row */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Latency over time
                            </CardTitle>
                            <span className="text-[11px] text-muted-foreground">
                                Last {chrono.length} checks
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: -12,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="latency-grad"
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
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        interval="preserveStartEnd"
                                        minTickGap={40}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        width={44}
                                        tickFormatter={(v) => `${v}ms`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            fontSize: 12,
                                            border: '1px solid hsl(var(--border))',
                                            background: 'hsl(var(--card))',
                                        }}
                                        formatter={(value: number) => [
                                            `${value}ms`,
                                            'Latency',
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="latency"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fill="url(#latency-grad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Status distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {distribution.length === 0 ? (
                            <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                                No data yet
                            </div>
                        ) : (
                            <>
                                <div className="relative h-[180px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {distribution.map((d, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={d.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    border: '1px solid hsl(var(--border))',
                                                    background:
                                                        'hsl(var(--card))',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-xl font-bold tracking-tight tabular-nums">
                                            {checks.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {distribution.map((d) => (
                                        <div
                                            key={d.name}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{
                                                    backgroundColor: d.color,
                                                }}
                                            />
                                            <span className="flex-1 text-muted-foreground">
                                                {d.name}
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                                {d.value}
                                            </span>
                                            <span className="w-10 text-right text-muted-foreground tabular-nums">
                                                {checks.length > 0
                                                    ? Math.round(
                                                          (d.value /
                                                              checks.length) *
                                                              100,
                                                      )
                                                    : 0}
                                                %
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status timeline */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        Status timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {chrono.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                            No checks to display.
                        </div>
                    ) : (
                        <>
                            <div className="flex h-8 items-stretch gap-0.5 overflow-hidden rounded-md">
                                {chrono.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex-1 cursor-help transition hover:opacity-80"
                                        style={{
                                            backgroundColor: statusMeta(
                                                c.status,
                                            ).color,
                                        }}
                                        title={`${statusMeta(c.status).label} — ${
                                            c.latency_ms !== null
                                                ? `${c.latency_ms}ms`
                                                : '—'
                                        } — ${new Date(c.checked_at).toISOString()}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                                <span>Oldest</span>
                                <span>Newest</span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Check history table */}
            <Card className="overflow-hidden p-0">
                <div className="border-b px-5 py-3">
                    <h2 className="text-sm font-semibold">Check history</h2>
                    <p className="text-[11px] text-muted-foreground">
                        Most recent {Math.min(checks.length, 100)} checks
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-5 py-2.5 font-semibold">
                                    Status
                                </th>
                                <th className="px-5 py-2.5 font-semibold">
                                    HTTP
                                </th>
                                <th className="px-5 py-2.5 font-semibold">
                                    Latency
                                </th>
                                <th className="px-5 py-2.5 font-semibold">
                                    Detail
                                </th>
                                <th className="px-5 py-2.5 text-right font-semibold">
                                    When
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {checks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-8 text-center text-xs text-muted-foreground"
                                    >
                                        No checks recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                checks.map((c) => {
                                    const meta = statusMeta(c.status);
                                    const Icon = meta.Icon;
                                    return (
                                        <tr
                                            key={c.id}
                                            className="transition hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${meta.tint}`}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-xs font-medium">
                                                        {meta.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs tabular-nums">
                                                    {c.http_status ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`font-mono text-xs tabular-nums ${
                                                        c.latency_ms !== null &&
                                                        c.latency_ms >= 2000
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : ''
                                                    }`}
                                                >
                                                    {c.latency_ms !== null
                                                        ? `${c.latency_ms}ms`
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="block max-w-xs truncate text-xs text-muted-foreground"
                                                    title={c.error ?? 'OK'}
                                                >
                                                    {c.error ?? 'OK'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <RelativeTimeCell
                                                    iso={c.checked_at}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}

function RelativeTimeCell({ iso }: { iso: string }) {
    const label = useRelativeTime(iso);
    return (
        <span className="text-xs text-muted-foreground">{label}</span>
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
    sub: string;
    icon: any;
    tint: 'emerald' | 'amber' | 'rose' | 'blue';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        amber:
            'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
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
                {value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
        </Card>
    );
}