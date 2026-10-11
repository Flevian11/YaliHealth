import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    Building2,
    Clock,
    Coins,
    GraduationCap,
    Heart,
    Laptop,
    Mail,
    MapPin,
    Rocket,
    Search,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Position = {
    slug: string;
    title: string;
    department: string;
    location: string;
    type: string;
    experience?: string;
    salary_range?: string;
    description: string;
    posted_at?: string;
    is_open?: boolean;
};

type Perk = { icon: string; title: string; desc: string };

const PERK_ICONS: Record<string, any> = {
    heart: Heart,
    laptop: Laptop,
    graduation: GraduationCap,
    clock: Clock,
    users: Users,
    shield: ShieldCheck,
    book: BookOpen,
    rocket: Rocket,
    target: Target,
    trending: TrendingUp,
};

function iconFor(key: string): any {
    return PERK_ICONS[key] ?? Sparkles;
}

function relativeDate(iso?: string): string {
    if (!iso) return 'Recently';
    const diff = Math.floor(
        (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 1) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return new Date(iso).toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
    });
}

const DEPT_COLORS: Record<string, string> = {
    Engineering: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    Design: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    Product: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    Sales: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    Marketing: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    Operations: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
    Support: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
};

function deptTint(name: string): string {
    return (
        DEPT_COLORS[name] ??
        'bg-muted text-muted-foreground'
    );
}

export default function Careers({
    positions,
    perks,
    contactEmail,
}: {
    positions: Position[];
    perks: Perk[];
    contactEmail: string;
}) {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    const [query, setQuery] = useState('');
    const [department, setDepartment] = useState('');

    const departments = useMemo(
        () => Array.from(new Set(positions.map((p) => p.department))).sort(),
        [positions],
    );

    const filtered = useMemo(() => {
        let result = positions;
        if (department) result = result.filter((p) => p.department === department);
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.department.toLowerCase().includes(q) ||
                    p.location.toLowerCase().includes(q),
            );
        }
        return result;
    }, [positions, query, department]);

    const isEmpty = positions.length === 0;

    return (
        <>
            <Head title="Careers">
                <meta
                    name="description"
                    content={`Join ${brand} and help build the future of Kenyan healthcare.`}
                />
            </Head>

            {/* Hero */}
            <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <img
                        src="/images/dashboard-hero.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.10] via-transparent to-teal-500/[0.10]" />
                </div>

                <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Briefcase className="h-3 w-3" />
                        Careers at {brand}
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
                        Build the future of{' '}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Kenyan healthcare
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        We're a small, focused team obsessed with making
                        hospital software that actually works. If that sounds
                        like you, we'd love to hear from you.
                    </p>

                    {!isEmpty && (
                        <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border bg-card/60 px-4 py-2 text-xs backdrop-blur">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="font-medium">
                                {positions.length}{' '}
                                {positions.length === 1
                                    ? 'open position'
                                    : 'open positions'}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                                Hiring now
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* Main */}
            <section className="border-t pb-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {isEmpty ? (
                        <EmptyState contactEmail={contactEmail} brand={brand} />
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col gap-4 py-8 lg:flex-row lg:items-center">
                                <div className="relative max-w-md flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search by title, team, or location..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="h-11 w-full rounded-xl border bg-card pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        onClick={() => setDepartment('')}
                                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                                            department === ''
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                        }`}
                                    >
                                        All
                                    </button>
                                    {departments.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDepartment(d)}
                                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                                                department === d
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Results count */}
                            {filtered.length > 0 && (
                                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Showing {filtered.length} of{' '}
                                        {positions.length}{' '}
                                        {positions.length === 1
                                            ? 'role'
                                            : 'roles'}
                                    </span>
                                    {(query || department) && (
                                        <button
                                            onClick={() => {
                                                setQuery('');
                                                setDepartment('');
                                            }}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* List */}
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Search className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold">
                                        No roles match
                                    </h3>
                                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                        Try a different search or clear the
                                        department filter.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-5"
                                        onClick={() => {
                                            setQuery('');
                                            setDepartment('');
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filtered.map((p) => (
                                        <PositionCard key={p.slug} position={p} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Why join us */}
            <section className="border-t bg-muted/30 py-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Why {brand}
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Meaningful work, real impact
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                Every line of code we ship reaches a real
                                hospital, a real clinician, a real patient.
                                That's the standard we hold ourselves to.
                            </p>

                            <div className="mt-8 space-y-4">
                                {[
                                    {
                                        title: 'Small team, big leverage',
                                        desc: 'Eight people shipping to 250+ hospitals. Every role matters.',
                                    },
                                    {
                                        title: 'Deep technical problems',
                                        desc: 'Multi-tenant PostgreSQL, FHIR R4, HIE integration, DHA compliance.',
                                    },
                                    {
                                        title: 'Health outcomes, not just software',
                                        desc: "We measure success by what happens in the clinic, not in the sprint.",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {item.title}
                                            </p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Perks grid */}
                        {perks.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {perks.map((perk, i) => {
                                    const Icon = iconFor(perk.icon);
                                    return (
                                        <Card
                                            key={i}
                                            className="p-5 transition hover:border-emerald-300 dark:hover:border-emerald-800"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <h3 className="mt-3 text-sm font-semibold">
                                                {perk.title}
                                            </h3>
                                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                {perk.desc}
                                            </p>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-6 py-16 text-center shadow-2xl sm:px-12">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        </div>
                        <div className="relative">
                            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Don't see your role?
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-base text-emerald-50/90">
                                We're always interested in meeting
                                exceptional people. Send us your CV and tell
                                us what you'd like to build.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-emerald-700 shadow-lg hover:bg-emerald-50"
                                >
                                    <a href={`mailto:${contactEmail}`}>
                                        <Mail className="mr-1.5 h-4 w-4" />
                                        Email us your CV
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                                >
                                    <Link href="/contact">Contact form</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function EmptyState({
    contactEmail,
    brand,
}: {
    contactEmail: string;
    brand: string;
}) {
    return (
        <div className="pt-16 pb-8">
            <div className="mx-auto max-w-2xl">
                <div className="relative overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
                    </div>

                    <div className="relative">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                            <Briefcase className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
                            No open positions right now
                        </h2>

                        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                            We're not actively hiring at the moment, but
                            we're always interested in exceptional people. If
                            you're excited about what {brand} is building,
                            send us a note anyway.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button
                                asChild
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <a href={`mailto:${contactEmail}`}>
                                    <Mail className="mr-1.5 h-4 w-4" />
                                    Send your CV anyway
                                </a>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/contact">Contact us</Link>
                            </Button>
                        </div>

                        <p className="mt-6 text-[11px] text-muted-foreground">
                            We review every submission — even speculative
                            ones. Response time is usually under a week.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PositionCard({ position }: { position: Position }) {
    return (
        <Card className="group overflow-hidden p-0 transition hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-800">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {position.title}
                        </h3>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${deptTint(position.department)}`}
                        >
                            {position.department}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {position.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {position.type}
                        </span>
                        {position.experience && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {position.experience}
                            </span>
                        )}
                        {position.salary_range && (
                            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                                <Coins className="h-3.5 w-3.5" />
                                {position.salary_range}
                            </span>
                        )}
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {position.description}
                    </p>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-[11px] text-muted-foreground">
                        {relativeDate(position.posted_at)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-foreground transition group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-300">
                        View role
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </Card>
    );
}