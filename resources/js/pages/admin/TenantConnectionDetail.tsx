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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    Lock,
    Plug,
    Power,
    RefreshCw,
    ShieldAlert,
    Trash2,
    Wifi,
    WifiOff,
    Zap,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Tenant = {
    id: string;
    name: string;
    plan: string | null;
    status: string;
    subscription_status: string;
    domains: string[];
    admin_name: string | null;
    admin_email: string | null;
};

type Connection = {
    id: number;
    environment: string;
    hie_base_url: string;
    client_id: string | null;
    client_secret_masked: string | null;
    has_client_secret: boolean;
    api_key_masked: string | null;
    has_api_key: boolean;
    facility_fr_code: string | null;
    facility_name: string | null;
    is_active: boolean;
    is_ready: boolean;
    status: string;
    last_verified_at: string | null;
    last_verified_status: string | null;
    last_verified_latency_ms: number | null;
    last_verified_http_status: number | null;
    last_verified_error: string | null;
    created_at: string | null;
};

type LogRow = {
    id: number;
    action: string;
    status: string;
    message: string | null;
    meta: Record<string, any> | null;
    actor_email: string | null;
    ip_address: string | null;
    created_at: string;
};

function statusMeta(status: string) {
    return {
        healthy: {
            label: 'Healthy',
            Icon: CheckCircle2,
            tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        failing: {
            label: 'Failing',
            Icon: ShieldAlert,
            tint: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        },
        incomplete: {
            label: 'Incomplete',
            Icon: AlertTriangle,
            tint: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        },
        unverified: {
            label: 'Not tested',
            Icon: Clock,
            tint: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        inactive: {
            label: 'Disabled',
            Icon: WifiOff,
            tint: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        not_configured: {
            label: 'Not configured',
            Icon: WifiOff,
            tint: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        },
    }[status] ?? { label: status, Icon: AlertTriangle, tint: 'bg-muted text-muted-foreground' };
}

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <span>{label}</span>;
}

function fullTime(iso: string): string {
    return new Date(iso).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TenantConnectionDetail({
    tenant,
    connection,
    logs,
    environments,
    default_base_urls,
}: {
    tenant: Tenant;
    connection: Connection | null;
    logs: LogRow[];
    environments: { value: string; label: string }[];
    default_base_urls: Record<string, string>;
}) {
    const { can } = usePermissions();
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [testing, setTesting] = useState(false);

    const status = connection?.status ?? 'not_configured';
    const meta = statusMeta(status);
    const StatusIcon = meta.Icon;

    const runTest = () => {
        if (!connection) return;
        setTesting(true);
        router.post(
            `/admin/tenant-connections/${tenant.id}/test`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setTesting(false),
            },
        );
    };

    const toggleActive = () => {
        router.post(
            `/admin/tenant-connections/${tenant.id}/toggle`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`${tenant.name} — Connection`} />

            <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Link href="/admin/tenant-connections" className="hover:text-foreground">
                    Tenant Connections
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">{tenant.name}</span>
            </nav>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md">
                        {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tint}`}>
                                <StatusIcon className="h-3 w-3" />
                                {meta.label}
                            </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {tenant.id}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            {tenant.plan && (
                                <span className="inline-flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {tenant.plan}
                                </span>
                            )}
                            {tenant.domains[0] && (
                                <span className="inline-flex items-center gap-1">
                                    <Wifi className="h-3 w-3" />
                                    {tenant.domains[0]}
                                </span>
                            )}
                            {tenant.admin_email && (
                                <span className="inline-flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {tenant.admin_email}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {can('settings.edit') && (
                    <div className="flex flex-wrap gap-2">
                        {connection && (
                            <Button
                                variant="outline"
                                onClick={toggleActive}
                            >
                                {connection.is_active ? (
                                    <>
                                        <Power className="mr-1.5 h-4 w-4" />
                                        Disable
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-1.5 h-4 w-4" />
                                        Enable
                                    </>
                                )}
                            </Button>
                        )}
                        {connection && (
                            <Button onClick={runTest} disabled={testing}>
                                {testing ? (
                                    <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-1.5 h-4 w-4" />
                                )}
                                {testing ? 'Testing...' : 'Test connection'}
                            </Button>
                        )}
                        <Button variant={connection ? 'outline' : 'default'} onClick={() => setEditOpen(true)}>
                            {connection ? 'Edit credentials' : 'Configure connection'}
                        </Button>
                    </div>
                )}
            </div>

            {props.flash?.success && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{props.flash.success}</span>
                </div>
            )}

            {props.errors?.test && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Connection test failed</p>
                            <p className="mt-0.5 text-xs">{props.errors.test}</p>
                        </div>
                    </div>
                </div>
            )}

            {!connection ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                            <Plug className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold">No connection configured</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Configure this hospital's HIE credentials so they can access
                            registries, eligibility, and claims.
                        </p>
                        {can('settings.edit') && (
                            <Button className="mt-5" onClick={() => setEditOpen(true)}>
                                Configure connection
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Health tiles */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <HealthTile
                            label="Environment"
                            value={connection.environment.toUpperCase()}
                            sub={connection.hie_base_url.replace(/^https?:\/\//, '')}
                            icon={Plug}
                            tint={connection.environment === 'production' ? 'emerald' : 'amber'}
                        />
                        <HealthTile
                            label="Last test"
                            value={
                                connection.last_verified_at
                                    ? undefined
                                    : 'Never'
                            }
                            sub={connection.last_verified_status ?? undefined}
                            icon={Activity}
                            tint={
                                connection.last_verified_status === 'success'
                                    ? 'emerald'
                                    : connection.last_verified_status === 'failed'
                                      ? 'rose'
                                      : 'slate'
                            }
                            relativeIso={connection.last_verified_at}
                        />
                        <HealthTile
                            label="Latency"
                            value={
                                connection.last_verified_latency_ms
                                    ? `${connection.last_verified_latency_ms}ms`
                                    : '—'
                            }
                            sub={
                                connection.last_verified_http_status
                                    ? `HTTP ${connection.last_verified_http_status}`
                                    : undefined
                            }
                            icon={Clock}
                            tint={
                                connection.last_verified_latency_ms
                                    ? connection.last_verified_latency_ms >= 2000
                                        ? 'amber'
                                        : 'emerald'
                                    : 'slate'
                            }
                        />
                        <HealthTile
                            label="Credentials"
                            value={connection.is_ready ? 'Complete' : 'Incomplete'}
                            sub={`${connection.has_client_secret ? '✓ secret' : '✗ secret'} · ${connection.has_api_key ? '✓ api key' : '✗ api key'}`}
                            icon={KeyRound}
                            tint={connection.is_ready ? 'emerald' : 'amber'}
                        />
                    </div>

                    {connection.last_verified_error && connection.last_verified_status === 'failed' && (
                        <Card className="mb-6 border-rose-200 dark:border-rose-900">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                        <ShieldAlert className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                                            Last test failed
                                        </p>
                                        <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-400">
                                            {connection.last_verified_error}
                                        </p>
                                        {connection.last_verified_at && (
                                            <p className="mt-1 text-[11px] text-rose-600/70 dark:text-rose-400/70">
                                                <RelativeTime iso={connection.last_verified_at} />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Credentials grid */}
                    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            HIE credentials
                                        </CardTitle>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Encrypted at rest. Values are masked.
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <CredRow
                                    label="Environment"
                                    value={connection.environment.toUpperCase()}
                                    mono
                                />
                                <CredRow
                                    label="Base URL"
                                    value={connection.hie_base_url}
                                    mono
                                />
                                <CredRow
                                    label="Client ID"
                                    value={connection.client_id ?? '—'}
                                    mono
                                    sensitive={false}
                                />
                                <CredRow
                                    label="Client secret"
                                    value={connection.client_secret_masked ?? '—'}
                                    mono
                                    sensitive
                                />
                                <CredRow
                                    label="API key"
                                    value={connection.api_key_masked ?? '—'}
                                    mono
                                    sensitive
                                />
                                <CredRow
                                    label="Facility FR code"
                                    value={connection.facility_fr_code ?? '—'}
                                    mono
                                />
                                {connection.facility_name && (
                                    <CredRow label="Facility name" value={connection.facility_name} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            Connection details
                                        </CardTitle>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Configuration metadata
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <CredRow
                                    label="Active"
                                    value={connection.is_active ? 'Yes' : 'No'}
                                    badge={connection.is_active ? 'emerald' : 'slate'}
                                />
                                <CredRow
                                    label="Ready"
                                    value={connection.is_ready ? 'Yes' : 'No'}
                                    badge={connection.is_ready ? 'emerald' : 'amber'}
                                />
                                <CredRow
                                    label="Created"
                                    value={connection.created_at ? fullTime(connection.created_at) : '—'}
                                />
                                <CredRow
                                    label="Last verified"
                                    value={connection.last_verified_at ? fullTime(connection.last_verified_at) : 'Never'}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logs */}
                    <Card className="overflow-hidden p-0">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Connection history</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    Every credential change and test
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                                {logs.length} events
                            </Badge>
                        </div>
                        <div className="divide-y">
                            {logs.length === 0 ? (
                                <p className="p-8 text-center text-xs text-muted-foreground">
                                    No activity yet.
                                </p>
                            ) : (
                                logs.map((l) => <LogRowItem key={l.id} log={l} />)
                            )}
                        </div>
                    </Card>
                </>
            )}

            {can('settings.edit') && connection && (
                <div className="mt-6 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setDeleteOpen(true)}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Remove connection
                    </Button>
                </div>
            )}

            {/* Edit dialog */}
            <EditDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                tenant={tenant}
                connection={connection}
                environments={environments}
                defaultBaseUrls={default_base_urls}
            />

            {/* Delete dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">
                            Remove connection?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-3 space-y-4 text-sm">
                        <p className="text-muted-foreground">
                            Remove the HIE connection for{' '}
                            <span className="font-semibold text-foreground">
                                {tenant.name}
                            </span>
                            ? All stored credentials will be permanently deleted.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    router.delete(`/admin/tenant-connections/${tenant.id}`, {
                                        preserveScroll: true,
                                    });
                                    setDeleteOpen(false);
                                }}
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Remove
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function HealthTile({
    label,
    value,
    sub,
    icon: Icon,
    tint,
    relativeIso,
}: {
    label: string;
    value?: string;
    sub?: string;
    icon: any;
    tint: 'emerald' | 'amber' | 'rose' | 'slate';
    relativeIso?: string | null;
}) {
    const tints: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        slate: 'bg-muted text-muted-foreground',
    };

    return (
        <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    {label}
                </p>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${tints[tint]}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
            </div>
            {relativeIso ? (
                <p className="mt-2 text-lg font-bold tabular-nums sm:text-xl">
                    <RelativeTime iso={relativeIso} />
                </p>
            ) : (
                <p className="mt-2 truncate text-lg font-bold tabular-nums sm:text-xl">
                    {value ?? '—'}
                </p>
            )}
            {sub && (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
                    {sub}
                </p>
            )}
        </Card>
    );
}

function CredRow({
    label,
    value,
    mono,
    sensitive,
    badge,
}: {
    label: string;
    value: string;
    mono?: boolean;
    sensitive?: boolean;
    badge?: 'emerald' | 'amber' | 'slate';
}) {
    const badgeTint = {
        emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        slate: 'bg-muted text-muted-foreground',
    };

    return (
        <div className="flex items-center justify-between gap-3 border-b pb-2.5 last:border-b-0 last:pb-0">
            <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
            {badge ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeTint[badge]}`}>
                    {value}
                </span>
            ) : (
                <span
                    className={`min-w-0 truncate text-right text-xs ${mono ? 'font-mono' : ''} ${
                        sensitive && value !== '—' ? 'text-foreground' : ''
                    }`}
                >
                    {value}
                </span>
            )}
        </div>
    );
}

