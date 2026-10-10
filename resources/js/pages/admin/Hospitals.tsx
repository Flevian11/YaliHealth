import InputError from '@/components/input-error';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    Building2,
    CheckCircle2,
    Copy,
    ExternalLink,
    Globe,
    LoaderCircle,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    Search,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import {
    FormEventHandler,
    useEffect,
    useRef,
    useState,
} from 'react';

type Hospital = {
    id: string;
    name: string;
    admin_name: string | null;
    admin_email: string | null;
    phone: string | null;
    status: string;
    domains: string[];
    created_at: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Stats = { total: number; active: number; suspended: number };

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'H';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
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

export default function Hospitals({
    hospitals,
    filters,
    tenantBase,
    stats,
}: {
    hospitals: Paginator<Hospital>;
    filters: { q: string; status: string };
    tenantBase: string;
    stats: Stats;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [createOpen, setCreateOpen] = useState(false);
    const [detail, setDetail] = useState<Hospital | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Hospital | null>(null);

    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    // Debounced search
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/hospitals',
                { q: query, status: filters.status || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['hospitals', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const setStatus = (s: string) => {
        router.get(
            '/admin/hospitals',
            { q: filters.q || undefined, status: s || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['hospitals', 'filters'],
            },
        );
    };

    const copy = (text: string) => navigator.clipboard?.writeText(text);

    return (
        <>
            <Head title="Hospitals" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hospitals</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {stats.total} total · {stats.active} active · {stats.suspended} suspended
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    New hospital
                </Button>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search name, domain, admin email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-9 w-full rounded-lg border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
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

                <div className="flex flex-wrap gap-1.5">
                    {[
                        { v: '', label: 'All' },
                        { v: 'active', label: 'Active' },
                        { v: 'suspended', label: 'Suspended' },
                    ].map(({ v, label }) => (
                        <button
                            key={v || 'all'}
                            onClick={() => setStatus(v)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                (filters.status || '') === v
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {hospitals.data.length === 0 ? (
                <EmptyState
                    hasFilters={!!(filters.q || filters.status)}
                    onCreate={() => setCreateOpen(true)}
                />
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Hospital</th>
                                        <th className="px-5 py-3 font-semibold">Domain</th>
                                        <th className="px-5 py-3 font-semibold">Primary admin</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Created</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {hospitals.data.map((h) => {
                                        const displayName =
                                            h.name?.trim() || h.domains[0] || h.id;
                                        const active = h.status === 'active';
                                        const domain = h.domains[0]
                                            ? `${h.domains[0]}.${tenantBase}`
                                            : null;
                                        const url = h.domains[0]
                                            ? `http://${h.domains[0]}.${tenantBase}:8000`
                                            : null;

                                        return (
                                            <tr
                                                key={h.id}
                                                className="group transition hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setDetail(h)}
                                                        className="flex items-center gap-3 text-left"
                                                    >
                                                        <div className="relative shrink-0">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary">
                                                                {initials(displayName)}
                                                            </div>
                                                            <span
                                                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                                                                    active
                                                                        ? 'bg-emerald-500'
                                                                        : 'bg-amber-500'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium group-hover:text-primary">
                                                                {displayName}
                                                            </p>
                                                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                                {h.id}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {domain ? (
                                                        <button
                                                            onClick={() => copy(domain)}
                                                            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11px] transition hover:bg-muted/70"
                                                            title="Click to copy"
                                                        >
                                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                                            {domain}
                                                            <Copy className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm">
                                                            {h.admin_name ?? '—'}
                                                        </p>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {h.admin_email ?? '—'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <Badge
                                                        className={
                                                            active
                                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                                                        }
                                                    >
                                                        {h.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-muted-foreground">
                                                    {relativeTime(h.created_at)}
                                                </td>
                                                <td className="px-5 py-3 text-right">
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
                                                            className="w-52"
                                                        >
                                                            <DropdownMenuItem
                                                                onSelect={() => setDetail(h)}
                                                            >
                                                                <Building2 className="mr-2 h-4 w-4" />
                                                                View details
                                                            </DropdownMenuItem>
                                                            {url && (
                                                                <DropdownMenuItem asChild>
                                                                    <a
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                                        Open tenant
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            {active ? (
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        router.post(
                                                                            `/admin/hospitals/${h.id}/suspend`,
                                                                            {},
                                                                            { preserveScroll: true },
                                                                        )
                                                                    }
                                                                >
                                                                    <Pause className="mr-2 h-4 w-4" />
                                                                    Suspend
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        router.post(
                                                                            `/admin/hospitals/${h.id}/activate`,
                                                                            {},
                                                                            { preserveScroll: true },
                                                                        )
                                                                    }
                                                                >
                                                                    <Play className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onSelect={() => setConfirmDelete(h)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete hospital
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={hospitals.current_page}
                        lastPage={hospitals.last_page}
                        total={hospitals.total}
                        perPage={hospitals.per_page}
                        baseUrl="/admin/hospitals"
                        filters={{ q: filters.q, status: filters.status }}
                    />
                </>
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create hospital</DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Provisions a new tenant with its own schema, subdomain, and administrator.
                        </p>
                    </DialogHeader>
                    <CreateForm onSuccess={() => setCreateOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Detail dialog */}
            <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
                <DialogContent className="max-w-xl">
                    {detail && (
                        <DetailView
                            hospital={detail}
                            tenantBase={tenantBase}
                            onClose={() => setDetail(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <DialogContent className="max-w-md">
                    {confirmDelete && (
                        <DeleteConfirm
                            hospital={confirmDelete}
                            onCancel={() => setConfirmDelete(null)}
                            onConfirm={() => {
                                router.delete(
                                    `/admin/hospitals/${confirmDelete.id}`,
                                    { preserveScroll: true },
                                );
                                setConfirmDelete(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ───────────── Empty ───────────── */
function EmptyState({
    hasFilters,
    onCreate,
}: {
    hasFilters: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
                {hasFilters ? 'No hospitals match your filters' : 'No hospitals yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters
                    ? 'Try clearing the search or filter.'
                    : 'Provision your first tenant to get started.'}
            </p>
            {!hasFilters && (
                <Button onClick={onCreate} className="mt-5">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create first hospital
                </Button>
            )}
        </div>
    );
}

/* ───────────── Delete confirm ───────────── */
function DeleteConfirm({
    hospital,
    onCancel,
    onConfirm,
}: {
    hospital: Hospital;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const [confirm, setConfirm] = useState('');
    const match = confirm.trim() === hospital.id;

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-destructive">
                    Delete hospital?
                </DialogTitle>
            </DialogHeader>
            <div className="mt-3 space-y-4 text-sm">
                <p className="text-muted-foreground">
                    This will permanently delete{' '}
                    <span className="font-semibold text-foreground">
                        {hospital.name || hospital.id}
                    </span>
                    , its database schema, all tenant data, and its subdomain.
                    This cannot be undone.
                </p>

                <div className="grid gap-2">
                    <Label htmlFor="confirm">
                        Type <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{hospital.id}</code> to confirm
                    </Label>
                    <Input
                        id="confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder={hospital.id}
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={!match}
                        onClick={onConfirm}
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete permanently
                    </Button>
                </div>
            </div>
        </>
    );
}

/* ───────────── Detail view ───────────── */
type Admin = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

function DetailView({
    hospital,
    tenantBase,
    onClose,
}: {
    hospital: Hospital;
    tenantBase: string;
    onClose: () => void;
}) {
    const displayName = hospital.name?.trim() || hospital.domains[0] || hospital.id;
    const active = hospital.status === 'active';
    const domain = hospital.domains[0]
        ? `${hospital.domains[0]}.${tenantBase}`
        : null;
    const url = hospital.domains[0]
        ? `http://${hospital.domains[0]}.${tenantBase}:8000`
        : null;

    const [admins, setAdmins] = useState<Admin[] | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const loadAdmins = () => {
        fetch(`/admin/hospitals/${hospital.id}/admins`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((d) => setAdmins(d.admins))
            .catch(() => setAdmins([]));
    };

    useEffect(() => {
        loadAdmins();
    }, [hospital.id]);

    const copy = (text: string) => navigator.clipboard?.writeText(text);

    return (
        <>
            <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-lg font-bold text-primary">
                        {initials(displayName)}
                    </div>
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                            active ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate">{displayName}</DialogTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Created {relativeTime(hospital.created_at)}
                    </p>
                    <Badge
                        className={`mt-2 ${
                            active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                    >
                        {hospital.status}
                    </Badge>
                </div>
            </div>

            <div className="mt-6 space-y-5">
                <Section title="Tenant">
                    <Row
                        label="Internal ID"
                        value={
                            <button
                                onClick={() => copy(hospital.id)}
                                className="font-mono text-xs hover:text-primary"
                            >
                                {hospital.id}
                            </button>
                        }
                    />
                    <Row
                        label="Subdomain"
                        value={
                            domain ? (
                                <button
                                    onClick={() => copy(domain)}
                                    className="font-mono text-xs hover:text-primary"
                                >
                                    {domain}
                                </button>
                            ) : (
                                '—'
                            )
                        }
                    />
                    <Row
                        label="Tenant URL"
                        value={
                            url ? (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    Open <ExternalLink className="h-3 w-3" />
                                </a>
                            ) : (
                                '—'
                            )
                        }
                    />
                    <Row label="Phone" value={hospital.phone ?? '—'} />
                </Section>

                <Section
                    title={`Administrators${admins ? ` (${admins.length})` : ''}`}
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setAddOpen(true)}
                        >
                            <UserPlus className="h-3 w-3" />
                            Add
                        </Button>
                    }
                >
                    {admins === null ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                            <LoaderCircle className="h-3 w-3 animate-spin" />
                            Loading admins...
                        </div>
                    ) : admins.length === 0 ? (
                        <p className="py-2 text-xs text-muted-foreground">
                            No admins yet.
                        </p>
                    ) : (
                        admins.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center gap-3 border-b py-2 last:border-b-0"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-[10px] font-bold text-primary">
                                    {initials(a.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {a.name}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {a.email}
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="shrink-0 text-[10px]"
                                >
                                    {a.role}
                                </Badge>
                            </div>
                        ))
                    )}
                </Section>

                {url && (
                    <Button asChild className="w-full">
                        <a href={url} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1.5 h-4 w-4" />
                            Open hospital console
                        </a>
                    </Button>
                )}
            </div>

            <AddAdminDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                hospitalId={hospital.id}
                onSuccess={() => {
                    setAddOpen(false);
                    loadAdmins();
                }}
            />
        </>
    );
}

function Section({
    title,
    action,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </h4>
                {action}
            </div>
            <div className="space-y-2 rounded-lg border bg-card p-3">
                {children}
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}

/* ───────────── Add admin dialog ───────────── */
function AddAdminDialog({
    open,
    onOpenChange,
    hospitalId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    hospitalId: string;
    onSuccess: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/admin/hospitals/${hospitalId}/admins`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add administrator</DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        This user will have hospital admin access inside this tenant.
                    </p>
                </DialogHeader>
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
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Add admin
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ───────────── Create form ───────────── */
function CreateForm({ onSuccess }: { onSuccess: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/hospitals', {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-6">
            <div>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Hospital information
                </h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Hospital name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nairobi West Hospital"
                            autoFocus
                        />
                        <InputError message={errors.name} />
                        <p className="text-[11px] text-muted-foreground">
                            Subdomain is generated from this name. Duplicates get
                            a numeric suffix automatically (e.g. yalipital-2).
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+254 700 000 000"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary administrator
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="admin_name">Full name</Label>
                        <Input
                            id="admin_name"
                            value={data.admin_name}
                            onChange={(e) => setData('admin_name', e.target.value)}
                            placeholder="Jane Doe"
                        />
                        <InputError message={errors.admin_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="admin_email">Email</Label>
                        <Input
                            id="admin_email"
                            type="email"
                            value={data.admin_email}
                            onChange={(e) => setData('admin_email', e.target.value)}
                            placeholder="admin@hospital.co.ke"
                        />
                        <InputError message={errors.admin_email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="admin_password">Password</Label>
                        <Input
                            id="admin_password"
                            type="password"
                            value={data.admin_password}
                            onChange={(e) => setData('admin_password', e.target.value)}
                        />
                        <InputError message={errors.admin_password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="admin_password_confirmation">
                            Confirm password
                        </Label>
                        <Input
                            id="admin_password_confirmation"
                            type="password"
                            value={data.admin_password_confirmation}
                            onChange={(e) =>
                                setData('admin_password_confirmation', e.target.value)
                            }
                        />
                    </div>
                </div>
            </div>

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
                    Create hospital
                </Button>
            </div>
        </form>
    );
}