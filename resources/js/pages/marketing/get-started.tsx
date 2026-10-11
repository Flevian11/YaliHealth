import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Headphones,
    KeyRound,
    Mail,
    Phone,
    ShieldCheck,
    Sparkles,
    UserCheck,
} from 'lucide-react';

export default function GetStarted() {
    return (
        <>
            <Head title="Get started">
                <meta
                    name="description"
                    content="Onboarding to YaliHealth is by invitation. Contact our team and we'll get your hospital set up on the platform."
                />
            </Head>

            {/* Hero */}
            <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <img
                        src="/images/dashboard-hero.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/85 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.10] via-transparent to-teal-500/[0.10]" />
                </div>

                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Sparkles className="h-3 w-3" />
                        Onboarding by invitation
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
                        Registration is{' '}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            by invitation only
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        To protect patient data and guarantee a secure,
                        compliant onboarding, every hospital is provisioned by
                        our platform team. There's no self-service sign-up.
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section className="border-t pb-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="-mt-px pt-16">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                How onboarding works
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Three steps from first contact to a live
                                hospital workspace.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-6 sm:grid-cols-3">
                            <Step
                                number="1"
                                icon={Mail}
                                title="Get in touch"
                                description="Email our team or fill out the contact form. Tell us about your hospital, your level, and what you'd like to solve."
                            />
                            <Step
                                number="2"
                                icon={CalendarCheck}
                                title="Onboarding call"
                                description="We walk through your workflows, confirm your facility registry code, and set up your subscription and HIE credentials."
                            />
                            <Step
                                number="3"
                                icon={KeyRound}
                                title="Secure access"
                                description="You receive your subdomain, admin login, and onboarding guide. Your team is live within days."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* What you get */}
            <section className="border-t bg-muted/30 py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                What you get
                            </span>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                                A complete hospital workspace
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                Once onboarded, your hospital gets a fully
                                isolated instance of YaliHealth with everything
                                connected — patients, clinicians, claims, and
                                the national HIE.
                            </p>

                            <ul className="mt-8 space-y-3">
                                {[
                                    'Your own secure subdomain (e.g. yourhospital.yourhmis.co.ke)',
                                    'Isolated database schema — no data shared with other hospitals',
                                    'Native HIE integration for registries, consent, and claims',
                                    'Full role-based access control for your staff',
                                    'Immutable audit trails and compliance reporting',
                                    'Direct line to our support team',
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-2.5 text-sm"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-muted-foreground">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold">
                                Ready to onboard?
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Email our team directly or fill out the
                                contact form. We respond within one business
                                day.
                            </p>

                            <div className="mt-6 space-y-3">
                                <a
                                    href="mailto:sales@yalihealth.co.ke"
                                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition hover:border-emerald-300 dark:hover:border-emerald-800"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Email
                                        </p>
                                        <p className="truncate text-sm font-medium">
                                            sales@yalihealth.co.ke
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href="tel:+254200000000"
                                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition hover:border-emerald-300 dark:hover:border-emerald-800"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <Phone className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Phone
                                        </p>
                                        <p className="truncate text-sm font-medium">
                                            +254 20 000 0000
                                        </p>
                                    </div>
                                </a>
                            </div>

                            <Button
                                asChild
                                className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <Link href="/contact">
                                    Open contact form
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            </Button>

                            <div className="mt-5 flex items-start gap-2 border-t pt-4 text-[11px] text-muted-foreground">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                    We verify every hospital against the
                                    national Facility Registry before
                                    provisioning access.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sign-in strip */}
            <section className="border-t">
                <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center sm:flex-row sm:justify-between sm:p-8 sm:text-left">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">
                                    Already onboarded?
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Sign in to your hospital workspace.
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Link href="/login">
                                Sign in
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-t bg-muted/30 py-20">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold tracking-tight text-center sm:text-3xl">
                        Common questions
                    </h2>

                    <div className="mt-10 space-y-3">
                        <Faq
                            q="Why can't I sign up directly?"
                            a="Patient data is sensitive. Our platform team verifies every hospital against the national Facility Registry and sets up HIE credentials through DHA's official onboarding process. Self-registration would not be compliant."
                        />
                        <Faq
                            q="How long does onboarding take?"
                            a="Most hospitals are live within 3 to 7 business days from the first call, depending on how quickly we can verify your facility registry code and SHA credentials."
                        />
                        <Faq
                            q="Is there a setup fee?"
                            a="Yes — there is a one-time setup fee that covers facility verification, HIE credential provisioning, staff training, and initial data migration support. It is separate from the monthly subscription."
                        />
                        <Faq
                            q="Can my staff register themselves?"
                            a="Staff accounts are created by your hospital administrator inside your hospital workspace. They sign in with email and password plus a 6-digit code, or use a passkey."
                        />
                        <Faq
                            q="What if I already have an HMIS?"
                            a="We can migrate your existing patient and clinical data during onboarding. Contact us to discuss the migration scope for your hospital."
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

function Step({
    number,
    icon: Icon,
    title,
    description,
}: {
    number: string;
    icon: any;
    title: string;
    description: string;
}) {
    return (
        <div className="relative rounded-2xl border bg-card p-6">
            <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-md">
                {number}
            </div>
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function Faq({ q, a }: { q: string; a: string }) {
    return (
        <details className="group rounded-2xl border bg-card transition open:border-emerald-300 dark:open:border-emerald-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                <span className="text-sm font-medium">{q}</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition group-open:rotate-45 group-open:border-emerald-400 group-open:text-emerald-600">
                    <span className="text-lg leading-none">+</span>
                </span>
            </summary>
            <div className="border-t px-5 py-4 text-xs leading-relaxed text-muted-foreground">
                {a}
            </div>
        </details>
    );
}