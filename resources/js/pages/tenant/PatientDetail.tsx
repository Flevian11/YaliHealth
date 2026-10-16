import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Cake,
    CheckCircle2,
    ClipboardList,
    FileText,
    Heart,
    LoaderCircle,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    ShieldCheck,
    Stethoscope,
    Trash2,
    User,
    UserCircle2,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type RecentVisit = {
    id: number;
    visit_number: string;
    visit_type: string;
    service_type: string | null;
    fund: string | null;
    scenario: number | null;
    claim_status: string;
    opened_at: string | null;
};

type Patient = {
    id: number;
    patient_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    full_name: string;
    initials: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
    county: string | null;
    village: string | null;
    national_id: string | null;
    sha_id: string | null;
    cr_number: string | null;
    principal_cr_number: string | null;
    principal_name: string | null;
    relationship_to_principal: string | null;
    is_dependant: boolean;
    hie_patient_id: string | null;
    verification_status: string;
    verification_attempts: number;
    last_verified_at: string | null;
    last_verification_error: string | null;
    next_of_kin: Record<string, string> | null;
    allergies: string[] | null;
    notes: string | null;
    first_visit_at: string | null;
    created_at: string;
    visits_count?: number;
    recent_visits?: RecentVisit[];
};

/* ═════════════════════════════════════════════════
   Status helpers
   ═════════════════════════════════════════════════ */

const STATUS_META: Record<
    string,
    { label: string; cls: string; Icon: typeof CheckCircle2 }
> = {
    verified: {
        label: 'SHA verified',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        Icon: CheckCircle2,
    },
    unverified: {
        label: 'Unverified — link pending',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        Icon: AlertTriangle,
    },
    not_found: {
        label: 'Not in national registry',
        cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        Icon: XCircle,
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
};

function StatusPill({ status }: { status: string }) {
    const m = STATUS_META[status] ?? STATUS_META.local_only;
    const Icon = m.Icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}
        >
            <Icon className="h-3 w-3" />
            {m.label}
        </span>
    );
}

