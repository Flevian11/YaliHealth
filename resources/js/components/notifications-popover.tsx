import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    BarChart3,
    Bell,
    LoaderCircle,
    Megaphone,
    Rocket,
    Sparkles,
    Tag,
    Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Announcement = {
    id: number;
    title: string;
    body: string;
    category: string;
    priority: string;
    published_at: string;
};

const CATEGORY_ICONS: Record<string, any> = {
    general: Megaphone,
    billing: Tag,
    usage: BarChart3,
    feature: Sparkles,
    advert: Rocket,
    maintenance: Wrench,
};

const CATEGORY_TINT: Record<string, string> = {
    general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    billing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    usage: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    feature: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    advert: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    maintenance: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

const PRIORITY_TINT: Record<string, string> = {
    low: '',
    normal: '',
    high: 'border-l-amber-400',
    urgent: 'border-l-rose-500',
};

function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
    });
}

export function NotificationsPopover() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Announcement[]>([]);
    const [lastRead, setLastRead] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        return Number(localStorage.getItem('notifications.lastRead') ?? '0');
    });
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = items.filter(
        (a) => a.id > lastRead,
    ).length;

    // Fetch on mount to show the badge without opening
    useEffect(() => {
        if (items.length === 0) {
            void load();
        }
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/announcements/recent', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.announcements ?? []);
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    const openPanel = () => {
        setOpen((o) => !o);
        if (!open && items.length === 0) {
            void load();
        }
    };

    const markAllRead = () => {
        if (items.length === 0) return;
        const topId = items[0].id;
        localStorage.setItem('notifications.lastRead', String(topId));
        setLastRead(topId);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={openPanel}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border bg-card shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold">
                                Notifications
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {unreadCount > 0
                                    ? `${unreadCount} unread`
                                    : 'All caught up'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Loading...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    No announcements yet
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {items.map((a) => {
                                    const Icon =
                                        CATEGORY_ICONS[a.category] ??
                                        Megaphone;
                                    const isUnread = a.id > lastRead;
                                    return (
                                        <div
                                            key={a.id}
                                            className={cn(
                                                'flex gap-3 px-4 py-3 transition',
                                                PRIORITY_TINT[a.priority] &&
                                                    `border-l-2 ${PRIORITY_TINT[a.priority]}`,
                                                isUnread
                                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                                                    : 'hover:bg-muted/40',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                                    CATEGORY_TINT[a.category] ??
                                                        CATEGORY_TINT.general,
                                                )}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p
                                                        className={cn(
                                                            'truncate text-sm',
                                                            isUnread &&
                                                                'font-semibold',
                                                        )}
                                                    >
                                                        {a.title}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                    )}
                                                </div>
                                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                                    {a.body}
                                                </p>
                                                <p className="mt-1 text-[10px] text-muted-foreground">
                                                    {relativeTime(
                                                        a.published_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}