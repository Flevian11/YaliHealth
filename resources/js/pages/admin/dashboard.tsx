import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    CheckCircle2,
    HeartPulse,
    LogIn,
    LogOut,
    ShieldAlert,
    Stethoscope,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Metric = { value: number; previous: number; delta: number };

type Recent = {
    id: string;
    name: string;
    domain: string | null;
    status: string;
    created_at: string;
};

type ActivityRow = {
    id: number;
    event: string;
    actor_email: string | null;
    created_at: string;
};

type Stats = {
    hospitals: Metric;
    active: Metric;
    admins: Metric;
    logins: Metric;
    recent: Recent[];
    activity: ActivityRow[];
    trend: { month: string; hospitals: number; logins: number }[];
    distribution: { name: string; value: number }[];
};

const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#94A3B8'];

/* ───── Event styling map ───── */
function eventStyle(event: string) {
    if (event.includes('failed')) {
        return {
            Icon: ShieldAlert,
            wrap: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        };
    }
    if (event.includes('login') && !event.includes('logout')) {
        return {
            Icon: LogIn,
            wrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        };
    }
    if (event.includes('logout')) {
        return {
            Icon: LogOut,
            wrap: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        };
    }
    if (event.includes('hospital')) {
        return {
            Icon: Building2,
            wrap: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        };
    }
    return {
        Icon: Activity,
        wrap: 'bg-muted text-muted-foreground',
    };
}

/* ───── Human-readable event label ───── */
function eventLabel(event: string): string {
    const map: Record<string, string> = {
        'auth.login': 'Signed in',
        'auth.logout': 'Signed out',
        'auth.failed': 'Failed sign-in',
        'hospital.created': 'Hospital created',
    };
    return map[event] ?? event;
}

/* ───── Relative time ───── */
function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });
}