const CLAIM_STATUS_META: Record<string, { label: string; cls: string }> = {
    draft: {
        label: 'Draft',
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    visit_created: {
        label: 'Visit open',
        cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    },
    preauthed: {
        label: 'Preauthed',
        cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    submitted: {
        label: 'Submitted',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    accepted: {
        label: 'Accepted',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    rejected: {
        label: 'Rejected',
        cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    },
    closed: {
        label: 'Closed',
        cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
};

function ClaimStatusBadge({ status }: { status: string }) {
    const m = CLAIM_STATUS_META[status] ?? {
        label: status,
        cls: 'bg-muted text-muted-foreground',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}
        >
            {m.label}
        </span>
    );
}

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

/* ═════════════════════════════════════════════════
   Main
   ═════════════════════════════════════════════════ */

export default function PatientDetail({ patient }: { patient: Patient }) {
    const [upgrading, setUpgrading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const upgrade = () => {
        setUpgrading(true);
        router.post(
            `/patients/${patient.id}/upgrade`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setUpgrading(false),
            },
        );
    };

    const deletePatient = () => {
        setDeleting(true);
        router.delete(`/patients/${patient.id}`, {
            onFinish: () => setDeleting(false),
        });
    };

    const isVerified = patient.verification_status === 'verified';
    const isDependant = patient.is_dependant;
    const allergies = (patient.allergies ?? []).filter(Boolean);
    const hasNok =
        patient.next_of_kin &&
        Object.values(patient.next_of_kin).some(Boolean);

    return (
        <>
            <Head title={patient.full_name} />

            {/* ───── Breadcrumb ───── */}
            <Link
                href="/patients"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to patients
            </Link>

            {/* ───── Dependant banner ───── */}
            {isDependant && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                            Dependant of {patient.principal_name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                            {patient.relationship_to_principal ?? 'Dependant'} ·
                            All HIE interactions filed under the principal's CR{' '}
                            <span className="font-mono">
                                {patient.principal_cr_number}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* ───── Hero card ───── */}
            <Card className="mb-6 overflow-hidden p-0">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 sm:p-6 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                                {patient.initials}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {patient.full_name}
                                </h1>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono">
                                        {patient.patient_number}
                                    </span>
                                    {patient.gender && (
                                        <>
                                            <span>·</span>
                                            <span>
                                                {patient.gender
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    patient.gender.slice(1)}
                                            </span>
                                        </>
                                    )}
                                    {patient.date_of_birth && (
                                        <>
                                            <span>·</span>
                                            <span>{patient.date_of_birth}</span>
                                        </>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <StatusPill
                                        status={patient.verification_status}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                            {isVerified ? (
                                <Button
                                    asChild
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <Link
                                        href={`/visits/create?patient_id=${patient.id}`}
                                    >
                                        <Stethoscope className="mr-1.5 h-4 w-4" />
                                        Start visit
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    onClick={upgrade}
                                    disabled={upgrading}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {upgrading ? (
                                        <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                                    )}
                                    Verify with SHA
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ───── Stat row ───── */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={ClipboardList}
                    label="Total visits"
                    value={
                        patient.visits_count !== undefined
                            ? String(patient.visits_count)
                            : '—'
                    }
                />
                <StatCard
                    icon={CalendarDays}
                    label="Registered"
                    value={<RelativeTime iso={patient.first_visit_at} />}
                />
                <StatCard
                    icon={ShieldCheck}
                    label="SHA ID"
                    value={patient.sha_id ?? '—'}
                    mono
                />
                <StatCard
                    icon={FileText}
                    label={
                        isDependant ? 'Principal CR' : 'CR number'
                    }
                    value={
                        isDependant
                            ? patient.principal_cr_number ?? '—'
                            : patient.cr_number ?? '—'
                    }
                    mono
                />
            </div>

            {/* ───── Main grid ───── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* ───── Left column ───── */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Demographics */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                                Demographics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={Cake}
                                label="Date of birth"
                                value={patient.date_of_birth ?? '—'}
                            />
                            <InfoRow
                                icon={User}
                                label="Gender"
                                value={
                                    patient.gender
                                        ? patient.gender
                                              .charAt(0)
                                              .toUpperCase() +
                                          patient.gender.slice(1)
                                        : '—'
                                }
                            />
                            <InfoRow
                                icon={ShieldCheck}
                                label="National ID"
                                value={patient.national_id ?? '—'}
                                mono
                            />
                            <InfoRow
                                icon={Heart}
                                label="SHA ID"
                                value={patient.sha_id ?? '—'}
                                mono
                            />
                            {!isDependant && (
                                <InfoRow
                                    icon={FileText}
                                    label="CR number"
                                    value={patient.cr_number ?? '—'}
                                    mono
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Dependant linkage */}
                    {isDependant && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Principal linkage
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <InfoRow
                                    icon={User}
                                    label="Principal member"
                                    value={patient.principal_name ?? '—'}
                                />
                                <InfoRow
                                    icon={FileText}
                                    label="Principal CR number"
                                    value={patient.principal_cr_number ?? '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={Heart}
                                    label="Relationship"
                                    value={
                                        patient.relationship_to_principal ?? '—'
                                    }
                                />
                                <InfoRow
                                    icon={ShieldCheck}
                                    label="HIE patient ID"
                                    value={patient.hie_patient_id ?? '—'}
                                    mono
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent visits */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                    Recent visits
                                </CardTitle>
                                {patient.recent_visits &&
                                    patient.recent_visits.length > 0 && (
                                        <Link
                                            href="/visits"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        >
                                            View all
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {patient.recent_visits &&
                            patient.recent_visits.length > 0 ? (
                                <ul className="divide-y">
                                    {patient.recent_visits.map((v) => (
                                        <li key={v.id}>
                                            <Link
                                                href={`/visits/${v.id}`}
                                                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-muted/50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {v.visit_number}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-sm font-medium">
                                                        {v.service_type ??
                                                            v.visit_type}
                                                        {v.fund
                                                            ? ` · ${v.fund}`
                                                            : ''}
                                                        {v.scenario
                                                            ? ` · Scenario ${v.scenario}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-3">
                                                    <ClaimStatusBadge
                                                        status={v.claim_status}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        <RelativeTime
                                                            iso={v.opened_at}
                                                        />
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                    <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No visits recorded yet
                                    </p>
                                    {isVerified && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="mt-3"
                                        >
                                            <Link
                                                href={`/visits/create?patient_id=${patient.id}`}
                                            >
                                                Start first visit
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {patient.notes && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                    {patient.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ───── Right column ───── */}
                <div className="space-y-6">
                    {/* Contact */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <ContactRow
                                icon={Phone}
                                value={patient.phone}
                                empty="No phone on file"
                            />
                            <ContactRow
                                icon={Mail}
                                value={patient.email}
                                empty="No email on file"
                            />
                            <ContactRow
                                icon={MapPin}
                                value={
                                    patient.county || patient.village
                                        ? `${patient.village ?? ''} ${patient.county ?? ''}`.trim()
                                        : null
                                }
                                empty="No location on file"
                            />
                        </CardContent>
                    </Card>

                    {/* Allergies */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                Allergies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {allergies.map((a, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                        >
                                            <AlertTriangle className="h-3 w-3" />
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No known allergies
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Next of kin */}
                    {hasNok && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Next of kin
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1.5 text-sm">
                                {patient.next_of_kin?.name && (
                                    <p className="font-medium">
                                        {patient.next_of_kin.name}
                                    </p>
                                )}
                                {patient.next_of_kin?.phone && (
                                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {patient.next_of_kin.phone}
                                    </p>
                                )}
                                {patient.next_of_kin?.relationship && (
                                    <p className="text-xs text-muted-foreground">
                                        {patient.next_of_kin.relationship}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Verification */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                SHA verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <StatusPill status={patient.verification_status} />

                            {patient.last_verified_at && (
                                <div className="text-xs text-muted-foreground">
                                    Last checked{' '}
                                    <RelativeTime
                                        iso={patient.last_verified_at}
                                    />
                                </div>
                            )}

                            {patient.verification_attempts > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    {patient.verification_attempts}{' '}
                                    {patient.verification_attempts === 1
                                        ? 'attempt'
                                        : 'attempts'}
                                </div>
                            )}

                            {patient.last_verification_error && (
                                <div className="rounded-md bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                    {patient.last_verification_error}
                                </div>
                            )}

                            {!isVerified && (
                                <Button
                                    onClick={upgrade}
                                    disabled={upgrading}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    {upgrading ? (
                                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    Retry now
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ───── Danger zone (full width) ───── */}
                <Card className="border-rose-200 lg:col-span-3 dark:border-rose-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-400">
                            <AlertTriangle className="h-4 w-4" />
                            Danger zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-medium">
                                    Delete this patient
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Removes the record from lists and searches.
                                    Existing visits and claims stay on file for
                                    audit.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirmDelete(true)}
                                className="shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Delete patient
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ───── Delete confirmation dialog ───── */}
            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-5 w-5" />
                            Delete patient?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-2 space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {patient.initials}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {patient.full_name}
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
                                onClick={() => setConfirmDelete(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={deletePatient}
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
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ═════════════════════════════════════════════════
   Primitives
   ═════════════════════════════════════════════════ */

function StatCard({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: typeof CheckCircle2;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <Card className="p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={`mt-1 truncate text-sm font-semibold ${
                            mono ? 'font-mono text-xs' : ''
                        }`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </Card>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: typeof CheckCircle2;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p
                    className={`mt-0.5 truncate text-sm ${
                        mono ? 'font-mono text-xs' : ''
                    }`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function ContactRow({
    icon: Icon,
    value,
    empty,
}: {
    icon: typeof Phone;
    value: string | null;
    empty: string;
}) {
    if (!value) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Icon className="h-3.5 w-3.5" />
                <span className="italic">{empty}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{value}</span>
        </div>
    );
}