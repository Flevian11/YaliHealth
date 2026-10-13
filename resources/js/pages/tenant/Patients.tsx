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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantPermissions } from '@/hooks/use-tenant-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    LoaderCircle,
    ShieldCheck,
    Search,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

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
            Icon: AlertTriangle,
        },
        failed: {
            label: 'Verification failed',
            cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            Icon: AlertTriangle,
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
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
        </span>
    );
}

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

    const [createOpen, setCreateOpen] = useState(false);
    const [query, setQuery] = useState(filters.q ?? '');
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
            router.get('/patients', { q: query }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['patients', 'filters'],
            });
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
                        {patients.total} {patients.total === 1 ? 'patient' : 'patients'} on file
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
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
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {patients.data.length === 0 ? (
                <EmptyState hasFilters={!!filters.q} canCreate={canCreate} onCreate={() => setCreateOpen(true)} />
            ) : (
                <>
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Patient</th>
                                        <th className="hidden px-5 py-3 font-semibold md:table-cell">Contact</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 text-right font-semibold">First visit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {patients.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="cursor-pointer transition hover:bg-muted/40"
                                            onClick={() => router.visit(`/patients/${p.id}`)}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        {p.initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">{p.name}</p>
                                                        <p className="truncate font-mono text-[11px] text-muted-foreground">{p.patient_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden px-5 py-3 md:table-cell">
                                                <div className="space-y-0.5 text-xs">
                                                    {p.phone && <div>{p.phone}</div>}
                                                    {p.national_id && <div className="font-mono text-[11px] text-muted-foreground">ID: {p.national_id}</div>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={p.verification_status} />
                                            </td>
                                            <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                                                <RelativeTime iso={p.first_visit_at} />
                                            </td>
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
        </>
    );
}

function EmptyState({ hasFilters, canCreate, onCreate }: { hasFilters: boolean; canCreate: boolean; onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
                {hasFilters ? 'No patients match' : 'No patients yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters ? 'Try a different search.' : 'Register your first patient to get started.'}
            </p>
            {!hasFilters && canCreate && (
                <Button onClick={onCreate} className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700">
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Register first patient
                </Button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Registration dialog with two modes + duplicate check
   ═════════════════════════════════════════════════ */

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

function CreatePatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [mode, setMode] = useState<'sha' | 'local'>('sha');
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [checkingDuplicates, setCheckingDuplicates] = useState(false);
    const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        mode: 'sha' as 'sha' | 'local',
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
    });

    // Debounced duplicate check when key fields change
    useEffect(() => {
        if (!open) return;
        const hasKey = data.national_id || data.phone || (data.first_name && data.last_name);
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
        data.national_id,
        data.phone,
        data.first_name,
        data.last_name,
        data.date_of_birth,
    ]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/patients', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setDuplicates([]);
                setDuplicateAcknowledged(false);
                onOpenChange(false);
            },
        });
    };

    const switchMode = (m: 'sha' | 'local') => {
        setMode(m);
        setData('mode', m);
    };

    const blockedByDuplicates = duplicates.length > 0 && !duplicateAcknowledged;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Register new patient
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose whether the patient is seeking SHA coverage or will pay locally.
                    </p>
                </DialogHeader>

                {/* Mode tabs */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border bg-muted/30 p-1">
                    <button
                        type="button"
                        onClick={() => switchMode('sha')}
                        className={`flex items-start gap-3 rounded-lg p-3 text-left transition ${
                            mode === 'sha'
                                ? 'bg-card shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === 'sha' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">With SHA</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed">
                                We'll attempt to link to the national registry.
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => switchMode('local')}
                        className={`flex items-start gap-3 rounded-lg p-3 text-left transition ${
                            mode === 'local'
                                ? 'bg-card shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === 'local' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Local / Cash</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed">
                                Register locally. No SHA lookup.
                            </p>
                        </div>
                    </button>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    {/* Personal */}
                    <Section title="Personal details">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="First name" error={errors.first_name}>
                                <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} autoFocus />
                            </Field>
                            <Field label="Middle name" error={errors.middle_name}>
                                <Input value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} />
                            </Field>
                            <Field label="Last name" error={errors.last_name}>
                                <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                            </Field>
                            <Field label="Date of birth" error={errors.date_of_birth}>
                                <Input type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                            </Field>
                            <Field label="Gender" error={errors.gender}>
                                <select
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
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

                    {/* Duplicate warning */}
                    {(duplicates.length > 0 || checkingDuplicates) && (
                        <div className={`rounded-xl border p-4 ${duplicates.length > 0 ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-border bg-muted/30'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${duplicates.length > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                                    {checkingDuplicates ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {checkingDuplicates
                                            ? 'Checking for existing records…'
                                            : `We found ${duplicates.length} similar ${duplicates.length === 1 ? 'patient' : 'patients'}`}
                                    </p>
                                    {duplicates.length > 0 && (
                                        <>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                Is this the same person? If so, use their existing record instead of creating a new one.
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {duplicates.map((d) => (
                                                    <Link
                                                        key={d.id}
                                                        href={`/patients/${d.id}`}
                                                        className="flex items-center justify-between rounded-lg border bg-card p-2.5 transition hover:border-emerald-300"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">{d.name}</p>
                                                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                                {d.patient_number}
                                                                {d.date_of_birth && ` · DOB ${d.date_of_birth}`}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={d.verification_status} />
                                                    </Link>
                                                ))}
                                            </div>
                                            <label className="mt-3 flex items-start gap-2 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={duplicateAcknowledged}
                                                    onChange={(e) => setDuplicateAcknowledged(e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-border"
                                                />
                                                <span className="text-muted-foreground">
                                                    None of these match. Create a new patient record.
                                                </span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Identification — only for SHA mode */}
                    {mode === 'sha' && (
                        <Section title="SHA identification">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="National ID" error={errors.national_id}>
                                    <Input value={data.national_id} onChange={(e) => setData('national_id', e.target.value)} placeholder="24131705" />
                                </Field>
                                <Field label="SHA ID" error={errors.sha_id}>
                                    <Input value={data.sha_id} onChange={(e) => setData('sha_id', e.target.value)} />
                                </Field>
                            </div>
                            <div className="mt-2 flex items-start gap-2 rounded-lg border bg-emerald-50/50 p-3 text-[11px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                                    We'll search the national registry for this patient. If the network is unavailable, the record is saved and verified automatically in the background.
                                </span>
                            </div>
                        </Section>
                    )}

                    {/* Contact */}
                    <Section title="Contact">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Phone" error={errors.phone}>
                                <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+254 700 000 000" />
                            </Field>
                            <Field label="Email" error={errors.email}>
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </Field>
                            <Field label="County" error={errors.county}>
                                <Input value={data.county} onChange={(e) => setData('county', e.target.value)} />
                            </Field>
                            <Field label="Village / Estate" error={errors.village}>
                                <Input value={data.village} onChange={(e) => setData('village', e.target.value)} />
                            </Field>
                        </div>
                    </Section>

                    {/* Next of kin */}
                    <Section title="Next of kin">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Name" error={errors['next_of_kin.name']}>
                                <Input value={data.next_of_kin.name} onChange={(e) => setData('next_of_kin', { ...data.next_of_kin, name: e.target.value })} />
                            </Field>
                            <Field label="Phone" error={errors['next_of_kin.phone']}>
                                <Input value={data.next_of_kin.phone} onChange={(e) => setData('next_of_kin', { ...data.next_of_kin, phone: e.target.value })} />
                            </Field>
                            <Field label="Relationship" error={errors['next_of_kin.relationship']}>
                                <Input value={data.next_of_kin.relationship} onChange={(e) => setData('next_of_kin', { ...data.next_of_kin, relationship: e.target.value })} placeholder="Spouse, Parent…" />
                            </Field>
                        </div>
                    </Section>

                    {/* Notes */}
                    <Section title="Notes">
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            placeholder="Any relevant notes…"
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                    </Section>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={processing || blockedByDuplicates}
                        >
                            {processing && <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />}
                            {mode === 'sha' ? 'Register & verify' : 'Register patient'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}