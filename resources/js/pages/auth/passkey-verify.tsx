import { Fingerprint, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';

type State =
    | { kind: 'idle' }
    | { kind: 'unsupported' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string };

async function csrfToken(): Promise<string> {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function PasskeyVerify() {
    const [state, setState] = useState<State>({ kind: 'idle' });

    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !window.PublicKeyCredential ||
            typeof navigator.credentials?.get !== 'function'
        ) {
            setState({ kind: 'unsupported' });
        }
    }, []);

    const handleClick = async () => {
        setState({ kind: 'loading' });

        try {
            const optionsRes = await fetch('/passkeys/login/options', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!optionsRes.ok) {
                throw new Error('Unable to start passkey sign-in.');
            }

            const { options } = await optionsRes.json();

            const credential = await startAuthentication({
                optionsJSON: options,
            });

            const verifyRes = await fetch('/passkeys/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': await csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(credential),
            });

            if (!verifyRes.ok) {
                let message =
                    'That passkey did not work. Try again or use your password.';
                try {
                    const body = await verifyRes.json();
                    if (body?.message) message = body.message;
                } catch {
                    /* keep the default message */
                }
                throw new Error(message);
            }

            // The PasskeyLoginResponse may return JSON with a redirect,
            // or it may return a plain 302. Handle both.
            const contentType = verifyRes.headers.get('content-type') ?? '';

            if (contentType.includes('application/json')) {
                const body = await verifyRes.json();
                window.location.href = body?.redirect ?? '/dashboard';
            } else {
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            const name = err?.name ?? '';

            // Cancelling the OS biometric prompt is not an error
            if (name === 'NotAllowedError' || name === 'AbortError') {
                setState({ kind: 'idle' });
                return;
            }

            setState({
                kind: 'error',
                message:
                    err?.message ?? 'Passkey sign-in failed. Please try again.',
            });
        }
    };

    if (state.kind === 'unsupported') {
        return (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                    This browser doesn't support passkeys. Use your email and
                    password instead.
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Button
                type="button"
                onClick={handleClick}
                disabled={state.kind === 'loading'}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                data-test="passkey-login-button"
            >
                {state.kind === 'loading' ? (
                    <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                    <Fingerprint className="mr-1.5 h-4 w-4" />
                )}
                {state.kind === 'loading'
                    ? 'Waiting for your device...'
                    : 'Sign in with passkey'}
            </Button>

            {state.kind === 'error' && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {state.message}
                </div>
            )}
        </div>
    );
}