import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRelativeTime } from '@/lib/relative-time';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Copy,
    ExternalLink,
    Hash,
    Layers,
    Network,
    Package,
    Sparkles,
    Tag,
} from 'lucide-react';

type Concept = {
    id: number;
    source: string;
    code: string;
    title: string;
    definition: string | null;
    chapter_code: string | null;
    chapter_title: string | null;
    block_code: string | null;
    block_title: string | null;
    parent_code: string | null;
    is_leaf: boolean;
    synonyms: string[];
    inclusions: string[];
    exclusions: string[];
    indexing_references: string[];
    raw_data: Record<string, any>;
    synced_at: string | null;
};

type ConceptRow = {
    id: number;
    source: string;
    code: string;
    title: string;
    chapter_code: string | null;
    chapter_title: string | null;
    block_title: string | null;
    is_leaf: boolean;
    synonyms_count: number;
    synced_at: string | null;
};

type Mapping = {
    id: number;
    to_code: string;
    to_source: string;
    to_title: string | null;
    map_type: string;
};

function RelativeTime({ iso }: { iso: string | null }) {
    const label = useRelativeTime(iso);
    return <>{label}</>;
}

function fullTime(iso: string): string {
    return new Date(iso).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TerminologyDetail({
    concept,
    children,
    mappings,
    parents,
}: {
    concept: Concept;
    children: ConceptRow[];
    mappings: Mapping[];
    parents: { code: string; title: string }[];
}) {
    const copy = (text: string) => navigator.clipboard?.writeText(text);

    const hasChildren = children.length > 0;
    const relatedMappings = mappings.filter(
        (m) => m.map_type !== 'has-child' && m.map_type !== 'has-parent',
    );

    const childMappings = mappings.filter((m) => m.map_type === 'has-child');
    const parentMappings = mappings.filter((m) => m.map_type === 'has-parent');

    return (
        <>
            <Head title={`${concept.code} — ${concept.title}`} />

            <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Link
                    href="/admin/terminology"
                    className="hover:text-foreground"
                >
                    Terminology
                </Link>
                <span>/</span>
                {concept.chapter_title && (
                    <>
                        <Link
                            href={`/admin/terminology?source=${concept.source}&chapter=${concept.chapter_code}`}
                            className="hover:text-foreground"
                        >
                            {concept.chapter_title}
                        </Link>
                        <span>/</span>
                    </>
                )}
                <span className="font-mono text-foreground">
                    {concept.code}
                </span>
            </nav>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-lg font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {concept.code}
                            </code>
                            <button
                                onClick={() => copy(concept.code)}
                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                title="Copy code"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {concept.source}
                            </Badge>
                            {!concept.is_leaf && (
                                <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                                    Parent concept
                                </Badge>
                            )}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight">
                            {concept.title}
                        </h1>
                        {concept.definition && (
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                {concept.definition}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        Synced <RelativeTime iso={concept.synced_at} />
                    </span>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatTile
                    label="Children"
                    value={children.length.toString()}
                    sub={hasChildren ? 'Sub-concepts' : 'Leaf concept'}
                    icon={Layers}
                    tint={hasChildren ? 'blue' : 'slate'}
                />
                <StatTile
                    label="Parents"
                    value={parents.length.toString()}
                    sub={parents.length > 0 ? 'Hierarchy' : 'Root level'}
                    icon={Network}
                    tint={parents.length > 0 ? 'amber' : 'slate'}
                />
                <StatTile
                    label="Synonyms"
                    value={concept.synonyms.length.toString()}
                    sub="Alternate names"
                    icon={Tag}
                    tint={concept.synonyms.length > 0 ? 'emerald' : 'slate'}
                />
                <StatTile
                    label="Mappings"
                    value={mappings.length.toString()}
                    sub="Relationships"
                    icon={Activity}
                    tint={mappings.length > 0 ? 'emerald' : 'slate'}
                />
            </div>

            {/* Hierarchy */}
            {parents.length > 0 && (
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Classification path
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Where this concept sits in the hierarchy
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <Network className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                            {parents.map((p, i) => (
                                <div
                                    key={p.code}
                                    className="flex items-center gap-2"
                                >
                                    <Link
                                        href={`/admin/terminology/${concept.source}/${encodeURIComponent(p.code)}`}
                                        className="group rounded-lg border bg-card px-3 py-1.5 text-xs transition hover:border-primary/40 hover:bg-muted/40"
                                    >
                                        <code className="block font-mono text-[10px] text-muted-foreground">
                                            {p.code}
                                        </code>
                                        <span className="block text-sm font-medium group-hover:text-primary">
                                            {p.title}
                                        </span>
                                    </Link>
                                    {i < parents.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            ))}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <code className="block font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                                    {concept.code}
                                </code>
                                <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                    {concept.title}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Chapter info */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Classification
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    ICD-11 chapter and block
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Hash className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {concept.chapter_title && (
                            <Row
                                label="Chapter"
                                value={
                                    <div className="text-right">
                                        <div className="font-mono text-[10px] text-muted-foreground">
                                            {concept.chapter_code}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {concept.chapter_title}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        {concept.block_title && (
                            <Row
                                label="Block"
                                value={
                                    <div className="text-right">
                                        <div className="font-mono text-[10px] text-muted-foreground">
                                            {concept.block_code}
                                        </div>
                                        <div className="text-sm font-medium">
                                            {concept.block_title}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <Row
                            label="Parent"
                            value={
                                concept.parent_code ? (
                                    <Link
                                        href={`/admin/terminology/${concept.source}/${encodeURIComponent(concept.parent_code)}`}
                                        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                                    >
                                        {concept.parent_code}
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        Root concept
                                    </span>
                                )
                            }
                        />
                        <Row
                            label="Leaf"
                            value={
                                concept.is_leaf ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Yes
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        No — has children
                                    </span>
                                )
                            }
                        />
                    </CardContent>
                </Card>

                {/* Synonyms */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Synonyms
                                </CardTitle>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Alternate names and common expressions
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Tag className="h-4 w-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {concept.synonyms.length === 0 ? (
                            <p className="py-4 text-center text-xs text-muted-foreground">
                                No synonyms recorded.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {concept.synonyms.map((s) => (
                                    <span
                                        key={s}
                                        className="rounded-full bg-muted px-2.5 py-1 text-xs"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Children */}
            {hasChildren && (
                <Card className="mt-6 overflow-hidden p-0">
                    <div className="flex items-center justify-between border-b px-5 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Children ({children.length})
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                Sub-concepts of {concept.code}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                            {children.length} items
                        </Badge>
                    </div>
                    <div className="divide-y">
                        {children.map((c) => (
                            <Link
                                key={c.id}
                                href={`/admin/terminology/${c.source}/${encodeURIComponent(c.code)}`}
                                className="group flex items-center gap-4 px-5 py-3 transition hover:bg-muted/40"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    <Layers className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                                            {c.code}
                                        </code>
                                        <span className="truncate text-sm font-medium group-hover:text-primary">
                                            {c.title}
                                        </span>
                                    </div>
                                    {c.block_title && (
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {c.block_title}
                                        </p>
                                    )}
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                            </Link>
                        ))}
                    </div>
                </Card>
            )}

            {/* Child/parent mappings */}
            {(childMappings.length > 0 || parentMappings.length > 0) && (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {parentMappings.length > 0 && (
                        <Card className="overflow-hidden p-0">
                            <div className="border-b px-5 py-3">
                                <h3 className="text-sm font-semibold">
                                    Parent relationships ({parentMappings.length})
                                </h3>
                            </div>
                            <div className="divide-y">
                                {parentMappings.map((m) => (
                                    <MappingRow key={m.id} mapping={m} direction="up" />
                                ))}
                            </div>
                        </Card>
                    )}

                    {childMappings.length > 0 && (
                        <Card className="overflow-hidden p-0">
                            <div className="border-b px-5 py-3">
                                <h3 className="text-sm font-semibold">
                                    Child relationships ({childMappings.length})
                                </h3>
                            </div>
                            <div className="divide-y">
                                {childMappings.map((m) => (
                                    <MappingRow key={m.id} mapping={m} direction="down" />
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Related mappings */}
            {relatedMappings.length > 0 && (
                <Card className="mt-6 overflow-hidden p-0">
                    <div className="border-b px-5 py-3">
                        <h3 className="text-sm font-semibold">
                            Related concepts ({relatedMappings.length})
                        </h3>
                    </div>
                    <div className="divide-y">
                        {relatedMappings.map((m) => (
                            <MappingRow key={m.id} mapping={m} direction="side" />
                        ))}
                    </div>
                </Card>
            )}

            {/* Raw metadata */}
            {Object.keys(concept.raw_data).length > 0 && (
                <Card className="mt-6 overflow-hidden p-0">
                    <div className="border-b px-5 py-3">
                        <h3 className="text-sm font-semibold">
                            Source metadata
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                            Raw fields returned by the source registry
                        </p>
                    </div>
                    <div className="grid gap-2 p-5 sm:grid-cols-2">
                        {Object.entries(concept.raw_data).map(([k, v]) => (
                            <div
                                key={k}
                                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-xs"
                            >
                                <span className="text-muted-foreground capitalize">
                                    {k.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium">
                                    {String(v)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-between">
                <Button variant="outline" asChild>
                    <Link href="/admin/terminology">
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Back to terminology
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        router.visit(
                            `/admin/terminology?source=${concept.source}&q=${encodeURIComponent(concept.code)}`,
                        )
                    }
                >
                    <Package className="mr-1.5 h-4 w-4" />
                    Show all {concept.source}
                </Button>
            </div>
        </>
    );
}

function MappingRow({
    mapping,
    direction,
}: {
    mapping: Mapping;
    direction: 'up' | 'down' | 'side';
}) {
    const tint =
        direction === 'up'
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
            : direction === 'down'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';

    const Icon = direction === 'up' ? ArrowLeft : direction === 'down' ? ArrowRight : Sparkles;

    return (
        <Link
            href={`/admin/terminology/${mapping.to_source}/${encodeURIComponent(mapping.to_code)}`}
            className="group flex items-center gap-3 px-5 py-3 transition hover:bg-muted/40"
        >
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}
            >
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        {mapping.to_code}
                    </code>
                    <span className="text-[10px] text-muted-foreground">
                        {mapping.to_source}
                    </span>
                </div>
                {mapping.to_title && (
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                        {mapping.to_title}
                    </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                    {mapping.map_type.replace(/-/g, ' ')}
                </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </Link>
    );
}

function Row({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-2.5 last:border-b-0 last:pb-0">
            <span className="shrink-0 text-xs text-muted-foreground">
                {label}
            </span>
            <div className="text-right">{value}</div>
        </div>
    );
}

function StatTile({
    label,
    value,
    sub,
    icon: Icon,
    tint,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: any;
    tint: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
}) {
    const tints: Record<string, string> = {
        emerald:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        slate: 'bg-muted text-muted-foreground',
    };

    return (
        <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    {label}
                </p>
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${tints[tint]}`}
                >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
                {value}
            </p>
            {sub && (
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                    {sub}
                </p>
            )}
        </Card>
    );
}