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
import { useTenantPermissions } from '@/hooks/use-tenant-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Clock,
    LoaderCircle,
    Plus,
    Search,
    Stethoscope,
    User,
    UserCircle2,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type Visit = {
    id: number;
    visit_number: string;
    patient_name: string | null;
    patient_number: string | null;
    cr_number: string | null;
    visit_type: string;
    service_type: string | null;
    fund: string | null;
    scenario: number | null;
    claim_status: string;
    opened_at: string | null;
    closed_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type SearchResult = {
    id: number;
    patient_number: string;
    name: string;
    initials: string;
    date_of_birth: string | null;
    gender: string | null;
    verification_status: string;
    cr_number: string | null;
};

type ScenarioLabels = Record<string, string>;

/* ═════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════ */

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

const CLAIM_META: Record<
    string,
    { label: string; cls: string; accent: string; Icon: typeof CheckCircle2 }
> = {
    draft: {
        label: 'Draft',
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        accent: 'bg-slate-300 dark:bg-slate-600',
        Icon: Clock,
    },
    visit_created: {
        label: 'Open',
        cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
        accent: 'bg-sky-400',
        Icon: Stethoscope,
    },
    preauthed: {
        label: 'Preauthed',
        cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
        accent: 'bg-indigo-400',
        Icon: CheckCircle2,
    },
    submitted: {
        label: 'Submitted',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        accent: 'bg-emerald-400',
        Icon: CheckCircle2,
    },
    accepted: {
        label: 'Accepted',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        accent: 'bg-emerald-500',
        Icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        accent: 'bg-rose-400',
        Icon: XCircle,
    },
    closed: {
        label: 'Closed',
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        accent: 'bg-slate-400',
        Icon: XCircle,
    },
};

function ClaimBadge({ status }: { status: string }) {
    const m = CLAIM_META[status] ?? {
        label: status,
        cls: 'bg-muted text-muted-foreground',
        accent: 'bg-muted-foreground',
        Icon: UserCircle2,
    };
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

const FUND_CLS: Record<string, string> = {
    SHIF: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    UHC: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    ECCIF: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

function FundBadge({ fund }: { fund: string | null }) {
    if (!fund) return null;
    const cls = FUND_CLS[fund] ?? 'bg-muted text-muted-foreground';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
        >
            {fund}
        </span>
    );
}

/* ═════════════════════════════════════════════════
   Status filter tabs
   ═════════════════════════════════════════════════ */

const TABS = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'visit_created', label: 'Open' },
    { key: 'preauthed', label: 'Preauthed' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'closed', label: 'Closed' },
];

/* ═════════════════════════════════════════════════
   Main page
   ═════════════════════════════════════════════════ */

