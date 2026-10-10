import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    baseUrl: string;
    filters?: Record<string, string>;
};

export function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    baseUrl,
    filters = {},
}: Props) {
    if (lastPage <= 1) {
        return (
            <p className="mt-4 text-center text-xs text-muted-foreground">
                Showing {total} {total === 1 ? 'entry' : 'entries'}
            </p>
        );
    }

    const from = (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    const goto = (page: number) => {
        if (page < 1 || page > lastPage || page === currentPage) return;
        router.get(
            baseUrl,
            { ...filters, page },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const pages = buildRange(currentPage, lastPage);

    return (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{from}</span>–
                <span className="font-medium text-foreground">{to}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span>
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => goto(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-card text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span
                            key={`gap-${i}`}
                            className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => goto(p as number)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs transition ${
                                p === currentPage
                                    ? 'border-primary bg-primary font-semibold text-primary-foreground'
                                    : 'bg-card hover:bg-muted'
                            }`}
                        >
                            {p}
                        </button>
                    ),
                )}

                <button
                    onClick={() => goto(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-card text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function buildRange(current: number, last: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const delta = 1;

    for (let i = 1; i <= last; i++) {
        if (
            i === 1 ||
            i === last ||
            (i >= current - delta && i <= current + delta)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return pages;
}