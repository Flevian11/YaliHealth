import { Button } from '@/components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Building2,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    Eye,
    FileText,
    HeartPulse,
    Layers,
    Lock,
    Network,
    Pill,
    Server,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';

type Plan = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    billing_cycle: string;
    billing_cycle_months: number;
    price_monthly: number;
    price_yearly: number;
    setup_fee: number;
    currency: string;
    trial_days: number;
    features: string[];
};

function formatPrice(amount: number, currency: string): string {
    if (amount === 0) return 'Custom';
    return `${currency} ${amount.toLocaleString()}`;
}

function cycleLabel(cycle: string): string {
    return {
        monthly: 'per month',
        quarterly: 'per quarter',
        semi_annual: 'every 6 months',
        annual: 'per year',
    }[cycle] ?? 'per cycle';
}

export default function Welcome({ plans }: { plans: Plan[] }) {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    return (
        <>
            <Head title="Modern hospital management for Kenya">
                <meta
                    name="description"
                    content="YaliHealth is a multi-tenant hospital management system with native integration to Kenya's Health Information Exchange."
                />
            </Head>

            {/* ─────── Hero ─────── */}
            <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <img
                        src="/images/dashboard-hero.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/75 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-500/[0.08]" />
                </div>

                <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
                    <div className="max-w-xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Built for the Kenyan health ecosystem
                        </span>

                        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-[3.25rem]">
                            Modern hospital management,{' '}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                connected end-to-end
                            </span>
                        </h1>

                        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {brand} is a multi-tenant HMIS with native
                            integration to the Health Information Exchange.
                            One platform, every hospital, full compliance with
                            the DHA framework.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                asChild
                                size="lg"
                                className="bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                            >
                                <Link href="/get-started">
                                    Request access
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <a href="#pricing">See pricing</a>
                            </Button>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Onboarding by invitation
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Verified facilities only
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Full platform access
                            </span>
                        </div>
                    </div>

                    {/* Mock browser preview */}
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.2)]">
                            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                                <div className="flex gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                </div>
                                <div className="ml-2 flex-1 truncate rounded-md bg-background px-3 py-1 text-[10px] text-muted-foreground">
                                    nairobi-west.yalihealth.co.ke
                                </div>
                            </div>
                            <div className="flex">
                                <div className="hidden w-40 shrink-0 flex-col border-r bg-muted/30 p-3 sm:flex">
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-md bg-emerald-600" />
                                        <div className="h-2 w-16 rounded bg-muted-foreground/20" />
                                    </div>
                                    {[
                                        { active: true, w: 'w-20' },
                                        { w: 'w-16' },
                                        { w: 'w-24' },
                                        { w: 'w-14' },
                                        { w: 'w-20' },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className={`mb-1.5 flex items-center gap-2 rounded px-2 py-1.5 ${
                                                item.active
                                                    ? 'bg-emerald-100 dark:bg-emerald-950/40'
                                                    : ''
                                            }`}
                                        >
                                            <div
                                                className={`h-2.5 w-2.5 rounded ${
                                                    item.active
                                                        ? 'bg-emerald-600'
                                                        : 'bg-muted-foreground/30'
                                                }`}
                                            />
                                            <div
                                                className={`h-1.5 rounded ${
                                                    item.active
                                                        ? 'bg-emerald-700'
                                                        : 'bg-muted-foreground/20'
                                                } ${item.w}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <div className="h-2.5 w-20 rounded bg-foreground/20" />
                                            <div className="mt-1.5 h-1.5 w-32 rounded bg-muted-foreground/20" />
                                        </div>
                                        <div className="h-6 w-16 rounded-md bg-emerald-600" />
                                    </div>
                                    <div className="mb-3 grid grid-cols-3 gap-2">
                                        {['emerald', 'blue', 'amber'].map(
                                            (tint) => (
                                                <div
                                                    key={tint}
                                                    className="rounded-lg border bg-card p-2.5"
                                                >
                                                    <div className="mb-2 h-1.5 w-10 rounded bg-muted-foreground/20" />
                                                    <div className="h-3 w-8 rounded bg-foreground/40" />
                                                    <div className="mt-2 h-1 w-12 rounded bg-muted-foreground/20" />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div className="rounded-lg border bg-card p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="h-1.5 w-16 rounded bg-muted-foreground/30" />
                                            <div className="h-1.5 w-10 rounded bg-muted-foreground/20" />
                                        </div>
                                        <div className="flex h-16 items-end gap-1">
                                            {[
                                                40, 65, 35, 80, 55, 70, 45, 90,
                                                60, 75,
                                            ].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t bg-emerald-400/80"
                                                    style={{
                                                        height: `${h}%`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -left-3 top-24 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg sm:flex">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold">
                                    HIE Verified
                                </div>
                                <div className="text-[9px] text-muted-foreground">
                                    Consent token active
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-3 bottom-16 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg sm:flex">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Activity className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold">
                                    Claims submitted
                                </div>
                                <div className="text-[9px] text-muted-foreground">
                                    Real-time to SHA
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust bar */}
                <div className="mx-auto mt-16 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl border bg-card/60 backdrop-blur-xl">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/[0.04] via-transparent to-teal-500/[0.04]" />
                        <div className="relative grid grid-cols-2 divide-x divide-y divide-border/60 md:grid-cols-4 md:divide-y-0">
                            <TrustStat
                                icon={Building2}
                                value="250+"
                                label="Hospitals onboarded"
                                tint="emerald"
                            />
                            <TrustStat
                                icon={Users}
                                value="1.2M+"
                                label="Patient records"
                                tint="blue"
                            />
                            <TrustStat
                                icon={Activity}
                                value="99.9%"
                                label="Uptime last 90 days"
                                tint="amber"
                            />
                            <TrustStat
                                icon={ShieldCheck}
                                value="100%"
                                label="Audit coverage"
                                tint="violet"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────── Features ─────── */}
            <section
                id="features"
                className="relative border-t bg-muted/30 py-20 sm:py-28"
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Built for hospitals
                        </span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                            Everything a modern hospital needs
                        </h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            From patient registration to claims reconciliation
                            — one platform, connected to every national
                            registry that matters.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={Users}
                            title="Patient Registry"
                            description="Search, verify, and register patients against the national MPI. One CR number, every visit."
                            tint="emerald"
                        />
                        <FeatureCard
                            icon={FileText}
                            title="ICD-11 Coding"
                            description="Every diagnosis coded to WHO standards. No free text, no rejected claims."
                            tint="blue"
                        />
                        <FeatureCard
                            icon={CreditCard}
                            title="Claims & Preauths"
                            description="Submit claims to SHA in real time. Track acceptance, pending reviews, and remittance."
                            tint="amber"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Consent Management"
                            description="OTP and biometric consent flows enforced at the point of care."
                            tint="violet"
                        />
                        <FeatureCard
                            icon={ClipboardList}
                            title="Shared Health Records"
                            description="Exchange FHIR R4 bundles with the national SHR. Lab, imaging, encounters."
                            tint="rose"
                        />
                        <FeatureCard
                            icon={Activity}
                            title="Real-time Audit"
                            description="Every PHI access logged. Immutable trail from doctor sign-in to claim approval."
                            tint="cyan"
                        />
                    </div>
                </div>
            </section>

            {/* ─────── HIE ─────── */}
            <section id="hie" className="relative border-t py-20 sm:py-28">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-400/[0.07] blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                HIE Integration
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Natively connected to the national HIE
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                {`YaliHealth speaks the HIE's language out of the box. Registries, consent, eligibility, claims, and shared records — all standardized, all queued, all retried.`}
                            </p>

                            <div className="mt-8 space-y-3">
                                {[
                                    {
                                        icon: Network,
                                        title: 'Registries',
                                        desc: 'Patient MPI, practitioners, and facilities',
                                    },
                                    {
                                        icon: ShieldCheck,
                                        title: 'Consent',
                                        desc: 'OTP and biometric authorization per visit',
                                    },
                                    {
                                        icon: CreditCard,
                                        title: 'Claims & Preauths',
                                        desc: 'Full lifecycle including renal, oncology, imaging',
                                    },
                                    {
                                        icon: HeartPulse,
                                        title: 'Shared Health Records',
                                        desc: 'FHIR R4 read/write with per-visit consent',
                                    },
                                    {
                                        icon: BookOpen,
                                        title: 'Terminology',
                                        desc: 'ICD-11 concepts, mappings, and synonyms',
                                    },
                                    {
                                        icon: Pill,
                                        title: 'Drug Formulary',
                                        desc: 'KEML standardized generic codes',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className="flex items-start gap-3 rounded-xl border bg-card p-3.5 transition hover:border-emerald-300 dark:hover:border-emerald-800"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {item.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl" />
                            <div className="rounded-2xl border bg-card p-6 shadow-lg">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        </span>
                                        <span className="text-xs font-semibold">
                                            HIE endpoints
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        All operational
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {[
                                        { label: 'Access token', ms: 1813 },
                                        { label: 'Patient search', ms: 948 },
                                        {
                                            label: 'SHA eligibility',
                                            ms: 1354,
                                        },
                                        {
                                            label: 'Preauth preview',
                                            ms: 1126,
                                        },
                                        { label: 'Claim submit', ms: 1146 },
                                        {
                                            label: 'SHR bundle read',
                                            ms: 1014,
                                        },
                                    ].map((row) => (
                                        <div
                                            key={row.label}
                                            className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                            <span className="flex-1 truncate text-xs font-medium">
                                                {row.label}
                                            </span>
                                            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                                {row.ms}ms
                                            </span>
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-4 text-[10px] text-muted-foreground">
                                    <span>
                                        Auto-retry · exponential backoff
                                    </span>
                                    <span>Uptime 24h: 100%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────── Pricing ─────── */}
            {plans.length > 0 && (
                <section
                    id="pricing"
                    className="relative border-t bg-muted/30 py-20 sm:py-28"
                >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Pricing
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Simple plans, every feature included
                            </h2>
                            <p className="mt-4 text-base text-muted-foreground">
                                Pick the billing cycle that works for your
                                hospital. Every plan unlocks the entire
                                platform.
                            </p>
                        </div>

                        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan, i) => (
                                <PricingCard
                                    key={plan.id}
                                    plan={plan}
                                    featured={plans.length === 3 && i === 2}
                                />
                            ))}
                        </div>

                        <p className="mt-8 text-center text-xs text-muted-foreground">
                            One-time setup fee applies on first activation. All
                            plans include every module.
                        </p>
                    </div>
                </section>
            )}

            {/* ─────── Security ─────── */}
            <section id="security" className="relative border-t py-20 sm:py-28">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-blue-400/[0.06] blur-3xl" />
                    <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-emerald-400/[0.06] blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Security & Compliance
                        </span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                            Built to DHA standards
                        </h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            Every requirement of the DHA HMIS framework is
                            baked into the architecture, not bolted on.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <SecurityCard
                            icon={Layers}
                            title="Data isolation"
                            desc="Each hospital runs in its own PostgreSQL schema. No query can leak across tenants."
                        />
                        <SecurityCard
                            icon={Eye}
                            title="Immutable audit"
                            desc="Every PHI access is logged with actor, IP, and full context. Append-only."
                        />
                        <SecurityCard
                            icon={Lock}
                            title="Encrypted at rest"
                            desc="Secrets stored with AES-256. Transport enforced over TLS 1.2+."
                        />
                        <SecurityCard
                            icon={Server}
                            title="ODPC registered"
                            desc="Fully compliant with the Kenya Data Protection Act, 2019."
                        />
                    </div>
                </div>
            </section>

            {/* ─────── CTA ─────── */}
            <section className="border-t">
                <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        </div>

                        <div className="relative">
                            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Ready to modernize your hospital?
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-base text-emerald-50/90">
                                Onboarding is by invitation. Tell us about your
                                hospital and we'll get you set up on the
                                platform.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-emerald-700 shadow-lg hover:bg-emerald-50"
                                >
                                    <Link href="/get-started">
                                        Request access
                                        <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                                >
                                    <Link href="/contact">
                                        Talk to our team
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

/* ─────── Components ─────── */

function TrustStat({
    icon: Icon,
    value,
    label,
    tint,
}: {
    icon: any;
    value: string;
    label: string;
    tint: 'emerald' | 'blue' | 'amber' | 'violet';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-6 text-center sm:py-8">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${tints[tint]}`}
            >
                <Icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {value}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                {label}
            </div>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    tint,
}: {
    icon: any;
    title: string;
    description: string;
    tint: 'emerald' | 'blue' | 'amber' | 'violet' | 'rose' | 'cyan';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
    };

    return (
        <div className="group rounded-2xl border bg-card p-6 transition hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-800">
            <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${tints[tint]}`}
            >
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function SecurityCard({
    icon: Icon,
    title,
    desc,
}: {
    icon: any;
    title: string;
    desc: string;
}) {
    return (
        <div className="rounded-2xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {desc}
            </p>
        </div>
    );
}

function PricingCard({
    plan,
    featured,
}: {
    plan: Plan;
    featured: boolean;
}) {
    return (
        <div
            className={`relative flex flex-col rounded-2xl border bg-card p-6 transition ${
                featured
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'hover:border-emerald-300 dark:hover:border-emerald-800'
            }`}
        >
            {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                    Best value
                </div>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                {featured && (
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
            </div>

            <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight">
                        {formatPrice(plan.price_yearly, plan.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {cycleLabel(plan.billing_cycle)}
                    </span>
                </div>
                {plan.billing_cycle !== 'monthly' && plan.price_monthly > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        ≈ {formatPrice(plan.price_monthly, plan.currency)} /
                        month
                    </p>
                )}
            </div>

            {plan.setup_fee > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <Zap className="h-3 w-3" />+{' '}
                    {formatPrice(plan.setup_fee, plan.currency)} one-time setup
                </div>
            )}

            {plan.description && (
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    {plan.description}
                </p>
            )}

            <ul className="mt-5 flex-1 space-y-2">
                {[
                    'Full platform access',
                    'HIE integration included',
                    'Unlimited users & branches',
                    plan.trial_days > 0
                        ? `${plan.trial_days}-day trial available`
                        : 'Pay-as-you-go',
                    'ODPC & DHA compliant',
                ].map((feature) => (
                    <li
                        key={feature}
                        className="flex items-start gap-2 text-xs"
                    >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                asChild
                className={`mt-6 w-full ${
                    featured
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : ''
                }`}
                variant={featured ? 'default' : 'outline'}
            >
                <Link href="/get-started">
                    Get started
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
            </Button>
        </div>
    );
}