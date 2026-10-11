import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    Flag,
    HeartPulse,
    LoaderCircle,
    Lock,
    Minus,
    Pill,
    Search,
    Settings,
    Stethoscope,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Plan = {
    id: number;
    name: string;
    slug: string;
    features: string[];
};

type Feature = {
    key: string;
    label: string;
    group: string;
    group_label: string;
    plans_with: number[];
    tenants_using: number;
    tenants_overriding: number;
};

type Stats = {
    total_features: number;
    total_plans: number;
    total_tenants: number;
    tenants_with_overrides: number;
};

const GROUP_ICONS: Record<string, any> = {
    clinical: Stethoscope,
    hie: HeartPulse,
    billing: CircleDollarSign,
    platform: Settings,
};

export default function FeatureFlags({
    catalog,
    features,
    plans,
    stats,
}: {
    catalog: Record<string, { label: string; features: Record<string, string> }>;
    features: Feature[];
    plans: Plan[];
    stats: Stats;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const [query, setQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState<string>('');
    const [pending, setPending] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let result = features;
        if (activeGroup) {
            result = result.filter((f) => f.group === activeGroup);
        }
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(
                (f) =>
                    f.label.toLowerCase().includes(q) ||
                    f.key.toLowerCase().includes(q),
            );
        }
        return result;
    }, [features, activeGroup, query]);

    const grouped = useMemo(() => {
        const g: Record<string, Feature[]> = {};
        filtered.forEach((f) => {
            if (!g[f.group]) g[f.group] = [];
            g[f.group].push(f);
        });
        return g;
    }, [filtered]);

    const toggle = (featureKey: string, planId: number, enabled: boolean) => {
        setPending(`${featureKey}:${planId}`);
        router.post(
            '/admin/features/toggle-plan',
            { feature_key: featureKey, plan_id: planId, enabled },
            {
                preserveScroll: true,
                onFinish: () => setPending(null),
            },
        );
    };

    const bulkToggle = (featureKey: string, enabled: boolean) => {
        setPending(`bulk:${featureKey}`);
        router.post(
            '/admin/features/bulk-toggle',
            {
                feature_key: featureKey,
                plan_ids: plans.map((p) => p.id),
                enabled,
            },
            {
                preserveScroll: true,
                onFinish: () => setPending(null),
            },
        );
    };

    return (
        <>
            <Head title="Feature Flags" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Feature Flags
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Control which capabilities are available on each plan.
                    Per-hospital overrides are managed inside each hospital's
                    detail view.
                </p>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile
                    label="Features"
                    value={stats.total_features}
                    icon={Flag}
                    tint="emerald"
                />
                <StatTile
                    label="Plans"
                    value={stats.total_plans}
                    icon={CircleDollarSign}
                    tint="blue"
                />
                <StatTile
                    label="Hospitals"
                    value={stats.total_tenants}
                    icon={Building2}
                    tint="slate"
                />
                <StatTile
                    label="With overrides"
                    value={stats.tenants_with_overrides}
                    icon={Lock}
                    tint="amber"
                />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search features..."
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
                    <FilterPill
                        active={activeGroup === ''}
                        onClick={() => setActiveGroup('')}
                    >
                        All
                    </FilterPill>
                    {Object.entries(catalog).map(([key, g]) => (
                        <FilterPill
                            key={key}
                            active={activeGroup === key}
                            onClick={() => setActiveGroup(key)}
                        >
                            {g.label}
                        </FilterPill>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <span>Included in plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-muted-foreground">
                        <Minus className="h-3 w-3" />
                    </span>
                    <span>Not included</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Has overrides</span>
                </div>
            </div>

            {/* Grouped features */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Flag className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        No features match
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Try changing the search or clearing filters.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([groupKey, groupFeatures]) => {
                        const Icon = GROUP_ICONS[groupKey] ?? Flag;
                        const catalogGroup = catalog[groupKey];
                        return (
                            <div key={groupKey}>
                                {/* Group header */}
                                <div className="mb-3 flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            {catalogGroup?.label ?? groupKey}
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            {groupFeatures.length}{' '}
                                            {groupFeatures.length === 1
                                                ? 'feature'
                                                : 'features'}
                                        </p>
                                    </div>
                                </div>

                                {/* Feature cards */}
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {groupFeatures.map((f) => (
                                        <FeatureCard
                                            key={f.key}
                                            feature={f}
                                            plans={plans}
                                            onToggle={toggle}
                                            onBulkToggle={bulkToggle}
                                            pending={pending}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

/* ───────────── Feature card ───────────── */
function FeatureCard({
    feature,
    plans,
    onToggle,
    onBulkToggle,
    pending,
}: {
    feature: Feature;
    plans: Plan[];
    onToggle: (key: string, planId: number, enabled: boolean) => void;
    onBulkToggle: (key: string, enabled: boolean) => void;
    pending: string | null;
}) {
    const allOn = plans.every((p) => feature.plans_with.includes(p.id));
    const allOff = plans.every((p) => !feature.plans_with.includes(p.id));

    return (
        <Card className="flex flex-col">
            <CardContent className="flex-1 p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                                {feature.label}
                            </p>
                            {feature.tenants_overriding > 0 && (
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                                    title={`${feature.tenants_overriding} hospital override${feature.tenants_overriding === 1 ? '' : 's'}`}
                                />
                            )}
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                            {feature.key}
                        </p>
                    </div>
                </div>

                {/* Plan toggles */}
                <div className="mt-3 space-y-1">
                    {plans.map((plan) => {
                        const enabled = feature.plans_with.includes(plan.id);
                        const isPending = pending === `${feature.key}:${plan.id}`;
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                    onToggle(feature.key, plan.id, !enabled)
                                }
                                className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                                    enabled
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                } disabled:opacity-60`}
                            >
                                <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                                        enabled
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {isPending ? (
                                        <LoaderCircle className="h-2.5 w-2.5 animate-spin" />
                                    ) : enabled ? (
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                    ) : (
                                        <Minus className="h-2.5 w-2.5" />
                                    )}
                                </div>
                                <span className="flex-1 truncate font-medium">
                                    {plan.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>
                            {feature.tenants_using} of {feature.tenants_using + (feature.tenants_overriding > 0 ? 0 : 0)}{' '}
                            hospitals
                        </span>
                    </div>
                    {!allOn && !allOff ? (
                        <button
                            type="button"
                            onClick={() =>
                                onBulkToggle(feature.key, !allOn)
                            }
                            disabled={pending === `bulk:${feature.key}`}
                            className="text-[10px] font-medium text-primary hover:underline disabled:opacity-60"
                        >
                            {pending === `bulk:${feature.key}` ? (
                                <LoaderCircle className="h-3 w-3 animate-spin" />
                            ) : allOn ? (
                                'Disable all'
                            ) : (
                                'Enable on all'
                            )}
                        </button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

/* ───────────── Stat tile ───────────── */
function StatTile({
    label,
    value,
    icon: Icon,
    tint,
}: {
    label: string;
    value: number;
    icon: any;
    tint: 'emerald' | 'blue' | 'slate' | 'amber';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        slate: 'bg-muted text-muted-foreground',
        amber:
            'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tints[tint]}`}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {value.toLocaleString()}
            </p>
        </Card>
    );
}

/* ───────────── Filter pill ───────────── */
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