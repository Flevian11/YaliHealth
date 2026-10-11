import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

const BRAND = import.meta.env.VITE_APP_NAME || 'YaliHealth';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-6 md:p-10 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/20">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border bg-card p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
                    <div className="mb-8 flex flex-col items-center gap-3 text-center">
                        <Link
                            href="/"
                            className="flex flex-col items-center gap-3"
                        >
                            <img
                                src="/images/logo.png"
                                alt={BRAND}
                                className="h-16 w-16 object-contain"
                            />
                        </Link>
                        <div>
                            {title && (
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
                <p className="mt-6 text-center text-[11px] text-muted-foreground">
                    Protected by {BRAND}. All sign-in attempts are logged.
                </p>
            </div>
        </div>
    );
}