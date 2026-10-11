import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Crown,
    Eye,
    LoaderCircle,
    MoreHorizontal,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type Admin = {
    id: number;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'viewer';
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    is_self: boolean;
};

type Stats = { total: number; owners: number; active: number };

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
    return new Date(iso).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const ROLE_META = {
    owner: {
        label: 'Owner',
        icon: Crown,
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    },
    admin: {
        label: 'Admin',
        icon: ShieldCheck,
        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    },
    viewer: {
        label: 'Viewer',
        icon: Eye,
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
};

export default function SuperAdmins({
    admins,
    canManage,
    stats,
}: {
    admins: Admin[];
    canManage: boolean;
    stats: Stats;
}) {
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Admin | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Admin | null>(null);

    return (
        <>
            <Head title="Super Admins" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Super Admins
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {stats.total} total · {stats.owners} owner{stats.owners === 1 ? '' : 's'} · {stats.active} active
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add super admin
                    </Button>
                )}
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {props.errors?.role && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {props.errors.role}
                </div>
            )}
            {props.errors?.delete && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {props.errors.delete}
                </div>
            )}

            {!canManage && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    Only owners can manage super admins. You can view the list but not edit.
                </div>
            )}

            {/* Stat tiles */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                <StatTile label="Total" value={stats.total} icon={Users} tint="slate" />
                <StatTile label="Owners" value={stats.owners} icon={Crown} tint="amber" />
                <StatTile label="Active" value={stats.active} icon={CheckCircle2} tint="emerald" />
            </div>

            {/* Table */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Name</th>
                                <th className="px-5 py-3 font-semibold">Email</th>
                                <th className="px-5 py-3 font-semibold">Role</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 font-semibold">Last login</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {admins.map((a) => {
                                const meta = ROLE_META[a.role];
                                const Icon = meta.icon;
                                return (
                                    <tr
                                        key={a.id}
                                        className="transition hover:bg-muted/40"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        {initials(a.name)}
                                                    </div>
                                                    {a.is_active && (
                                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium">
                                                            {a.name}
                                                        </p>
                                                        {a.is_self && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px]"
                                                            >
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                        #{a.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-muted-foreground">
                                            {a.email}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
                                            >
                                                <Icon className="h-3 w-3" />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                className={
                                                    a.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                                                }
                                            >
                                                {a.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-muted-foreground">
                                            {relativeTime(a.last_login_at)}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {canManage && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                    >
                                                        <DropdownMenuItem
                                                            onSelect={() => setEditing(a)}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {!a.is_self && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onSelect={() => setConfirmDelete(a)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add super admin</DialogTitle>
                    </DialogHeader>
                    <AdminForm onSuccess={() => setCreateOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="max-w-md">
                    {editing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit super admin</DialogTitle>
                            </DialogHeader>
                            <AdminForm
                                admin={editing}
                                onSuccess={() => setEditing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
                <DialogContent className="max-w-md">
                    {confirmDelete && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">
                                    Delete super admin?
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-3 space-y-4 text-sm">
                                <p className="text-muted-foreground">
                                    Remove{' '}
                                    <span className="font-semibold text-foreground">
                                        {confirmDelete.name}
                                    </span>{' '}
                                    permanently. This cannot be undone.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmDelete(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            router.delete(
                                                `/admin/super-admins/${confirmDelete.id}`,
                                                { preserveScroll: true },
                                            );
                                            setConfirmDelete(null);
                                        }}
                                    >
                                        <Trash2 className="mr-1.5 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function StatTile({
    label,
    value,
    icon: Icon,
    tint,
}: {
    label: string;
    value: number;
    icon: any;
    tint: 'slate' | 'emerald' | 'amber';
}) {
    const tints: Record<string, string> = {
        slate: 'bg-muted text-muted-foreground',
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        amber:
            'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tints[tint]}`}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {value.toLocaleString()}
            </p>
        </Card>
    );
}

function AdminForm({
    admin,
    onSuccess,
}: {
    admin?: Admin;
    onSuccess: () => void;
}) {
    const isEdit = !!admin;

    const { data, setData, post, put, processing, errors } = useForm({
        name: admin?.name ?? '',
        email: admin?.email ?? '',
        password: '',
        password_confirmation: '',
        role: admin?.role ?? 'admin',
        is_active: admin?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onSuccess(),
        };
        if (isEdit) {
            put(`/admin/super-admins/${admin!.id}`, options);
        } else {
            post('/admin/super-admins', options);
        }
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    autoFocus
                />
                <InputError message={errors.name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
                <InputError message={errors.email} />
            </div>
            {!isEdit && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>
                </>
            )}
            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                    id="role"
                    value={data.role}
                    onChange={(e) => setData('role', e.target.value as any)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                    <option value="owner">Owner — full control</option>
                    <option value="admin">Admin — most features, cannot manage super admins</option>
                    <option value="viewer">Viewer — read-only access</option>
                </select>
                <InputError message={errors.role} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                />
                Active (can sign in)
            </label>

            <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSuccess}
                    disabled={processing}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && (
                        <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                    )}
                    {isEdit ? 'Save changes' : 'Create'}
                </Button>
            </div>
        </form>
    );
}