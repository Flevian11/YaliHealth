import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    KeyRound,
    Palette,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';

export default function TenantSettings() {
    const links = [
        {
            href: '/settings/profile',
            icon: UserCog,
            title: 'My Profile',
            desc: 'Update your name and email address',
            tint: 'emerald',
        },
        {
            href: '/settings/security',
            icon: ShieldCheck,
            title: 'Security & Passkeys',
            desc: 'Password, two-factor auth, and passkeys',
            tint: 'blue',
        },
        {
            href: '/settings/appearance',
            icon: Palette,
            title: 'Appearance',
            desc: 'Choose light, dark, or system theme',
            tint: 'violet',
        },
    ];

    const restricted = [
        {
            icon: Users,
            title: 'Staff & Users',
            desc: 'Add and manage hospital staff accounts',
        },
        {
            icon: KeyRound,
            title: 'HIE Credentials',
            desc: 'Manage integration secrets and facility codes',
        },
        {
            icon: Building2,
            title: 'Facility Settings',
            desc: 'Configure hospital-wide defaults',
        },
    ];

    return (
        <>
            <Head title="Settings" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account and hospital preferences
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Your account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {links.map((l) => {
                            const tints: Record<string, string> = {
                                emerald:
                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                                blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
                                violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
                            };
                            return (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className="group flex items-center gap-3 rounded-lg border bg-card p-3.5 transition hover:border-emerald-300 dark:hover:border-emerald-800"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tints[l.tint]}`}
                                    >
                                        <l.icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                            {l.title}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {l.desc}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                </Link>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Hospital administration
                            </CardTitle>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                Admin only
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {restricted.map((r) => (
                            <div
                                key={r.title}
                                className="flex items-center gap-3 rounded-lg border bg-card p-3.5 opacity-60"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <r.icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {r.title}
                                        </p>
                                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                            Soon
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {r.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardContent className="p-5">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-semibold">
                                Need help or want to upgrade?
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Our team is here to help with anything you need.
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/announcements">
                                View announcements
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}