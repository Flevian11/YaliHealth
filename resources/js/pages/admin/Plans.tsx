import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Boxes,
    CheckCircle2,
    CircleDollarSign,
    Eye,
    LoaderCircle,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

type Plan = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    setup_fee: number;
    billing_cycle: BillingCycle;
    billing_cycle_months: number;
    currency: string;
    trial_days: number;
    is_active: boolean;
    is_public: boolean;
    sort_order: number;
    features: string[];
    limits: { max_users?: number; max_branches?: number };
    tenants_count: number;
};

type FeatureGroups = Record<
    string,
    {
        label: string;
        features: Record<string, string>;
    }
>;

function formatPrice(amount: number, currency: string): string {
    if (amount === 0) return 'Free';
    return `${currency} ${amount.toLocaleString()}`;
}

function cycleLabel(cycle: BillingCycle): string {
    return {
        monthly: 'per month',
        quarterly: 'per quarter',
        semi_annual: 'every 6 months',
        annual: 'per year',
    }[cycle];
}

function cycleShort(cycle: BillingCycle): string {
    return {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        semi_annual: 'Semi-Annual',
        annual: 'Yearly',
    }[cycle];
}

export default function Plans({
    plans,
    featureCatalog,
}: {
    plans: Plan[];
    featureCatalog: FeatureGroups;
}) {
    const { props } = usePage<{
        flash?: { success?: string };
        errors?: Record<string, string>;
    }>();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [viewing, setViewing] = useState<Plan | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);

    const totalFeatures = useMemo(
        () =>
            Object.values(featureCatalog).reduce(
                (sum, g) => sum + Object.keys(g.features).length,
                0,
            ),
        [featureCatalog],
    );

    return (
        <>
            <Head title="Subscription Plans" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {plans.length} {plans.length === 1 ? 'plan' : 'plans'} ·{' '}
                        {totalFeatures} features available
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    New plan
                </Button>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {props.errors?.plan && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {props.errors.plan}
                </div>
            )}

            {plans.length === 0 ? (
                <EmptyState onCreate={() => setCreateOpen(true)} />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            totalFeatures={totalFeatures}
                            onView={() => setViewing(plan)}
                            onEdit={() => setEditing(plan)}
                            onDelete={() => setConfirmDelete(plan)}
                        />
                    ))}
                </div>
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create plan</DialogTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure what hospitals on this plan can access.
                        </p>
                    </DialogHeader>
                    <PlanForm
                        featureCatalog={featureCatalog}
                        onSuccess={() => setCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog
                open={!!editing}
                onOpenChange={(o) => !o && setEditing(null)}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {editing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit plan</DialogTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Update the plan details and feature access.
                                </p>
                            </DialogHeader>
                            <PlanForm
                                plan={editing}
                                featureCatalog={featureCatalog}
                                onSuccess={() => setEditing(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* View dialog */}
            <Dialog
                open={!!viewing}
                onOpenChange={(o) => !o && setViewing(null)}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {viewing && (
                        <PlanView
                            plan={viewing}
                            featureCatalog={featureCatalog}
                            onClose={() => setViewing(null)}
                            onEdit={() => {
                                const p = viewing;
                                setViewing(null);
                                setEditing(p);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <DialogContent className="max-w-md">
                    {confirmDelete && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">
                                    Delete plan
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-3 space-y-4 text-sm">
                                <p className="text-muted-foreground">
                                    Delete{' '}
                                    <span className="font-semibold text-foreground">
                                        {confirmDelete.name}
                                    </span>
                                    ?
                                </p>
                                {confirmDelete.tenants_count > 0 && (
                                    <p className="rounded-md bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                        This plan has{' '}
                                        {confirmDelete.tenants_count} hospital
                                        {confirmDelete.tenants_count === 1
                                            ? ''
                                            : 's'}{' '}
                                        assigned. Move them to another plan
                                        before deleting.
                                    </p>
                                )}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmDelete(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={confirmDelete.tenants_count > 0}
                                        onClick={() => {
                                            router.delete(
                                                `/admin/plans/${confirmDelete.id}`,
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

/* ────────────── Plan card ────────────── */
function PlanCard({
    plan,
    totalFeatures,
    onView,
    onEdit,
    onDelete,
}: {
    plan: Plan;
    totalFeatures: number;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const featureCount = plan.features.length;
    const pct = totalFeatures
        ? Math.round((featureCount / totalFeatures) * 100)
        : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <button
                        onClick={onView}
                        className="min-w-0 flex-1 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold hover:text-primary">
                                {plan.name}
                            </CardTitle>
                            {!plan.is_active && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    Inactive
                                </Badge>
                            )}
                            {!plan.is_public && plan.is_active && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    Private
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {plan.slug}
                        </p>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={onView}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete plan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                {plan.description && (
                    <p className="text-sm text-muted-foreground">
                        {plan.description}
                    </p>
                )}

                <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight">
                            {formatPrice(plan.price_yearly, plan.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {cycleLabel(plan.billing_cycle)}
                        </span>
                    </div>
                    {plan.billing_cycle !== 'monthly' &&
                        plan.price_monthly > 0 && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                ≈{' '}
                                {formatPrice(plan.price_monthly, plan.currency)}{' '}
                                / month
                            </p>
                        )}
                    {plan.setup_fee > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            <CircleDollarSign className="h-3 w-3" />+{' '}
                            {formatPrice(plan.setup_fee, plan.currency)}{' '}
                            one-time setup
                        </div>
                    )}
                    {plan.trial_days > 0 && (
                        <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            {plan.trial_days}-day free trial
                        </p>
                    )}
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Features</span>
                        <span className="font-semibold tabular-nums">
                            {featureCount} / {totalFeatures}
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Users
                            </p>
                            <p className="font-semibold tabular-nums">
                                {plan.limits.max_users
                                    ? plan.limits.max_users
                                    : 'Unlimited'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <Boxes className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Branches
                            </p>
                            <p className="font-semibold tabular-nums">
                                {plan.limits.max_branches
                                    ? plan.limits.max_branches
                                    : 'Unlimited'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t pt-3 text-xs">
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {plan.tenants_count}{' '}
                        {plan.tenants_count === 1 ? 'hospital' : 'hospitals'} on
                        this cycle
                    </span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onView}
                >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View details
                </Button>
            </CardContent>
        </Card>
    );
}

/* ────────────── Empty state ────────────── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <CircleDollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No plans yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Plans define how hospitals are billed. Create your first plan
                to get started.
            </p>
            <Button onClick={onCreate} className="mt-5">
                <Plus className="mr-1.5 h-4 w-4" />
                Create first plan
            </Button>
        </div>
    );
}

/* ────────────── View dialog content ────────────── */
function PlanView({
    plan,
    featureCatalog,
    onClose,
    onEdit,
}: {
    plan: Plan;
    featureCatalog: FeatureGroups;
    onClose: () => void;
    onEdit: () => void;
}) {
    return (
        <>
            <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <DialogTitle>{plan.name}</DialogTitle>
                            {!plan.is_active && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    Inactive
                                </Badge>
                            )}
                            {!plan.is_public && plan.is_active && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    Private
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {plan.slug}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                        <Button size="sm" onClick={onEdit}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="mt-5 space-y-5">
                {plan.description && (
                    <p className="text-sm text-muted-foreground">
                        {plan.description}
                    </p>
                )}

                {/* Pricing */}
                <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pricing
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailRow
                            label="Billing cycle"
                            value={cycleShort(plan.billing_cycle)}
                        />
                        <DetailRow
                            label="Billed amount"
                            value={`${formatPrice(plan.price_yearly, plan.currency)} ${cycleLabel(plan.billing_cycle)}`}
                        />
                        {plan.billing_cycle !== 'monthly' && (
                            <DetailRow
                                label="Effective monthly"
                                value={`≈ ${formatPrice(plan.price_monthly, plan.currency)} / month`}
                            />
                        )}
                        <DetailRow
                            label="Setup fee"
                            value={
                                plan.setup_fee > 0
                                    ? `${formatPrice(plan.setup_fee, plan.currency)} one-time`
                                    : 'None'
                            }
                        />
                        <DetailRow
                            label="Free trial"
                            value={
                                plan.trial_days > 0
                                    ? `${plan.trial_days} days`
                                    : 'None'
                            }
                        />
                        <DetailRow
                            label="Currency"
                            value={plan.currency}
                        />
                    </div>
                </div>

                {/* Limits */}
                <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Limits
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailRow
                            label="Max users"
                            value={
                                plan.limits.max_users
                                    ? plan.limits.max_users.toLocaleString()
                                    : 'Unlimited'
                            }
                        />
                        <DetailRow
                            label="Max branches"
                            value={
                                plan.limits.max_branches
                                    ? plan.limits.max_branches.toLocaleString()
                                    : 'Unlimited'
                            }
                        />
                    </div>
                </div>

                {/* Features */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Features ({plan.features.length})
                        </h4>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(featureCatalog).map(
                            ([groupKey, group]) => {
                                const included = Object.keys(
                                    group.features,
                                ).filter((k) => plan.features.includes(k));
                                if (included.length === 0) return null;

                                return (
                                    <div
                                        key={groupKey}
                                        className="rounded-lg border bg-card p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-semibold">
                                                {group.label}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {included.length} /{' '}
                                                {
                                                    Object.keys(
                                                        group.features,
                                                    ).length
                                                }
                                            </span>
                                        </div>
                                        <div className="grid gap-1 sm:grid-cols-2">
                                            {included.map((key) => (
                                                <div
                                                    key={key}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                    <span className="truncate">
                                                        {
                                                            group.features[
                                                                key
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>

                <Separator />

                {/* Tenants on plan */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Hospitals on this cycle
                    </span>
                    <span className="font-semibold tabular-nums">
                        {plan.tenants_count}
                    </span>
                </div>
            </div>
        </>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

/* ────────────── Form (create + edit) ────────────── */
function PlanForm({
    plan,
    featureCatalog,
    onSuccess,
}: {
    plan?: Plan;
    featureCatalog: FeatureGroups;
    onSuccess: () => void;
}) {
    const isEdit = !!plan;

    const { data, setData, post, put, processing, errors } = useForm({
        name: plan?.name ?? '',
        slug: plan?.slug ?? '',
        description: plan?.description ?? '',
        price_monthly: plan?.price_monthly ?? 0,
        price_yearly: plan?.price_yearly ?? 0,
        setup_fee: plan?.setup_fee ?? 0,
        billing_cycle: plan?.billing_cycle ?? 'monthly',
        billing_cycle_months: plan?.billing_cycle_months ?? 1,
        currency: plan?.currency ?? 'KES',
        trial_days: plan?.trial_days ?? 14,
        is_active: plan?.is_active ?? true,
        is_public: plan?.is_public ?? true,
        sort_order: plan?.sort_order ?? 0,
        features: plan?.features ?? [],
        limits: {
            max_users: plan?.limits?.max_users ?? 0,
            max_branches: plan?.limits?.max_branches ?? 0,
        },
    });

    const toggleFeature = (key: string) => {
        setData(
            'features',
            data.features.includes(key)
                ? data.features.filter((f) => f !== key)
                : [...data.features, key],
        );
    };

    const toggleGroup = (group: { features: Record<string, string> }) => {
        const keys = Object.keys(group.features);
        const allOn = keys.every((k) => data.features.includes(k));
        if (allOn) {
            setData(
                'features',
                data.features.filter((f) => !keys.includes(f)),
            );
        } else {
            setData(
                'features',
                Array.from(new Set([...data.features, ...keys])),
            );
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onSuccess(),
        };
        if (isEdit) {
            put(`/admin/plans/${plan!.id}`, options);
        } else {
            post('/admin/plans', options);
        }
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">Plan name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Monthly"
                        autoFocus
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={data.description}
                        onChange={(e) =>
                            setData('description', e.target.value)
                        }
                        placeholder="Full platform access — every module included."
                    />
                    <InputError message={errors.description} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (optional)</Label>
                    <Input
                        id="slug"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="monthly"
                    />
                    <InputError message={errors.slug} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="sort_order">Sort order</Label>
                    <Input
                        id="sort_order"
                        type="number"
                        value={data.sort_order}
                        onChange={(e) =>
                            setData('sort_order', Number(e.target.value))
                        }
                    />
                    <InputError message={errors.sort_order} />
                </div>
            </div>

            {/* Pricing */}
            <div>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pricing
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="billing_cycle">Billing cycle</Label>
                        <select
                            id="billing_cycle"
                            value={data.billing_cycle}
                            onChange={(e) => {
                                const cycle = e.target.value;
                                const monthsMap: Record<string, number> = {
                                    monthly: 1,
                                    quarterly: 3,
                                    semi_annual: 6,
                                    annual: 12,
                                };
                                setData('billing_cycle', cycle as any);
                                setData(
                                    'billing_cycle_months',
                                    monthsMap[cycle] ?? 1,
                                );
                            }}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly (3 months)</option>
                            <option value="semi_annual">
                                Semi-Annual (6 months)
                            </option>
                            <option value="annual">Yearly (12 months)</option>
                        </select>
                        <InputError message={errors.billing_cycle} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                            id="currency"
                            value={data.currency}
                            onChange={(e) =>
                                setData(
                                    'currency',
                                    e.target.value.toUpperCase(),
                                )
                            }
                            maxLength={3}
                        />
                        <InputError message={errors.currency} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price_yearly">
                            Billed amount per cycle ({data.currency})
                        </Label>
                        <Input
                            id="price_yearly"
                            type="number"
                            value={data.price_yearly}
                            onChange={(e) =>
                                setData('price_yearly', Number(e.target.value))
                            }
                        />
                        <InputError message={errors.price_yearly} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price_monthly">
                            Effective monthly price ({data.currency})
                        </Label>
                        <Input
                            id="price_monthly"
                            type="number"
                            value={data.price_monthly}
                            onChange={(e) =>
                                setData(
                                    'price_monthly',
                                    Number(e.target.value),
                                )
                            }
                        />
                        <InputError message={errors.price_monthly} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="setup_fee">
                            One-time setup fee ({data.currency})
                        </Label>
                        <Input
                            id="setup_fee"
                            type="number"
                            value={data.setup_fee}
                            onChange={(e) =>
                                setData('setup_fee', Number(e.target.value))
                            }
                        />
                        <InputError message={errors.setup_fee} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="trial_days">Trial days</Label>
                        <Input
                            id="trial_days"
                            type="number"
                            value={data.trial_days}
                            onChange={(e) =>
                                setData('trial_days', Number(e.target.value))
                            }
                        />
                        <InputError message={errors.trial_days} />
                    </div>
                </div>
            </div>

            {/* Limits */}
            <div>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Limits
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="max_users">
                            Max users (0 = unlimited)
                        </Label>
                        <Input
                            id="max_users"
                            type="number"
                            value={data.limits.max_users}
                            onChange={(e) =>
                                setData('limits', {
                                    ...data.limits,
                                    max_users: Number(e.target.value),
                                })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="max_branches">
                            Max branches (0 = unlimited)
                        </Label>
                        <Input
                            id="max_branches"
                            type="number"
                            value={data.limits.max_branches}
                            onChange={(e) =>
                                setData('limits', {
                                    ...data.limits,
                                    max_branches: Number(e.target.value),
                                })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) =>
                            setData('is_active', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border"
                    />
                    Active (available for assignment)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.is_public}
                        onChange={(e) =>
                            setData('is_public', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border"
                    />
                    Public (shown on pricing page)
                </label>
            </div>

            {/* Features */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Features
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {data.features.length} selected
                    </span>
                </div>

                <div className="space-y-4">
                    {Object.entries(featureCatalog).map(
                        ([groupKey, group]) => {
                            const keys = Object.keys(group.features);
                            const allOn = keys.every((k) =>
                                data.features.includes(k),
                            );
                            const someOn = keys.some((k) =>
                                data.features.includes(k),
                            );

                            return (
                                <div
                                    key={groupKey}
                                    className="rounded-lg border bg-card"
                                >
                                    <div className="flex items-center justify-between border-b px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold">
                                                {group.label}
                                            </span>
                                            {someOn && !allOn && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    {
                                                        keys.filter((k) =>
                                                            data.features.includes(
                                                                k,
                                                            ),
                                                        ).length
                                                    }{' '}
                                                    / {keys.length}
                                                </Badge>
                                            )}
                                            {allOn && (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    All
                                                </Badge>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group)}
                                            className="text-[11px] font-medium text-primary hover:underline"
                                        >
                                            {allOn
                                                ? 'Deselect all'
                                                : 'Select all'}
                                        </button>
                                    </div>
                                    <div className="grid gap-1 p-2 sm:grid-cols-2">
                                        {Object.entries(group.features).map(
                                            ([key, label]) => {
                                                const checked =
                                                    data.features.includes(key);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={key}
                                                        onClick={() =>
                                                            toggleFeature(key)
                                                        }
                                                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                                                            checked
                                                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'hover:bg-muted'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                                checked
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-border'
                                                            }`}
                                                        >
                                                            {checked && (
                                                                <CheckCircle2 className="h-3 w-3" />
                                                            )}
                                                        </div>
                                                        <span className="truncate">
                                                            {label}
                                                        </span>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            </div>

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
                    {isEdit ? 'Save changes' : 'Create plan'}
                </Button>
            </div>
        </form>
    );
}