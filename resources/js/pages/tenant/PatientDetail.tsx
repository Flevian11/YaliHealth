import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    MapPin,
    Phone,
    RefreshCw,
    ShieldCheck,
    User,
    Users,
} from 'lucide-react';

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
    verification_status: string;
    verification_attempts: number;
    last_verified_at: string | null;
    last_verification_error: string | null;
    next_of_kin: Record<string, string> | null;
    allergies: string[] | null;
    notes: string | null;
    first_visit_at: string | null;
    created_at: string;
};

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

function StatusPill({ status }: { status: string }) {
    const meta: Record<string, { label: string; cls: string; Icon: any }> = {
        verified: {
            label: 'SHA verified',
            cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            Icon: CheckCircle2,
        },
        unverified: {
            label: 'Unverified — SHA link pending',
            cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
            Icon: AlertTriangle,
        },
        not_found: {
            label: 'Not in national registry',
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
    };

    const m = meta[status] ?? meta.local_only;
    const Icon = m.Icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}>
            <Icon className="h-3 w-3" />
            {m.label}
        </span>
    );
}

export default function PatientDetail({ patient }: { patient: Patient }) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [upgrading, setUpgrading] = React.useState(false);

    const upgrade = () => {
        setUpgrading(true);
        router.post(`/patients/${patient.id}/upgrade`, {}, {
            preserveScroll: true,
            onFinish: () => setUpgrading(false),
        });
    };

    return (
        <>
            <Head title={patient.full_name} />

            <div className="mb-6">
                <Link href="/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to patients
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md">
                            {patient.initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight">{patient.full_name}</h1>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{patient.patient_number}</p>
                            <div className="mt-2">
                                <StatusPill status={patient.verification_status} />
                            </div>
                        </div>
                    </div>

                    {patient.verification_status !== 'verified' && (
                        <Button
                            onClick={upgrade}
                            disabled={upgrading}
                            variant="outline"
                            className="shrink-0"
                        >
                            {upgrading ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                            Try SHA verification now
                        </Button>
                    )}
                </div>
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

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Demographics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Row label="Date of birth" value={patient.date_of_birth ?? '—'} />
                        <Row label="Gender" value={patient.gender ?? '—'} />
                        <Row label="National ID" value={patient.national_id ?? '—'} />
                        <Row label="SHA ID" value={patient.sha_id ?? '—'} />
                        <Row label="CR number" value={patient.cr_number ?? '—'} mono />
                        <Row label="Registered" value={<RelativeTime iso={patient.first_visit_at} />} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <ContactRow icon={Phone} value={patient.phone} />
                        <ContactRow icon={User} value={patient.email} />
                        <ContactRow icon={MapPin} value={patient.county ? `${patient.village ?? ''} ${patient.county}`.trim() : null} />
                    </CardContent>
                </Card>

                {patient.verification_status === 'unverified' && (
                    <Card className="lg:col-span-2">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">Verification pending</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        We tried to link this patient to the national registry {patient.verification_attempts} {patient.verification_attempts === 1 ? 'time' : 'times'}. The system will retry automatically every 5 minutes.
                                    </p>
                                    {patient.last_verification_error && (
                                        <p className="mt-2 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                            {patient.last_verification_error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {patient.next_of_kin && Object.values(patient.next_of_kin).some(Boolean) && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Next of kin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 text-sm">
                            {patient.next_of_kin.name && <p className="font-medium">{patient.next_of_kin.name}</p>}
                            {patient.next_of_kin.phone && <p className="text-xs text-muted-foreground">{patient.next_of_kin.phone}</p>}
                            {patient.next_of_kin.relationship && <p className="text-xs text-muted-foreground">{patient.next_of_kin.relationship}</p>}
                        </CardContent>
                    </Card>
                )}

                {patient.notes && (
                    <Card className="lg:col-span-3">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{patient.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={`text-right text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
        </div>
    );
}

function ContactRow({ icon: Icon, value }: { icon: any; value: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{value}</span>
        </div>
    );
}

// React import for useState
import React from 'react';
import { LoaderCircle } from 'lucide-react';