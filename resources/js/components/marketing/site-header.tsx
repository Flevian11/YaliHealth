import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV = [
    { href: '/#features', label: 'Features' },
    { href: '/#hie', label: 'HIE Integration' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#security', label: 'Security' },
    { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
                scrolled
                    ? 'border-b bg-background/85 backdrop-blur-md'
                    : 'border-b border-transparent'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2.5">
                    <img
                        src="/images/logo.png"
                        alt={brand}
                        className="h-8 w-8 object-contain"
                    />
                    <span className="text-sm font-semibold tracking-tight">
                        {brand}
                    </span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {NAV.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="hidden sm:inline-flex"
                    >
                        <Link href="/login">Sign in</Link>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    >
                        <Link href="/get-started">
                            Get started
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <button
                        onClick={() => setMobileOpen((o) => !o)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Menu className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="border-t bg-background md:hidden">
                    <div className="flex flex-col gap-1 px-4 py-3">
                        {NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}