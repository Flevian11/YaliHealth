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
    AlertTriangle,
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
    Sparkles,
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

type PlanSummary = {
    id: number;
    name: string;
    slug: string;
    billing_cycle: string;
    price_yearly: number;
    currency: string;
    setup_fee: number;
    trial_days: number;
};

type Hospital = {
    id: string;
    name: string;
    admin_name: string | null;
    admin_email: string | null;
    phone: string | null;
    status: string;
    domains: string[];
    created_at: string;
    plan: PlanSummary | null;
    subscription_status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    trial_days_left: number;
    can_access_system: boolean;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Stats = {
    total: number;
    active: number;
    suspended: number;
    expiring_soon: number;
};

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

function formatPrice(amount: number, currency: string): string {
    if (amount === 0) return 'Free';
    return `${currency} ${amount.toLocaleString()}`;
}

export default function Hospitals({
    hospitals,
    filters,
    tenantBase,
    stats,
    plans,
}: {
    hospitals: Paginator<Hospital>;
    filters: { q: string; status: string; plan: string };
    tenantBase: string;
    stats: Stats;
    plans: PlanSummary[];
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [createOpen, setCreateOpen] = useState(false);
    const [detail, setDetail] = useState<Hospital | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Hospital | null>(null);

    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/hospitals',
                {
                    q: query,
                    status: filters.status || undefined,
                    plan: filters.plan || undefined,
                },
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

    const applyFilter = (key: string, value: string) => {
        router.get(
            '/admin/hospitals',
            {
                q: filters.q || undefined,
                status: filters.status || undefined,
                plan: filters.plan || undefined,
                [key]: value || undefined,
            },
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
                    <h1 className="text-2xl font-bold tracking-tight">
                        Hospitals
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {stats.total} total · {stats.active} active · {stats.suspended} suspended
                        {stats.expiring_soon > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                                {' '}· {stats.expiring_soon} expiring soon
                            </span>
                        )}
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
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
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
                            onClick={() => applyFilter('status', v)}
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

                {plans.length > 0 && (
                    <select
                        value={filters.plan || ''}
                        onChange={(e) => applyFilter('plan', e.target.value)}
                        className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground outline-none transition hover:border-foreground/30"
                    >
                        <option value="">All plans</option>
                        {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {hospitals.data.length === 0 ? (
                <EmptyState
                    hasFilters={!!(filters.q || filters.status || filters.plan)}
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
                                        <th className="px-5 py-3 font-semibold">Plan</th>
                                        <th className="px-5 py-3 font-semibold">Subscription</th>
                                        <th className="px-5 py-3 font-semibold">Domain</th>
                                        <th className="px-5 py-3 font-semibold">Primary admin</th>
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
                                                    {h.plan ? (
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {h.plan.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {formatPrice(h.plan.price_yearly, h.plan.currency)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            No plan
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <SubscriptionBadge hospital={h} />
                                                </td>
                                                <td className="px-5 py-3">
                                                    {domain ? (
                                                        <button
                                                            onClick={() => copy(domain)}
                                                            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11px] transition hover:bg-muted/70"
                                                            title="Click to copy"
                                                        >
                                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                                            {h.domains[0]}
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
                        filters={{
                            q: filters.q,
                            status: filters.status,
                            plan: filters.plan,
                        }}
                    />
                </>
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create hospital</DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Provisions a new tenant with its own schema, subdomain, and administrator.
                        </p>
                    </DialogHeader>
                    <CreateForm
                        plans={plans}
                        onSuccess={() => setCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Detail dialog */}
            <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {detail && (
                        <DetailView
                            hospital={detail}
                            tenantBase={tenantBase}
                            plans={plans}
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

/* ───────────── Subscription badge ───────────── */
function SubscriptionBadge({ hospital }: { hospital: Hospital }) {
    const { subscription_status, trial_days_left, trial_ends_at, current_period_end, can_access_system } = hospital;

    if (!can_access_system) {
        return (
            <div className="flex items-center gap-1.5">
                <span className="flex h-6 items-center gap-1 rounded-full bg-rose-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    No access
                </span>
            </div>
        );
    }

    if (subscription_status === 'trialing') {
        const urgent = trial_days_left <= 3;
        return (
            <div className="flex items-center gap-1.5">
                <span
                    className={`flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide ${
                        urgent
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                    }`}
                >
                    <Sparkles className="h-3 w-3" />
                    Trial · {trial_days_left}d
                </span>
            </div>
        );
    }

    if (subscription_status === 'active') {
        const expiringSoon =
            current_period_end &&
            new Date(current_period_end).getTime() - Date.now() <
                14 * 24 * 60 * 60 * 1000;

        return (
            <div className="flex items-center gap-1.5">
                <span
                    className={`flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide ${
                        expiringSoon
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                >
                    <CheckCircle2 className="h-3 w-3" />
                    {expiringSoon ? 'Expiring' : 'Active'}
                </span>
                {current_period_end && (
                    <span className="text-[11px] text-muted-foreground">
                        {expiringSoon
                            ? `in ${Math.max(0, Math.ceil((new Date(current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d`
                            : relativeTime(current_period_end)}
                    </span>
                )}
            </div>
        );
    }

    return (
        <span className="flex h-6 items-center gap-1 rounded-full bg-muted px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {subscription_status}
        </span>
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
                    ? 'Try clearing the search or filters.'
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
    plans,
    onClose,
}: {
    hospital: Hospital;
    tenantBase: string;
    plans: PlanSummary[];
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
    const [planOpen, setPlanOpen] = useState(false);

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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                            className={
                                active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                            }
                        >
                            {hospital.status}
                        </Badge>
                        <SubscriptionBadge hospital={hospital} />
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-5">
                {/* Subscription */}
                <Section
                    title="Subscription"
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setPlanOpen(true)}
                        >
                            <Sparkles className="h-3 w-3" />
                            Change plan
                        </Button>
                    }
                >
                    {hospital.plan ? (
                        <>
                            <Row
                                label="Plan"
                                value={
                                    <span className="font-medium">
                                        {hospital.plan.name}
                                    </span>
                                }
                            />
                            <Row
                                label="Billing"
                                value={
                                    <span className="text-xs">
                                        {formatPrice(
                                            hospital.plan.price_yearly,
                                            hospital.plan.currency,
                                        )}{' '}
                                        /{' '}
                                        {hospital.plan.billing_cycle === 'annual'
                                            ? 'year'
                                            : hospital.plan.billing_cycle === 'semi_annual'
                                              ? '6 months'
                                              : hospital.plan.billing_cycle === 'quarterly'
                                                ? 'quarter'
                                                : 'month'}
                                    </span>
                                }
                            />
                            <Row
                                label="Status"
                                value={
                                    <Badge
                                        variant={
                                            hospital.subscription_status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className={
                                            hospital.subscription_status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : ''
                                        }
                                    >
                                        {hospital.subscription_status}
                                    </Badge>
                                }
                            />
                            {hospital.trial_ends_at && (
                                <Row
                                    label="Trial ends"
                                    value={new Date(
                                        hospital.trial_ends_at,
                                    ).toLocaleDateString()}
                                />
                            )}
                            {hospital.current_period_end && (
                                <Row
                                    label="Renews"
                                    value={new Date(
                                        hospital.current_period_end,
                                    ).toLocaleDateString()}
                                />
                            )}
                            <Row
                                label="System access"
                                value={
                                    hospital.can_access_system ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Enabled
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Blocked
                                        </span>
                                    )
                                }
                            />
                        </>
                    ) : (
                        <p className="py-2 text-xs text-muted-foreground">
                            No plan assigned.
                        </p>
                    )}
                </Section>

                {/* Tenant */}
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

                {/* Admins */}
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

            <ChangePlanDialog
                open={planOpen}
                onOpenChange={setPlanOpen}
                hospital={hospital}
                plans={plans}
                onSuccess={() => {
                    setPlanOpen(false);
                    onClose();
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

/* ───────────── Change plan dialog ───────────── */
function ChangePlanDialog({
    open,
    onOpenChange,
    hospital,
    plans,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    hospital: Hospital;
    plans: PlanSummary[];
    onSuccess: () => void;
}) {
    const [selected, setSelected] = useState<number | null>(
        hospital.plan?.id ?? null,
    );
    const [resetPeriod, setResetPeriod] = useState(false);
    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selected) return;
        setProcessing(true);
        router.post(
            `/admin/hospitals/${hospital.id}/plan`,
            { plan_id: selected, reset_period: resetPeriod },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onSuccess();
                },
                onError: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Change plan</DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Switch {hospital.name || hospital.id} to a different
                        billing cycle.
                    </p>
                </DialogHeader>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="grid gap-2">
                        {plans.map((p) => {
                            const isCurrent = p.id === hospital.plan?.id;
                            const cycleLabel =
                                p.billing_cycle === 'annual'
                                    ? 'per year'
                                    : p.billing_cycle === 'semi_annual'
                                      ? 'every 6 months'
                                      : p.billing_cycle === 'quarterly'
                                        ? 'per quarter'
                                        : 'per month';
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelected(p.id)}
                                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${
                                        selected === p.id
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:border-foreground/20'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {p.name}
                                            </span>
                                            {isCurrent && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {formatPrice(p.price_yearly, p.currency)}{' '}
                                            {cycleLabel}
                                            {p.setup_fee > 0 && (
                                                <>
                                                    {' '}· +{' '}
                                                    {formatPrice(
                                                        p.setup_fee,
                                                        p.currency,
                                                    )}{' '}
                                                    setup
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                            selected === p.id
                                                ? 'border-primary'
                                                : 'border-border'
                                        }`}
                                    >
                                        {selected === p.id && (
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                        <input
                            type="checkbox"
                            checked={resetPeriod}
                            onChange={(e) => setResetPeriod(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border"
                        />
                        <div>
                            <div className="font-medium">
                                Reset billing period
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Immediately starts a new billing cycle from today.
                                Leave unchecked to keep the current period and only
                                change the plan tier.
                            </p>
                        </div>
                    </label>

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
                            disabled={processing || !selected || selected === hospital.plan?.id}
                        >
                            {processing && (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Change plan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
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
function CreateForm({
    plans,
    onSuccess,
}: {
    plans: PlanSummary[];
    onSuccess: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        plan_id: plans[0]?.id ?? null,
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
                    <div className="grid gap-2">
                        <Label htmlFor="plan_id">Subscription plan</Label>
                        <select
                            id="plan_id"
                            value={data.plan_id ?? ''}
                            onChange={(e) =>
                                setData(
                                    'plan_id',
                                    e.target.value ? Number(e.target.value) : null,
                                )
                            }
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} · {p.currency}{' '}
                                    {p.price_yearly.toLocaleString()} /{' '}
                                    {p.billing_cycle === 'annual'
                                        ? 'year'
                                        : p.billing_cycle === 'semi_annual'
                                          ? '6 months'
                                          : p.billing_cycle === 'quarterly'
                                            ? 'quarter'
                                            : 'month'}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.plan_id} />
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