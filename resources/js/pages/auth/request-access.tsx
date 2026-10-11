import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Copy,
    Headphones,
    Mail,
    Phone,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    hospitalName: string;
    adminName: string | null;
    adminEmail: string | null;
    adminPhone: string | null;
};

export default function RequestAccess({
    hospitalName,
    adminName,
    adminEmail,
    adminPhone,
}: Props) {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    const copy = (text: string) => navigator.clipboard?.writeText(text);

    const hasAdmin = adminName || adminEmail || adminPhone;

    return (
        <>
            <Head title="Request staff access" />

            <div className="mb-6 flex flex-col items-center text-center">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                        <UserRound className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>

                <h2 className="mt-4 text-lg font-semibold">
                    Staff accounts are created by your hospital
                </h2>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    To get a login for{' '}
                    <span className="font-medium text-foreground">
                        {hospitalName}
                    </span>
                    , ask your hospital administrator to create one for you.
                </p>
            </div>

            {/* Admin contact card */}
            {hasAdmin ? (
                <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-background to-teal-50/70 p-5 dark:border-emerald-900/60 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20">
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            Contact your administrator
                        </span>
                    </div>

                    {adminName && (
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                                {adminName
                                    .split(' ')
                                    .map((p) => p.charAt(0))
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {adminName}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Hospital Administrator
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {adminEmail && (
                            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <Mail className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Email
                                    </p>
                                    <a
                                        href={`mailto:${adminEmail}?subject=Request%20for%20${brand}%20staff%20account&body=Hi%20${encodeURIComponent(adminName ?? 'admin')},%0A%0AI%20would%20like%20to%20request%20a%20${brand}%20account%20for%20${hospitalName}.%0A%0AThanks.`}
                                        className="block truncate text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
                                    >
                                        {adminEmail}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copy(adminEmail)}
                                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    title="Copy email"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {adminPhone && (
                            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <Phone className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Phone
                                    </p>
                                    <a
                                        href={`tel:${adminPhone.replace(/\s+/g, '')}`}
                                        className="block truncate text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
                                    >
                                        {adminPhone}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copy(adminPhone)}
                                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    title="Copy phone"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {adminEmail && (
                        <Button
                            asChild
                            className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <a
                                href={`mailto:${adminEmail}?subject=Request%20for%20${brand}%20staff%20account&body=Hi%20${encodeURIComponent(adminName ?? 'admin')},%0A%0AI%20would%20like%20to%20request%20a%20${brand}%20account%20for%20${hospitalName}.%0A%0AThanks.`}
                            >
                                <Mail className="mr-1.5 h-4 w-4" />
                                Email administrator
                            </a>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border bg-muted/30 p-5 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Headphones className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        The hospital administrator contact details are not
                        available yet. Please contact your hospital's IT
                        department directly.
                    </p>
                </div>
            )}

            <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                    Your administrator will create your account and share your
                    sign-in details. All {brand} accounts require email
                    verification before activation.
                </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to sign in
                </Link>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <Building2 className="h-3 w-3" />
                    {hospitalName}
                </Link>
            </div>
        </>
    );
}

RequestAccess.layout = {
    title: 'Request staff access',
    description: 'Staff accounts are created by your hospital administrator',
};