import { Form, Head, Link, usePage } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
    ArrowLeft,
    Clock,
    LoaderCircle,
    Mail,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';

const OTP_LENGTH = 6;
const VERIFY_URL = '/auth/verify-otp';
const RESEND_URL = '/auth/verify-otp/resend';
const CANCEL_URL = '/auth/verify-otp/cancel';

type Props = {
    email: string;
    expiresInMinutes: number;
    resendCooldown: number;
};

export default function VerifyOtp({
    email,
    expiresInMinutes,
    resendCooldown,
}: Props) {
    const { props } = usePage<{
        theme?: { brand: string };
        flash?: { success?: string };
    }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    const [code, setCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [timeLeft, setTimeLeft] = useState(expiresInMinutes * 60);
    const cooldownRef = useRef<number | null>(null);
    const expiryRef = useRef<number | null>(null);

    useEffect(() => {
        setTimeLeft(expiresInMinutes * 60);
        expiryRef.current = window.setInterval(() => {
            setTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => {
            if (expiryRef.current !== null) {
                window.clearInterval(expiryRef.current);
            }
        };
    }, [expiresInMinutes]);

    useEffect(() => {
        if (cooldown <= 0) {
            if (cooldownRef.current !== null) {
                window.clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
            return;
        }

        cooldownRef.current = window.setInterval(() => {
            setCooldown((c) => (c > 0 ? c - 1 : 0));
        }, 1000);

        return () => {
            if (cooldownRef.current !== null) {
                window.clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
        };
    }, [cooldown]);

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const expired = timeLeft <= 0;

    return (
        <>
            <Head title="Verify your sign-in" />

            {props.flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {props.flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-col items-center text-center">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                        <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>

                <h2 className="mt-4 text-lg font-semibold">Check your inbox</h2>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    We sent a {OTP_LENGTH}-digit code to{' '}
                    <span className="font-medium text-foreground">{email}</span>.
                    Enter it below to finish signing in.
                </p>
            </div>

            <Form action={VERIFY_URL} method="post" className="space-y-5" resetOnError>
                {({ errors, processing }) => (
                    <>
                        <div className="flex flex-col items-center gap-3">
                            <InputOTP
                                name="code"
                                maxLength={OTP_LENGTH}
                                value={code}
                                onChange={setCode}
                                disabled={processing || expired}
                                pattern={REGEXP_ONLY_DIGITS}
                                autoFocus
                                containerClassName="justify-center"
                            >
                                <InputOTPGroup>
                                    {Array.from({ length: OTP_LENGTH }, (_, i) => (
                                        <InputOTPSlot
                                            key={i}
                                            index={i}
                                            className="h-12 w-12 text-lg font-semibold"
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>

                            <InputError message={errors.code} />

                            <div className="flex items-center gap-1.5 text-xs">
                                {expired ? (
                                    <span className="text-rose-600 dark:text-rose-400">
                                        Code expired
                                    </span>
                                ) : (
                                    <>
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="tabular-nums text-muted-foreground">
                                            Expires in {formatTime(timeLeft)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={
                                processing || code.length < OTP_LENGTH || expired
                            }
                            data-test="verify-otp-button"
                        >
                            {processing ? (
                                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                            )}
                            Verify and sign in
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                <Link
                    href={CANCEL_URL}
                    method="post"
                    as="button"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to sign in
                </Link>

                <Link
                    href={RESEND_URL}
                    method="post"
                    as="button"
                    onClick={() => setCooldown(resendCooldown)}
                    disabled={cooldown > 0}
                    className={`inline-flex items-center gap-1.5 font-medium transition ${
                        cooldown > 0
                            ? 'cursor-not-allowed text-muted-foreground'
                            : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                    }`}
                >
                    <RefreshCw
                        className={`h-3 w-3 ${
                            cooldown > 0 ? '' : 'transition-transform hover:rotate-90'
                        }`}
                    />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </Link>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                    Never share this code. {brand} will never ask for it by phone or
                    email.
                </span>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Wrong email?{' '}
                <Link
                    href={CANCEL_URL}
                    method="post"
                    as="button"
                    className="font-medium text-foreground underline underline-offset-2 hover:text-emerald-600"
                >
                    Start over
                </Link>
            </p>
        </>
    );
}

VerifyOtp.layout = {
    title: 'Verify your sign-in',
    description: 'Enter the code we sent to your email',
};