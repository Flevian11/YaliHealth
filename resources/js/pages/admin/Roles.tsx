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
import { usePermissions } from '@/hooks/use-permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Crown,
    Eye,
    LoaderCircle,
    Lock,
    MoreHorizontal,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type Role = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    permissions: string[];
    is_system: boolean;
    sort_order: number;
    users_count: number;
};

type Catalog = Record<string, { label: string; permissions: Record<string, string> }>;

const ROLE_ICONS: Record<string, any> = {
    owner: Crown,
    admin: ShieldCheck,
    viewer: Eye,
};

const ROLE_TINTS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function roleIcon(slug: string) {
    return ROLE_ICONS[slug] ?? ShieldCheck;
}

function roleTint(slug: string, isSystem: boolean) {
    return ROLE_TINTS[slug] ?? (isSystem
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        : 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400');
}

export default function Roles({
    roles,
    catalog,
    stats,
}: {
    roles: Role[];
    catalog: Catalog;
    stats: { total: number; system: number; custom: number; total_permissions: number };
}) {
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();
    const { can } = usePermissions();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
    const [viewing, setViewing] = useState<Role | null>(null);

    return (
        <>
            <Head title="Roles & Permissions" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Roles & Permissions
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {stats.total} roles · {stats.system} system · {stats.custom} custom · {stats.total_permissions} permissions available
                    </p>
                </div>
                {can('roles.create') && (
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        New role
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                    <RoleCard
                        key={role.id}
                        role={role}
                        totalPermissions={stats.total_permissions}
                        onView={() => setViewing(role)}
                        onEdit={() => setEditing(role)}
                        onDelete={() => setConfirmDelete(role)}
                        canEdit={can('roles.edit')}
                        canDelete={can('roles.delete')}
                    />
                ))}
            </div>

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create role</DialogTitle>
                    </DialogHeader>
                    <RoleForm
                        catalog={catalog}
                        onSuccess={() => setCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {editing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit role</DialogTitle>
                            </DialogHeader>
                            <RoleForm
                                role={editing}
                                catalog={catalog}
                                onSuccess={() => setEditing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* View dialog */}
            <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    {viewing && (
                        <RoleView
                            role={viewing}
                            catalog={catalog}
                            onClose={() => setViewing(null)}
                            onEdit={() => {
                                const r = viewing;
                                setViewing(null);
                                setEditing(r);
                            }}
                            canEdit={can('roles.edit')}
                        />
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
                                    Delete role
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-3 space-y-4 text-sm">
                                <p className="text-muted-foreground">
                                    Delete{' '}
                                    <span className="font-semibold text-foreground">
                                        {confirmDelete.name}
                                    </span>
                                    ? This cannot be undone.
                                </p>
                                {confirmDelete.users_count > 0 && (
                                    <p className="rounded-md bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                        {confirmDelete.users_count} admin{confirmDelete.users_count === 1 ? '' : 's'}{' '}
                                        currently use this role. Reassign them first.
                                    </p>
                                )}
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={confirmDelete.users_count > 0}
                                        onClick={() => {
                                            router.delete(`/admin/roles/${confirmDelete.id}`, {
                                                preserveScroll: true,
                                            });
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

function RoleCard({
    role,
    totalPermissions,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: {
    role: Role;
    totalPermissions: number;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
    const Icon = roleIcon(role.slug);
    const tint = roleTint(role.slug, role.is_system);
    const isWildcard = role.permissions.includes('*');
    const permCount = isWildcard ? totalPermissions : role.permissions.length;
    const pct = totalPermissions ? Math.round((permCount / totalPermissions) * 100) : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <button onClick={onView} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="truncate text-base font-semibold hover:text-primary">
                                    {role.name}
                                </CardTitle>
                                {role.is_system && (
                                    <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                                        <Lock className="h-2.5 w-2.5" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                {role.slug}
                            </p>
                        </div>
                    </button>
                    {(canEdit || canDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onSelect={onView}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                </DropdownMenuItem>
                                {canEdit && (
                                    <DropdownMenuItem onSelect={onEdit}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit role
                                    </DropdownMenuItem>
                                )}
                                {canDelete && !role.is_system && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={onDelete}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete role
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                {role.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {role.description}
                    </p>
                )}

                <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Permissions</span>
                        <span className="font-semibold tabular-nums">
                            {isWildcard ? 'All' : `${permCount} / ${totalPermissions}`}
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t pt-3 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {role.users_count} {role.users_count === 1 ? 'admin' : 'admins'} assigned
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function RoleView({
    role,
    catalog,
    onClose,
    onEdit,
    canEdit,
}: {
    role: Role;
    catalog: Catalog;
    onClose: () => void;
    onEdit: () => void;
    canEdit: boolean;
}) {
    const Icon = roleIcon(role.slug);
    const tint = roleTint(role.slug, role.is_system);
    const isWildcard = role.permissions.includes('*');

    return (
        <>
            <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <DialogTitle className="truncate">{role.name}</DialogTitle>
                                {role.is_system && (
                                    <Badge variant="secondary" className="gap-1 text-[10px]">
                                        <Lock className="h-2.5 w-2.5" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                {role.slug}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                        {canEdit && (
                            <Button size="sm" onClick={onEdit}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                            </Button>
                        )}
                    </div>
                </div>
            </DialogHeader>

            <div className="mt-5 space-y-5">
                {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border bg-card p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Admins
                        </p>
                        <p className="mt-1 text-xl font-bold tabular-nums">
                            {role.users_count}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Permissions
                        </p>
                        <p className="mt-1 text-xl font-bold tabular-nums">
                            {isWildcard ? 'All' : role.permissions.length}
                        </p>
                    </div>
                </div>

                {isWildcard ? (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                Full platform access
                            </p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                                This role has every permission on the platform.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(catalog).map(([groupKey, group]) => {
                            const included = Object.keys(group.permissions).filter((k) =>
                                role.permissions.includes(k),
                            );
                            if (included.length === 0) return null;

                            return (
                                <div key={groupKey} className="rounded-lg border bg-card p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold">
                                            {group.label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {included.length} / {Object.keys(group.permissions).length}
                                        </span>
                                    </div>
                                    <div className="grid gap-1 sm:grid-cols-2">
                                        {included.map((k) => (
                                            <div key={k} className="flex items-center gap-2 text-xs">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span className="truncate">
                                                    {group.permissions[k]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

function RoleForm({
    role,
    catalog,
    onSuccess,
}: {
    role?: Role;
    catalog: Catalog;
    onSuccess: () => void;
}) {
    const isEdit = !!role;
    const isWildcardRole = role?.permissions.includes('*') ?? false;

        const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        slug: string;
        description: string;
        permissions: string[];
        sort_order: number;
    }>({
        name: role?.name ?? '',
        slug: role?.slug ?? '',
        description: role?.description ?? '',
        permissions: role?.permissions ?? [],
        sort_order: role?.sort_order ?? 0,
    });

    const allKeys = useMemo(() => {
        const keys: string[] = [];
        Object.values(catalog).forEach((g) => {
            Object.keys(g.permissions).forEach((k) => keys.push(k));
        });
        return keys;
    }, [catalog]);

    const toggle = (key: string) => {
        setData(
            'permissions',
            data.permissions.includes(key)
                ? data.permissions.filter((p) => p !== key)
                : [...data.permissions, key],
        );
    };

    const toggleGroup = (groupKey: string) => {
        const group = catalog[groupKey];
        const keys = Object.keys(group.permissions);
        const allOn = keys.every((k) => data.permissions.includes(k));
        if (allOn) {
            setData('permissions', data.permissions.filter((p) => !keys.includes(p)));
        } else {
            setData('permissions', Array.from(new Set([...data.permissions, ...keys])));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onSuccess() };
        if (isEdit) {
            put(`/admin/roles/${role!.id}`, options);
        } else {
            post('/admin/roles', options);
        }
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-5">
            {isWildcardRole && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    This role has wildcard access (<code className="font-mono">*</code>).
                    Individual permissions cannot be edited.
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Role name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Billing Manager"
                        autoFocus
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug {role?.is_system && '(locked)'}</Label>
                    <Input
                        id="slug"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="billing-manager"
                        disabled={role?.is_system}
                    />
                    <InputError message={errors.slug} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Manages hospital billing and reconciliations."
                    />
                </div>
            </div>

            {!isWildcardRole && (
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Permissions
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {data.permissions.length} / {allKeys.length} selected
                        </span>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(catalog).map(([groupKey, group]) => {
                            const keys = Object.keys(group.permissions);
                            const allOn = keys.every((k) => data.permissions.includes(k));
                            const someOn = keys.some((k) => data.permissions.includes(k));
                            return (
                                <div key={groupKey} className="rounded-lg border bg-card">
                                    <div className="flex items-center justify-between border-b px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold">
                                                {group.label}
                                            </span>
                                            {someOn && !allOn && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {keys.filter((k) => data.permissions.includes(k)).length} / {keys.length}
                                                </Badge>
                                            )}
                                            {allOn && (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    All
                                                </Badge>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(groupKey)}
                                            className="text-[11px] font-medium text-primary hover:underline"
                                        >
                                            {allOn ? 'Deselect all' : 'Select all'}
                                        </button>
                                    </div>
                                    <div className="grid gap-1 p-2 sm:grid-cols-2">
                                        {Object.entries(group.permissions).map(([key, label]) => {
                                            const checked = data.permissions.includes(key);
                                            return (
                                                <button
                                                    type="button"
                                                    key={key}
                                                    onClick={() => toggle(key)}
                                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                                                        checked
                                                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                                    }`}>
                                                        {checked && <CheckCircle2 className="h-3 w-3" />}
                                                    </div>
                                                    <span className="truncate">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={onSuccess} disabled={processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Save changes' : 'Create role'}
                </Button>
            </div>
        </form>
    );
}