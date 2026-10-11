import { Form, Head, Link } from '@inertiajs/react';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const LOGIN_URL = '/login';
const REGISTER_URL = '/register';
const FORGOT_URL = '/forgot-password';

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Sign in" />

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {status}
                </div>
            )}

            {/* Passkey card */}
            <div className="mb-6">
                <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                                Sign in with a passkey
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Fingerprint, face, or device PIN. No password
                                needed.
                            </p>
                        </div>
                    </div>

                    <PasskeyVerify />
                </div>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-card px-3 text-muted-foreground">
                        Or continue with email
                    </span>
                </div>
            </div>

            {/* Email + password */}
            <Form
                action={LOGIN_URL}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="you@hospital.co.ke"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <Link
                                            href={FORGOT_URL}
                                            className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-sm"
                                >
                                    Keep me signed in on this device
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Continue with password
                            </Button>

                            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                    After your password, we'll send a 6-digit
                                    code to your email to keep your account
                                    secure.
                                </span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-muted-foreground">
                            Need a staff account?{' '}
                            <Link
                                href={REGISTER_URL}
                                className="font-medium text-foreground underline underline-offset-2 hover:text-emerald-600"
                                tabIndex={6}
                            >
                                Contact your administrator
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Sign in to your hospital account',
};