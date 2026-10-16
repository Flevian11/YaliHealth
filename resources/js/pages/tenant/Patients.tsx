import InputError from '@/components/input-error';
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
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
    Search,
    SearchCheck,
    ShieldCheck,
    Trash2,
    UserPlus,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type Patient = {
    id: number;
    patient_number: string;
    name: string;
    initials: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    national_id: string | null;
    cr_number: string | null;
    verification_status: string;
    first_visit_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type DuplicateMatch = {
    id: number;
    patient_number: string;
    name: string;
    date_of_birth: string | null;
    phone: string | null;
    national_id: string | null;
    verification_status: string;
    first_visit_at: string | null;
};

type RegistryPerson = {
    cr_number: string;
    sha_id?: string | null;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone?: string | null;
    alive?: boolean;
    relationship?: string | null;
    is_dependant: boolean;
    existing_local?: {
        id: number;
        patient_number: string;
        verification_status: string;
    } | null;
};

type LookupStatus = 'idle' | 'loading' | 'not_found' | 'unreachable';
type ShaStep = 'entry' | 'pick' | 'review';
type Mode = 'sha' | 'local';

/* ═════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════ */

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

function StatusBadge({ status }: { status: string }) {
    const meta = {
        verified: {
            label: 'SHA verified',
            cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            Icon: CheckCircle2,
        },
        unverified: {
            label: 'Unverified',
            cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
            Icon: AlertTriangle,
        },
        not_found: {
            label: 'Not in registry',
            cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
            Icon: XCircle,
        },
        failed: {
            label: 'Failed',
            cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            Icon: XCircle,
        },
        local_only: {
            label: 'Local record',
            cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            Icon: Users,
        },
    }[status] ?? {
        label: status,
        cls: 'bg-muted text-muted-foreground',
        Icon: Users,
    };

    const Icon = meta.Icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}
        >
            <Icon className="h-3 w-3" />
            {meta.label}
        </span>
    );
}

/* ═════════════════════════════════════════════════
   Main list page
   ═════════════════════════════════════════════════ */

