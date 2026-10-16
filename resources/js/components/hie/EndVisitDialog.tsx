import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertTriangle,
    CheckCircle2,
    Fingerprint,
    LoaderCircle,
    Send,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Phase =
    | 'select_method'
    | 'otp_sent'
    | 'biometric_starting'
    | 'biometric_waiting'
    | 'biometric_ready'
    | 'submitting'
    | 'done';

type Reason = 'RECOVERED' | 'REFERRED' | 'ABSCONDED' | 'OTHER';

const REASONS: { value: Reason; label: string }[] = [
    { value: 'RECOVERED', label: 'Recovered' },
    { value: 'REFERRED', label: 'Referred' },
    { value: 'ABSCONDED', label: 'Absconded' },
    { value: 'OTHER', label: 'Other' },
];

export function EndVisitDialog({
    visitId,
    visitType, // 'OP' | 'IP'
    onCompleted,
    onCancel,
}: {
    visitId: number;
    visitType: string;
    onCompleted: () => void;
    onCancel: () => void;
}) {
    const [phase, setPhase] = useState<Phase>('select_method');
    const [method, setMethod] = useState<'otp' | 'biometric'>('otp');
    const [reason, setReason] = useState<Reason>('RECOVERED');
    const [otp, setOtp] = useState('');
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [authGuid, setAuthGuid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (pollRef.current) window.clearTimeout(pollRef.current);
        };
    }, []);

    const csrf = () =>
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';

    /* ───── OTP path ───── */

    const sendDischargeOtp = async () => {
        setError(null);
        try {
            const res = await fetch(`/visits/${visitId}/otp/discharge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(csrf()),
                },
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error ?? 'Could not send discharge OTP.');
                return;
            }
            setPhase('otp_sent');
        } catch {
            setError('Could not reach the HIE.');
        }
    };

    /* ───── Biometric path ───── */

    const startBiometric = async () => {
        setError(null);
        setPhase('biometric_starting');
        try {
            const res = await fetch(
                `/visits/${visitId}/biometric/discharge`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(csrf()),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                },
            );
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error ?? 'Could not start biometric.');
                setPhase('select_method');
                return;
            }
            setIframeUrl(json.iframe_url);
            setAuthGuid(json.guid);
            setPhase('biometric_waiting');
            schedulePoll();
        } catch {
            setError('Could not reach the HIE.');
            setPhase('select_method');
        }
    };

    const schedulePoll = () => {
        pollRef.current = window.setTimeout(pollBiometric, 2000);
    };

    const pollBiometric = async () => {
        try {
            const res = await fetch(
                `/visits/${visitId}/biometric/discharge/poll`,
                { headers: { Accept: 'application/json' } },
            );
            const json = await res.json();
            if (res.ok && json.authorized) {
                setPhase('biometric_ready');
                setAuthGuid(json.auth_guid);
                return;
            }
            schedulePoll();
        } catch {
            schedulePoll();
        }
    };

    /* ───── Dispatch ───── */

    const dispatch = async () => {
        setError(null);
        setPhase('submitting');

        const payload: Record<string, string> = { discharge_reason: reason };

        if (method === 'otp') {
            payload.otp = otp.trim();
        } else {
            payload.discharge_auth_guid = authGuid ?? '';
        }

        const endpoint =
            visitType === 'IP'
                ? `/visits/${visitId}/discharge`
                : `/visits/${visitId}/submit`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(csrf()),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error ?? 'Dispatch failed.');
                setPhase(method === 'otp' ? 'otp_sent' : 'biometric_ready');
                return;
            }
            setPhase('done');
            setTimeout(onCompleted, 900);
        } catch {
            setError('Could not reach the HIE.');
            setPhase(method === 'otp' ? 'otp_sent' : 'biometric_ready');
        }
    };

    /* ───── Render ───── */

    return (
        <div className="space-y-4">
            {/* Reason selector — always visible until done */}
            {phase !== 'done' && (
                <div className="grid gap-2">
                    <Label>Discharge reason</Label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as Reason)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                        {REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Method tabs */}
            {(phase === 'select_method' ||
                phase === 'otp_sent' ||
                phase === 'biometric_waiting' ||
                phase === 'biometric_ready') && (
                <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/30 p-1">
                    <button
                        type="button"
                        onClick={() => method !== 'otp' && resetToSelect('otp')}
                        disabled={method === 'otp' && phase !== 'select_method'}
                        className={`flex items-center gap-2 rounded-lg p-2.5 text-left text-sm transition disabled:opacity-60 ${
                            method === 'otp'
                                ? 'bg-card font-semibold shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Smartphone className="h-4 w-4" />
                        OTP
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            method !== 'biometric' && resetToSelect('biometric')
                        }
                        disabled={
                            method === 'biometric' && phase !== 'select_method'
                        }
                        className={`flex items-center gap-2 rounded-lg p-2.5 text-left text-sm transition disabled:opacity-60 ${
                            method === 'biometric'
                                ? 'bg-card font-semibold shadow-sm ring-1 ring-emerald-500/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Fingerprint className="h-4 w-4" />
                        Biometric
                    </button>
                </div>
            )}

            {/* OTP path */}
            {method === 'otp' && phase === 'select_method' && (
                <Button
                    onClick={sendDischargeOtp}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <Send className="mr-1.5 h-4 w-4" />
                    Send discharge OTP
                </Button>
            )}

            {method === 'otp' && phase === 'otp_sent' && (
                <>
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            OTP sent. Ask the patient to read it out.
                        </span>
                    </div>
                    <div className="grid gap-2">
                        <Label>One-time code</Label>
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            autoFocus
                            inputMode="numeric"
                            className="text-center text-lg tracking-widest"
                        />
                    </div>
                </>
            )}

            {/* Biometric path */}
            {method === 'biometric' && phase === 'select_method' && (
                <Button
                    onClick={startBiometric}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <Fingerprint className="mr-1.5 h-4 w-4" />
                    Start biometric check
                </Button>
            )}

            {method === 'biometric' && phase === 'biometric_starting' && (
                <div className="flex flex-col items-center py-8">
                    <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        Preparing biometric authorization…
                    </p>
                </div>
            )}

            {method === 'biometric' && phase === 'biometric_waiting' && (
                <>
                    <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                        <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                        <span>
                            Ask the patient to place their finger on the scanner.
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
                </>
            )}

            {method === 'biometric' && phase === 'biometric_ready' && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Biometric matched. Ready to dispatch.</span>
                </div>
            )}

            {phase === 'submitting' && (
                <div className="flex flex-col items-center py-8">
                    <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        Submitting claim…
                    </p>
                </div>
            )}

            {phase === 'done' && (
                <div className="flex flex-col items-center py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="mt-3 text-base font-semibold">
                        Visit {visitType === 'IP' ? 'discharged' : 'submitted'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Claim sent to SHA.
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Action row */}
            {(phase === 'otp_sent' || phase === 'biometric_ready') && (
                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={phase === 'submitting'}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={dispatch}
                        disabled={
                            phase === 'submitting' ||
                            (method === 'otp' && otp.trim().length < 4)
                        }
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {visitType === 'IP' ? 'Discharge patient' : 'Submit claim'}
                    </Button>
                </div>
            )}
        </div>
    );

    function resetToSelect(m: 'otp' | 'biometric') {
        setMethod(m);
        setPhase('select_method');
        setOtp('');
        setAuthGuid(null);
        setIframeUrl(null);
        setError(null);
        if (pollRef.current) window.clearTimeout(pollRef.current);
    }
}