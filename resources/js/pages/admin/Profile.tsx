import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Crown,
    Eye,
    LoaderCircle,
    Lock,
    LogIn,
    LogOut,
    ShieldCheck,
    User,
} from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';

type Admin = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_name: string;
    permissions: string[];
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
};

type ActivityRow = {
    id: number;
    event: string;
    ip_address: string | null;
    created_at: string;
};

type Catalog = Record<string, { label: string; permissions: Record<string, string> }>;

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

function relativeTime(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function eventLabel(event: string): string {
    const map: Record<string, string> = {
        'auth.login': 'Signed in',
        'auth.logout': 'Signed out',
        'auth.failed': 'Failed sign-in',
        'profile.updated': 'Profile updated',
        'profile.password.changed': 'Password changed',
    };
    return map[event] ?? event;
}

function eventStyle(event: string) {
    if (event.includes('failed')) return { Icon: ShieldCheck, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' };
    if (event.includes('login')) return { Icon: LogIn, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' };
    if (event.includes('logout')) return { Icon: LogOut, tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
    return { Icon: Activity, tint: 'bg-muted text-muted-foreground' };
}

const ROLE_TINTS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function Profile({
    admin,
    activity,
    catalog,
}: {
    admin: Admin;
    activity: ActivityRow[];
    catalog: Catalog;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const profileForm = useForm({
        name: admin.name,
        email: admin.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.put('/admin/profile', { preserveScroll: true });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put('/admin/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const isWildcard = admin.permissions.length === Object.values(catalog).reduce((s, g) => s + Object.keys(g.permissions).length, 0);

    return (
        <>
            <Head title="My Profile" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account details and password.
                </p>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {/* Header card */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                        <div className="relative shrink-0">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lg">
                                {initials(admin.name)}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card ${ROLE_TINTS[admin.role] ?? 'bg-muted'}`}>
                                {admin.role === 'owner' ? (
                                    <Crown className="h-3 w-3" />
                                ) : admin.role === 'admin' ? (
                                    <ShieldCheck className="h-3 w-3" />
                                ) : (
                                    <Eye className="h-3 w-3" />
                                )}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-bold">{admin.name}</h2>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_TINTS[admin.role] ?? 'bg-muted'}`}>
                                    <ShieldCheck className="h-3 w-3" />
                                    {admin.role_name}
                                </span>
                                <Badge
                                    className={
                                        admin.is_active
                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                                    }
                                >
                                    {admin.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-5" />

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Member since
                                </p>
                                <p className="text-sm font-medium">
                                    {relativeTime(admin.created_at)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Last login
                                </p>
                                <p className="text-sm font-medium">
                                    {relativeTime(admin.last_login_at)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Permissions
                                </p>
                                <p className="text-sm font-medium">
                                    {isWildcard ? 'Full access' : `${admin.permissions.length} of ${Object.values(catalog).reduce((s, g) => s + Object.keys(g.permissions).length, 0)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column - forms */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Profile details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Profile details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitProfile} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        value={profileForm.data.name}
                                        onChange={(e) =>
                                            profileForm.setData('name', e.target.value)
                                        }
                                    />
                                    <InputError message={profileForm.errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) =>
                                            profileForm.setData('email', e.target.value)
                                        }
                                    />
                                    <InputError message={profileForm.errors.email} />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                                                                disabled={profileForm.processing}
                                    >
                                        {profileForm.processing && (
                                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                        )}
                                        Save changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Change password
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitPassword} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'current_password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={passwordForm.errors.current_password}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">New password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={passwordForm.data.password}
                                            onChange={(e) =>
                                                passwordForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={passwordForm.errors.password}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Confirm password
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={
                                                passwordForm.data.password_confirmation
                                            }
                                            onChange={(e) =>
                                                passwordForm.setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                    >
                                        {passwordForm.processing && (
                                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                        )}
                                        Update password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Permissions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                My permissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isWildcard ? (
                                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                                    <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                            Full platform access
                                        </p>
                                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                                            As {admin.role_name}, you have every permission.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(catalog).map(([key, group]) => {
                                        const granted = Object.keys(
                                            group.permissions,
                                        ).filter((p) =>
                                            admin.permissions.includes(p),
                                        );
                                        if (granted.length === 0) return null;
                                        return (
                                            <div
                                                key={key}
                                                className="rounded-lg border bg-card p-3"
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-xs font-semibold">
                                                        {group.label}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {granted.length}
                                                    </span>
                                                </div>
                                                <div className="grid gap-1 sm:grid-cols-2">
                                                    {granted.map((p) => (
                                                        <div
                                                            key={p}
                                                            className="flex items-center gap-2 text-xs"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                            <span className="truncate">
                                                                {group.permissions[p]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right column - activity */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Recent activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No activity yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {activity.map((a) => {
                                        const { Icon, tint } = eventStyle(a.event);
                                        return (
                                            <div
                                                key={a.id}
                                                className="flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                                            >
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {eventLabel(a.event)}
                                                    </p>
                                                    <p className="truncate text-[11px] text-muted-foreground">
                                                        {a.ip_address ?? '—'}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                                    {relativeTime(a.created_at)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}