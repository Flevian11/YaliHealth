import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertTriangle,
    CheckCircle2,
    LoaderCircle,
    Send,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Contact = {
    id: string;
    masked: string;
    type: string | null;
    confirmed: boolean;
};

export function OtpCapture({
    visitId,
    onVerified,
}: {
    visitId: number;
    onVerified: () => void;
}) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/visits/${visitId}/contacts`, {
                    headers: { Accept: 'application/json' },
                });
                const json = await res.json();
                if (cancelled) return;

                if (!res.ok || json.error) {
                    setLoadError(json.error ?? 'Could not load contacts.');
                    return;
                }

                const list: Contact[] = json.contacts ?? [];
                setContacts(list);
                if (list.length > 0) {
                    setSelectedContactId(
                        list.find((c) => c.confirmed)?.id ?? list[0].id,
                    );
                }
            } catch {
                if (!cancelled) setLoadError('Could not reach the HIE.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [visitId]);

    const sendOtp = async () => {
        if (!selectedContactId) return;
        setSending(true);
        setSendError(null);

        try {
            const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const res = await fetch(`/visits/${visitId}/otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ contact_id: selectedContactId }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setSendError(json.error ?? 'Could not send OTP.');
                return;
            }
            setSentTo(json.sent_to);
        } catch {
            setSendError('Could not reach the HIE.');
        } finally {
            setSending(false);
        }
    };

    const verify = async () => {
        if (!otp.trim()) return;
        setVerifying(true);
        setVerifyError(null);

        try {
            const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const res = await fetch(`/visits/${visitId}/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ otp: otp.trim() }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setVerifyError(json.error ?? 'Invalid OTP.');
                return;
            }
            onVerified();
        } catch {
            setVerifyError('Could not reach the HIE.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{loadError}</span>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                    This patient has no confirmed contacts for OTP. Update the
                    contact on the patient record first.
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Contacts list */}
            <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Send code to
                </p>
                <div className="space-y-2">
                    {contacts.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            disabled={!!sentTo}
                            onClick={() => setSelectedContactId(c.id)}
                            className={`flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition ${
                                selectedContactId === c.id
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                    : 'hover:border-emerald-300'
                            } ${sentTo ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-mono text-sm font-semibold">
                                    {c.masked}
                                </p>
                                {c.confirmed && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                        Confirmed
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {sendError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{sendError}</span>
                </div>
            )}

            {!sentTo ? (
                <Button
                    onClick={sendOtp}
                    disabled={sending || !selectedContactId}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    {sending ? (
                        <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-1.5 h-4 w-4" />
                    )}
                    Send OTP
                </Button>
            ) : (
                <>
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            OTP sent to <strong>{sentTo}</strong>. Ask the patient
                            to read it out.
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            One-time code
                        </label>
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    verify();
                                }
                            }}
                            placeholder="123456"
                            autoFocus
                            inputMode="numeric"
                            className="text-center text-lg tracking-widest"
                        />
                    </div>

                    {verifyError && (
                        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{verifyError}</span>
                        </div>
                    )}

                    <Button
                        onClick={verify}
                        disabled={verifying || otp.trim().length < 4}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {verifying ? (
                            <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="mr-1.5 h-4 w-4" />
                        )}
                        Verify and create visit
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            setSentTo(null);
                            setOtp('');
                            setSendError(null);
                        }}
                        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                    >
                        Use a different contact
                    </button>
                </>
            )}
        </div>
    );
}