import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

type FormData = {
    name: string;
    phone: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_password_confirmation: string;
};

export default function HospitalsCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        phone: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/hospitals');
    };

    return (
        <>
            <Head title="New Hospital" />

            <div className="mb-6">
                <Link
                    href="/admin/hospitals"
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                >
                    <ArrowLeft className="h-3 w-3" /> Back to hospitals
                </Link>
                <h1 className="text-2xl font-semibold">Create a hospital</h1>
                <p className="text-sm text-muted-foreground">
                    This provisions a new tenant with its own schema, subdomain, and hospital admin.
                </p>
            </div>

            <form onSubmit={submit} className="grid max-w-4xl gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Hospital information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="name">Hospital name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nairobi West Hospital"
                            />
                            <InputError message={errors.name} />
                            <p className="text-xs text-muted-foreground">
                                The subdomain and internal ID are generated from this name.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone (optional)</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="+254 700 000 000"
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hospital administrator</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="admin_name">Full name</Label>
                            <Input
                                id="admin_name"
                                value={data.admin_name}
                                onChange={(e) => setData('admin_name', e.target.value)}
                                placeholder="Jane Doe"
                            />
                            <InputError message={errors.admin_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin_email">Email</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                value={data.admin_email}
                                onChange={(e) => setData('admin_email', e.target.value)}
                                placeholder="admin@nairobiwest.co.ke"
                            />
                            <InputError message={errors.admin_email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin_password">Password</Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={data.admin_password}
                                onChange={(e) => setData('admin_password', e.target.value)}
                            />
                            <InputError message={errors.admin_password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin_password_confirmation">Confirm password</Label>
                            <Input
                                id="admin_password_confirmation"
                                type="password"
                                value={data.admin_password_confirmation}
                                onChange={(e) =>
                                    setData('admin_password_confirmation', e.target.value)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/hospitals">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create hospital
                    </Button>
                </div>
            </form>
        </>
    );
}