export default function Visits({
    visits,
    filters,
    scenarioLabels,
}: {
    visits: Paginator<Visit>;
    filters: { status: string; q: string };
    scenarioLabels: ScenarioLabels;
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const { can } = useTenantPermissions();
    const canCreate = can('visits.create');

    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/visits',
                { q: query, status: filters.status || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['visits', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    const setStatus = (status: string) => {
        router.get(
            '/visits',
            { status: status || undefined, q: query || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['visits', 'filters'],
            },
        );
    };

    return (
        <>
            <Head title="Visits" />

            {/* ───── Header ───── */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Visits</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {visits.total}{' '}
                        {visits.total === 1 ? 'visit' : 'visits'} on record
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => setPickerOpen(true)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        New Visit
                    </Button>
                )}
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}
            {props.flash?.error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.error}</span>
                </div>
            )}

            {/* ───── Filters ───── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    {TABS.map((tab) => {
                        const active = (filters.status || '') === tab.key;
                        return (
                            <button
                                key={tab.key || 'all'}
                                onClick={() => setStatus(tab.key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                    active
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Visit no, patient name, CR..."
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

            {/* ───── List ───── */}
            {visits.data.length === 0 ? (
                <EmptyState
                    hasFilters={!!filters.q || !!filters.status}
                    canCreate={canCreate}
                    onCreate={() => setPickerOpen(true)}
                />
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="w-1 px-0 py-0" />
                                        <th className="px-5 py-3 font-semibold">
                                            Visit
                                        </th>
                                        <th className="hidden px-5 py-3 font-semibold md:table-cell">
                                            Patient
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Fund
                                        </th>
                                        <th className="hidden px-5 py-3 font-semibold lg:table-cell">
                                            Scenario
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold">
                                            Opened
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {visits.data.map((v) => {
                                        const meta =
                                            CLAIM_META[v.claim_status] ?? {
                                                accent: 'bg-slate-300',
                                            };
                                        const isOpen =
                                            v.claim_status !== 'closed' &&
                                            v.claim_status !== 'submitted' &&
                                            v.claim_status !== 'accepted' &&
                                            v.claim_status !== 'rejected';

                                        return (
                                            <tr
                                                key={v.id}
                                                className="group cursor-pointer transition hover:bg-muted/40"
                                                onClick={() =>
                                                    router.visit(
                                                        `/visits/${v.id}`,
                                                    )
                                                }
                                            >
                                                <td className="p-0">
                                                    <div
                                                        className={`h-full min-h-[64px] w-1 ${meta.accent}`}
                                                    />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-xs font-semibold text-foreground">
                                                            {v.visit_number}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:hidden">
                                                            {v.patient_name ??
                                                                'Unknown'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="hidden px-5 py-3 md:table-cell">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                            <User className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {v.patient_name ??
                                                                    '—'}
                                                            </p>
                                                            {v.patient_number && (
                                                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                                    {
                                                                        v.patient_number
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <FundBadge fund={v.fund} />
                                                </td>
                                                <td className="hidden px-5 py-3 lg:table-cell">
                                                    {v.scenario ? (
                                                        <span
                                                            className="inline-flex items-center rounded-md border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground"
                                                            title={
                                                                scenarioLabels[
                                                                    String(
                                                                        v.scenario,
                                                                    )
                                                                ]
                                                            }
                                                        >
                                                            #
                                                            {v.scenario}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <ClaimBadge
                                                        status={
                                                            v.claim_status
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            <RelativeTime
                                                                iso={v.opened_at}
                                                            />
                                                        </span>
                                                        {isOpen && (
                                                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={visits.current_page}
                        lastPage={visits.last_page}
                        total={visits.total}
                        perPage={visits.per_page}
                        baseUrl="/visits"
                        filters={{
                            q: filters.q,
                            status: filters.status,
                        }}
                    />
                </>
            )}

            <PatientPickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
            />
        </>
    );
}

/* ═════════════════════════════════════════════════
   Empty state
   ═════════════════════════════════════════════════ */

function EmptyState({
    hasFilters,
    canCreate,
    onCreate,
}: {
    hasFilters: boolean;
    canCreate: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
                {hasFilters ? 'No visits match' : 'No visits yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters
                    ? 'Try a different filter or search.'
                    : 'Start a visit for a SHA-verified patient to begin.'}
            </p>
            {!hasFilters && canCreate && (
                <Button
                    onClick={onCreate}
                    className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    New Visit
                </Button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Patient picker dialog
   ═════════════════════════════════════════════════ */

function PatientPickerDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const firstOpen = useRef(true);

    // Reset on close
    useEffect(() => {
        if (open) return;
        setQ('');
        setResults([]);
        setLoading(false);
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (!open) return;
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const handle = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/patients/search?q=${encodeURIComponent(q)}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );
                if (res.ok) {
                    const json = await res.json();
                    setResults(json.patients ?? []);
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handle);
    }, [q, open]);

    const pick = (patient: SearchResult) => {
        onOpenChange(false);
        router.visit(`/visits/create?patient_id=${patient.id}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Start a new visit
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Search for the patient. Only SHA-verified patients can
                        start a visit.
                    </p>
                </DialogHeader>

                <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        autoFocus
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name, phone, patient number…"
                        className="pl-9"
                    />
                </div>

                <div className="mt-4 max-h-[50vh] min-h-[180px] overflow-y-auto">
                    {q.trim().length < 2 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Users className="h-6 w-6 text-muted-foreground/60" />
                            <p className="mt-2 text-xs text-muted-foreground">
                                Type at least 2 characters to search
                            </p>
                        </div>
                    )}

                    {q.trim().length >= 2 && loading && results.length === 0 && (
                        <div className="flex items-center justify-center py-10">
                            <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {q.trim().length >= 2 && !loading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Search className="h-6 w-6 text-muted-foreground/60" />
                            <p className="mt-2 text-xs text-muted-foreground">
                                No patients match "{q}"
                            </p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <ul className="divide-y">
                            {results.map((p) => {
                                const verified =
                                    p.verification_status === 'verified';

                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => pick(p)}
                                            disabled={!verified}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                                                verified
                                                    ? 'hover:bg-muted/60'
                                                    : 'cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                {p.initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {p.name}
                                                </p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="font-mono">
                                                        {p.patient_number}
                                                    </span>
                                                    {p.cr_number && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="font-mono">
                                                                {p.cr_number}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {verified ? (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    SHA
                                                </span>
                                            ) : (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Unverified
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
                    Can't find the patient?{' '}
                    <Link
                        href="/patients?create=1"
                        className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => onOpenChange(false)}
                    >
                        Register a new patient
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}