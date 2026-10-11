import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    CreditCard,
    HeartPulse,
    LogIn,
    LogOut,
    Plug,
    ShieldAlert,
    Sparkles,
    Stethoscope,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
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

type TrendPoint = {
    month: string;
    key: string;
    hospitals: number;
    logins: number;
    audits: number;
    admins: number;
};

type Stats = {
    hospitals: Metric;
    active: Metric;
    admins: Metric;
    logins: Metric;
    recent: Recent[];
    activity: ActivityRow[];
    trend: TrendPoint[];
    trend_totals: {
        hospitals: number;
        logins: number;
        audits: number;
        admins: number;
    };
    distribution: { name: string; value: number }[];
    plan_distribution: { name: string; value: number }[];
    subs_distribution: { name: string; value: number }[];
    event_distribution: { name: string; value: number }[];
    top_hospitals: { email: string; count: number }[];
    connection_health: {
        healthy: number;
        failing: number;
        incomplete: number;
        not_configured: number;
        total: number;
    };
};

const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#94A3B8'];
const PLAN_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
const SERIES = [
    { key: 'hospitals', label: 'Hospitals', color: '#10B981' },
    { key: 'logins', label: 'Logins', color: '#F59E0B' },
    { key: 'audits', label: 'Audit events', color: '#3B82F6' },
    { key: 'admins', label: 'New admins', color: '#8B5CF6' },
] as const;
const RANGE_OPTIONS = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: 'ytd', label: 'YTD' },
    { value: '12m', label: '12 months' },
];

