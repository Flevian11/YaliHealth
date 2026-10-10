import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function AdminLogin() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

        const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/login', { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title="Super Admin Login" />

            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-semibold">YaliHealth</h1>
                            <p className="text-sm text-muted-foreground">
                                Super Admin console
                            </p>
                        </div>

                        <form className="flex flex-col gap-6" onSubmit={submit}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="admin@yalihealth.local"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) =>
                                            setData('remember', checked === true)
                                        }
                                    />
                                    <Label htmlFor="remember">Remember me</Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Sign in
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}