/* ───── Initials for hospital ───── */
function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'H';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AdminDashboard({ stats }: { stats: Stats }) {
    const { props } = usePage<{
        auth?: { user?: { name: string } };
        theme?: { brand: string };
    }>();

    const firstName = props.auth?.user?.name?.split(' ')[0] ?? 'Admin';
    const brand = props.theme?.brand ?? 'YaliHealth';

    const distributionTotal = stats.distribution.reduce(
        (s, d) => s + d.value,
        0,
    );
    const hasDistribution = distributionTotal > 0;
    const trendHasData = stats.trend.some(
        (t) => t.hospitals > 0 || t.logins > 0,
    );

    return (
        <>
            <Head title="Dashboard" />

            {/* Hero banner */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-8 lg:col-span-2 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/20">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="max-w-xl flex-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <HeartPulse className="h-3 w-3" />
                                Administration
                            </span>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
                                Welcome back, {firstName} 👋
                            </h1>
                            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                                Monitor hospitals, track authentication
                                activity, and provision new tenants on{' '}
                                <span className="font-medium text-foreground">
                                    {brand}
                                </span>
                                .
                            </p>
                            <Button
                                asChild
                                size="sm"
                                className="mt-5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                            >
                                <Link href="/admin/hospitals">
                                    Manage hospitals
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>

                        <div className="relative hidden h-44 w-72 shrink-0 sm:block">
                            <div className="absolute inset-0 -z-0 rounded-full bg-emerald-300/20 blur-3xl" />

                            <div className="absolute right-0 top-2 w-44 rounded-xl bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-medium text-muted-foreground">
                                        Visits
                                    </div>
                                    <div className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        +18%
                                    </div>
                                </div>
                                <div className="mt-3 flex h-12 items-end gap-1">
                                    {[40, 65, 35, 80, 55, 70, 45, 90].map(
                                        (h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t bg-emerald-400/80"
                                                style={{ height: `${h}%` }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-52 rounded-xl bg-white p-4 shadow-[0_12px_40px_rgb(0,0,0,0.08)] ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                                        <Stethoscope className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-semibold">
                                            Patient Flow
                                        </div>
                                        <div className="truncate text-[10px] text-muted-foreground">
                                            Last 7 days
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tracking-tight">
                                        1,284
                                    </span>
                                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600">
                                        <ArrowUpRight className="h-3 w-3" />
                                        12.4%
                                    </span>
                                </div>
                                <svg
                                    viewBox="0 0 100 24"
                                    className="mt-2 w-full"
                                    preserveAspectRatio="none"
                                >
                                    <polyline
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points="0,18 15,14 30,16 45,9 60,12 75,7 100,4"
                                    />
                                </svg>
                            </div>

                            <div className="absolute right-8 top-24 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-card">
                                <HeartPulse className="h-4 w-4 text-rose-500" />
                            </div>
                            <div className="absolute left-40 top-0 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 shadow-md">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative min-h-[220px] overflow-hidden rounded-2xl border bg-card">
                    <img
                        src="/images/dashboard-hero.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                            (
                                e.currentTarget as HTMLImageElement
                            ).style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                            Featured
                        </span>
                        <p className="mt-2 text-base font-semibold leading-snug">
                            Exploring the hidden gems of digital health
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                            Insights from across the network
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Total Hospitals"
                    metric={stats.hospitals}
                    icon={Building2}
                    tint="emerald"
                    series={stats.trend.map((t) => t.hospitals)}
                    subtitle="Registered tenants"
                />
                <StatCard
                    label="Active Hospitals"
                    metric={stats.active}
                    icon={CheckCircle2}
                    tint="blue"
                    series={stats.trend.map((t) =>
                        Math.max(0, t.hospitals - 1),
                    )}
                    subtitle="Live and verified"
                />
                <StatCard
                    label="Administrators"
                    metric={stats.admins}
                    icon={Users}
                    tint="amber"
                    series={stats.trend.map((t) => t.logins)}
                    subtitle="Super and hospital admins"
                />
            </div>

            {/* Charts row */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Distribution
                            </CardTitle>
                            <span className="text-[11px] text-muted-foreground">
                                All time
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!hasDistribution ? (
                            <EmptyChart
                                height={280}
                                message="No distribution data yet"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                <div className="relative h-[180px] w-[180px] shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={58}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats.distribution.map(
                                                    (_, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={
                                                                DONUT_COLORS[
                                                                    i %
                                                                        DONUT_COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-xl font-bold tracking-tight">
                                            {distributionTotal}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full space-y-2.5">
                                    {stats.distribution.map((d, i) => {
                                        const pct = distributionTotal
                                            ? Math.round(
                                                  (d.value / distributionTotal) *
                                                      100,
                                              )
                                            : 0;
                                        return (
                                            <div
                                                key={d.name}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            DONUT_COLORS[
                                                                i %
                                                                    DONUT_COLORS.length
                                                            ],
                                                    }}
                                                />
                                                <span className="flex-1 truncate text-muted-foreground">
                                                    {d.name}
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                    {d.value}
                                                </span>
                                                <span className="w-8 text-right text-muted-foreground tabular-nums">
                                                    {pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Platform activity
                            </CardTitle>
                            <div className="flex items-center gap-3 text-[11px]">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">
                                        Hospitals
                                    </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground">
                                        Logins
                                    </span>
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!trendHasData ? (
                            <EmptyChart
                                height={280}
                                message="No activity recorded yet"
                            />
                        ) : (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={stats.trend}
                                        margin={{
                                            top: 10,
                                            right: 8,
                                            left: -12,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="g-hospitals"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#10B981"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#10B981"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="g-logins"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#F59E0B"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#F59E0B"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: 'hsl(var(--muted-foreground))',
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: 'hsl(var(--muted-foreground))',
                                            }}
                                            width={36}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                fontSize: 12,
                                                border: '1px solid hsl(var(--border))',
                                                background:
                                                    'hsl(var(--card))',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="hospitals"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            fill="url(#g-hospitals)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="logins"
                                            stroke="#F59E0B"
                                            strokeWidth={2}
                                            fill="url(#g-logins)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ──────── Lists row (refined) ──────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent hospitals */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Recent hospitals
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.hospitals.value}{' '}
                                {stats.hospitals.value === 1
                                    ? 'tenant'
                                    : 'tenants'}{' '}
                                on the platform
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/admin/hospitals"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {stats.recent.length === 0 ? (
                            <EmptyList message="No hospitals yet" />
                        ) : (
                            <div className="divide-y">
                                {stats.recent.map((h) => {
                                    const displayName =
                                        h.name?.trim() ||
                                        h.domain ||
                                        h.id ||
                                        'Unnamed hospital';
                                    const active =
                                        h.status === 'active';

                                    return (
                                        <Link
                                            key={h.id}
                                            href="/admin/hospitals"
                                            className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary">
                                                    {initials(displayName)}
                                                </div>
                                                <span
                                                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                                                        active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-slate-400'
                                                    }`}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium">
                                                        {displayName}
                                                    </p>
                                                    {active && (
                                                        <span className="hidden shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline dark:bg-emerald-950/40 dark:text-emerald-400">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                    {h.domain
                                                        ? `${h.domain}.localhost`
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[11px] text-muted-foreground">
                                                    {new Date(
                                                        h.created_at,
                                                    ).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent activity */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Recent activity
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Latest authentication and system events
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/admin/audit-logs"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {stats.activity.length === 0 ? (
                            <EmptyList message="No activity recorded yet" />
                        ) : (
                            <div className="divide-y">
                                {stats.activity.map((a) => {
                                    const { Icon, wrap } = eventStyle(a.event);
                                    const label = eventLabel(a.event);

                                    return (
                                        <div
                                            key={a.id}
                                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${wrap}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {label}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {a.actor_email ??
                                                        'System'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                                {relativeTime(a.created_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   Stat card
   ───────────────────────────────────────────── */
function StatCard({
    label,
    metric,
    icon: Icon,
    tint,
    series,
    subtitle,
}: {
    label: string;
    metric: Metric;
    icon: any;
    tint: 'emerald' | 'blue' | 'amber';
    series: number[];
    subtitle: string;
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    };

    const bars: Record<string, string> = {
        emerald: '#10B981',
        blue: '#3B82F6',
        amber: '#F59E0B',
    };

    const positive = metric.delta >= 0;
    const hasSeries = series.some((v) => v > 0);
    const chartData = series.map((v, i) => ({ i, v }));

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                            {metric.value.toLocaleString()}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                    positive
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                }`}
                            >
                                {positive ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {positive ? '+' : ''}
                                {metric.delta}%
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                vs prev. 30d
                            </span>
                        </div>
                    </div>
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tints[tint]}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <div className="mt-4 h-14">
                    {hasSeries ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                                barCategoryGap={2}
                            >
                                <Bar
                                    dataKey="v"
                                    fill={bars[tint]}
                                    radius={[3, 3, 0, 0]}
                                    maxBarSize={14}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-end gap-1 opacity-30">
                            {[40, 65, 35, 80, 55, 70, 45, 60].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-t bg-muted-foreground/40"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]">
                    <span className="text-muted-foreground">{subtitle}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                        Previous period
                    </span>
                    <span className="font-semibold tabular-nums">
                        {metric.previous.toLocaleString()}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

/* ─────────────────────────────────────────────
   Empty states
   ───────────────────────────────────────────── */
function EmptyChart({ height, message }: { height: number; message: string }) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed"
            style={{ height }}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

function EmptyList({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}