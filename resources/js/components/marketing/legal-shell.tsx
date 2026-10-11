import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock } from 'lucide-react';
import { ReactNode } from 'react';

export type LegalSection = {
    id: string;
    title: string;
    body: ReactNode;
};

export function LegalShell({
    title,
    updated,
    intro,
    sections,
}: {
    title: string;
    updated: string;
    intro: string;
    sections: LegalSection[];
}) {
    return (
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
            <Link
                href="/"
                className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3 w-3" />
                Back to home
            </Link>

            <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border bg-card p-4">
                        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            On this page
                        </h3>
                        <nav className="flex flex-col gap-1">
                            {sections.map((s, i) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted text-[9px] font-semibold">
                                        {i + 1}
                                    </span>
                                    <span className="truncate">{s.title}</span>
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-4 rounded-2xl border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                            <Clock className="h-3 w-3" />
                            Last updated
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {updated}
                        </p>
                    </div>
                </aside>

                <article className="min-w-0">
                    <header className="border-b pb-8">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            {title}
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            {intro}
                        </p>
                    </header>

                    <div className="divide-y">
                        {sections.map((section, i) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-24 py-10 first:pt-8"
                            >
                                <div className="mb-4 flex items-baseline gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {i + 1}
                                    </span>
                                    <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                                        {section.title}
                                    </h2>
                                </div>
                                <div className="legal-body ml-0 sm:ml-10">
                                    {section.body}
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="mt-8 rounded-2xl border bg-muted/30 p-6">
                        <p className="text-sm font-medium">
                            Questions about this document?
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Contact our compliance team at{' '}
                            <a
                                href="mailto:legal@yalihealth.co.ke"
                                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                                legal@yalihealth.co.ke
                            </a>{' '}
                            or use our{' '}
                            <Link
                                href="/contact"
                                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                                contact form
                            </Link>
                            .
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
}