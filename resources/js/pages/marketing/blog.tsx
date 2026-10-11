import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Clock,
    Mail,
    Search,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type PostBlock =
    | { type: 'paragraph'; content: string }
    | { type: 'heading'; level: number; content: string }
    | { type: 'list'; items: string[] }
    | { type: 'quote'; content: string; source?: string }
    | { type: 'callout'; variant: 'info' | 'warning' | 'success'; title: string; content: string }
    | { type: 'code'; language: string; content: string }
    | { type: 'image'; src: string; caption?: string; alt?: string }
    | { type: 'video'; src: string; caption?: string }
    | { type: 'table'; headers: string[]; rows: string[][] };

type Post = {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    tags?: string[];
    author: string;
    author_role?: string;
    read_minutes: number;
    published_at: string;
    featured?: boolean;
    cover_image?: string;
    cover_video?: string;
    body?: PostBlock[];
};

const CATEGORY_COLORS: Record<string, string> = {
    Engineering: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    Product: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    Design: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    Compliance: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    'Case Study': 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    Announcement: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
};

function categoryTint(name: string): string {
    return CATEGORY_COLORS[name] ?? 'bg-muted text-muted-foreground';
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function Blog({
    posts,
    categories,
    newsletterEmail,
    post,
}: {
    posts: Post[];
    categories: string[];
    newsletterEmail: string;
    post?: Post;
}) {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    if (post) {
        return <PostDetail post={post} brand={brand} />;
    }

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');

    const filtered = useMemo(() => {
        let result = posts;
        if (category) result = result.filter((p) => p.category === category);
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.excerpt.toLowerCase().includes(q) ||
                    p.author.toLowerCase().includes(q) ||
                    (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
            );
        }
        return result;
    }, [posts, query, category]);

    const featured = posts.find((p) => p.featured);
    const rest = filtered.filter((p) => !p.featured || category || query);
    const isEmpty = posts.length === 0;

    return (
        <>
            <Head title="Blog" />

            <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <img src="/images/dashboard-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.10] via-transparent to-teal-500/[0.10]" />
                </div>

                <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <BookOpen className="h-3 w-3" />
                        The {brand} Blog
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
                        Notes from the frontier of{' '}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            digital health
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        Engineering deep-dives, compliance updates, product
                        releases, and stories from hospitals we work with.
                    </p>
                </div>
            </section>

            <section className="border-t pb-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {isEmpty ? (
                        <EmptyState newsletterEmail={newsletterEmail} brand={brand} />
                    ) : (
                        <>
                            {featured && !category && !query && (
                                <div className="py-10">
                                    <FeaturedPost post={featured} />
                                </div>
                            )}

                            <div className="flex flex-col gap-4 border-t py-6 lg:flex-row lg:items-center">
                                <div className="relative max-w-md flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search posts..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="h-11 w-full rounded-xl border bg-card pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                    {query && (
                                        <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setCategory('')} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${category === '' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-foreground/30'}`}>
                                        All
                                    </button>
                                    {categories.map((c) => (
                                        <button key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-foreground/30'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {rest.length > 0 && (
                                <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {rest.map((p) => (
                                        <PostCard key={p.slug} post={p} />
                                    ))}
                                </div>
                            )}

                            {rest.length === 0 && (query || category) && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Search className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold">No posts match</h3>
                                    <Button variant="outline" size="sm" className="mt-5" onClick={() => { setQuery(''); setCategory(''); }}>
                                        Clear filters
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <section className="border-t bg-muted/30 py-20">
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Mail className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Stay in the loop</h2>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        One email a month. Engineering notes, compliance updates, and what we're shipping.
                    </p>
                    <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md gap-2">
                        <input type="email" placeholder="you@hospital.co.ke" className="h-11 flex-1 rounded-xl border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Subscribe</Button>
                    </form>
                </div>
            </section>
        </>
    );
}

function PostDetail({ post, brand }: { post: Post; brand: string }) {
    const blocks = post.body ?? [];

    return (
        <>
            <Head title={post.title} />

            <article className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
                <Link href="/blog" className="mb-8 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3 w-3" />
                    Back to blog
                </Link>

                <header>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryTint(post.category)}`}>
                            {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(post.published_at)}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {post.read_minutes} min read
                        </span>
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
                        {post.title}
                    </h1>

                    <div className="mt-6 flex items-center gap-3 border-b pb-8">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {post.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{post.author}</p>
                            {post.author_role && <p className="text-xs text-muted-foreground">{post.author_role}</p>}
                        </div>
                    </div>
                </header>

                {post.cover_video && (
                    <div className="mt-8 aspect-video overflow-hidden rounded-2xl border">
                        <iframe
                            src={post.cover_video}
                            title={post.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                {!post.cover_video && post.cover_image && (
                    <div className="mt-8 overflow-hidden rounded-2xl border">
                        <img src={post.cover_image} alt={post.title} className="w-full object-cover" />
                    </div>
                )}

                <div className="mt-10 space-y-6">
                    {blocks.map((block, i) => (
                        <Block key={i} block={block} />
                    ))}
                </div>

                {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 flex flex-wrap gap-2 border-t pt-6">
                        {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center text-white">
                    <h3 className="text-xl font-bold">Building an HMIS for Kenya?</h3>
                    <p className="mt-2 text-sm text-emerald-50/90">
                        We'd love to talk. Get in touch and we'll show you how {brand} handles HIE integration.
                    </p>
                    <Button asChild className="mt-4 bg-white text-emerald-700 hover:bg-emerald-50">
                        <Link href="/contact">Talk to us</Link>
                    </Button>
                </div>
            </article>
        </>
    );
}

function Block({ block }: { block: PostBlock }) {
    switch (block.type) {
        case 'paragraph':
            return <p className="text-base leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: formatInline(block.content) }} />;

        case 'heading':
            return block.level === 2 ? (
                <h2 className="mt-10 text-2xl font-bold tracking-tight">{block.content}</h2>
            ) : (
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{block.content}</h3>
            );

        case 'list':
            return (
                <ul className="space-y-2 pl-6">
                    {block.items.map((item, i) => (
                        <li key={i} className="list-disc text-base leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                    ))}
                </ul>
            );

        case 'quote':
            return (
                <blockquote className="border-l-4 border-emerald-500 pl-6">
                    <p className="text-lg italic leading-relaxed text-foreground/90">{block.content}</p>
                    {block.source && <footer className="mt-2 text-sm text-muted-foreground">— {block.source}</footer>}
                </blockquote>
            );

        case 'callout':
            return (
                <div className={`rounded-2xl border-l-4 p-5 ${block.variant === 'warning' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20' : block.variant === 'success' ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
                    <p className="text-sm font-semibold">{block.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: formatInline(block.content) }} />
                </div>
            );

        case 'code':
            return (
                <div className="overflow-x-auto rounded-2xl border bg-slate-950 p-5">
                    <pre className="text-xs leading-relaxed text-slate-100">
                        <code>{block.content}</code>
                    </pre>
                </div>
            );

        case 'image':
            return (
                <figure className="my-8">
                    <div className="overflow-hidden rounded-2xl border">
                        <img src={block.src} alt={block.alt ?? ''} className="w-full object-cover" />
                    </div>
                    {block.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>}
                </figure>
            );

        case 'video':
            return (
                <figure className="my-8">
                    <div className="aspect-video overflow-hidden rounded-2xl border">
                        <iframe src={block.src} title={block.caption ?? 'Video'} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                    {block.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>}
                </figure>
            );

        case 'table':
            return (
                <div className="my-8 overflow-x-auto rounded-2xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                {block.headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {block.rows.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-3 text-sm">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        default:
            return null;
    }
}

function formatInline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-emerald-600 underline">$1</a>');
}

function EmptyState({ newsletterEmail, brand }: { newsletterEmail: string; brand: string }) {
    return (
        <div className="pt-16 pb-8">
            <div className="mx-auto max-w-2xl">
                <div className="relative overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
                    </div>
                    <div className="relative">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                            <BookOpen className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">No posts yet</h2>
                        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                            We're working on our first stories from the field. Subscribe to be notified when the first one goes live.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                                <a href={`mailto:${newsletterEmail}`}>
                                    <Mail className="mr-1.5 h-4 w-4" />
                                    Notify me
                                </a>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/contact">Contact us</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeaturedPost({ post }: { post: Post }) {
    return (
        <Link href={`/blog/${post.slug}`} className="group block">
            <Card className="overflow-hidden p-0 transition hover:border-emerald-300 hover:shadow-xl dark:hover:border-emerald-800">
                <div className="grid gap-0 md:grid-cols-2">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 md:aspect-auto">
                        {post.cover_image ? (
                            <img src={post.cover_image} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="h-16 w-16 text-white/30" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute left-6 top-6">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                                <Sparkles className="h-3 w-3" />
                                Featured
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between p-6 sm:p-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryTint(post.category)}`}>
                                    {post.category}
                                </span>
                                <span className="text-[11px] text-muted-foreground">{formatDate(post.published_at)}</span>
                            </div>
                            <h3 className="mt-4 text-2xl font-bold tracking-tight leading-snug transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {post.title}
                            </h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {post.author.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-medium">{post.author}</p>
                                    {post.author_role && <p className="text-[10px] text-muted-foreground">{post.author_role}</p>}
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {post.read_minutes} min
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

function PostCard({ post }: { post: Post }) {
    return (
        <Link href={`/blog/${post.slug}`} className="group block h-full">
            <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-800">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-500/90 via-emerald-600/90 to-teal-700/90">
                    {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-white/40" />
                        </div>
                    )}
                    <div className="absolute left-4 top-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryTint(post.category)}`}>
                            {post.category}
                        </span>
                    </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between border-t pt-4 text-[11px] text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {post.author.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate font-medium">{post.author}</span>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.read_minutes}m
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}