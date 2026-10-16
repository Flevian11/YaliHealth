import { EndVisitDialog } from '@/components/hie/EndVisitDialog';
import { OtpCapture } from '@/components/hie/OtpCapture';
import { BiometricCapture } from '@/components/hie/BiometricCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    FileText,
    Fingerprint,
    HeartPulse,
    LoaderCircle,
    Paperclip,
    Plus,
    Receipt,
    Search,
    ShieldCheck,
    Smartphone,
    Stethoscope,
    Trash2,
    Upload,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type Visit = {
    id: number;
    visit_number: string;
    patient: {
        id: number;
        patient_number: string;
        full_name: string;
        initials: string;
        date_of_birth: string | null;
        gender: string | null;
        cr_number: string | null;
        principal_name: string | null;
        relationship_to_principal: string | null;
        is_dependant: boolean;
    };
    visit_type: string;
    service_type: string | null;
    scenario: number | null;
    fund: string | null;
    payment_mechanism: string | null;
    payment_mode: string;
    needs_preauth: boolean;
    needs_elective_preauth: boolean;
    claim_status: string;
    consent_token: string | null;
    auth_guid: string | null;
    hie_visit_ref: string | null;
    invoice_number: string | null;
    claim_draft: {
        lines: any[];
        diagnoses: any[];
        attachments: any[];
    };
    admitted_at: string | null;
    discharged_at: string | null;
    discharge_reason: string | null;
    emergency_deadline_at: string | null;
    closed_at: string | null;
    opened_at: string | null;
};

type Intervention = {
    id: number;
    intervention_code: string;
    name: string | null;
    status: string;
    fund: string | null;
    payment_mechanism: string | null;
    needs_preauth: boolean;
    needs_elective_preauth: boolean;
    preauth_code: string | null;
    preauth_finalised_at: string | null;
    tariff: number | null;
};

type Consent = {
    id: number;
    purpose: string;
    method: string;
    status: string;
    contact_masked: string | null;
    otp_sent_at: string | null;
    otp_verified_at: string | null;
    auth_guid: string | null;
    created_at: string | null;
};

type ScenarioSpec = {
    number: number;
    label: string;
    fund: string;
    service_type: string;
    visit_type: string;
    payment_mechanism: string | null;
    needs_preauth: boolean;
    needs_elective_preauth: boolean;
    preauth_timing: string;
    consent_timing: string;
    dispatch_method: string;
    has_cr_id: boolean;
    is_emergency: boolean;
    notes: string;
};

type Tab = 'overview' | 'billing' | 'diagnoses' | 'attachments' | 'preauth';

/* ═════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════ */

