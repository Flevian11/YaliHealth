import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    Lock,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type Props = {
    token: string;
    user: { name: string; email: string };
    hospital: string | null;
};

/* ═════════════════════════════════════════════════
   Password strength helpers
   ═════════════════════════════════════════════════ */

const REQUIREMENTS = [
    { key: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { key: 'number', label: 'One number', test: (v: string) => /\d/.test(v) },
    { key: 'symbol', label: 'One symbol (!@#$…)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function scorePassword(v: string): number {
    if (!v) return 0;
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return Math.min(score, 6);
}

function strengthMeta(score: number) {
    if (score <= 2)
        return { label: 'Weak', tone: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
    if (score <= 4)
        return { label: 'Fair', tone: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    if (score === 5)
        return { label: 'Strong', tone: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    return { label: 'Excellent', tone: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' };
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* ═════════════════════════════════════════════════
   Page
   ═════════════════════════════════════════════════ */

export default function AcceptInvitation({ token, user, hospital }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const hospitalName = hospital ?? 'your hospital';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/staff/accept/${token}`, {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const score = useMemo(() => scorePassword(data.password), [data.password]);
    const strength = strengthMeta(score);
    const met = useMemo(
        () => REQUIREMENTS.map((r) => ({ ...r, met: r.test(data.password) })),
        [data.password],
    );
    const allMet = met.every((r) => r.met);
    const matches =
        data.password.length > 0 && data.password === data.password_confirmation;

    return (
        <>
            <Head title={`Accept Invitation · ${hospitalName}`} />

            <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/30 p-4 sm:p-6 lg:p-8">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-emerald-900/5 lg:grid-cols-[1fr_1.15fr]">
                    {/* ═══════════════════════════════════════
                        LEFT — emerald welcome panel
                        ═══════════════════════════════════════ */}
                    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 lg:flex lg:flex-col">
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
                            <div className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
                            <div className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
                        </div>

                        {/* Brand */}
                        <div className="relative flex items-center gap-3">
                            <img
                                src="/images/logo.png"
                                alt=""
                                className="h-9 w-9 object-contain drop-shadow-lg"
                            />
                            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">
                                YaliHealth
                            </span>
                        </div>

                        {/* Welcome copy */}
                        <div className="relative mt-auto">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
                                <Sparkles className="h-3 w-3" />
                                Invitation
                            </span>
                            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                                Welcome aboard.
                            </h1>
                            <p className="mt-4 text-sm leading-relaxed text-emerald-50/85 xl:text-base">
                                You've been invited to join{' '}
                                <strong className="font-semibold text-white">
                                    {hospitalName}
                                </strong>{' '}
                                on Kenya's connected hospital platform.
                            </p>

                            <ul className="mt-7 space-y-3">
                                {[
                                    'Secure access to patient records',
                                    'Real-time SHA eligibility and claims',
                                    'Shared Health Records across facilities',
                                    'Consent-driven data exchange',
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-3 text-xs text-emerald-50/90 xl:text-sm"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                                            <Check className="h-2.5 w-2.5 text-white" />
                                        </span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Security footer */}
                        <div className="relative mt-10 flex items-center gap-2 border-t border-white/10 pt-5 text-[11px] text-emerald-100/70">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                Protected by end-to-end encryption and audit
                                logging.
                            </span>
                        </div>
                    </aside>

                    {/* ═══════════════════════════════════════
                        RIGHT — form
                        ═══════════════════════════════════════ */}
                    <main className="flex flex-col p-6 sm:p-8 lg:p-10 xl:p-12">
                        {/* Mobile brand bar */}
                        <div className="mb-6 flex items-center gap-2.5 border-b pb-5 lg:hidden">
                            <img
                                src="/images/logo.png"
                                alt=""
                                className="h-9 w-9 object-contain"
                            />
                            <div className="leading-tight">
                                <div className="text-sm font-semibold">
                                    YaliHealth
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {hospitalName}
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <div>
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                                <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Set your password
                            </h2>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                Choose a strong password to secure your account.
                            </p>
                        </div>

                        {/* Identity card */}
                        <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-md shadow-emerald-500/20">
                                    {initials(user.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold">
                                            {user.name}
                                        </p>
                                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            Invited
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Server error */}
                        {props.flash?.error && (
                            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{props.flash.error}</span>
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-6 space-y-5">
                            {/* Password */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        autoFocus
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        className="pl-9 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>

                                {data.password.length > 0 && (
                                    <div className="mt-1 space-y-2">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground">
                                                Strength
                                            </span>
                                            <span
                                                className={`font-semibold ${strength.text}`}
                                            >
                                                {strength.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all ${
                                                        i <= score
                                                            ? strength.tone
                                                            : 'bg-muted'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        autoComplete="new-password"
                                        placeholder="Re-enter your password"
                                        className="pl-9 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        aria-label={
                                            showConfirm
                                                ? 'Hide confirmation'
                                                : 'Show confirmation'
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>

                                {data.password_confirmation.length > 0 && (
                                    <div
                                        className={`flex items-center gap-1.5 text-[11px] ${
                                            matches
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                        }`}
                                    >
                                        {matches ? (
                                            <Check className="h-3 w-3" />
                                        ) : (
                                            <AlertTriangle className="h-3 w-3" />
                                        )}
                                        <span>
                                            {matches
                                                ? 'Passwords match'
                                                : 'Passwords do not match yet'}
                                        </span>
                                    </div>
                                )}

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Requirements */}
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Password requirements
                                </p>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {met.map((r) => (
                                        <li
                                            key={r.key}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span
                                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition ${
                                                    r.met
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'border border-muted-foreground/30'
                                                }`}
                                            >
                                                {r.met ? (
                                                    <Check className="h-2.5 w-2.5" />
                                                ) : (
                                                    <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                                                )}
                                            </span>
                                            <span
                                                className={
                                                    r.met
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground'
                                                }
                                            >
                                                {r.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing || !allMet || !matches}
                                className="w-full bg-emerald-600 py-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {processing ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                )}
                                Set password & continue
                            </Button>

                            <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                    After setting your password, you'll sign in
                                    with your email and a one-time code sent to
                                    your inbox.
                                </span>
                            </div>
                        </form>

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Already accepted this invite?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            >
                                Sign in
                            </Link>
                        </p>
                    </main>
                </div>
            </div>
        </>
    );
}