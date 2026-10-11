import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Bell,
    Building2,
    CheckCircle2,
    HeartPulse,
    LoaderCircle,
    Lock,
    RotateCcw,
    Save,
    Settings2,
    Wrench,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type SettingMeta = {
    label: string;
    type: 'text' | 'email' | 'number' | 'boolean' | 'select' | 'textarea';
    default?: any;
    help?: string;
    suffix?: string;
    options?: Record<string, string>;
};

type Group = {
    label: string;
    description: string;
    settings: Record<string, SettingMeta>;
};

const GROUP_ICONS: Record<string, any> = {
    general: Settings2,
    tenants: Building2,
    hie: HeartPulse,
    notifications: Bell,
    security: Lock,
    maintenance: Wrench,
};

export default function Settings({
    groups,
    values,
}: {
    groups: Record<string, Group>;
    values: Record<string, any>;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [activeTab, setActiveTab] = useState<string>(
        Object.keys(groups)[0] ?? 'general',
    );

    const form = useForm({
        settings: { ...values } as Record<string, any>,
    });

    const activeGroup = groups[activeTab];

    const dirty = useMemo(() => {
        return JSON.stringify(form.data.settings) !== JSON.stringify(values);
    }, [form.data.settings, values]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put('/admin/settings', { preserveScroll: true });
    };

    const setField = (key: string, value: any) => {
        form.setData('settings', {
            ...form.data.settings,
            [key]: value,
        });
    };

    const reset = () => {
        form.setData('settings', { ...values });
    };

    return (
        <>
            <Head title="Settings" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Platform-wide defaults. Tenant-specific settings are
                        managed inside each hospital.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={reset}
                        disabled={!dirty || form.processing}
                    >
                        <RotateCcw className="mr-1.5 h-4 w-4" />
                        Reset
                    </Button>
                    <Button
                        type="button"
                        onClick={submit}
                        disabled={!dirty || form.processing}
                    >
                        {form.processing ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-1.5 h-4 w-4" />
                        )}
                        Save changes
                    </Button>
                </div>
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {dirty && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    You have unsaved changes.
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                {/* Tab sidebar */}
                <nav className="flex flex-col gap-1 lg:sticky lg:top-20 lg:self-start">
                    {Object.entries(groups).map(([key, group]) => {
                        const Icon = GROUP_ICONS[key] ?? Settings2;
                        const active = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                                    active
                                        ? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon
                                    className={`h-4 w-4 shrink-0 ${
                                        active
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : ''
                                    }`}
                                />
                                <span className="truncate">{group.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Form area */}
                <form onSubmit={submit}>
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h2 className="text-base font-semibold">
                                {activeGroup.label}
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {activeGroup.description}
                            </p>
                        </div>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {Object.entries(activeGroup.settings).map(
                                    ([key, meta]) => (
                                        <SettingField
                                            key={key}
                                            id={key}
                                            meta={meta}
                                            value={form.data.settings[key]}
                                            onChange={(v) => setField(key, v)}
                                        />
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

function SettingField({
    id,
    meta,
    value,
    onChange,
}: {
    id: string;
    meta: SettingMeta;
    value: any;
    onChange: (v: any) => void;
}) {
    return (
        <div className="grid gap-2">
            {meta.type === 'boolean' ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition hover:bg-muted/30">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{meta.label}</div>
                        {meta.help && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {meta.help}
                            </p>
                        )}
                    </div>
                </label>
            ) : (
                <>
                    <Label htmlFor={id}>{meta.label}</Label>

                    {meta.type === 'select' ? (
                        <select
                            id={id}
                            value={value ?? ''}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                        >
                            {Object.entries(meta.options ?? {}).map(
                                ([val, label]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    ) : meta.type === 'textarea' ? (
                        <textarea
                            id={id}
                            value={value ?? ''}
                            onChange={(e) => onChange(e.target.value)}
                            rows={4}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Input
                                id={id}
                                type={
                                    meta.type === 'number'
                                        ? 'number'
                                        : meta.type === 'email'
                                          ? 'email'
                                          : 'text'
                                }
                                value={value ?? ''}
                                onChange={(e) =>
                                    onChange(
                                        meta.type === 'number'
                                            ? Number(e.target.value)
                                            : e.target.value,
                                    )
                                }
                            />
                            {meta.suffix && (
                                <span className="shrink-0 text-sm text-muted-foreground">
                                    {meta.suffix}
                                </span>
                            )}
                        </div>
                    )}

                    {meta.help && (
                        <p className="text-[11px] text-muted-foreground">
                            {meta.help}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}