import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function AdminLogin() {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

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
            <Head title="Super Admin Sign in" />

            <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-6 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/20">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border bg-card p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
                        <div className="mb-8 flex flex-col items-center gap-3 text-center">
                            <img
                                src="/images/logo.png"
                                alt={brand}
                                className="h-16 w-16 object-contain"
                            />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {brand}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Super Admin console
                                </p>
                            </div>
                        </div>

                        <form className="flex flex-col gap-5" onSubmit={submit}>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    autoComplete="email"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@yalihealth.local"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(c) => setData('remember', c === true)}
                                />
                                <Label htmlFor="remember" className="cursor-pointer">
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 w-full"
                                disabled={processing}
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Sign in
                            </Button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Authorized access only. All activity is logged.
                    </p>
                </div>
            </div>
        </>
    );
}