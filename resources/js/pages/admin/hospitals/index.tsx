import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';

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

export default function HospitalsIndex({ hospitals }: { hospitals: Hospital[] }) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    return (
        <>
            <Head title="Hospitals" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Hospitals</h1>
                    <p className="text-sm text-muted-foreground">
                        {hospitals.length} {hospitals.length === 1 ? 'tenant' : 'tenants'} on the platform
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/hospitals/create">
                        <Plus className="h-4 w-4" /> New Hospital
                    </Link>
                </Button>
            </div>

            {props.flash?.success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {props.flash.success}
                </div>
            )}

            {hospitals.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                    No hospitals yet. Click "New Hospital" to add the first one.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border bg-card">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Hospital</th>
                                <th className="px-4 py-3 font-medium">Domain</th>
                                <th className="px-4 py-3 font-medium">Admin</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hospitals.map((h) => (
                                <tr key={h.id} className="border-b last:border-b-0 hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/hospitals/${h.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {h.name}
                                        </Link>
                                        {h.phone && (
                                            <div className="text-xs text-muted-foreground">
                                                {h.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {h.domains[0] ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{h.admin_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {h.admin_email}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={h.status === 'active' ? 'default' : 'secondary'}>
                                            {h.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}