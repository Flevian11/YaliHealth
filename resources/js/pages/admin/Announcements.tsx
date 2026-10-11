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
    AlertCircle,
    BarChart3,
    Bell,
    CheckCircle2,
    Eye,
    LoaderCircle,
    Mail,
    Megaphone,
    MessageSquare,
    MoreHorizontal,
    Pencil,
    Plus,
    Rocket,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

type Announcement = {
    id: number;
    title: string;
    body: string;
    category: string;
    priority: string;
    status: string;
    target_type: 'all' | 'plan' | 'tenant';
    target_ids: (number | string)[];
    channels: string[];
    scheduled_at: string | null;
    published_at: string | null;
    expires_at: string | null;
    created_at: string;
    reads_count: number;
    recipients_count: number;
    emails_sent: number;
    emails_failed: number;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Stats = { total: number; published: number; draft: number; scheduled: number };

const CATEGORY_META: Record<string, { label: string; icon: any; cls: string }> = {
    general: { label: 'General', icon: Megaphone, cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    billing: { label: 'Billing', icon: Tag, cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    usage: { label: 'Usage', icon: BarChart3, cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    feature: { label: 'New feature', icon: Sparkles, cls: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300' },
    advert: { label: 'Advert', icon: Rocket, cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    maintenance: { label: 'Maintenance', icon: Wrench, cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
};

const PRIORITY_CLS: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    high: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    urgent: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

const STATUS_CLS: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    expired: 'bg-muted text-muted-foreground',
};

function relativeTime(iso: string | null): string {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 0) {
        const future = Math.abs(diff);
        if (future < 3600) return `in ${Math.floor(future / 60)}m`;
        if (future < 86400) return `in ${Math.floor(future / 3600)}h`;
        return `in ${Math.floor(future / 86400)}d`;
    }
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Announcements({
    announcements,
    filters,
    tenants,
    plans,
    categories,
    stats,
}: {
    announcements: Paginator<Announcement>;
    filters: { q: string; status: string; category: string };
    tenants: { id: string; name: string }[];
    plans: { id: number; name: string }[];
    categories: string[];
    stats: Stats;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Announcement | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
    const [viewing, setViewing] = useState<Announcement | null>(null);

    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/admin/announcements',
                {
                    q: query,
                    status: filters.status || undefined,
                    category: filters.category || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['announcements', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const applyFilter = (key: string, value: string) => {
        router.get(
            '/admin/announcements',
            {
                q: filters.q || undefined,
                status: filters.status || undefined,
                category: filters.category || undefined,
                [key]: value || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['announcements', 'filters'],
            },
        );
    };

    return (
        <>
            <Head title="Announcements" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Announcements
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Send messages, billing notices, usage reports, feature launches, and adverts to hospitals.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    New announcement
                </Button>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Total" value={stats.total} icon={MessageSquare} tint="slate" />
                <StatTile label="Published" value={stats.published} icon={CheckCircle2} tint="emerald" />
                <StatTile label="Scheduled" value={stats.scheduled} icon={Bell} tint="sky" />
                <StatTile label="Drafts" value={stats.draft} icon={Pencil} tint="amber" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search title or body..."
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
                        { v: 'published', label: 'Published' },
                        { v: 'scheduled', label: 'Scheduled' },
                        { v: 'draft', label: 'Draft' },
                    ].map(({ v, label }) => (
                        <FilterPill
                            key={v || 'all'}
                            active={(filters.status || '') === v}
                            onClick={() => applyFilter('status', v)}
                        >
                            {label}
                        </FilterPill>
                    ))}
                </div>

                <select
                    value={filters.category || ''}
                    onChange={(e) => applyFilter('category', e.target.value)}
                    className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground outline-none transition hover:border-foreground/30"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {CATEGORY_META[c]?.label ?? c}
                        </option>
                    ))}
                </select>
            </div>

            {announcements.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                        <Megaphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        {filters.q || filters.status || filters.category
                            ? 'No matching announcements'
                            : 'No announcements yet'}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {filters.q || filters.status || filters.category
                            ? 'Try clearing filters or search.'
                            : 'Compose your first message to hospitals.'}
                    </p>
                    {!filters.q && !filters.status && !filters.category && (
                        <Button onClick={() => setCreateOpen(true)} className="mt-5">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Create first announcement
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Announcement</th>
                                        <th className="px-5 py-3 font-semibold">Category</th>
                                        <th className="px-5 py-3 font-semibold">Priority</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Reach</th>
                                        <th className="px-5 py-3 font-semibold">When</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {announcements.data.map((a) => {
                                        const cat = CATEGORY_META[a.category];
                                        const CatIcon = cat?.icon ?? Megaphone;
                                        const pct = a.recipients_count > 0
                                            ? Math.round((a.reads_count / a.recipients_count) * 100)
                                            : 0;

                                        return (
                                            <tr
                                                key={a.id}
                                                className="group transition hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setViewing(a)}
                                                        className="flex min-w-0 items-start gap-3 text-left"
                                                    >
                                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cat?.cls ?? ''}`}>
                                                            <CatIcon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium group-hover:text-primary">
                                                                {a.title}
                                                            </p>
                                                            <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                                                {a.body}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cat?.cls ?? ''}`}>
                                                        {cat?.label ?? a.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CLS[a.priority] ?? ''}`}>
                                                        {a.priority}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLS[a.status] ?? ''}`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] tabular-nums text-muted-foreground">
                                                            {a.reads_count}/{a.recipients_count}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-muted-foreground">
                                                    {a.published_at
                                                        ? relativeTime(a.published_at)
                                                        : a.scheduled_at
                                                          ? relativeTime(a.scheduled_at)
                                                          : relativeTime(a.created_at)}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onSelect={() => setViewing(a)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => setEditing(a)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {a.status !== 'published' && (
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        router.post(
                                                                            `/admin/announcements/${a.id}/publish`,
                                                                            {},
                                                                            { preserveScroll: true },
                                                                        )
                                                                    }
                                                                >
                                                                    <Rocket className="mr-2 h-4 w-4" />
                                                                    Publish now
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onSelect={() => setConfirmDelete(a)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
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
                        currentPage={announcements.current_page}
                        lastPage={announcements.last_page}
                        total={announcements.total}
                        perPage={announcements.per_page}
                        baseUrl="/admin/announcements"
                        filters={{ q: filters.q, status: filters.status, category: filters.category }}
                    />
                </>
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New announcement</DialogTitle>
                    </DialogHeader>
                    <AnnouncementForm
                        tenants={tenants}
                        plans={plans}
                        categories={categories}
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
                                <DialogTitle>Edit announcement</DialogTitle>
                            </DialogHeader>
                            <AnnouncementForm
                                announcement={editing}
                                tenants={tenants}
                                plans={plans}
                                categories={categories}
                                onSuccess={() => setEditing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* View dialog */}
            <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
                <DialogContent className="max-w-xl">
                    {viewing && (
                        <AnnouncementView
                            announcement={viewing}
                            tenants={tenants}
                            plans={plans}
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
                                    Delete announcement?
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-3 space-y-4 text-sm">
                                <p className="text-muted-foreground">
                                    Delete{' '}
                                    <span className="font-semibold text-foreground">
                                        {confirmDelete.title}
                                    </span>
                                    ? Read receipts are also removed.
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
                                                `/admin/announcements/${confirmDelete.id}`,
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
    tint: 'slate' | 'emerald' | 'sky' | 'amber';
}) {
    const tints: Record<string, string> = {
        slate: 'bg-muted text-muted-foreground',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tints[tint]}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {value.toLocaleString()}
            </p>
        </Card>
    );
}

function FilterPill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}

function AnnouncementView({
    announcement,
    tenants,
    plans,
}: {
    announcement: Announcement;
    tenants: { id: string; name: string }[];
    plans: { id: number; name: string }[];
}) {
    const cat = CATEGORY_META[announcement.category];
    const CatIcon = cat?.icon ?? Megaphone;

    const targets = useMemo(() => {
        if (announcement.target_type === 'all') return ['All hospitals'];
        if (announcement.target_type === 'plan') {
            return announcement.target_ids
                .map((id) => plans.find((p) => p.id === id)?.name)
                .filter(Boolean) as string[];
        }
        return announcement.target_ids
            .map((id) => tenants.find((t) => t.id === String(id))?.name)
            .filter(Boolean) as string[];
    }, [announcement, tenants, plans]);

    const pct = announcement.recipients_count > 0
        ? Math.round((announcement.reads_count / announcement.recipients_count) * 100)
        : 0;

    return (
        <>
            <DialogHeader>
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat?.cls ?? ''}`}>
                        <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="truncate">
                            {announcement.title}
                        </DialogTitle>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cat?.cls ?? ''}`}>
                                {cat?.label ?? announcement.category}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CLS[announcement.priority] ?? ''}`}>
                                {announcement.priority}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLS[announcement.status] ?? ''}`}>
                                {announcement.status}
                            </span>
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <div className="mt-5 space-y-4">
                <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                    {announcement.body}
                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border bg-card p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Reach
                        </p>
                        <p className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold tabular-nums">
                                {announcement.recipients_count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                hospitals
                            </span>
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Read
                        </p>
                        <p className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold tabular-nums">
                                {announcement.reads_count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({pct}%)
                            </span>
                        </p>
                    </div>
                </div>

                {announcement.channels.includes('email') && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-lg border bg-card p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Emails delivered
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {announcement.emails_sent}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Emails failed
                            </p>
                            <p className={`mt-1 text-xl font-bold tabular-nums ${
                                announcement.emails_failed > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-muted-foreground'
                            }`}>
                                {announcement.emails_failed}
                            </p>
                        </div>
                    </div>
                )}
                <div className="rounded-lg border bg-card p-3 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Targeting
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {targets.slice(0, 12).map((t, i) => (
                            <span
                                key={i}
                                className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
                            >
                                {t}
                            </span>
                        ))}
                        {targets.length > 12 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                +{targets.length - 12} more
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {announcement.channels.includes('in_app') && (
                        <span className="inline-flex items-center gap-1">
                            <Bell className="h-3 w-3" /> In-app
                        </span>
                    )}
                    {announcement.channels.includes('email') && (
                        <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}

function AnnouncementForm({
    announcement,
    tenants,
    plans,
    categories,
    onSuccess,
}: {
    announcement?: Announcement;
    tenants: { id: string; name: string }[];
    plans: { id: number; name: string }[];
    categories: string[];
    onSuccess: () => void;
}) {
    const isEdit = !!announcement;

    const { data, setData, post, put, processing, errors } = useForm({
        title: announcement?.title ?? '',
        body: announcement?.body ?? '',
        category: announcement?.category ?? 'general',
        priority: announcement?.priority ?? 'normal',
        target_type: announcement?.target_type ?? 'all',
        target_ids: announcement?.target_ids ?? [],
        channels: announcement?.channels ?? ['in_app'],
        scheduled_at: announcement?.scheduled_at ?? '',
        expires_at: announcement?.expires_at ?? '',
        publish_now: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onSuccess(),
        };
        if (isEdit) {
            put(`/admin/announcements/${announcement!.id}`, options);
        } else {
            post('/admin/announcements', options);
        }
    };

        const toggleTarget = (id: number | string) => {
        setData(
            'target_ids',
            data.target_ids.includes(id as any)
                ? data.target_ids.filter((x) => x !== id)
                : [...data.target_ids, id as any],
        );
    };

    const toggleChannel = (ch: string) => {
        setData(
            'channels',
            data.channels.includes(ch)
                ? data.channels.filter((c) => c !== ch)
                : [...data.channels, ch],
        );
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-5">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Scheduled maintenance on Sunday"
                    autoFocus
                />
                <InputError message={errors.title} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="body">Message</Label>
                <textarea
                    id="body"
                    value={data.body}
                    onChange={(e) => setData('body', e.target.value)}
                    placeholder="Describe what hospitals need to know..."
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <InputError message={errors.body} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                        id="category"
                        value={data.category}
                        onChange={(e) => setData('category', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {CATEGORY_META[c]?.label ?? c}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                        id="priority"
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Target audience</Label>
                <div className="flex flex-wrap gap-1.5">
                    {(['all', 'plan', 'tenant'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setData('target_type', t)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                data.target_type === t
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground'
                            }`}
                        >
                            {t === 'all' ? 'All hospitals' : t === 'plan' ? 'By plan' : 'Specific hospitals'}
                        </button>
                    ))}
                </div>
            </div>

            {data.target_type === 'plan' && (
                <div className="rounded-lg border bg-card p-3">
                    <div className="grid gap-1">
                        {plans.map((p) => {
                            const checked = data.target_ids.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggleTarget(p.id)}
                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                                        checked
                                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                    }`}>
                                        {checked && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                    <span>{p.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

                        {data.target_type === 'tenant' && (
                <div className="max-h-56 overflow-y-auto rounded-lg border bg-card p-2">
                    <div className="grid gap-1 sm:grid-cols-2">
                        {tenants.map((t) => {
                            const checked = data.target_ids.includes(t.id as any);
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleTarget(t.id as any)}
                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                                        checked
                                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                    }`}>
                                        {checked && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate">{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid gap-2">
                <Label>Delivery channels</Label>
                <div className="flex gap-2">
                    {['in_app', 'email'].map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChannel(ch)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                                data.channels.includes(ch)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground'
                            }`}
                        >
                            {ch === 'in_app' ? <Bell className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                            {ch === 'in_app' ? 'In-app' : 'Email'}
                        </button>
                    ))}
                </div>
                <InputError message={errors.channels} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="scheduled_at">
                        Schedule for (optional)
                    </Label>
                    <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={data.scheduled_at}
                        onChange={(e) => setData('scheduled_at', e.target.value)}
                    />
                    <InputError message={errors.scheduled_at} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expires_at">Expires at (optional)</Label>
                    <Input
                        id="expires_at"
                        type="datetime-local"
                        value={data.expires_at}
                        onChange={(e) => setData('expires_at', e.target.value)}
                    />
                </div>
            </div>

            {!isEdit && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <input
                        type="checkbox"
                        checked={data.publish_now}
                        onChange={(e) => setData('publish_now', e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                    />
                    <div>
                        <div className="font-medium">Publish immediately</div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Skips scheduling and sends to hospitals right away.
                        </p>
                    </div>
                </label>
            )}

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
                    {isEdit ? 'Save' : 'Create'}
                </Button>
            </div>
        </form>
    );
}