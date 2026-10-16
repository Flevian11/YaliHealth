import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    CheckCircle2,
    Fingerprint,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'starting' | 'waiting' | 'verifying' | 'done';

export function BiometricCapture({
    visitId,
    onVerified,
}: {
    visitId: number;
    onVerified: () => void;
}) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<number | null>(null);

    /* Clear polling on unmount */
    useEffect(() => {
        return () => {
            if (pollRef.current) window.clearTimeout(pollRef.current);
        };
    }, []);

    const start = async () => {
        setPhase('starting');
        setError(null);

        try {
            const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const res = await fetch(`/visits/${visitId}/biometric`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({}),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error ?? 'Could not start biometric.');
                setPhase('idle');
                return;
            }
            setIframeUrl(json.iframe_url);
            setPhase('waiting');
            scheduleePoll();
        } catch {
            setError('Could not reach the HIE.');
            setPhase('idle');
        }
    };

    const scheduleePoll = () => {
        pollRef.current = window.setTimeout(poll, 2000);
    };

    const poll = async () => {
        try {
            const res = await fetch(`/visits/${visitId}/biometric/poll`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                // A transient error — try again in 2s, don't kill the flow
                scheduleePoll();
                return;
            }
            if (json.authorized) {
                setPhase('done');
                setTimeout(onVerified, 800);
                return;
            }
            scheduleePoll();
        } catch {
            scheduleePoll();
        }
    };

    if (phase === 'idle') {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                        <Fingerprint className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                        Fingerprint verification
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        The patient places their finger on the biometric device
                        when the workspace opens. We'll detect the match
                        automatically.
                    </p>
                </div>

                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Button
                    onClick={start}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <Fingerprint className="mr-1.5 h-4 w-4" />
                    Start biometric check
                </Button>
            </div>
        );
    }

    if (phase === 'starting') {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
                <p className="mt-3 text-sm text-muted-foreground">
                    Preparing biometric authorization…
                </p>
            </div>
        );
    }

    if (phase === 'waiting') {
        return (
            <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                    <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                    <span>
                        Ask the patient to place their finger on the scanner.
                        We'll detect the match automatically.
                    </span>
                </div>

                {iframeUrl && (
                    <div className="overflow-hidden rounded-xl border bg-white">
                        <iframe
                            src={iframeUrl}
                            title="Biometric Verification"
                            className="h-[420px] w-full border-0"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'done') {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="mt-3 text-sm font-semibold">Biometric matched</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Creating visit…
                </p>
            </div>
        );
    }

    return null;
}