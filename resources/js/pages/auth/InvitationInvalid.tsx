import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Clock,
    KeyRound,
    Mail,
    ShieldCheck,
    XCircle,
} from 'lucide-react';

type Reason = 'not_found' | 'expired' | 'accepted' | string;

const SCENARIOS: Record<
    Reason,
    {
        title: string;
        description: string;
        hint: string;
        Icon: typeof AlertTriangle;
        iconTone: string;
        accent: string;
    }
> = {
    not_found: {
        title: 'Invitation not found',
        description:
            'This invitation link is not recognised. It may have been cancelled, replaced, or copied incorrectly.',
        hint: 'Ask your hospital administrator to send a new invitation.',
        Icon: XCircle,
        iconTone:
            'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        accent: 'from-rose-500 to-red-600',
    },
    expired: {
        title: 'Invitation expired',
        description:
            'This invitation is more than 7 days old. For security, invitation links expire automatically.',
        hint: 'Ask your hospital administrator to send a fresh link.',
        Icon: Clock,
        iconTone:
            'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        accent: 'from-amber-500 to-orange-600',
    },
    accepted: {
        title: 'Invitation already used',
        description:
            'You have already set your password with this link. It can only be used once.',
        hint: 'Sign in with your email and password to continue.',
        Icon: ShieldCheck,
        iconTone:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        accent: 'from-emerald-500 to-teal-600',
    },
};

export default function InvitationInvalid({ reason }: { reason: Reason }) {
    const s = SCENARIOS[reason] ?? SCENARIOS.not_found;
    const Icon = s.Icon;

    return (
        <>
            <Head title={`${s.title} · YaliHealth`} />

            <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/30 p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-emerald-900/5">
                    {/* Accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${s.accent}`} />

                    <div className="p-8 sm:p-10">
                        {/* Icon */}
                        <div
                            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${s.iconTone}`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>

                        {/* Heading */}
                        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">
                            {s.title}
                        </h1>
                        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                            {s.description}
                        </p>

                        {/* Hint box */}
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border bg-muted/40 p-3.5 text-xs">
                            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {s.hint}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col gap-2">
                            {reason === 'accepted' ? (
                                <Button
                                    asChild
                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <Link href="/login">
                                        <KeyRound className="mr-1.5 h-4 w-4" />
                                        Sign in
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full justify-between"
                                    >
                                        <Link href="/login">
                                            <span className="flex items-center">
                                                <KeyRound className="mr-2 h-4 w-4" />
                                                Go to sign in
                                            </span>
                                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <Link href="/">
                                            Back to homepage
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Support footer */}
                        <div className="mt-8 border-t pt-5 text-center">
                            <p className="text-[11px] text-muted-foreground">
                                Need help? Contact{' '}
                                <span className="font-medium text-foreground">
                                    YaliHealth support
                                </span>{' '}
                                or your hospital administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}