function LogRowItem({ log }: { log: LogRow }) {
    const when = useRelativeTime(log.created_at);

    const meta = {
        'created': { Icon: Plug, tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
        'updated': { Icon: KeyRound, tint: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
        'tested': log.status === 'success'
            ? { Icon: CheckCircle2, tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' }
            : { Icon: ShieldAlert, tint: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
        'activated': { Icon: Zap, tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
        'deactivated': { Icon: WifiOff, tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
        'deleted': { Icon: Trash2, tint: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
    }[log.action] ?? { Icon: Activity, tint: 'bg-muted text-muted-foreground' };

    const Icon = meta.Icon;

    return (
        <div className="flex items-start gap-3 px-5 py-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium capitalize">{log.action}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}>
                        {log.status}
                    </span>
                </div>
                {log.message && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {log.message}
                    </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                    {log.actor_email && <span>by {log.actor_email}</span>}
                    {log.ip_address && <span className="font-mono">{log.ip_address}</span>}
                </div>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{when}</span>
        </div>
    );
}

function EditDialog({
    open,
    onOpenChange,
    tenant,
    connection,
    environments,
    defaultBaseUrls,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    tenant: Tenant;
    connection: Connection | null;
    environments: { value: string; label: string }[];
    defaultBaseUrls: Record<string, string>;
}) {
    const [showSecret, setShowSecret] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        environment: connection?.environment ?? 'uat',
        hie_base_url: connection?.hie_base_url ?? defaultBaseUrls.uat,
        client_id: connection?.client_id ?? '',
        client_secret: '',
        api_key: '',
        facility_fr_code: connection?.facility_fr_code ?? '',
        facility_name: connection?.facility_name ?? '',
        is_active: connection?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/tenant-connections/${tenant.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    const handleEnvChange = (env: string) => {
        setData('environment', env);
        if (!connection) {
            setData('hie_base_url', defaultBaseUrls[env] ?? '');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {connection ? 'Edit connection' : 'Configure connection'}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        HIE credentials for {tenant.name}. Secrets are encrypted at rest.
                    </p>
                </DialogHeader>

                <form onSubmit={submit} className="mt-4 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Environment</Label>
                            <div className="flex gap-2">
                                {environments.map((e) => (
                                    <button
                                        key={e.value}
                                        type="button"
                                        onClick={() => handleEnvChange(e.value)}
                                        className={`flex-1 rounded-lg border p-3 text-left text-sm transition ${
                                            data.environment === e.value
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                : 'hover:border-foreground/20'
                                        }`}
                                    >
                                        <span className="font-semibold">{e.value.toUpperCase()}</span>
                                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                            {e.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="hie_base_url">HIE base URL</Label>
                            <Input
                                id="hie_base_url"
                                value={data.hie_base_url}
                                onChange={(e) => setData('hie_base_url', e.target.value)}
                                placeholder="https://ilm-dev.dha.go.ke/uat-middleware"
                            />
                            <InputError message={errors.hie_base_url} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="client_id">Client ID</Label>
                            <Input
                                id="client_id"
                                value={data.client_id}
                                onChange={(e) => setData('client_id', e.target.value)}
                                placeholder="Issued by HIE onboarding team"
                            />
                            <InputError message={errors.client_id} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="client_secret">
                                Client secret
                                {connection?.has_client_secret && (
                                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                                        (leave empty to keep current)
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="client_secret"
                                    type={showSecret ? 'text' : 'password'}
                                    value={data.client_secret}
                                    onChange={(e) => setData('client_secret', e.target.value)}
                                    placeholder={connection?.has_client_secret ? connection.client_secret_masked ?? '' : 'Paste client secret'}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                                >
                                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <InputError message={errors.client_secret} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="api_key">
                                API key
                                <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                                    Optional · used for POMSF balance checks
                                </span>
                                {connection?.has_api_key && (
                                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                        (leave empty to keep current)
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="api_key"
                                    type={showApiKey ? 'text' : 'password'}
                                    value={data.api_key}
                                    onChange={(e) => setData('api_key', e.target.value)}
                                    placeholder={connection?.has_api_key ? connection.api_key_masked ?? '' : 'Paste API key'}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                                >
                                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <InputError message={errors.api_key} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="facility_fr_code">Facility FR code</Label>
                            <Input
                                id="facility_fr_code"
                                value={data.facility_fr_code}
                                onChange={(e) => setData('facility_fr_code', e.target.value)}
                                placeholder="FID-47-105963-0"
                                className="font-mono"
                            />
                            <InputError message={errors.facility_fr_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="facility_name">Facility name</Label>
                            <Input
                                id="facility_name"
                                value={data.facility_name}
                                onChange={(e) => setData('facility_name', e.target.value)}
                                placeholder="Nairobi West Hospital"
                            />
                            <InputError message={errors.facility_name} />
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border"
                        />
                        <div>
                            <div className="font-medium">Active</div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Inactive connections are still stored but skipped during tests.
                            </p>
                        </div>
                    </label>

                    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            {connection ? 'Save changes' : 'Save connection'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}