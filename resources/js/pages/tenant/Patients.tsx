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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    LoaderCircle,
    Mail,
    MapPin,
    Phone,
    Search,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

type Patient = {
    id: number;
    patient_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    national_id: string | null;
    insurance_type: string;
    created_at: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

function initials(p: Patient): string {
    const a = p.first_name.charAt(0);
    const b = p.last_name.charAt(0);
    return (a + b).toUpperCase();
}

function fullName(p: Patient): string {
    return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
}

function RelativeTime({ iso }: { iso: string }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

export default function Patients({
    patients,
    filters,
}: {
    patients: Paginator<Patient>;
    filters: { q: string };
}) {
    const { props } = usePage<{
        flash?: { success?: string };
        tenant_permissions?: string[];
    }>();
    const { can } = useTenantPermissions();
    const canCreate = can('patients.create');

    const [createOpen, setCreateOpen] = useState(false);
    const [query, setQuery] = useState(filters.q ?? '');
    const firstRender = useRef(true);

    // Open dialog automatically if URL has ?create=1 (from dashboard)
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
                    <h1 className="text-2xl font-bold tracking-tight">
                        Patients
                    </h1>
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

            <div className="relative mb-4 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, phone, ID, or number..."
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
                                        <th className="hidden px-5 py-3 font-semibold lg:table-cell">
                                            Insurance
                                        </th>
                                        <th className="px-5 py-3 text-right font-semibold">
                                            Registered
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {patients.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="transition hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        {initials(p)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {fullName(p)}
                                                        </p>
                                                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                            {p.patient_number}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden px-5 py-3 md:table-cell">
                                                <div className="space-y-0.5 text-xs">
                                                    {p.phone && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {p.phone}
                                                        </div>
                                                    )}
                                                    {p.national_id && (
                                                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                                                            ID: {p.national_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="hidden px-5 py-3 lg:table-cell">
                                                <Badge
                                                    className={
                                                        p.insurance_type === 'sha'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : p.insurance_type === 'private'
                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }
                                                >
                                                    {p.insurance_type === 'sha'
                                                        ? 'SHA'
                                                        : p.insurance_type === 'private'
                                                          ? 'Private'
                                                          : 'Cash'}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                                                <RelativeTime iso={p.created_at} />
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

            <CreatePatientDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
        </>
    );
}

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
                    ? 'Try a different search or clear the query.'
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

/* ───────── Create dialog (inline) ───────── */

function CreatePatientDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        national_id: '',
        sha_id: '',
        insurance_type: 'cash',
        county: '',
        village: '',
        next_of_kin: {
            name: '',
            phone: '',
            relationship: '',
        },
        notes: '',
    });

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Register new patient
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Capture patient details to begin a visit.
                    </p>
                </DialogHeader>

                <form onSubmit={submit} className="mt-4 space-y-6">
                    <Section title="Personal details">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="First name" error={errors.first_name}>
                                <Input
                                    value={data.first_name}
                                    onChange={(e) =>
                                        setData('first_name', e.target.value)
                                    }
                                    autoFocus
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
                                        setData('date_of_birth', e.target.value)
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

                    <Section title="Identification & insurance">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="National ID" error={errors.national_id}>
                                <Input
                                    value={data.national_id}
                                    onChange={(e) =>
                                        setData('national_id', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="SHA ID" error={errors.sha_id}>
                                <Input
                                    value={data.sha_id}
                                    onChange={(e) =>
                                        setData('sha_id', e.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                label="Payment type"
                                error={errors.insurance_type}
                            >
                                <select
                                    value={data.insurance_type}
                                    onChange={(e) =>
                                        setData('insurance_type', e.target.value)
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="sha">SHA / SHIF</option>
                                    <option value="private">Private insurance</option>
                                </select>
                            </Field>
                        </div>
                    </Section>

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

                    <Section title="Chief complaint / notes">
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Reason for visit or relevant notes…"
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                        <InputError message={errors.notes} />
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
                            disabled={processing}
                        >
                            {processing && (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Register patient
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
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