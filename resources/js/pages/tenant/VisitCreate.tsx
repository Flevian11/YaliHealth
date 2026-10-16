import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronRight,
    FileText,
    LoaderCircle,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/* ═════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════ */

type Patient = {
    id: number;
    patient_number: string;
    full_name: string;
    initials: string;
    cr_number: string | null;
    principal_cr_number: string | null;
    principal_name: string | null;
    relationship_to_principal: string | null;
    is_dependant: boolean;
    hie_patient_id: string | null;
    sha_id: string | null;
    date_of_birth: string | null;
    gender: string | null;
};

type SubBenefit = {
    code: string;
    name: string;
    status: string;
};

type Intervention = {
    code: string;
    name: string;
    fund: string | null;
    payment_mechanism: string | null;
    access_point: string | null;
    needs_preauth: boolean;
    needs_elective_preauth: boolean;
    requires_surgical_preauth: boolean;
    requires_renal_preauth: boolean;
    requires_oncology_preauth: boolean;
    requires_radiology_preauth: boolean;
    requires_optical_preauth: boolean;
    tariffs: Record<string, number>;
};

type Group = {
    sub_benefit: SubBenefit;
    interventions: Intervention[];
    error: string | null;
};

type ScenarioLabels = Record<string, string>;

/* ═════════════════════════════════════════════════
   Scenario hint (client-side preview — server is authoritative)
   ═════════════════════════════════════════════════ */

function scenarioHint(i: Intervention): { number: number | null; label: string } {
    const hasCr = true; // patient is verified → CR present

    if (i.fund === 'ECCIF') {
        return { number: hasCr ? 7 : 8, label: 'Emergency' };
    }
    if (i.access_point === 'OP') {
        if (i.fund === 'UHC' && i.payment_mechanism === 'CAPITATION') {
            return { number: 6, label: 'UHC Capitation' };
        }
        if (i.fund === 'SHIF' && i.payment_mechanism === 'FEE_FOR_SERVICE' && i.needs_preauth) {
            return {
                number: i.needs_elective_preauth ? 4 : 5,
                label: i.needs_elective_preauth ? 'OP Elective' : 'OP FFS',
            };
        }
    }
    if (i.access_point === 'IP') {
        if (i.fund === 'SHIF' && i.payment_mechanism === 'PER_DIEM') {
            return { number: 1, label: 'IP Per Diem' };
        }
        if (i.fund === 'SHIF' && i.payment_mechanism === 'FEE_FOR_SERVICE' && i.needs_preauth) {
            return {
                number: i.needs_elective_preauth ? 3 : 2,
                label: i.needs_elective_preauth ? 'IP Elective' : 'IP FFS',
            };
        }
    }
    return { number: null, label: 'Unknown' };
}

function fundColor(fund: string | null) {
    return (
        {
            SHIF: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
            UHC: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
            ECCIF: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        }[fund ?? ''] ?? 'bg-muted text-muted-foreground'
    );
}

/* ═════════════════════════════════════════════════
   Main page
   ═════════════════════════════════════════════════ */

