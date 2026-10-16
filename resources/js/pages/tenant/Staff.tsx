import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    LoaderCircle,
    Mail,
    MoreVertical,
    Search,
    ShieldCheck,
    UserCog,
    UserPlus,
    UserX,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type StaffUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    role_tone: string;
    is_active: boolean;
    status: 'active' | 'invited' | 'inactive';
    last_login_at: string | null;
    last_login_ip: string | null;
    invited_at: string | null;
    created_at: string;
    is_self: boolean;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Filters = {
    q: string;
    role: string;
    status: string;
};

type RoleOptions = Record<string, string>;
type RoleTones = Record<string, string>;

/* ═════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════ */

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

const STATUS_META = {
    active: {
        label: 'Active',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        Icon: CheckCircle2,
    },
    invited: {
        label: 'Invited',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        Icon: Clock,
    },
    inactive: {
        label: 'Inactive',
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        Icon: UserX,
    },
};

function StatusBadge({ status }: { status: string }) {
    const m = STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.active;
    const Icon = m.Icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}
        >
            <Icon className="h-3 w-3" />
            {m.label}
        </span>
    );
}

function RoleBadge({ label, tone }: { label: string; tone: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
        >
            {label}
        </span>
    );
}

/* ═════════════════════════════════════════════════
   Main page
   ═════════════════════════════════════════════════ */

