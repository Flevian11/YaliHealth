import { Pagination } from '@/components/pagination';
import { Card } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    Megaphone,
    Rocket,
    Sparkles,
    Tag,
    Wrench,
} from 'lucide-react';

type Announcement = {
    id: number;
    title: string;
    body: string;
    category: string;
    priority: string;
    published_at: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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

const PRIORITY_LABEL: Record<string, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'Important',
    urgent: 'Urgent',
};

const PRIORITY_TINT: Record<string, string> = {
    low: '',
    normal: '',
    high: 'border-l-2 border-l-amber-400',
    urgent: 'border-l-2 border-l-rose-500',
};

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

export default function AnnouncementsPage({
    announcements,
}: {
    announcements: Paginator<Announcement>;
}) {
    return (
        <>
            <Head title="Announcements" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Announcements
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Updates from {`YaliHealth`} and your hospital administrator
                </p>
            </div>

            {announcements.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                        <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                        No announcements yet
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        When the platform or your hospital posts an update,
                        it will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {announcements.data.map((a) => {
                            const Icon = CATEGORY_ICONS[a.category] ?? Megaphone;
                            return (
                                <Card
                                    key={a.id}
                                    className={`overflow-hidden p-0 transition hover:shadow-sm ${PRIORITY_TINT[a.priority]}`}
                                >
                                    <div className="flex gap-4 p-5">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CATEGORY_TINT[a.category] ?? CATEGORY_TINT.general}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold">
                                                    {a.title}
                                                </h3>
                                                {(a.priority === 'high' ||
                                                    a.priority === 'urgent') && (
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                            a.priority === 'urgent'
                                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        {PRIORITY_LABEL[a.priority]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                                {a.body}
                                            </p>
                                            <p className="mt-3 text-[11px] text-muted-foreground">
                                                <RelativeTime iso={a.published_at} />
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <Pagination
                        currentPage={announcements.current_page}
                        lastPage={announcements.last_page}
                        total={announcements.total}
                        perPage={announcements.per_page}
                        baseUrl="/announcements"
                    />
                </>
            )}
        </>
    );
}