export default function VisitCreate({
    patient,
    scenarioLabels,
}: {
    patient: Patient;
    scenarioLabels: ScenarioLabels;
}) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeSubBenefit, setActiveSubBenefit] = useState<string | null>(null);
    const [selected, setSelected] = useState<Intervention | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setLoadError(null);
            try {
                const res = await fetch(
                    `/visits/interventions?patient_id=${patient.id}`,
                    { headers: { Accept: 'application/json' } },
                );
                const json = await res.json();
                if (cancelled) return;

                if (!res.ok || json.error) {
                    setLoadError(json.error ?? 'Failed to load interventions.');
                    return;
                }

                const loadedGroups: Group[] = json.groups ?? [];
                setGroups(loadedGroups);

                if (loadedGroups.length > 0) {
                    setActiveSubBenefit(loadedGroups[0].sub_benefit.code);
                }
            } catch {
                if (!cancelled) {
                    setLoadError('Could not reach the HIE. Please try again.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [patient.id]);

    const activeGroup = groups.find(
        (g) => g.sub_benefit.code === activeSubBenefit,
    );

    const startVisit = () => {
        if (!selected) return;
        setSubmitting(true);
        setSubmitError(null);

        router.post(
            '/visits',
            {
                patient_id: patient.id,
                intervention_code: selected.code,
                intervention_flags: selected,
            },
            {
                onError: (errors) => {
                    setSubmitting(false);
                    const first = Object.values(errors)[0];
                    setSubmitError(first ?? 'Could not create visit.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title="New Visit" />

            <Link
                href={`/patients/${patient.id}`}
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to patient
            </Link>

            {/* ───── Patient banner ───── */}
            <Card className="mb-6 overflow-hidden p-0">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
                            {patient.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold tracking-tight">
                                {patient.full_name}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">
                                    {patient.patient_number}
                                </span>
                                {patient.date_of_birth && (
                                    <>
                                        <span>·</span>
                                        <span>{patient.date_of_birth}</span>
                                    </>
                                )}
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
                            </div>
                            {patient.is_dependant && (
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                                    <Users className="h-3 w-3" />
                                    Dependant of {patient.principal_name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ───── Content grid ───── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: picker */}
                <div className="space-y-4 lg:col-span-2">
                    {loading && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Loading the patient's benefits…
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {loadError && (
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                                            Could not load interventions
                                        </p>
                                        <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
                                            {loadError}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !loadError && groups.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Stethoscope className="h-6 w-6 text-muted-foreground/60" />
                                <p className="mt-3 text-sm font-medium">
                                    No interventions available
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    The patient's benefit package is empty.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !loadError && groups.length > 0 && (
                        <>
                            {/* Sub-benefit tabs */}
                            <div className="flex flex-wrap gap-1.5">
                                {groups.map((g) => (
                                    <button
                                        key={g.sub_benefit.code}
                                        onClick={() =>
                                            setActiveSubBenefit(g.sub_benefit.code)
                                        }
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            activeSubBenefit === g.sub_benefit.code
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        {g.sub_benefit.name}
                                        <span className="ml-1.5 opacity-70">
                                            {g.interventions.length}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Interventions */}
                            {activeGroup && (
                                <>
                                    {activeGroup.error && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                                            {activeGroup.error}
                                        </div>
                                    )}

                                    {activeGroup.interventions.length === 0 &&
                                    !activeGroup.error ? (
                                        <Card>
                                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                                No interventions under this
                                                sub-benefit.
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-2">
                                            {activeGroup.interventions.map((i) => {
                                                const isSelected =
                                                    selected?.code === i.code;
                                                const hint = scenarioHint(i);
                                                const tariff =
                                                    Object.values(i.tariffs)[0] ??
                                                    null;

                                                return (
                                                    <button
                                                        key={i.code}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelected(i)
                                                        }
                                                        className={`w-full rounded-xl border bg-card p-4 text-left transition ${
                                                            isSelected
                                                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                                                : 'hover:border-emerald-300 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                                                    isSelected
                                                                        ? 'border-emerald-600 bg-emerald-600'
                                                                        : 'border-muted-foreground/30'
                                                                }`}
                                                            >
                                                                {isSelected && (
                                                                    <Check className="h-3 w-3 text-white" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-sm font-semibold">
                                                                        {i.name}
                                                                    </p>
                                                                    {i.fund && (
                                                                        <span
                                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${fundColor(
                                                                                i.fund,
                                                                            )}`}
                                                                        >
                                                                            {i.fund}
                                                                        </span>
                                                                    )}
                                                                    {i.needs_preauth && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                                            <ShieldCheck className="h-3 w-3" />
                                                                            Preauth
                                                                        </span>
                                                                    )}
                                                                    {i.needs_elective_preauth && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                                            <Sparkles className="h-3 w-3" />
                                                                            Elective
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                                                    <span className="font-mono">
                                                                        {i.code}
                                                                    </span>
                                                                    {hint.number && (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <FileText className="h-3 w-3" />
                                                                            Scenario{' '}
                                                                            {hint.number} ·{' '}
                                                                            {hint.label}
                                                                        </span>
                                                                    )}
                                                                    {tariff && (
                                                                        <span>
                                                                            KES{' '}
                                                                            {tariff.toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Right: summary + action */}
                <div className="lg:col-span-1">
                    <div className="sticky top-20 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">
                                    Visit summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <SummaryRow
                                    label="Patient"
                                    value={patient.full_name}
                                />
                                <SummaryRow
                                    label="Beneficiary CR"
                                    value={
                                        patient.hie_patient_id ?? '—'
                                    }
                                    mono
                                />
                                {selected ? (
                                    <>
                                        <div className="border-t pt-3" />
                                        <SummaryRow
                                            label="Intervention"
                                            value={selected.name}
                                        />
                                        <SummaryRow
                                            label="Fund"
                                            value={selected.fund ?? '—'}
                                        />
                                        <SummaryRow
                                            label="Payment"
                                            value={
                                                selected.payment_mechanism?.replace(
                                                    /_/g,
                                                    ' ',
                                                ) ?? '—'
                                            }
                                        />
                                        <SummaryRow
                                            label="Access"
                                            value={
                                                selected.access_point === 'IP'
                                                    ? 'Inpatient'
                                                    : selected.access_point === 'OP'
                                                      ? 'Outpatient'
                                                      : '—'
                                            }
                                        />
                                        {(() => {
                                            const hint = scenarioHint(selected);
                                            return hint.number ? (
                                                <div className="rounded-lg border bg-muted/30 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                            Scenario
                                                        </span>
                                                        <span className="font-mono text-sm font-bold">
                                                            #{hint.number}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                                        {
                                                            scenarioLabels[
                                                                String(
                                                                    hint.number,
                                                                )
                                                            ]
                                                        }
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                    </>
                                ) : (
                                    <div className="border-t pt-3 text-center text-xs text-muted-foreground">
                                        Pick an intervention to continue.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Button
                            onClick={startVisit}
                            disabled={!selected || submitting}
                            className="w-full bg-emerald-600 py-6 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {submitting ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Stethoscope className="mr-2 h-4 w-4" />
                            )}
                            Start visit
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>

                        {submitError && (
                            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>
                                The scenario is chosen automatically by the
                                system based on the intervention's fund and
                                payment mechanism.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function SummaryRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span
                className={`truncate text-right text-sm font-medium ${
                    mono ? 'font-mono text-xs' : ''
                }`}
            >
                {value}
            </span>
        </div>
    );
}