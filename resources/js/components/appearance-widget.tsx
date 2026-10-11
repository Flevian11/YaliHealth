import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Check, Monitor, Moon, Palette, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppearanceWidget() {
    const { appearance, updateAppearance } = useAppearance();
    const [open, setOpen] = useState(false);

    // Close on escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const options = [
        { value: 'light' as const, label: 'Light', Icon: Sun },
        { value: 'dark' as const, label: 'Dark', Icon: Moon },
        { value: 'system' as const, label: 'System', Icon: Monitor },
    ];

    return (
        <>
            {/* Floating trigger button */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'fixed right-4 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-l-xl rounded-r-none border border-r-0 bg-card text-foreground shadow-lg transition hover:bg-muted',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
                    open && 'bg-muted',
                )}
                aria-label="Open appearance settings"
            >
                <Palette className="h-5 w-5" />
            </button>

            {/* Backdrop on mobile */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Panel */}
            <div
                className={cn(
                    'fixed right-0 top-1/2 z-40 w-72 -translate-y-1/2 rounded-l-2xl border border-r-0 bg-card shadow-2xl transition-transform duration-200',
                    open ? 'translate-x-0' : 'translate-x-full pointer-events-none opacity-0',
                )}
            >
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <p className="text-sm font-semibold">Appearance</p>
                            <p className="text-[10px] text-muted-foreground">
                                Choose your theme
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="space-y-1.5">
                        {options.map((opt) => {
                            const active = appearance === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateAppearance(opt.value)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition',
                                        active
                                            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                                            : 'border-transparent hover:border-border hover:bg-muted/50',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                            active
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        <opt.Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {opt.label}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {opt.value === 'system'
                                                ? 'Follow device setting'
                                                : `Always ${opt.label.toLowerCase()}`}
                                        </p>
                                    </div>
                                    {active && (
                                        <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 border-t pt-3 text-[10px] text-muted-foreground">
                        Your choice is saved to this browser.
                    </div>
                </div>
            </div>
        </>
    );
}