export default function Patients({
    patients,
    filters,
}: {
    patients: Paginator<Patient>;
    filters: { q: string };
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const { can } = useTenantPermissions();
    const canCreate = can('patients.create');
    const canDelete = can('patients.delete');

    const [createOpen, setCreateOpen] = useState(false);
    const [query, setQuery] = useState(filters.q ?? '');
    const [pendingDelete, setPendingDelete] = useState<Patient | null>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('create') === '1' && canCreate) {
            setCreateOpen(true);
            url.searchParams.delete('create');
            window.history.replaceState({}, '', url.toString());
        }
    }, [canCreate]);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const handle = setTimeout(() => {
            router.get(
                '/patients',
                { q: query },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['patients', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    return (
        <>
            <Head title="Patients" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {patients.total}{' '}
                        {patients.total === 1 ? 'patient' : 'patients'} on file
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        New Patient
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

            <div className="relative mb-4 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, phone, ID, or patient number..."
                    className="h-10 w-full rounded-lg border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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

            {patients.data.length === 0 ? (
                <EmptyState
                    hasFilters={!!filters.q}
                    canCreate={canCreate}
                    onCreate={() => setCreateOpen(true)}
                />
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">
                                            Patient
                                        </th>
                                        <th className="hidden px-5 py-3 font-semibold md:table-cell">
                                            Contact
                                        </th>
                                        <th className="px-5 py-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold">
                                            First visit
                                        </th>
                                        {canDelete && (
                                            <th className="w-12 px-3 py-3" />
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {patients.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="group cursor-pointer transition hover:bg-muted/40"
                                            onClick={() =>
                                                router.visit(`/patients/${p.id}`)
                                            }
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        {p.initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {p.name}
                                                        </p>
                                                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                            {p.patient_number}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden px-5 py-3 md:table-cell">
                                                <div className="space-y-0.5 text-xs">
                                                    {p.phone && <div>{p.phone}</div>}
                                                    {p.national_id && (
                                                        <div className="font-mono text-[11px] text-muted-foreground">
                                                            ID: {p.national_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge
                                                    status={p.verification_status}
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                                                <RelativeTime
                                                    iso={p.first_visit_at}
                                                />
                                            </td>
                                            {canDelete && (
                                                <td className="px-3 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${p.name}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPendingDelete(p);
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={patients.current_page}
                        lastPage={patients.last_page}
                        total={patients.total}
                        perPage={patients.per_page}
                        baseUrl="/patients"
                        filters={{ q: filters.q }}
                    />
                </>
            )}

            <CreatePatientDialog open={createOpen} onOpenChange={setCreateOpen} />

            <DeletePatientDialog
                patient={pendingDelete}
                onClose={() => setPendingDelete(null)}
            />
        </>
    );
}

/* ═════════════════════════════════════════════════
   Delete confirmation dialog
   ═════════════════════════════════════════════════ */

function DeletePatientDialog({
    patient,
    onClose,
}: {
    patient: Patient | null;
    onClose: () => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const confirm = () => {
        if (!patient) return;
        setDeleting(true);
        router.delete(`/patients/${patient.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog
            open={!!patient}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
        >
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-5 w-5" />
                        Delete patient?
                    </DialogTitle>
                </DialogHeader>

                {patient && (
                    <div className="mt-2 space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {patient.initials}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {patient.name}
                                </p>
                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                    {patient.patient_number}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            This will remove the patient from all lists and
                            searches. Existing visits and claims stay on file
                            for audit. You can restore this record if needed.
                        </p>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={confirm}
                                disabled={deleting}
                                className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                                {deleting && (
                                    <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                )}
                                Delete patient
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
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
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
                {hasFilters ? 'No patients match' : 'No patients yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters
                    ? 'Try a different search.'
                    : 'Register your first patient to get started.'}
            </p>
            {!hasFilters && canCreate && (
                <Button
                    onClick={onCreate}
                    className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Register first patient
                </Button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Registration dialog — lookup-first, dependant-aware
   ═════════════════════════════════════════════════ */

function CreatePatientDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [step, setStep] = useState<ShaStep>('entry');
    const [principal, setPrincipal] = useState<RegistryPerson | null>(null);
    const [dependants, setDependants] = useState<RegistryPerson[]>([]);
    const [selected, setSelected] = useState<RegistryPerson | null>(null);
    const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
    const [lookupMessage, setLookupMessage] = useState<string | null>(null);
    const [alreadyRegisteredId, setAlreadyRegisteredId] = useState<number | null>(
        null,
    );

    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [checkingDuplicates, setCheckingDuplicates] = useState(false);
    const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        mode: 'sha' as Mode,
        first_name: '',
        middle_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        county: '',
        village: '',
        national_id: '',
        sha_id: '',
        next_of_kin: { name: '', phone: '', relationship: '' },
        notes: '',
        resolved_cr_number: '',
        resolved_principal_cr_number: '',
        resolved_principal_name: '',
        resolved_relationship: '',
    });

    useEffect(() => {
        if (open) return;
        reset();
        setStep('entry');
        setPrincipal(null);
        setDependants([]);
        setSelected(null);
        setLookupStatus('idle');
        setLookupMessage(null);
        setAlreadyRegisteredId(null);
        setDuplicates([]);
        setCheckingDuplicates(false);
        setDuplicateAcknowledged(false);
    }, [open]);

    useEffect(() => {
        if (!open || step !== 'review') return;

        const hasKey =
            data.national_id || data.phone || (data.first_name && data.last_name);
        if (!hasKey) {
            setDuplicates([]);
            return;
        }

        setCheckingDuplicates(true);
        const handle = setTimeout(async () => {
            try {
                const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
                const res = await fetch('/patients/check-duplicates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        national_id: data.national_id,
                        phone: data.phone,
                        first_name: data.first_name,
                        last_name: data.last_name,
                        date_of_birth: data.date_of_birth || null,
                    }),
                });
                if (res.ok) {
                    const json = await res.json();
                    setDuplicates(json.matches ?? []);
                    setDuplicateAcknowledged(false);
                }
            } finally {
                setCheckingDuplicates(false);
            }
        }, 500);

        return () => clearTimeout(handle);
    }, [
        open,
        step,
        data.national_id,
        data.phone,
        data.first_name,
        data.last_name,
        data.date_of_birth,
    ]);

    const switchToSha = () => {
        setData('mode', 'sha');
        setStep(principal ? 'review' : 'entry');
        setLookupStatus('idle');
        setLookupMessage(null);
        setAlreadyRegisteredId(null);
    };

    const switchToLocal = () => {
        setData('mode', 'local');
        setStep('review');
        setPrincipal(null);
        setDependants([]);
        setSelected(null);
        setLookupStatus('idle');
        setLookupMessage(null);
        setAlreadyRegisteredId(null);
        setData('resolved_cr_number', '');
        setData('resolved_principal_cr_number', '');
        setData('resolved_principal_name', '');
        setData('resolved_relationship', '');
    };

    const applyPerson = (
        person: RegistryPerson,
        principalForThis: RegistryPerson | null,
    ) => {
        setSelected(person);
        setData({
            ...data,
            first_name: person.first_name || data.first_name,
            middle_name: person.middle_name ?? data.middle_name,
            last_name: person.last_name || data.last_name,
            date_of_birth: person.date_of_birth ?? data.date_of_birth,
            gender: person.gender ?? data.gender,
            phone: person.phone ?? data.phone,
            sha_id: person.sha_id ?? data.sha_id,
            resolved_cr_number: person.cr_number,
            resolved_principal_cr_number: person.is_dependant
                ? principalForThis?.cr_number ?? ''
                : '',
            resolved_principal_name: person.is_dependant
                ? `${principalForThis?.first_name ?? ''} ${
                      principalForThis?.last_name ?? ''
                  }`.trim()
                : '',
            resolved_relationship: person.relationship ?? '',
        });
        setStep('review');
    };

    const performLookup = async () => {
        const id = data.national_id.trim();
        if (!id) return;

        setLookupStatus('loading');
        setLookupMessage(null);
        setAlreadyRegisteredId(null);

        try {
            const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const res = await fetch('/patients/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    identification_number: id,
                    identification_type: 'National ID',
                }),
            });

            const json = await res.json();

            if (json.found && json.record) {
                const p: RegistryPerson = json.record;
                const deps: RegistryPerson[] = json.dependants ?? [];

                if (p.existing_local) {
                    setLookupStatus('not_found');
                    setAlreadyRegisteredId(p.existing_local.id);
                    setLookupMessage(
                        `This member is already registered as ${p.existing_local.patient_number}.`,
                    );
                    return;
                }

                setPrincipal(p);
                setDependants(deps);
                setLookupStatus('idle');

                if (deps.length > 0) {
                    setStep('pick');
                    return;
                }

                applyPerson(p, null);
                return;
            }

            setLookupStatus(
                json.reason === 'not_found' ? 'not_found' : 'unreachable',
            );
            setLookupMessage(json.error ?? 'Lookup failed.');
        } catch {
            setLookupStatus('unreachable');
            setLookupMessage('Could not reach the HIE. Please try again.');
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/patients', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const blockedByDuplicates = duplicates.length > 0 && !duplicateAcknowledged;
    const isDependant = !!selected?.is_dependant;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Register new patient
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter the patient's National ID and we'll fetch their
                        record from the national registry.
                    </p>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border bg-muted/30 p-1">
                    <button
                        type="button"
                        onClick={switchToSha}
                        className={`flex items-start gap-3 rounded-lg p-3 text-left transition ${
                            data.mode === 'sha'
                                ? 'bg-card shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                data.mode === 'sha'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">With SHA</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed">
                                Link to the national registry
                            </p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={switchToLocal}
                        className={`flex items-start gap-3 rounded-lg p-3 text-left transition ${
                            data.mode === 'local'
                                ? 'bg-card shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                data.mode === 'local'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Local / Cash</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed">
                                No SHA lookup
                            </p>
                        </div>
                    </button>
                </div>

                {data.mode === 'sha' && step === 'entry' && (
                    <div className="mt-6 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lookup-id">National ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="lookup-id"
                                    value={data.national_id}
                                    onChange={(e) =>
                                        setData('national_id', e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            performLookup();
                                        }
                                    }}
                                    placeholder="24131705"
                                    autoFocus
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    onClick={performLookup}
                                    disabled={
                                        !data.national_id ||
                                        lookupStatus === 'loading'
                                    }
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {lookupStatus === 'loading' ? (
                                        <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                    ) : (
                                        <SearchCheck className="mr-1.5 h-4 w-4" />
                                    )}
                                    Look up
                                </Button>
                            </div>
                        </div>

                        {lookupStatus === 'not_found' && alreadyRegisteredId && (
                            <InlineNotice
                                tone="amber"
                                icon={AlertTriangle}
                                title="Already registered"
                                message={
                                    lookupMessage ??
                                    'This patient is already on file.'
                                }
                                actions={
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={`/patients/${alreadyRegisteredId}`}
                                            onClick={() => onOpenChange(false)}
                                        >
                                            Open record
                                        </Link>
                                    </Button>
                                }
                            />
                        )}

                        {lookupStatus === 'not_found' && !alreadyRegisteredId && (
                            <InlineNotice
                                tone="rose"
                                icon={XCircle}
                                title="Not in the national registry"
                                message={
                                    lookupMessage ??
                                    'This ID does not match any SHA record.'
                                }
                                actions={
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={switchToLocal}
                                    >
                                        Register as local patient
                                    </Button>
                                }
                            />
                        )}

                        {lookupStatus === 'unreachable' && (
                            <InlineNotice
                                tone="amber"
                                icon={AlertTriangle}
                                title="HIE is unreachable"
                                message={
                                    lookupMessage ??
                                    'We could not reach the national registry. You can continue anyway — we will retry automatically when you save.'
                                }
                                actions={
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={performLookup}
                                        >
                                            Try again
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setStep('review')}
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            Continue anyway
                                        </Button>
                                    </>
                                }
                            />
                        )}

                        <div className="rounded-lg border bg-emerald-50/50 p-3 text-[11px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <ShieldCheck className="mb-1 inline h-3.5 w-3.5" />{' '}
                            We'll retrieve the patient's name, date of birth, and
                            SHA ID from the national registry. If this member has
                            dependants, you can register one of them.
                        </div>
                    </div>
                )}

                {data.mode === 'sha' && step === 'pick' && principal && (
                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-sm font-semibold">
                                Who are you registering?
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {principal.first_name} {principal.last_name} is
                                the principal member and covers{' '}
                                {dependants.length}{' '}
                                {dependants.length === 1
                                    ? 'dependant'
                                    : 'dependants'}
                                .
                            </p>

                            <div className="mt-4 space-y-2">
                                <MemberButton
                                    person={principal}
                                    primary
                                    onSelect={() => applyPerson(principal, null)}
                                />
                                {dependants.map((d) => (
                                    <MemberButton
                                        key={d.cr_number}
                                        person={d}
                                        onSelect={() => applyPerson(d, principal)}
                                    />
                                ))}
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setStep('entry');
                                    setPrincipal(null);
                                    setDependants([]);
                                }}
                                className="mt-3"
                            >
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                Search a different ID
                            </Button>
                        </div>
                    </div>
                )}

                {(data.mode === 'local' || step === 'review') && (
                    <form onSubmit={submit} className="mt-6 space-y-6">
                        {selected && (
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                        {isDependant
                                            ? `Dependant of ${data.resolved_principal_name}`
                                            : 'Verified with SHA'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                                        {isDependant ? (
                                            <>
                                                {data.resolved_relationship ??
                                                    'Dependant'}{' '}
                                                · Claims will be filed under{' '}
                                                <span className="font-mono">
                                                    {
                                                        data.resolved_principal_cr_number
                                                    }
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                CR number:{' '}
                                                <span className="font-mono">
                                                    {data.resolved_cr_number}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setSelected(null);
                                        setPrincipal(null);
                                        setDependants([]);
                                        setStep('entry');
                                        setData('resolved_cr_number', '');
                                        setData(
                                            'resolved_principal_cr_number',
                                            '',
                                        );
                                        setData(
                                            'resolved_principal_name',
                                            '',
                                        );
                                        setData('resolved_relationship', '');
                                    }}
                                    className="shrink-0"
                                >
                                    <ArrowLeft className="mr-1 h-3 w-3" />
                                    Change
                                </Button>
                            </div>
                        )}

                        {data.mode === 'sha' && !selected && (
                            <InlineNotice
                                tone="amber"
                                icon={AlertTriangle}
                                title="SHA link pending"
                                message="We'll retry the registry lookup on save. If it succeeds, the patient is verified; if not, they are stored as unverified and retried in the background."
                            />
                        )}

                        {(duplicates.length > 0 || checkingDuplicates) && (
                            <div
                                className={`rounded-xl border p-4 ${
                                    duplicates.length > 0
                                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                                        : 'border-border bg-muted/30'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                            duplicates.length > 0
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {checkingDuplicates ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">
                                            {checkingDuplicates
                                                ? 'Checking for existing records…'
                                                : `We found ${duplicates.length} similar ${
                                                      duplicates.length === 1
                                                          ? 'patient'
                                                          : 'patients'
                                                  }`}
                                        </p>
                                        {duplicates.length > 0 && (
                                            <>
                                                <div className="mt-3 space-y-2">
                                                    {duplicates.map((d) => (
                                                        <Link
                                                            key={d.id}
                                                            href={`/patients/${d.id}`}
                                                            className="flex items-center justify-between rounded-lg border bg-card p-2.5 transition hover:border-emerald-300"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {d.name}
                                                                </p>
                                                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                                    {
                                                                        d.patient_number
                                                                    }
                                                                </p>
                                                            </div>
                                                            <StatusBadge
                                                                status={
                                                                    d.verification_status
                                                                }
                                                            />
                                                        </Link>
                                                    ))}
                                                </div>
                                                <label className="mt-3 flex items-start gap-2 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            duplicateAcknowledged
                                                        }
                                                        onChange={(e) =>
                                                            setDuplicateAcknowledged(
                                                                e.target.checked,
                                                            )
                                                        }
                                                        className="mt-0.5 h-4 w-4 rounded border-border"
                                                    />
                                                    <span className="text-muted-foreground">
                                                        None of these match. Create
                                                        a new record.
                                                    </span>
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Section title="Personal details">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="First name" error={errors.first_name}>
                                    <Input
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData('first_name', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Middle name" error={errors.middle_name}>
                                    <Input
                                        value={data.middle_name}
                                        onChange={(e) =>
                                            setData('middle_name', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Last name" error={errors.last_name}>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData('last_name', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Date of birth"
                                    error={errors.date_of_birth}
                                >
                                    <Input
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) =>
                                            setData(
                                                'date_of_birth',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field label="Gender" error={errors.gender}>
                                    <select
                                        value={data.gender}
                                        onChange={(e) =>
                                            setData('gender', e.target.value)
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Select…</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </Field>
                            </div>
                        </Section>

                        {data.mode === 'sha' && (
                            <Section title="SHA identification">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="National ID"
                                        error={errors.national_id}
                                    >
                                        <Input
                                            value={data.national_id}
                                            onChange={(e) =>
                                                setData(
                                                    'national_id',
                                                    e.target.value,
                                                )
                                            }
                                            readOnly={!!selected}
                                            className={
                                                selected
                                                    ? 'bg-muted/50'
                                                    : undefined
                                            }
                                        />
                                    </Field>
                                    <Field label="SHA ID" error={errors.sha_id}>
                                        <Input
                                            value={data.sha_id}
                                            onChange={(e) =>
                                                setData('sha_id', e.target.value)
                                            }
                                            readOnly={!!selected}
                                            className={
                                                selected
                                                    ? 'bg-muted/50'
                                                    : undefined
                                            }
                                        />
                                    </Field>
                                </div>

                                {isDependant && (
                                    <div className="mt-3 grid gap-3 rounded-lg border bg-muted/30 p-3 text-[11px] sm:grid-cols-2">
                                        <div>
                                            <p className="text-muted-foreground">
                                                Principal member
                                            </p>
                                            <p className="mt-0.5 font-semibold">
                                                {data.resolved_principal_name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">
                                                Principal CR
                                            </p>
                                            <p className="mt-0.5 font-mono font-semibold">
                                                {
                                                    data.resolved_principal_cr_number
                                                }
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-muted-foreground">
                                                Relationship
                                            </p>
                                            <p className="mt-0.5 font-semibold">
                                                {data.resolved_relationship ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </Section>
                        )}

                        <Section title="Contact">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Phone" error={errors.phone}>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        placeholder="+254 700 000 000"
                                    />
                                </Field>
                                <Field label="Email" error={errors.email}>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="County" error={errors.county}>
                                    <Input
                                        value={data.county}
                                        onChange={(e) =>
                                            setData('county', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Village / Estate"
                                    error={errors.village}
                                >
                                    <Input
                                        value={data.village}
                                        onChange={(e) =>
                                            setData('village', e.target.value)
                                        }
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Next of kin">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field
                                    label="Name"
                                    error={errors['next_of_kin.name']}
                                >
                                    <Input
                                        value={data.next_of_kin.name}
                                        onChange={(e) =>
                                            setData('next_of_kin', {
                                                ...data.next_of_kin,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Phone"
                                    error={errors['next_of_kin.phone']}
                                >
                                    <Input
                                        value={data.next_of_kin.phone}
                                        onChange={(e) =>
                                            setData('next_of_kin', {
                                                ...data.next_of_kin,
                                                phone: e.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Relationship"
                                    error={errors['next_of_kin.relationship']}
                                >
                                    <Input
                                        value={data.next_of_kin.relationship}
                                        onChange={(e) =>
                                            setData('next_of_kin', {
                                                ...data.next_of_kin,
                                                relationship: e.target.value,
                                            })
                                        }
                                        placeholder="Spouse, Parent…"
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Notes">
                            <textarea
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                rows={2}
                                placeholder="Any relevant notes…"
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                        </Section>

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
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={processing || blockedByDuplicates}
                            >
                                {processing && (
                                    <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                )}
                                Save patient
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ═════════════════════════════════════════════════
   Primitives
   ═════════════════════════════════════════════════ */

function MemberButton({
    person,
    primary,
    onSelect,
}: {
    person: RegistryPerson;
    primary?: boolean;
    onSelect: () => void;
}) {
    const initials =
        (person.first_name[0] ?? '') + (person.last_name[0] ?? '');

    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-emerald-300 hover:bg-muted/30"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {initials.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                    {person.first_name} {person.middle_name ?? ''}{' '}
                    {person.last_name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {primary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Principal
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                            {person.relationship ?? 'Dependant'}
                        </span>
                    )}
                    <span className="font-mono">{person.cr_number}</span>
                </div>
            </div>
        </button>
    );
}

function InlineNotice({
    tone,
    icon: Icon,
    title,
    message,
    actions,
}: {
    tone: 'rose' | 'amber';
    icon: typeof AlertTriangle;
    title: string;
    message: string;
    actions?: React.ReactNode;
}) {
    const tones = {
        rose: {
            wrap: 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20',
            icon: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            title: 'text-rose-900 dark:text-rose-200',
            body: 'text-rose-700 dark:text-rose-300',
        },
        amber: {
            wrap: 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
            icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            title: 'text-amber-900 dark:text-amber-200',
            body: 'text-amber-700 dark:text-amber-300',
        },
    }[tone];

    return (
        <div className={`rounded-xl border p-4 ${tones.wrap}`}>
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones.icon}`}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${tones.title}`}>
                        {title}
                    </p>
                    <p className={`mt-0.5 text-[11px] ${tones.body}`}>
                        {message}
                    </p>
                    {actions && (
                        <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}