export default function Staff({
    users,
    filters,
    roleOptions,
    roleTones,
}: {
    users: Paginator<StaffUser>;
    filters: Filters;
    roleOptions: RoleOptions;
    roleTones: RoleTones;
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    const [inviteOpen, setInviteOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    /* Debounced search */
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/staff',
                {
                    q: query || undefined,
                    role: filters.role || undefined,
                    status: filters.status || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['users', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const setRoleFilter = (role: string) => {
        router.get(
            '/staff',
            {
                q: query || undefined,
                role: role || undefined,
                status: filters.status || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['users', 'filters'] },
        );
    };

    const setStatusFilter = (status: string) => {
        router.get(
            '/staff',
            {
                q: query || undefined,
                role: filters.role || undefined,
                status: status || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['users', 'filters'] },
        );
    };

    return (
        <>
            <Head title="Staff & Users" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Staff & Users</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {users.total} {users.total === 1 ? 'person' : 'people'} on your team
                    </p>
                </div>
                <Button
                    onClick={() => setInviteOpen(true)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Invite staff
                </Button>
            </div>

            {/* Filter row */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setRoleFilter('')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!filters.role
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        All roles
                    </button>
                    {Object.entries(roleOptions).map(([slug, label]) => (
                        <button
                            key={slug}
                            onClick={() => setRoleFilter(slug)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filters.role === slug
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filters.status}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-lg border bg-card px-3 text-xs font-medium shadow-sm"
                    >
                        <option value="">Any status</option>
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <div className="relative w-full lg:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name or email"
                            className="h-9 w-full rounded-lg border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            {users.data.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                        <UserCog className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        {filters.q || filters.role || filters.status
                            ? 'No staff match'
                            : 'No staff yet'}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {filters.q || filters.role || filters.status
                            ? 'Try a different filter.'
                            : 'Invite your first team member to get started.'}
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Person</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="hidden px-5 py-3 font-semibold md:table-cell">
                                            Last login
                                        </th>
                                        <th className="w-12 px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.data.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="transition hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        {initials(u.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="flex items-center gap-2 truncate text-sm font-medium">
                                                            {u.name}
                                                            {u.is_self && (
                                                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                    You
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <RoleBadge
                                                    label={u.role_label}
                                                    tone={u.role_tone}
                                                />
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={u.status} />
                                            </td>
                                            <td className="hidden px-5 py-3 text-xs text-muted-foreground md:table-cell">
                                                {u.last_login_at ? (
                                                    <RelativeTime iso={u.last_login_at} />
                                                ) : u.invited_at ? (
                                                    <span className="italic">
                                                        Never (invited)
                                                    </span>
                                                ) : (
                                                    <span className="italic">
                                                        Never
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                    aria-label="Manage user"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={users.current_page}
                        lastPage={users.last_page}
                        total={users.total}
                        perPage={users.per_page}
                        baseUrl="/staff"
                        filters={{
                            q: filters.q,
                            role: filters.role,
                            status: filters.status,
                        }}
                    />
                </>
            )}

            {/* Invite modal */}
            <InviteStaffModal
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                roleOptions={roleOptions}
            />

            {/* Edit modal */}
            <EditStaffModal
                user={editingUser}
                onClose={() => setEditingUser(null)}
                roleOptions={roleOptions}
            />
        </>
    );
}

/* ═════════════════════════════════════════════════
   Invite modal
   ═════════════════════════════════════════════════ */

function InviteStaffModal({
    open,
    onOpenChange,
    roleOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roleOptions: RoleOptions;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        role: 'nurse' as string,
    });

    useEffect(() => {
        if (open) return;
        reset();
    }, [open]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/staff', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Invite a staff member
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        They'll receive an email with a link to set their password.
                    </p>
                </DialogHeader>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invite-name">Full name</Label>
                        <Input
                            id="invite-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Jane Wanjiku"
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="jane@hospital.co.ke"
                        />
                        {errors.email && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <select
                            id="invite-role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                            {Object.entries(roleOptions).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.role && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                                {errors.role}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {processing ? (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-1.5 h-4 w-4" />
                            )}
                            Send invitation
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ═════════════════════════════════════════════════
   Edit modal
   ═════════════════════════════════════════════════ */

function EditStaffModal({
    user,
    onClose,
    roleOptions,
}: {
    user: StaffUser | null;
    onClose: () => void;
    roleOptions: RoleOptions;
}) {
    const [role, setRole] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        if (user) setRole(user.role);
    }, [user]);

    if (!user) return null;

    const handleRoleChange = () => {
        if (role === user.role) return;
        setBusy('role');
        router.post(
            `/staff/${user.id}/role`,
            { role },
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
                onSuccess: () => onClose(),
            },
        );
    };

    const handleToggleActive = () => {
        if (!confirm(
            user.is_active
                ? `Deactivate ${user.name}? They will no longer be able to log in.`
                : `Reactivate ${user.name}?`,
        )) return;

        setBusy('toggle');
        router.post(
            `/staff/${user.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
                onSuccess: () => onClose(),
            },
        );
    };

    const handleSendReset = () => {
        setBusy('reset');
        router.post(
            `/staff/${user.id}/send-reset`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
                onSuccess: () => onClose(),
            },
        );
    };

    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        {user.name}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {user.email}
                    </p>
                </DialogHeader>

                <div className="mt-4 space-y-5">
                    {/* Role */}
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex gap-2">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                disabled={user.is_self}
                                className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-60"
                            >
                                {Object.entries(roleOptions).map(([slug, label]) => (
                                    <option key={slug} value={slug}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <Button
                                type="button"
                                onClick={handleRoleChange}
                                disabled={
                                    busy !== null ||
                                    role === user.role ||
                                    user.is_self
                                }
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {busy === 'role' ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </div>
                        {user.is_self && (
                            <p className="text-[11px] text-muted-foreground">
                                You cannot change your own role.
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendReset}
                            disabled={busy !== null}
                            className="w-full justify-start"
                        >
                            {busy === 'reset' ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Send new invitation link
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleToggleActive}
                            disabled={busy !== null || user.is_self}
                            className={`w-full justify-start ${user.is_active
                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                }`}
                        >
                            {busy === 'toggle' ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : user.is_active ? (
                                <UserX className="mr-2 h-4 w-4" />
                            ) : (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            {user.is_active
                                ? 'Deactivate access'
                                : 'Reactivate access'}
                        </Button>
                        {user.is_self && (
                            <p className="text-[11px] text-muted-foreground">
                                You cannot deactivate your own account.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}