import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

type Hospital = {
    id: string;
    name: string;
    admin_name: string | null;
    admin_email: string | null;
    phone: string | null;
    status: string;
    domains: string[];
    created_at: string;
};

export default function HospitalShow({
    hospital,
    tenantBase,
}: {
    hospital: Hospital;
    tenantBase: string;
}) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const tenantUrl = hospital.domains[0]
        ? `http://${hospital.domains[0]}.${tenantBase}:8000`
        : null;

    return (
        <>
            <Head title={hospital.name} />

            <div className="mb-6">
                <Link
                    href="/admin/hospitals"
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                >
                    <ArrowLeft className="h-3 w-3" /> Back to hospitals
                </Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">{hospital.name}</h1>
                    <Badge variant={hospital.status === 'active' ? 'default' : 'secondary'}>
                        {hospital.status}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Created {new Date(hospital.created_at).toLocaleString()}
                </p>
            </div>

            {props.flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {props.flash.success}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <Row label="Internal ID" value={<code>{hospital.id}</code>} />
                        <Row label="Subdomain" value={<code>{hospital.domains[0] ?? '—'}</code>} />
                        <Row label="Full domain" value={<code>{hospital.domains[0]}.{tenantBase}</code>} />
                        <Row
                            label="Tenant URL"
                            value={
                                tenantUrl ? (
                                    <a
                                        href={tenantUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        Open <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    '—'
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hospital administrator</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <Row label="Name" value={hospital.admin_name ?? '—'} />
                        <Row label="Email" value={hospital.admin_email ?? '—'} />
                        <Row label="Phone" value={hospital.phone ?? '—'} />
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <Button variant="outline" asChild>
                    <Link href="/admin/hospitals">Back to list</Link>
                </Button>
            </div>
        </>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}