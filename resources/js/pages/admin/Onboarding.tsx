import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Building2,
    Check,
    CheckCircle2,
    CircleDollarSign,
    LoaderCircle,
    Sparkles,
    UserPlus,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type Plan = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    billing_cycle: string;
    billing_cycle_months: number;
    price_yearly: number;
    price_monthly: number;
    setup_fee: number;
    currency: string;
    trial_days: number;
    features: string[];
};

type FeatureGroup = { label: string; features: Record<string, string> };

type FormData = {
    name: string;
    phone: string;
    plan_id: number | null;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_password_confirmation: string;
};

const STEPS = [
    { key: 'hospital', label: 'Hospital', icon: Building2 },
    { key: 'plan', label: 'Plan', icon: CircleDollarSign },
    { key: 'admin', label: 'Administrator', icon: UserPlus },
    { key: 'review', label: 'Review', icon: CheckCircle2 },
] as const;

function formatPrice(amount: number, currency: string): string {
    if (amount === 0) return 'Free';
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

export default function Onboarding({
    plans,
    catalog,
}: {
    plans: Plan[];
    catalog: Record<string, FeatureGroup>;
}) {
    const [step, setStep] = useState(0);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        phone: '',
        plan_id: plans[0]?.id ?? null,
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
    });

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === data.plan_id) ?? null,
        [plans, data.plan_id],
    );

    const stepValid = (s: number): boolean => {
        if (s === 0) return data.name.trim().length > 0;
        if (s === 1) return data.plan_id !== null;
        if (s === 2)
            return (
                data.admin_name.trim().length > 0 &&
                data.admin_email.trim().length > 0 &&
                data.admin_password.length >= 8 &&
                data.admin_password === data.admin_password_confirmation
            );
        return true;
    };

    const next = () => {
        if (stepValid(step) && step < STEPS.length - 1) setStep(step + 1);
    };

    const back = () => {
        if (step > 0) setStep(step - 1);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/onboarding');
    };

    return (
        <>
            <Head title="Onboard a hospital" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Onboard a hospital
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    A guided setup that provisions the tenant, plan, and first
                    administrator in one flow.
                </p>
            </div>

            {/* Step indicator */}
            <div className="mb-6 overflow-hidden rounded-2xl border bg-card">
                <div className="flex items-center">
                    {STEPS.map((s, i) => {
                        const done = i < step;
                        const current = i === step;
                        return (
                            <div
                                key={s.key}
                                className="relative flex flex-1 items-center"
                            >
                                <div
                                    className={`flex items-center gap-2.5 px-4 py-3 ${
                                        current ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                                    }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                                            done
                                                ? 'bg-emerald-600 text-white'
                                                : current
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {done ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <s.icon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            Step {i + 1}
                                        </div>
                                        <div className="text-xs font-medium">
                                            {s.label}
                                        </div>
                                    </div>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="h-px flex-1 bg-border" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardContent className="p-6 sm:p-8">
                        {step === 0 && (
                            <StepHospital
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        )}
                        {step === 1 && (
                            <StepPlan
                                plans={plans}
                                selected={data.plan_id}
                                onSelect={(id) => setData('plan_id', id)}
                                error={errors.plan_id}
                            />
                        )}
                        {step === 2 && (
                            <StepAdmin
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        )}
                        {step === 3 && (
                            <StepReview
                                data={data}
                                plan={selectedPlan}
                                catalog={catalog}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Footer nav */}
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={back}
                        disabled={step === 0 || processing}
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Back
                    </Button>

                    <div className="text-xs text-muted-foreground">
                        Step {step + 1} of {STEPS.length}
                    </div>

                    {step < STEPS.length - 1 ? (
                        <Button
                            type="button"
                            onClick={next}
                            disabled={!stepValid(step)}
                        >
                            Continue
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Create hospital
                        </Button>
                    )}
                </div>
            </form>
        </>
    );
}

/* ─── Step 1 ─── */
function StepHospital({
    data,
    setData,
    errors,
}: {
    data: FormData;
    setData: (k: keyof FormData, v: any) => void;
    errors: Partial<Record<keyof FormData, string>>;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Hospital information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The name determines the subdomain and internal tenant ID.
                </p>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Hospital name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Nairobi West Hospital"
                        autoFocus
                    />
                    <InputError message={errors.name} />
                    <p className="text-[11px] text-muted-foreground">
                        Duplicates are auto-suffixed (e.g. yalipital-2).
                    </p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                        id="phone"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="+254 700 000 000"
                    />
                    <InputError message={errors.phone} />
                </div>
            </div>
        </div>
    );
}

/* ─── Step 2 ─── */
function StepPlan({
    plans,
    selected,
    onSelect,
    error,
}: {
    plans: Plan[];
    selected: number | null;
    onSelect: (id: number) => void;
    error?: string;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Choose a plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Every plan includes all features. The difference is how often
                    the customer is billed.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {plans.map((p) => {
                    const active = selected === p.id;
                    return (
                        <button
                            type="button"
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                                active
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'hover:border-foreground/20'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    {p.name}
                                </span>
                                {active && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold tracking-tight">
                                        {formatPrice(p.price_yearly, p.currency)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {cycleLabel(p.billing_cycle)}
                                </p>
                            </div>
                            {p.billing_cycle !== 'monthly' && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    ≈ {formatPrice(p.price_monthly, p.currency)} / month
                                </p>
                            )}
                            {p.setup_fee > 0 && (
                                <p className="mt-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                    + {formatPrice(p.setup_fee, p.currency)} setup
                                </p>
                            )}
                            {p.trial_days > 0 && (
                                <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    {p.trial_days}-day trial
                                </p>
                            )}
                            {p.description && (
                                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                                    {p.description}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>
            <InputError message={error} />
        </div>
    );
}

/* ─── Step 3 ─── */
function StepAdmin({
    data,
    setData,
    errors,
}: {
    data: FormData;
    setData: (k: keyof FormData, v: any) => void;
    errors: Partial<Record<keyof FormData, string>>;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Primary administrator</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    This account has full access inside the hospital tenant.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="admin_name">Full name</Label>
                    <Input
                        id="admin_name"
                        value={data.admin_name}
                        onChange={(e) => setData('admin_name', e.target.value)}
                        placeholder="Jane Doe"
                        autoFocus
                    />
                    <InputError message={errors.admin_name} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="admin_email">Email</Label>
                    <Input
                        id="admin_email"
                        type="email"
                        value={data.admin_email}
                        onChange={(e) => setData('admin_email', e.target.value)}
                        placeholder="admin@hospital.co.ke"
                    />
                    <InputError message={errors.admin_email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="admin_password">Password</Label>
                    <Input
                        id="admin_password"
                        type="password"
                        value={data.admin_password}
                        onChange={(e) =>
                            setData('admin_password', e.target.value)
                        }
                        placeholder="Minimum 8 characters"
                    />
                    <InputError message={errors.admin_password} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="admin_password_confirmation">
                        Confirm password
                    </Label>
                    <Input
                        id="admin_password_confirmation"
                        type="password"
                        value={data.admin_password_confirmation}
                        onChange={(e) =>
                            setData(
                                'admin_password_confirmation',
                                e.target.value,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}

/* ─── Step 4 ─── */
function StepReview({
    data,
    plan,
    catalog,
}: {
    data: FormData;
    plan: Plan | null;
    catalog: Record<string, FeatureGroup>;
}) {
    const totalFeatures = plan?.features.length ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Review and confirm</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Provisioning creates the tenant schema, subdomain, and
                    administrator account.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Hospital
                        </h3>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{data.name || '—'}</p>
                    {data.phone && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {data.phone}
                        </p>
                    )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Administrator
                        </h3>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                        {data.admin_name || '—'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {data.admin_email || '—'}
                    </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Subscription
                        </h3>
                    </div>
                    {plan ? (
                        <>
                            <div className="mt-3 flex flex-wrap items-baseline gap-2">
                                <span className="text-sm font-semibold">
                                    {plan.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    · {formatPrice(plan.price_yearly, plan.currency)}{' '}
                                    {cycleLabel(plan.billing_cycle)}
                                </span>
                                {plan.setup_fee > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                        + {formatPrice(plan.setup_fee, plan.currency)} setup
                                    </span>
                                )}
                                {plan.trial_days > 0 && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {plan.trial_days}-day trial
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium">
                                    {totalFeatures} features included
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                            No plan selected.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}