const CLAIM_STATUS_META: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    visit_created: { label: 'Visit open', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' },
    preauthed: { label: 'Preauthed', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' },
    submitted: { label: 'Submitted', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    accepted: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
    closed: { label: 'Closed', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

function ClaimStatusBadge({ status }: { status: string }) {
    const m = CLAIM_STATUS_META[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}>
            {m.label}
        </span>
    );
}

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

/**
 * Extract a human-readable error message from a fetch response, handling
 * both our custom {error} shape and Laravel's {message, errors:{...}} shape.
 */
async function parseError(res: Response): Promise<string> {
    try {
        const body = await res.json();
        if (typeof body?.error === 'string') return body.error;
        if (body?.errors && typeof body.errors === 'object') {
            const first = Object.values(body.errors)[0];
            if (Array.isArray(first) && first[0]) return String(first[0]);
            if (typeof first === 'string') return first;
        }
        if (typeof body?.message === 'string') return body.message;
        return `Request failed (${res.status})`;
    } catch {
        return `Request failed (${res.status})`;
    }
}

function csrfToken(): string {
    const raw = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
    return decodeURIComponent(raw);
}

/* ═════════════════════════════════════════════════
   Main
   ═════════════════════════════════════════════════ */

export default function VisitWorkspace({
    visit,
    interventions,
    consents,
    scenarioSpec,
}: {
    visit: Visit;
    interventions: Intervention[];
    consents: Consent[];
    scenarioSpec: ScenarioSpec | null;
}) {
    const [consentOpen, setConsentOpen] = useState(false);
    const [consentMethod, setConsentMethod] = useState<'otp' | 'biometric'>('otp');
    const [endOpen, setEndOpen] = useState(false);
    const [tab, setTab] = useState<Tab>('overview');

    const isDraft = visit.claim_status === 'draft';
    const isOpen = visit.claim_status === 'visit_created';
    const isDispatched = ['submitted', 'accepted', 'closed'].includes(visit.claim_status);

    useEffect(() => {
        if (isDraft) setConsentOpen(true);
    }, [isDraft]);

    const onConsentVerified = () => {
        setConsentOpen(false);
        router.reload({ only: ['visit', 'consents', 'interventions'] });
    };

    const onEndCompleted = () => {
        setEndOpen(false);
        router.reload();
    };

    const abandonVisit = () => {
        if (!confirm('Abandon this draft visit? This cannot be undone.')) return;
        router.post(`/visits/${visit.id}/close`, { reason: 'Abandoned by operator' });
    };

    return (
        <>
            <Head title={`Visit ${visit.visit_number}`} />

            <Link
                href="/visits"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to visits
            </Link>

            {/* Header */}
            <Card className="mb-6 overflow-hidden p-0">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="font-mono text-lg font-bold tracking-tight">
                                    {visit.visit_number}
                                </h1>
                                <ClaimStatusBadge status={visit.claim_status} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {scenarioSpec && (
                                    <span className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 font-semibold text-foreground">
                                        Scenario #{scenarioSpec.number}
                                    </span>
                                )}
                                {visit.fund && (
                                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                        {visit.fund}
                                    </span>
                                )}
                                <span>
                                    Opened <RelativeTime iso={visit.opened_at} />
                                </span>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {isDraft && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={abandonVisit}
                                        className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                                    >
                                        <XCircle className="mr-1.5 h-4 w-4" />
                                        Abandon
                                    </Button>
                                    <Button
                                        onClick={() => setConsentOpen(true)}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                                        Capture consent
                                    </Button>
                                </>
                            )}
                            {isOpen && (
                                <Button
                                    onClick={() => setEndOpen(true)}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    {visit.visit_type === 'IP' ? 'Discharge visit' : 'End visit & submit'}
                                </Button>
                            )}
                            {isDispatched && visit.invoice_number && (
                                <div className="rounded-lg border bg-card px-3 py-2 text-xs">
                                    <span className="text-muted-foreground">Invoice</span>{' '}
                                    <span className="font-mono font-semibold">
                                        {visit.invoice_number}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {isDraft && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Consent required
                        </p>
                        <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                            The patient must consent before this visit can be
                            created on the HIE. Capture OTP or biometric consent
                            to continue.
                        </p>
                    </div>
                </div>
            )}

            {visit.emergency_deadline_at && !isDispatched && (
                <EmergencyCountdown deadline={visit.emergency_deadline_at} />
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="mb-4 flex flex-wrap gap-1.5 border-b pb-2">
                        {(
                            [
                                { key: 'overview', label: 'Overview', Icon: ClipboardList },
                                { key: 'billing', label: 'Billing', Icon: Receipt },
                                { key: 'diagnoses', label: 'Diagnoses', Icon: FileText },
                                { key: 'attachments', label: 'Attachments', Icon: Paperclip },
                                { key: 'preauth', label: 'Preauth', Icon: ShieldCheck },
                            ] as { key: Tab; label: string; Icon: any }[]
                        ).map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.key
                                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <t.Icon className="h-3.5 w-3.5" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <OverviewTab
                            visit={visit}
                            interventions={interventions}
                            consents={consents}
                            scenarioSpec={scenarioSpec}
                        />
                    )}

                    {tab === 'billing' && (
                        <BillingTab
                            visit={visit}
                            enabled={isOpen}
                            interventions={interventions}
                        />
                    )}

                    {tab === 'diagnoses' && (
                        <DiagnosesTab
                            visit={visit}
                            enabled={isOpen}
                            interventions={interventions}
                        />
                    )}

                    {tab === 'attachments' && (
                        <AttachmentsTab
                            visit={visit}
                            enabled={isOpen}
                            interventions={interventions}
                        />
                    )}

                    {tab === 'preauth' && (
                        <PlaceholderTab
                            icon={ShieldCheck}
                            title="Preauthorization"
                            message={
                                visit.needs_preauth
                                    ? 'This visit requires preauth. Create it after consent, then poll until FINALISED.'
                                    : 'No preauth is required for this intervention.'
                            }
                            enabled={isOpen && visit.needs_preauth}
                        />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Patient
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link
                                href={`/patients/${visit.patient.id}`}
                                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-emerald-300"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                                    {visit.patient.initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {visit.patient.full_name}
                                    </p>
                                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                                        {visit.patient.patient_number}
                                    </p>
                                </div>
                            </Link>

                            {visit.patient.is_dependant && (
                                <div className="flex items-start gap-2 rounded-lg bg-sky-50 p-2.5 text-[11px] text-sky-800 dark:bg-sky-950/30 dark:text-sky-300">
                                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        Dependant of{' '}
                                        <strong>
                                            {visit.patient.principal_name}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">
                                Visit details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 text-sm">
                            <DetailRow icon={Stethoscope} label="Type" value={visit.visit_type} />
                            {visit.service_type && (
                                <DetailRow
                                    icon={HeartPulse}
                                    label="Service"
                                    value={visit.service_type}
                                />
                            )}
                            {scenarioSpec && (
                                <DetailRow
                                    icon={ClipboardList}
                                    label="Scenario"
                                    value={`#${scenarioSpec.number} · ${scenarioSpec.label}`}
                                    wrap
                                />
                            )}
                            {visit.fund && (
                                <DetailRow
                                    icon={Receipt}
                                    label="Fund"
                                    value={visit.fund}
                                />
                            )}
                            {visit.hie_visit_ref && (
                                <DetailRow
                                    icon={ShieldCheck}
                                    label="HIE ref"
                                    value={visit.hie_visit_ref}
                                    mono
                                />
                            )}
                        </CardContent>
                    </Card>

                    {consents.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    Consent
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {consents.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-2.5"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            {c.method === 'otp' ? (
                                                <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            ) : (
                                                <Fingerprint className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium">
                                                    {c.method === 'otp' ? 'OTP' : 'Biometric'}
                                                    <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                                                        ({c.purpose})
                                                    </span>
                                                </p>
                                                {c.contact_masked && (
                                                    <p className="truncate text-[10px] text-muted-foreground">
                                                        {c.contact_masked}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <StatusChip status={c.status} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Consent modal */}
            <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            Capture patient consent
                        </DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {visit.patient.full_name} — {visit.visit_number}
                        </p>
                    </DialogHeader>
                    <div className="mt-2">
                        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border bg-muted/30 p-1">
                            <button
                                type="button"
                                onClick={() => setConsentMethod('otp')}
                                className={`flex items-center gap-2 rounded-lg p-2.5 text-left text-sm transition ${consentMethod === 'otp'
                                        ? 'bg-card font-semibold shadow-sm ring-1 ring-emerald-500/20'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Smartphone className="h-4 w-4" />
                                OTP
                            </button>
                            <button
                                type="button"
                                onClick={() => setConsentMethod('biometric')}
                                className={`flex items-center gap-2 rounded-lg p-2.5 text-left text-sm transition ${consentMethod === 'biometric'
                                        ? 'bg-card font-semibold shadow-sm ring-1 ring-emerald-500/20'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Fingerprint className="h-4 w-4" />
                                Biometric
                            </button>
                        </div>

                        {consentMethod === 'otp' ? (
                            <OtpCapture visitId={visit.id} onVerified={onConsentVerified} />
                        ) : (
                            <BiometricCapture visitId={visit.id} onVerified={onConsentVerified} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* End visit modal */}
            <Dialog open={endOpen} onOpenChange={setEndOpen}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            {visit.visit_type === 'IP' ? 'Discharge patient' : 'End visit & submit claim'}
                        </DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {visit.patient.full_name} — {visit.visit_number}
                        </p>
                    </DialogHeader>
                    <div className="mt-2">
                        <EndVisitDialog
                            visitId={visit.id}
                            visitType={visit.visit_type}
                            onCompleted={onEndCompleted}
                            onCancel={() => setEndOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ═════════════════════════════════════════════════
   Emergency countdown
   ═════════════════════════════════════════════════ */

function EmergencyCountdown({ deadline }: { deadline: string }) {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        const update = () => {
            const ms = new Date(deadline).getTime() - Date.now();
            if (ms <= 0) {
                setRemaining('Overdue');
                return;
            }
            const h = Math.floor(ms / 3600000);
            const m = Math.floor((ms % 3600000) / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            setRemaining(`${h}h ${m}m ${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    const overdue = remaining === 'Overdue';

    return (
        <div
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${overdue
                    ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20'
                    : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                }`}
        >
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${overdue
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
            >
                <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                    {overdue
                        ? 'Emergency submission overdue'
                        : 'Emergency submission deadline'}
                </p>
                <p className="mt-0.5 text-xs">
                    ECCIF claims must be submitted within 24 hours of the visit.
                    Time remaining:{' '}
                    <span className="font-mono font-bold">{remaining}</span>
                </p>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Overview tab
   ═════════════════════════════════════════════════ */

function OverviewTab({
    visit,
    interventions,
    consents,
    scenarioSpec,
}: {
    visit: Visit;
    interventions: Intervention[];
    consents: Consent[];
    scenarioSpec: ScenarioSpec | null;
}) {
    return (
        <div className="space-y-6">
            {scenarioSpec && (
                <Card className="border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <ClipboardList className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                            Scenario #{scenarioSpec.number} — {scenarioSpec.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {scenarioSpec.notes}
                        </p>
                        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                            <div>
                                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                    Consent timing
                                </p>
                                <p className="mt-0.5 font-medium">
                                    {scenarioSpec.consent_timing.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                    Preauth timing
                                </p>
                                <p className="mt-0.5 font-medium">
                                    {scenarioSpec.preauth_timing.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                                    Dispatch
                                </p>
                                <p className="mt-0.5 font-medium">
                                    {scenarioSpec.dispatch_method}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <HeartPulse className="h-4 w-4 text-muted-foreground" />
                        Interventions on this visit
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {interventions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No interventions recorded.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {interventions.map((i) => (
                                <li
                                    key={i.id}
                                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {i.name ?? i.intervention_code}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                            {i.intervention_code}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {i.tariff && (
                                            <span className="text-xs tabular-nums text-muted-foreground">
                                                KES {i.tariff.toLocaleString()}
                                            </span>
                                        )}
                                        <StatusChip status={i.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {consents.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            Consent history
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {consents.map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        {c.method === 'otp' ? (
                                            <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <Fingerprint className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium capitalize">
                                                {c.method}{' '}
                                                <span className="text-[11px] font-normal text-muted-foreground">
                                                    · {c.purpose.replace(/_/g, ' ')}
                                                </span>
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {c.contact_masked ?? 'Biometric match'} ·{' '}
                                                <RelativeTime iso={c.created_at} />
                                            </p>
                                        </div>
                                    </div>
                                    <StatusChip status={c.status} />
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Billing tab
   ═════════════════════════════════════════════════ */

/* ═════════════════════════════════════════════════
   Billing tab — searchable intervention picker
   ═════════════════════════════════════════════════ */

function BillingTab({
    visit,
    enabled,
    interventions,
}: {
    visit: Visit;
    enabled: boolean;
    interventions: Intervention[];
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selected, setSelected] = useState<Intervention | null>(null);
    const [serviceName, setServiceName] = useState('');
    const [serviceIdentifier, setServiceIdentifier] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const lines = visit.claim_draft?.lines ?? [];

    // Total of everything added so far
    const total = lines.reduce((sum, l) => {
        const price = parseFloat(String(l.unit_price ?? 0)) || 0;
        const qty = parseInt(String(l.quantity ?? 1), 10) || 1;
        return sum + price * qty;
    }, 0);

    // Pre-select the first intervention if there's only one, otherwise
    // leave it empty so the user consciously chooses.
    useEffect(() => {
        if (!selected && interventions.length === 1) {
            setSelected(interventions[0]);
        }
    }, [interventions, selected]);

    // When the intervention changes, prefill the unit price from its tariff
    // if the user hasn't already typed something.
    useEffect(() => {
        if (!selected?.tariff) return;
        setUnitPrice((prev) => prev || String(selected.tariff));
    }, [selected]);

    const resetForm = () => {
        setServiceName('');
        setServiceIdentifier('');
        setUnitPrice('');
        setQuantity('1');
        // Keep `selected` in place — most operators add multiple lines
        // for the same intervention.
    };

    const save: FormEventHandler = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selected) {
            setError('Pick an intervention first.');
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/visits/${visit.id}/lines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    intervention_code: selected.intervention_code,
                    service_name: serviceName || undefined,
                    service_identifier: serviceIdentifier || undefined,
                    unit_price: unitPrice || undefined,
                    quantity: quantity || '1',
                }),
            });

            if (!res.ok) {
                setError(await parseError(res));
                return;
            }

            setSuccess('Line item added.');
            resetForm();
            router.reload({ only: ['visit'] });
        } catch {
            setError('Could not reach the HIE.');
        } finally {
            setSaving(false);
        }
    };

    if (!enabled) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="h-6 w-6 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">Billing locked</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Capture consent first to open the visit on the HIE.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ───── Existing lines ───── */}
            {lines.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                Added lines
                            </CardTitle>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Total: KES {total.toLocaleString()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {lines.map((l, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {l.service_name ?? 'Line item'}
                                        </p>
                                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                            {l.service_identifier
                                                ? `${l.service_identifier} · `
                                                : ''}
                                            {l.intervention_code ?? '—'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3 text-xs">
                                        <span className="tabular-nums text-muted-foreground">
                                            x{l.quantity ?? 1}
                                        </span>
                                        {l.unit_price && (
                                            <span className="font-mono tabular-nums">
                                                KES{' '}
                                                {parseFloat(l.unit_price).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* ───── Add line form ───── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        Add line item
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={save} className="space-y-4">
                        {/* Intervention selector */}
                        <div className="grid gap-2">
                            <Label>Intervention</Label>
                            {selected ? (
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(true)}
                                    className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-emerald-300"
                                >
                                    <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {selected.intervention_code}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {selected.name ??
                                                selected.intervention_code}
                                        </p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                            {selected.fund && (
                                                <span>{selected.fund}</span>
                                            )}
                                            {selected.payment_mechanism && (
                                                <>
                                                    <span>·</span>
                                                    <span>
                                                        {selected.payment_mechanism.replace(
                                                            /_/g,
                                                            ' ',
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                            {selected.tariff && (
                                                <>
                                                    <span>·</span>
                                                    <span className="tabular-nums">
                                                        KES{' '}
                                                        {selected.tariff.toLocaleString()}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                        Change
                                    </span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(true)}
                                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground transition hover:border-emerald-300 hover:bg-muted/30 hover:text-foreground"
                                >
                                    <Search className="h-4 w-4" />
                                    Choose an intervention
                                </button>
                            )}
                        </div>

                        {/* Service details */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Service name (optional)</Label>
                                <Input
                                    value={serviceName}
                                    onChange={(e) =>
                                        setServiceName(e.target.value)
                                    }
                                    placeholder="Basic consultation"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Service identifier (optional)</Label>
                                <Input
                                    value={serviceIdentifier}
                                    onChange={(e) =>
                                        setServiceIdentifier(e.target.value)
                                    }
                                    placeholder="C/123"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit price (KES)</Label>
                                <Input
                                    value={unitPrice}
                                    onChange={(e) =>
                                        setUnitPrice(e.target.value)
                                    }
                                    placeholder="200"
                                    inputMode="decimal"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantity</Label>
                                <Input
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(e.target.value)
                                    }
                                    placeholder="1"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        {/* Line total preview */}
                        {unitPrice && quantity && (
                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5 text-xs">
                                <span className="font-medium text-muted-foreground">
                                    Line total
                                </span>
                                <span className="font-mono text-sm font-semibold tabular-nums">
                                    KES{' '}
                                    {(
                                        (parseFloat(unitPrice) || 0) *
                                        (parseInt(quantity, 10) || 1)
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {error && <ErrorBox>{error}</ErrorBox>}
                        {success && <SuccessBox>{success}</SuccessBox>}

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={saving || !selected}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {saving && (
                                    <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                )}
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add line
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ───── Intervention picker modal ───── */}
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
                        <DialogTitle>Choose intervention</DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pick from the visit's benefit package, or enter a
                            code manually.
                        </p>
                    </DialogHeader>
                    <div className="min-h-0 flex-1">
                        <InterventionPicker
                            interventions={interventions}
                            onPick={(i) => {
                                setSelected(i);
                                setPickerOpen(false);
                            }}
                            onCancel={() => setPickerOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Intervention picker — three-band layout
   ═════════════════════════════════════════════════ */

function InterventionPicker({
    interventions,
    onPick,
    onCancel,
}: {
    interventions: Intervention[];
    onPick: (i: Intervention) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState('');
    const [manualMode, setManualMode] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filtered = query.trim()
        ? interventions.filter((i) => {
            const q = query.toLowerCase();
            return (
                i.intervention_code.toLowerCase().includes(q) ||
                (i.name ?? '').toLowerCase().includes(q) ||
                (i.fund ?? '').toLowerCase().includes(q)
            );
        })
        : interventions;

    const submitManual: FormEventHandler = (e) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (!code) return;

        // If the code matches an intervention we already have, use that.
        const match = interventions.find(
            (i) => i.intervention_code === code,
        );
        if (match) {
            onPick(match);
            return;
        }

        // Otherwise construct a minimal synthetic intervention from the code.
        onPick({
            id: -1,
            intervention_code: code,
            name: null,
            status: 'manual',
            fund: null,
            payment_mechanism: null,
            needs_preauth: false,
            needs_elective_preauth: false,
            preauth_code: null,
            preauth_finalised_at: null,
            tariff: null,
        });
    };

    /* ═════ Manual entry mode ═════ */
    if (manualMode) {
        return (
            <form onSubmit={submitManual} className="flex h-full flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            Manual codes are not validated against the tariff
                            catalogue. The HIE will reject the line if the code
                            isn't valid for this visit.
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="manual-code">Intervention code</Label>
                        <Input
                            id="manual-code"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g. SHA-01-001"
                            autoFocus
                            className="font-mono"
                        />
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setManualMode(false)}
                    >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back to list
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!manualCode.trim()}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Use code
                    </Button>
                </div>
            </form>
        );
    }

    /* ═════ Search / list mode ═════ */
    return (
        <div className="flex h-full flex-col">
            {/* Search bar — fixed */}
            <div className="shrink-0 p-6 pb-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setHighlighted(0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlighted((h) =>
                                    Math.min(h + 1, filtered.length - 1),
                                );
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlighted((h) => Math.max(h - 1, 0));
                            } else if (
                                e.key === 'Enter' &&
                                filtered[highlighted]
                            ) {
                                e.preventDefault();
                                onPick(filtered[highlighted]);
                            }
                        }}
                        placeholder="Search by name, code, or fund"
                        className="pl-9"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results — scrollable middle band */}
            <div className="min-h-0 flex-1 overflow-y-auto border-t">
                {interventions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertTriangle className="h-6 w-6 text-muted-foreground/60" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            No interventions are attached to this visit.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => setManualMode(true)}
                        >
                            Enter a code manually
                        </Button>
                    </div>
                )}

                {interventions.length > 0 && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="h-6 w-6 text-muted-foreground/60" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            No interventions match "{query}"
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => {
                                setManualCode(query.trim());
                                setManualMode(true);
                            }}
                        >
                            Enter "{query}" manually
                        </Button>
                    </div>
                )}

                {filtered.length > 0 && (
                    <ul className="divide-y">
                        {filtered.map((i, idx) => (
                            <li key={i.intervention_code}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setHighlighted(idx)}
                                    onClick={() => onPick(i)}
                                    className={`flex w-full items-start gap-3 px-6 py-3 text-left transition ${highlighted === idx
                                            ? 'bg-muted/60'
                                            : 'hover:bg-muted/40'
                                        }`}
                                >
                                    <span className="mt-0.5 shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {i.intervention_code}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {i.name ?? i.intervention_code}
                                        </p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                            {i.fund && <span>{i.fund}</span>}
                                            {i.payment_mechanism && (
                                                <>
                                                    <span>·</span>
                                                    <span>
                                                        {i.payment_mechanism.replace(
                                                            /_/g,
                                                            ' ',
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                            {i.needs_preauth && (
                                                <>
                                                    <span>·</span>
                                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                                        Preauth required
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    {i.tariff && (
                                        <span className="shrink-0 text-xs font-mono tabular-nums text-muted-foreground">
                                            KES {i.tariff.toLocaleString()}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer — fixed */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
                <button
                    type="button"
                    onClick={() => setManualMode(true)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                    Enter a code manually
                </button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Diagnoses tab — with ICD-11 search
   ═════════════════════════════════════════════════ */

type IcdResult = {
    code: string;
    title: string;
    chapter: string | null;
    block: string | null;
};


function DiagnosesTab({
    visit,
    enabled,
    interventions,
}: {
    visit: Visit;
    enabled: boolean;
    interventions: Intervention[];
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const diagnoses = visit.claim_draft?.diagnoses ?? [];

    const addDiagnosis = async (icdCode: string) => {
        setError(null);
        setSuccess(null);

        if (!icdCode.trim()) {
            setError('ICD-11 code is required.');
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/visits/${visit.id}/diagnoses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ icd_code: icdCode }),
            });

            if (!res.ok) {
                setError(await parseError(res));
                return;
            }

            setSuccess(`Diagnosis ${icdCode} added.`);
            setPickerOpen(false);
            router.reload({ only: ['visit'] });
        } catch {
            setError('Could not reach the server.');
        } finally {
            setSaving(false);
        }
    };

    if (!enabled) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">Diagnoses locked</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Capture consent first to open the visit on the HIE.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {diagnoses.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Recorded diagnoses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {diagnoses.map((d, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs font-semibold">
                                            {d.icd_code ?? d.code}
                                        </p>
                                        {d.title && (
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {d.title}
                                            </p>
                                        )}
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        Active
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {error && <ErrorBox>{error}</ErrorBox>}
            {success && <SuccessBox>{success}</SuccessBox>}

            <Button
                onClick={() => setPickerOpen(true)}
                className="w-full bg-emerald-600 py-6 text-white hover:bg-emerald-700"
                disabled={saving}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add diagnosis
            </Button>

            {/* Modal — full-height flex column, no clipping */}
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
                        <DialogTitle>Add diagnosis</DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Search the ICD-11 catalogue, or enter a code directly.
                        </p>
                    </DialogHeader>
                    <div className="min-h-0 flex-1">
                        <Icd11Picker
                            onPick={addDiagnosis}
                            onCancel={() => setPickerOpen(false)}
                            saving={saving}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ═════════════════════════════════════════════════
   ICD-11 picker — three-band layout (search / results / footer)
   ═════════════════════════════════════════════════ */

function Icd11Picker({
    onPick,
    onCancel,
    saving,
}: {
    onPick: (code: string) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IcdResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (manualMode) return;
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const handle = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/clinical/icd11/search?q=${encodeURIComponent(query)}`,
                    { headers: { Accept: 'application/json' } },
                );
                if (res.ok) {
                    const json = await res.json();
                    setResults(json.results ?? []);
                    setHighlighted(0);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(handle);
    }, [query, manualMode]);

    const pick = (result: IcdResult) => {
        onPick(result.code);
    };

    const submitManual: FormEventHandler = (e) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (!code) return;
        onPick(code);
    };

    const looksLikeCode = (value: string) =>
        /^[A-Z0-9]{2,}[\d\.]*$/i.test(value.trim());

    /* ═════ Manual entry mode ═════ */
    if (manualMode) {
        return (
            <form
                onSubmit={submitManual}
                className="flex h-full flex-col"
            >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            Manual entry is not validated against the ICD-11
                            catalogue. Use a code you are certain of.
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="manual-icd">ICD-11 code</Label>
                        <Input
                            id="manual-icd"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g. 5B5K.0"
                            autoFocus
                            className="font-mono"
                        />
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setManualMode(false)}
                        disabled={saving}
                    >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back to search
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={saving || !manualCode.trim()}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {saving ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        )}
                        Use code
                    </Button>
                </div>
            </form>
        );
    }

    /* ═════ Search mode ═════ */
    return (
        <div className="flex h-full flex-col">
            {/* Search bar — fixed */}
            <div className="shrink-0 p-6 pb-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlighted((h) =>
                                    Math.min(h + 1, results.length - 1),
                                );
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlighted((h) => Math.max(h - 1, 0));
                            } else if (e.key === 'Enter' && results[highlighted]) {
                                e.preventDefault();
                                pick(results[highlighted]);
                            }
                        }}
                        placeholder="Search by name, or paste a code (malaria, 5B5K, HIV)"
                        className="pl-9"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results — scrollable middle band */}
            <div className="min-h-0 flex-1 overflow-y-auto border-t">
                {query.trim().length < 2 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="h-6 w-6 text-muted-foreground/60" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Type at least 2 characters to search
                        </p>
                    </div>
                )}

                {query.trim().length >= 2 && loading && results.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {query.trim().length >= 2 &&
                    !loading &&
                    results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <AlertTriangle className="h-6 w-6 text-muted-foreground/60" />
                            <p className="mt-2 text-xs text-muted-foreground">
                                No ICD-11 codes match "{query}"
                            </p>
                            {looksLikeCode(query) && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="mt-3"
                                    onClick={() => {
                                        setManualCode(query.trim());
                                        setManualMode(true);
                                    }}
                                >
                                    Use "{query}" as a manual code
                                </Button>
                            )}
                        </div>
                    )}

                {results.length > 0 && (
                    <ul className="divide-y">
                        {results.map((r, i) => (
                            <li key={`${r.code}-${i}`}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setHighlighted(i)}
                                    onClick={() => pick(r)}
                                    className={`flex w-full items-start gap-3 px-6 py-3 text-left transition ${highlighted === i
                                            ? 'bg-muted/60'
                                            : 'hover:bg-muted/40'
                                        }`}
                                >
                                    <span className="mt-0.5 shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {r.code}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {r.title}
                                        </p>
                                        {(r.chapter || r.block) && (
                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                {[r.chapter, r.block]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer — fixed */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
                <button
                    type="button"
                    onClick={() => setManualMode(true)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                    Enter a code manually
                </button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════
   Attachments tab — with file upload
   ═════════════════════════════════════════════════ */

const DOCUMENT_TYPES = [
    { value: 'LAB_RESULTS', label: 'Lab results' },
    { value: 'IMAGING_ORDER', label: 'Imaging order' },
    { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'FINAL_BILL', label: 'Final bill' },
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'LAB_ORDER', label: 'Lab order' },
    { value: 'CLAIM_FORM', label: 'Claim form' },
    { value: 'PREAUTH_FORM', label: 'Preauth form' },
    { value: 'BIO_DETAILS', label: 'Biometric details' },
    { value: 'DEATH_NOTICE', label: 'Death notice' },
    { value: 'THEATRE_NOTES', label: 'Theatre notes' },
    { value: 'OTHER', label: 'Other' },
];

function AttachmentsTab({
    visit,
    enabled,
    interventions,
}: {
    visit: Visit;
    enabled: boolean;
    interventions: Intervention[];
}) {
    const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
    const [interventionCode, setInterventionCode] = useState(
        interventions[0]?.intervention_code ?? '',
    );
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const attachments = visit.claim_draft?.attachments ?? [];

    const csrf = () =>
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';

    const pickFile = (f: File | null | undefined) => {
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) {
            setError('File exceeds 10 MB.');
            return;
        }
        setError(null);
        setFile(f);
    };

    const upload = async () => {
        setError(null);
        setSuccess(null);

        if (!file) {
            setError('Choose a file to upload.');
            return;
        }

        if (!interventionCode) {
            setError('No intervention is attached to this visit.');
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append('intervention_code', interventionCode);
        formData.append('file', file);

        try {
            // Use XMLHttpRequest so we can show upload progress.
            const res = await new Promise<{ status: number; body: string }>(
                (resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `/visits/${visit.id}/attachments`);
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrf()));
                    xhr.withCredentials = true;

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            setProgress(
                                Math.round((e.loaded / e.total) * 100),
                            );
                        }
                    };

                    xhr.onload = () =>
                        resolve({ status: xhr.status, body: xhr.responseText });
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(formData);
                },
            );

            if (res.status >= 400) {
                let msg = `Upload failed (${res.status})`;
                try {
                    const body = JSON.parse(res.body);
                    if (body.error) msg = body.error;
                    else if (body.errors) {
                        const first = Object.values(body.errors)[0];
                        if (Array.isArray(first) && first[0]) msg = String(first[0]);
                    } else if (body.message) msg = body.message;
                } catch { }
                setError(msg);
                return;
            }

            setSuccess(`Uploaded ${file.name}.`);
            setFile(null);
            setProgress(0);
            router.reload({ only: ['visit'] });
        } catch {
            setError('Could not reach the server.');
        } finally {
            setUploading(false);
        }
    };

    if (!enabled) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Paperclip className="h-6 w-6 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">
                        Attachments locked
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Capture consent first to open the visit on the HIE.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {attachments.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Uploaded attachments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {attachments.map((a, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {a.original_name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {a.document_type} ·{' '}
                                                {formatBytes(a.size)} ·{' '}
                                                <RelativeTime iso={a.uploaded_at} />
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        Upload attachment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Document type</Label>
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            >
                                {DOCUMENT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Intervention</Label>
                            <select
                                value={interventionCode}
                                onChange={(e) =>
                                    setInterventionCode(e.target.value)
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            >
                                <option value="" disabled>
                                    Choose an intervention…
                                </option>
                                {interventions.map((i) => (
                                    <option
                                        key={i.intervention_code}
                                        value={i.intervention_code}
                                    >
                                        {i.name ?? i.intervention_code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            pickFile(e.dataTransfer.files?.[0]);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver
                                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                                : 'border-border hover:border-emerald-300 hover:bg-muted/30'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => pickFile(e.target.files?.[0])}
                        />
                        {file ? (
                            <>
                                <Paperclip className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <p className="mt-2 text-sm font-medium">
                                    {file.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {formatBytes(file.size)} · click to change
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 text-muted-foreground/60" />
                                <p className="mt-2 text-sm font-medium">
                                    Drop a file here, or click to browse
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    PDF, image, or document · max 10 MB
                                </p>
                            </>
                        )}
                    </div>

                    {uploading && progress > 0 && (
                        <div className="space-y-1.5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-right text-[11px] tabular-nums text-muted-foreground">
                                {progress}%
                            </p>
                        </div>
                    )}

                    {error && <ErrorBox>{error}</ErrorBox>}
                    {success && <SuccessBox>{success}</SuccessBox>}

                    <div className="flex justify-end">
                        <Button
                            onClick={upload}
                            disabled={
                                uploading ||
                                !file ||
                                !interventionCode
                            }
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {uploading ? (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-1.5 h-4 w-4" />
                            )}
                            Upload
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ═════════════════════════════════════════════════
   Primitives
   ═════════════════════════════════════════════════ */

function ErrorBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

function SuccessBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

function PlaceholderTab({
    icon: Icon,
    title,
    message,
    enabled,
}: {
    icon: any;
    title: string;
    message: string;
    enabled: boolean;
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                    <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {message}
                </p>
                {!enabled && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Requires consent
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
    mono,
    wrap,
}: {
    icon: any;
    label: string;
    value: string;
    mono?: boolean;
    wrap?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3 w-3" />
                {label}
            </span>
            <span
                className={`text-right text-sm font-medium ${mono ? 'font-mono text-[11px]' : ''
                    } ${wrap ? 'break-words' : 'truncate'}`}
            >
                {value}
            </span>
        </div>
    );
}

function StatusChip({ status }: { status: string }) {
    const meta = {
        pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
        sent: { label: 'Sent', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' },
        verified: { label: 'Verified', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
        expired: { label: 'Expired', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
        cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
        failed: { label: 'Failed', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
        active: { label: 'Active', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
        retired: { label: 'Retired', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    }[status] ?? {
        label: status,
        cls: 'bg-muted text-muted-foreground',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
            {meta.label}
        </span>
    );
}