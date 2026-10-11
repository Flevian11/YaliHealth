import { useTenantPermissions } from '@/hooks/use-tenant-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BedDouble,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    FileText,
    FlaskConical,
    HeartPulse,
    KeyRound,
    LogIn,
    LogOut,
    Megaphone,
    Network,
    Pill,
    Plus,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    TrendingUp,
    UserPlus,
    Users,
    WifiOff,
} from 'lucide-react';
import { useState } from 'react';
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

type Hospital = {
    id: string;
    name: string;
    plan: string | null;
    subscription_status: string;
    trial_ends_at: string | null;
};

type UserInfo = {
    name: string;
    email: string;
    role: string;
    last_login_at: string | null;
};

type Connection = {
    status: string;
    environment: string;
    last_verified_at: string | null;
    last_verified_latency_ms: number | null;
    facility_fr_code: string | null;
    facility_name: string | null;
};

type Stats = {
    staff: number;
    total_patients: number;
    patients_today: number;
    patients_week: number;
};

type TrendPoint = {
    date: string;
    full_date: string;
    patients: number;
};

type RecentPatient = {
    id: number;
    number: string;
    name: string;
    insurance_type: string;
    created_at: string;
};

type ActivityRow = {
    id: number;
    event: string;
    actor_email: string | null;
    created_at: string;
};

const INSURANCE_COLORS: Record<string, string> = {
    cash: '#64748B',
    sha: '#10B981',
    private: '#3B82F6',
};

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
    if (event.includes('patient')) {
        return {
            Icon: Users,
            wrap: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        };
    }
    return { Icon: Activity, wrap: 'bg-muted text-muted-foreground' };
}

