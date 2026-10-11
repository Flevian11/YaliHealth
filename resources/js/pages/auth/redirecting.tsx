import { Head } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    LoaderCircle,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    target: string;
    hospital: string;
    userName: string;
};

export default function Redirecting({ target, hospital, userName }: Props) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animated progress bar that fills over ~1.2s
        const start = performance.now();
        const duration = 1200;

        let raf: number;
        const tick = (now: number) => {
            const elapsed = now - start;
            const pct = Math.min(100, (elapsed / duration) * 100);
            setProgress(pct);
            if (pct < 100) {
                raf = requestAnimationFrame(tick);
            }
        };
        raf = requestAnimationFrame(tick);

        // Navigate after the animation completes plus a small breath
        const timeout = window.setTimeout(() => {
            window.location.href = target;
        }, 1350);

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(timeout);
        };
    }, [target]);

    const firstName = userName.split(' ')[0] || userName;

    return (
        <>
            <Head title={`Signing in to ${hospital}`} />

            <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-6 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/20">
                {/* Decorative orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-700/20" />
                    <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-700/20" />
                </div>

                <div className="relative w-full max-w-md">
                    <div className="rounded-2xl border bg-card p-8 shadow-[0_8px_40px_rgb(0,0,0,0.08)] sm:p-10">
                        {/* Icon */}
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/30 blur-2xl" />
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                                    <Building2 className="h-7 w-7" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                            </div>

                            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Signing you in
                            </p>
                            <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                                {hospital}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Welcome back, <span className="font-medium text-foreground">{firstName}</span>
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-8">
                            <div className="mb-2 flex items-center justify-between text-[11px]">
                                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                    <LoaderCircle className="h-3 w-3 animate-spin" />
                                    Redirecting to your workspace
                                </span>
                                <span className="font-medium tabular-nums text-muted-foreground">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-100 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Trust line */}
                        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>
                                Your session is being established securely.
                                This link is single-use and expires in 60 seconds.
                            </span>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[11px] text-muted-foreground">
                        Not redirected?{' '}
                        <a
                            href={target}
                            className="font-medium text-foreground underline underline-offset-2 hover:text-emerald-600"
                        >
                            Click here
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}

Redirecting.layout = null;