import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { Building2, CheckCircle2 } from 'lucide-react';

type Recent = {
    id: string;
    name: string;
    domain: string | null;
    created_at: string;
};

type Stats = {
    total_hospitals: number;
    active_hospitals: number;
    recent: Recent[];
};

export default function AdminDashboard({ stats }: { stats: Stats }) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Platform overview
                </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Hospitals
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">
                            {stats.total_hospitals}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">
                            {stats.active_hospitals}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="mb-3 text-lg font-medium">Recently added</h2>
                {stats.recent.length === 0 ? (
                    <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                        No hospitals yet.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-card">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Hospital</th>
                                    <th className="px-4 py-3 font-medium">Domain</th>
                                    <th className="px-4 py-3 font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent.map((h) => (
                                    <tr key={h.id} className="border-b last:border-b-0">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/hospitals/${h.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {h.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {h.domain ?? '—'}
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
            </div>
        </>
    );
}