function eventLabel(event: string): string {
    const map: Record<string, string> = {
        'auth.login': 'Signed in',
        'auth.logout': 'Signed out',
        'auth.failed': 'Failed sign-in',
        'auth.login.cross_domain_adopted': 'Signed in',
        'auth.login.otp_verified': 'Signed in via OTP',
        'patient.created': 'Patient registered',
    };
    return map[event] ?? event;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function RelativeTime({ iso }: { iso: string }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

function connectionMeta(status: string | undefined) {
    return (
        {
            healthy: {
                label: 'Connected',
                Icon: CheckCircle2,
                tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            },
            failing: {
                label: 'Failing',
                Icon: ShieldAlert,
                tint: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            },
            incomplete: {
                label: 'Incomplete',
                Icon: Clock,
                tint: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
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
        }[status ?? 'unverified'] ?? {
            label: 'Not configured',
            Icon: WifiOff,
            tint: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        }
    );
}

export default function TenantDashboard({
    hospital,
    user,
    connection,
    stats,
    trend,
    recent_patients,
    recent_activity,
}: {
    hospital: Hospital;
    user: UserInfo;
    connection: Connection | null;
    stats: Stats;
    trend: TrendPoint[];
    recent_patients: RecentPatient[];
    recent_activity: ActivityRow[];
}) {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';
    const firstName = user.name.split(' ')[0] || user.name;
    const { can } = useTenantPermissions();

    const connMeta = connectionMeta(connection?.status);
    const ConnIcon = connMeta.Icon;
    const canCreatePatient = can('patients.create');

    const trendHasData = trend.some((t) => t.patients > 0);

    // Insurance distribution (from recent patients as a proxy)
    const insuranceDist = (() => {
        const counts: Record<string, number> = {};
        recent_patients.forEach((p) => {
            counts[p.insurance_type] =
                (counts[p.insurance_type] ?? 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name === 'sha' ? 'SHA / SHIF' : name === 'private' ? 'Private insurance' : 'Cash',
            value,
            color: INSURANCE_COLORS[name] ?? '#94A3B8',
        }));
    })();

    const insuranceTotal = insuranceDist.reduce((s, d) => s + d.value, 0);

    return (
        <>
            <Head title="Dashboard" />

                        {/* ───────── Hero banner ───────── */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-8 lg:col-span-2 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
                    {/* Decorative blur orbs */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-800/20" />
                        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-800/20" />
                    </div>

                    <div className="relative flex items-center gap-6">
                        <div className="max-w-xl flex-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-100/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur-sm dark:border-emerald-800/80 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <HeartPulse className="h-3 w-3" />
                                {hospital.name}
                            </span>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
                                {greeting()}, {firstName} 👋
                            </h1>
                            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                                Here's your hospital at a glance. Manage
                                patients, claims, and HIE interactions from
                                one connected workspace.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {canCreatePatient && (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        <Link href="/patients?create=1">
                                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                            New Patient
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                >
                                    <Link href="/patients">
                                        <Users className="mr-1.5 h-3.5 w-3.5" />
                                        View Patients
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Connection card */}
                        <div className="relative hidden h-44 w-64 shrink-0 sm:block">
                            <div className="relative h-full rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        HIE Status
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${connMeta.tint}`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                connection?.status === 'healthy'
                                                    ? 'bg-emerald-500'
                                                    : connection?.status === 'failing'
                                                      ? 'bg-rose-500'
                                                      : 'bg-amber-500'
                                            }`}
                                        />
                                        {connMeta.label}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-2.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <ConnIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {connection
                                                ? connection.facility_name ??
                                                  'HIE Connected'
                                                : 'Not configured'}
                                        </p>
                                        {connection?.facility_fr_code ? (
                                            <p className="truncate font-mono text-[10px] text-muted-foreground">
                                                {connection.facility_fr_code}
                                            </p>
                                        ) : (
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                Contact {brand} support
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {connection?.environment && (
                                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] text-muted-foreground">
                                        <span className="uppercase tracking-wider">
                                            {connection.environment}
                                        </span>
                                        {connection.last_verified_latency_ms && (
                                            <span className="tabular-nums">
                                                {connection.last_verified_latency_ms}ms
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured card */}
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
                            Module rolling out
                        </span>
                        <p className="mt-2 text-base font-semibold leading-snug">
                            Claims & Preauths
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                            Submit to SHA in real time from the workspace
                        </p>
                    </div>
                </div>
            </div>


            {/* ───────── Stat cards ───────── */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard
                    label="Patients registered"
                    value={stats.total_patients}
                    delta={stats.patients_week > 0 ? 12.4 : 0}
                    icon={Users}
                    tint="emerald"
                    sub={
                        stats.patients_today > 0
                            ? `${stats.patients_today} today`
                            : 'All time'
                    }
                    sparkline={trend.map((t) => t.patients)}
                />
                <StatCard
                    label="This week"
                    value={stats.patients_week}
                    delta={stats.patients_week > 0 ? 8.2 : 0}
                    icon={TrendingUp}
                    tint="blue"
                    sub="New registrations"
                    sparkline={trend.map((t) => t.patients)}
                />
                <StatCard
                    label="Active claims"
                    value={0}
                    delta={0}
                    icon={FileText}
                    tint="amber"
                    sub="Module coming soon"
                    sparkline={[0, 0, 0, 0, 0, 0, 0]}
                />
                <StatCard
                    label="Staff"
                    value={stats.staff}
                    delta={0}
                    icon={Users}
                    tint="violet"
                    sub={stats.staff === 1 ? '1 account' : `${stats.staff} accounts`}
                    sparkline={[0, 1, 1, 2, 2, 2, stats.staff]}
                />
            </div>

            {/* ───────── Trend + Insurance distribution ───────── */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Patient registrations
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Last 7 days — {stats.patients_week} new{' '}
                                    {stats.patients_week === 1 ? 'patient' : 'patients'}
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                7 days
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!trendHasData ? (
                            <EmptyChart
                                height={280}
                                message="Patient registration module coming soon"
                            />
                        ) : (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={trend}
                                        margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="g-patients" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="hsl(var(--border))"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                                            labelFormatter={(_, payload) =>
                                                payload?.[0]?.payload?.full_date ?? ''
                                            }
                                            formatter={(v: number) => [
                                                v,
                                                v === 1 ? 'Patient' : 'Patients',
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="patients"
                                            stroke="#10B981"
                                            strokeWidth={2.5}
                                            fill="url(#g-patients)"
                                        />
                                    </AreaChart>
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
                                    Insurance mix
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Recent registrations
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {insuranceDist.length === 0 ? (
                            <EmptyChart height={220} message="No patients registered yet" />
                        ) : (
                            <>
                                <div className="relative h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={insuranceDist}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {insuranceDist.map((d, i) => (
                                                    <Cell key={i} fill={d.color} />
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
                                            Total
                                        </div>
                                        <div className="text-xl font-bold tabular-nums">
                                            {insuranceTotal}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {insuranceDist.map((d) => (
                                        <div
                                            key={d.name}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: d.color }}
                                            />
                                            <span className="flex-1 truncate text-muted-foreground">
                                                {d.name}
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                                {d.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ───────── Modules grid + Activity ───────── */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Your workspace
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Modules being prepared for your hospital
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Rolling out
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                {
                                    icon: Users,
                                    label: 'Patient Registry',
                                    desc: 'Register, search, and manage patient records',
                                    href: '/patients',
                                    active: true,
                                    permission: 'patients.view',
                                },
                                {
                                    icon: Stethoscope,
                                    label: 'Clinical Encounters',
                                    desc: 'Document visits with ICD-11 coding',
                                    permission: 'encounters.view',
                                },
                                {
                                    icon: Pill,
                                    label: 'Prescriptions',
                                    desc: 'Standardized dosing and dispensing',
                                    permission: 'prescriptions.view',
                                },
                                {
                                    icon: FileText,
                                    label: 'Claims & Preauths',
                                    desc: 'Submit and track SHA claims in real time',
                                    permission: 'hie.claims.view',
                                },
                                {
                                    icon: ClipboardList,
                                    label: 'Shared Health Records',
                                    desc: 'Exchange FHIR bundles with the national SHR',
                                    permission: 'hie.shr.read',
                                },
                                {
                                    icon: Coins,
                                    label: 'Billing & Invoices',
                                    desc: 'Reconcile remittances and payouts',
                                    permission: 'invoices.view',
                                },
                            ]
                                .filter((m) => can(m.permission))
                                .map((m) => {
                                    const Card = m.active ? Link : 'div';
                                    const props: any = m.active
                                        ? {
                                              href: m.href,
                                              className:
                                                  'group flex items-start gap-3 rounded-lg border bg-card p-3.5 transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800',
                                          }
                                        : {
                                              className:
                                                  'flex items-start gap-3 rounded-lg border bg-card p-3.5 opacity-70',
                                          };

                                    return (
                                        <Card key={m.label} {...props}>
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                    m.active
                                                        ? 'bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                }`}
                                            >
                                                <m.icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium">
                                                        {m.label}
                                                    </p>
                                                    {!m.active && (
                                                        <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                            Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                    {m.desc}
                                                </p>
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Recent activity
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Latest events in your hospital
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recent_activity.length === 0 ? (
                            <EmptyList message="No activity yet" />
                        ) : (
                            <div className="divide-y">
                                {recent_activity.map((a) => {
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

            {/* ───────── Recent patients + Onboarding ───────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Recent patients
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.total_patients}{' '}
                                {stats.total_patients === 1
                                    ? 'patient'
                                    : 'patients'}{' '}
                                registered
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/patients"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {recent_patients.length === 0 ? (
                            <EmptyList message="No patients registered yet" />
                        ) : (
                            <div className="divide-y">
                                {recent_patients.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            {initials(p.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {p.name}
                                            </p>
                                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                {p.number}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-[11px] text-muted-foreground">
                                            <RelativeTime iso={p.created_at} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Getting started
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    A few steps to complete your hospital setup
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {
                                    [
                                        true,
                                        !!connection,
                                        stats.staff > 1,
                                        stats.total_patients > 0,
                                    ].filter(Boolean).length
                                }{' '}
                                / 5
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <ChecklistItem
                                done={true}
                                title="Hospital provisioned"
                                desc={`${hospital.name} is live on the platform`}
                            />
                            <ChecklistItem
                                done={!!connection}
                                title="HIE connection configured"
                                desc={
                                    connection
                                        ? `${connection.facility_name ?? connection.facility_fr_code ?? 'Connected'}`
                                        : 'Contact support to provide your facility FR code and credentials'
                                }
                            />
                            <ChecklistItem
                                done={stats.staff > 1}
                                title="Add hospital staff"
                                desc={`${stats.staff} ${
                                    stats.staff === 1 ? 'account' : 'accounts'
                                } registered`}
                            />
                            <ChecklistItem
                                done={stats.total_patients > 0}
                                title="Register first patient"
                                desc={
                                    stats.total_patients > 0
                                        ? `${stats.total_patients} patients on file`
                                        : canCreatePatient
                                          ? 'Open the patients page to begin'
                                          : 'Awaiting your hospital administrator'
                                }
                            />
                            <ChecklistItem
                                done={false}
                                title="Submit first claim to SHA"
                                desc="Claims module coming soon"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/* ───────── Components ───────── */

function StatCard({
    label,
    value,
    delta,
    icon: Icon,
    tint,
    sub,
    sparkline,
}: {
    label: string;
    value: number;
    delta: number;
    icon: any;
    tint: 'emerald' | 'blue' | 'amber' | 'violet';
    sub: string;
    sparkline: number[];
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
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

    const hasSeries = sparkline.some((v) => v > 0);
    const chartData = sparkline.map((v, i) => ({ i, v }));
    const positive = delta >= 0;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                            {value.toLocaleString()}
                        </p>
                        {delta !== 0 && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        positive
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                    }`}
                                >
                                    <ArrowUpRight className="h-3 w-3" />
                                    +{delta}%
                                </span>
                            </div>
                        )}
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
                                <Bar
                                    dataKey="v"
                                    fill={bars[tint]}
                                    radius={[3, 3, 0, 0]}
                                    maxBarSize={14}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-end gap-1 opacity-20">
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

                <div className="mt-2.5 border-t pt-2.5 text-[10px]">
                    <span className="text-muted-foreground">{sub}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function ChecklistItem({
    done,
    title,
    desc,
}: {
    done: boolean;
    title: string;
    desc: string;
}) {
    return (
        <div
            className={`flex items-start gap-3 rounded-lg border p-3.5 transition ${
                done
                    ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/10'
                    : 'bg-card'
            }`}
        >
            <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    done
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-dashed border-muted-foreground/30'
                }`}
            >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {desc}
                </p>
            </div>
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