function eventStyle(event: string) {
    if (event.includes('failed')) {
        return { Icon: ShieldAlert, wrap: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' };
    }
    if (event.includes('login') && !event.includes('logout')) {
        return { Icon: LogIn, wrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' };
    }
    if (event.includes('logout')) {
        return { Icon: LogOut, wrap: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
    }
    if (event.includes('hospital')) {
        return { Icon: Building2, wrap: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' };
    }
    if (event.includes('plan')) {
        return { Icon: CreditCard, wrap: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' };
    }
    return { Icon: Activity, wrap: 'bg-muted text-muted-foreground' };
}

function eventLabel(event: string): string {
    const map: Record<string, string> = {
        'auth.login': 'Signed in',
        'auth.logout': 'Signed out',
        'auth.failed': 'Failed sign-in',
        'hospital.created': 'Hospital created',
        'hospital.suspended': 'Hospital suspended',
        'hospital.activated': 'Hospital activated',
        'hospital.deleted': 'Hospital deleted',
        'hospital.admin.created': 'Admin added',
        'plan.created': 'Plan created',
        'plan.updated': 'Plan updated',
        'settings.updated': 'Settings updated',
        'tenant_connection.created': 'HIE connection created',
        'tenant_connection.updated': 'HIE connection updated',
        'tenant_connection.toggled': 'HIE connection toggled',
    };
    return map[event] ?? event;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'H';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function RelativeTime({ iso }: { iso: string }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

export default function AdminDashboard({
    stats,
    range,
}: {
    stats: Stats;
    range: string;
}) {
    const { props } = usePage<{
        auth?: { user?: { name: string } };
        theme?: { brand: string };
    }>();

    const firstName = props.auth?.user?.name?.split(' ')[0] ?? 'Admin';
    const brand = props.theme?.brand ?? 'YaliHealth';

    const setRange = (r: string) => {
        router.get('/', { range: r }, { preserveState: true, preserveScroll: true });
    };

    const distributionTotal = stats.distribution.reduce((s, d) => s + d.value, 0);
    const hasDistribution = distributionTotal > 0;
    const hasTrend = stats.trend.some(
        (t) => t.hospitals > 0 || t.logins > 0 || t.audits > 0 || t.admins > 0,
    );

    const connectionPct =
        stats.connection_health.total > 0
            ? Math.round(
                  (stats.connection_health.healthy / stats.connection_health.total) * 100,
              )
            : 0;

    return (
        <>
            <Head title="Dashboard" />

            {/* Hero */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-8 lg:col-span-2 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/20">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="max-w-xl flex-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <HeartPulse className="h-3 w-3" />
                                Administration
                            </span>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
                                Welcome back, {firstName} 👋
                            </h1>
                            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                                Monitor hospitals, track authentication activity, and provision new tenants on{' '}
                                <span className="font-medium text-foreground">{brand}</span>.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button asChild size="sm" className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                                    <Link href="/admin/hospitals">
                                        Manage hospitals
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/admin/onboarding">
                                        Onboard new
                                        <Sparkles className="ml-1.5 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative hidden h-44 w-72 shrink-0 sm:block">
                            <div className="absolute inset-0 -z-0 rounded-full bg-emerald-300/20 blur-3xl" />

                            <div className="absolute right-0 top-2 w-44 rounded-xl bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-medium text-muted-foreground">Visits</div>
                                    <div className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        +18%
                                    </div>
                                </div>
                                <div className="mt-3 flex h-12 items-end gap-1">
                                    {[40, 65, 35, 80, 55, 70, 45, 90].map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t bg-emerald-400/80"
                                            style={{ height: `${h}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-52 rounded-xl bg-white p-4 shadow-[0_12px_40px_rgb(0,0,0,0.08)] ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                                        <Stethoscope className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-semibold">Patient Flow</div>
                                        <div className="truncate text-[10px] text-muted-foreground">Last 7 days</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tracking-tight">1,284</span>
                                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600">
                                        <ArrowUpRight className="h-3 w-3" />
                                        12.4%
                                    </span>
                                </div>
                                <svg viewBox="0 0 100 24" className="mt-2 w-full" preserveAspectRatio="none">
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
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
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
                        <p className="mt-1 text-xs text-white/70">Insights from across the network</p>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
                    series={stats.trend.map((t) => t.hospitals)}
                    subtitle="Live and verified"
                />
                <StatCard
                    label="Administrators"
                    metric={stats.admins}
                    icon={Users}
                    tint="amber"
                    series={stats.trend.map((t) => t.admins)}
                    subtitle="Super and hospital admins"
                />
                <StatCard
                    label="Logins today"
                    metric={stats.logins}
                    icon={LogIn}
                    tint="violet"
                    series={stats.trend.map((t) => t.logins)}
                    subtitle="Super admin sign-ins"
                />
            </div>

            {/* Trend chart — all series overlaid */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Platform activity</CardTitle>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {stats.trend_totals.hospitals} new hospitals ·{' '}
                                {stats.trend_totals.logins} sign-ins ·{' '}
                                {stats.trend_totals.audits} audit events in this range
                            </p>
                        </div>

                        <div className="flex rounded-lg border bg-muted/40 p-0.5">
                            {RANGE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRange(opt.value)}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                                        range === opt.value
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!hasTrend ? (
                        <EmptyChart height={320} message="No activity recorded yet" />
                    ) : (
                        <div className="h-[340px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={stats.trend}
                                    margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                                >
                                    <defs>
                                        {SERIES.map((s) => (
                                            <linearGradient
                                                key={s.key}
                                                id={`grad-${s.key}`}
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                                                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        interval="preserveStartEnd"
                                        minTickGap={24}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        width={40}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            fontSize: 12,
                                            border: '1px solid hsl(var(--border))',
                                            background: 'hsl(var(--card))',
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                        formatter={(value) =>
                                            SERIES.find((s) => s.key === value)?.label ?? value
                                        }
                                    />
                                    {SERIES.map((s) => (
                                        <Area
                                            key={s.key}
                                            type="monotone"
                                            dataKey={s.key}
                                            stroke={s.color}
                                            strokeWidth={2}
                                            fill={`url(#grad-${s.key})`}
                                            activeDot={{ r: 4 }}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Connection health + Plans */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">HIE connection health</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Across {stats.connection_health.total} hospitals
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Plug className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold tracking-tight tabular-nums">
                                    {stats.connection_health.healthy}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    of {stats.connection_health.total} healthy
                                </span>
                            </div>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    connectionPct >= 80
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : connectionPct >= 40
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                }`}
                            >
                                {connectionPct}%
                            </span>
                        </div>
                        <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    connectionPct >= 80
                                        ? 'bg-emerald-500'
                                        : connectionPct >= 40
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                }`}
                                style={{ width: `${connectionPct}%` }}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <HealthRow label="Healthy" value={stats.connection_health.healthy} color="#10B981" />
                            <HealthRow label="Failing" value={stats.connection_health.failing} color="#EF4444" />
                            <HealthRow label="Incomplete" value={stats.connection_health.incomplete} color="#F59E0B" />
                            <HealthRow label="Not configured" value={stats.connection_health.not_configured} color="#94A3B8" />
                        </div>

                        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                            <Link href="/admin/tenant-connections">
                                Manage connections
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Plans in use</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Hospitals by subscription tier
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.plan_distribution.length === 0 ? (
                            <EmptyChart height={240} message="No plans assigned yet" />
                        ) : (
                            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                                <div className="relative h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.plan_distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats.plan_distribution.map((_, i) => (
                                                    <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                                                ))}
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
                                            Hospitals
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">
                                            {stats.plan_distribution.reduce((s, d) => s + d.value, 0)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    {stats.plan_distribution.map((d, i) => {
                                        const total = stats.plan_distribution.reduce((s, x) => s + x.value, 0);
                                        const pct = total ? Math.round((d.value / total) * 100) : 0;
                                        return (
                                            <div key={d.name} className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                                                />
                                                <span className="flex-1 truncate font-medium">{d.name}</span>
                                                <span className="tabular-nums text-muted-foreground">
                                                    {d.value} · {pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Event types + Top hospitals */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Event types</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Audit events over the last 30 days
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.event_distribution.length === 0 ? (
                            <EmptyChart height={220} message="No events yet" />
                        ) : (
                            <div
                                style={{
                                    height: Math.max(240, stats.event_distribution.length * 32),
                                }}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={stats.event_distribution}
                                        layout="vertical"
                                        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
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
                                            tickFormatter={(v: string) => eventLabel(v)}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                fontSize: 12,
                                                border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--card))',
                                            }}
                                            formatter={(v: number) => [v.toLocaleString(), 'Events']}
                                            labelFormatter={(v: string) => eventLabel(v)}
                                        />
                                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Most active</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Top 5 admins (last 30 days)
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.top_hospitals.length === 0 ? (
                            <p className="py-6 text-center text-xs text-muted-foreground">
                                No activity recorded.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {stats.top_hospitals.map((h, i) => {
                                    const max = stats.top_hospitals[0]?.count ?? 1;
                                    const pct = Math.round((h.count / max) * 100);
                                    return (
                                        <div key={h.email} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">
                                                        {i + 1}
                                                    </span>
                                                    <span className="truncate font-medium">
                                                        {h.email.split('@')[0]}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                                    {h.count}
                                                </span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Distribution + Subscriptions */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Platform distribution</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Hospitals, admins, and logins
                                </p>
                            </div>
                            <span className="text-[11px] text-muted-foreground">All time</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!hasDistribution ? (
                            <EmptyChart height={260} message="No distribution data yet" />
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
                                                {stats.distribution.map((_, i) => (
                                                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-xl font-bold tabular-nums">{distributionTotal}</div>
                                    </div>
                                </div>

                                <div className="w-full space-y-2.5">
                                    {stats.distribution.map((d, i) => {
                                        const pct = distributionTotal
                                            ? Math.round((d.value / distributionTotal) * 100)
                                            : 0;
                                        return (
                                            <div key={d.name} className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                                />
                                                <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                                                <span className="font-semibold tabular-nums">{d.value}</span>
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

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Subscriptions</CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Status across all hospitals
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                                <Zap className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.subs_distribution.length === 0 ? (
                            <EmptyChart height={240} message="No subscription data" />
                        ) : (
                            <div className="space-y-3">
                                {stats.subs_distribution.map((d) => {
                                    const total = stats.subs_distribution.reduce((s, x) => s + x.value, 0);
                                    const pct = total ? Math.round((d.value / total) * 100) : 0;
                                    const color =
                                        d.name.toLowerCase() === 'active'
                                            ? '#10B981'
                                            : d.name.toLowerCase() === 'trialing'
                                              ? '#F59E0B'
                                              : '#94A3B8';
                                    return (
                                        <div key={d.name} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="font-medium">{d.name}</span>
                                                </div>
                                                <span className="tabular-nums text-muted-foreground">
                                                    {d.value} · {pct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent lists */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent hospitals</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.hospitals.value}{' '}
                                {stats.hospitals.value === 1 ? 'tenant' : 'tenants'} on the platform
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
                                        h.name?.trim() || h.domain || h.id || 'Unnamed hospital';
                                    const active = h.status === 'active';

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
                                                        active ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium group-hover:text-primary">
                                                        {displayName}
                                                    </p>
                                                    {active && (
                                                        <span className="hidden shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline dark:bg-emerald-950/40 dark:text-emerald-400">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                    {h.domain ? `${h.domain}.localhost` : '—'}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                                                <RelativeTime iso={h.created_at} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
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
                                                <p className="truncate text-sm font-medium">{label}</p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {a.actor_email ?? 'System'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                                <RelativeTime iso={a.created_at} />
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
    tint: 'emerald' | 'blue' | 'amber' | 'violet';
    series: number[];
    subtitle: string;
}) {
    const tints: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    };

    const bars: Record<string, string> = {
        emerald: '#10B981',
        blue: '#3B82F6',
        amber: '#F59E0B',
        violet: '#8B5CF6',
    };

    const positive = metric.delta >= 0;
    const hasSeries = series.some((v) => v > 0);
    const chartData = series.map((v, i) => ({ i, v }));

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                            {metric.value.toLocaleString()}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span
                                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
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
                            <span className="text-[10px] text-muted-foreground">vs prev. 30d</span>
                        </div>
                    </div>
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${tints[tint]}`}
                    >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                </div>

                <div className="mt-3 h-12">
                    {hasSeries ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                                barCategoryGap={2}
                            >
                                <Bar dataKey="v" fill={bars[tint]} radius={[3, 3, 0, 0]} maxBarSize={14} />
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

                <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-[10px]">
                    <span className="text-muted-foreground">{subtitle}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Previous period</span>
                    <span className="font-semibold tabular-nums">
                        {metric.previous.toLocaleString()}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function HealthRow({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
            />
            <span className="flex-1 truncate text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{value}</span>
        </div>
    );
}

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