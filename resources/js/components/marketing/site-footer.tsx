import { Link, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

function FooterCol({
    title,
    links,
}: {
    title: string;
    links: { href: string; label: string }[];
}) {
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">
                {title}
            </h4>
            <ul className="mt-3 space-y-2">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link
                            href={link.href}
                            className="text-xs text-muted-foreground transition hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function SiteFooter() {
    const { props } = usePage<{ theme?: { brand: string } }>();
    const brand = props.theme?.brand ?? 'YaliHealth';

    return (
        <footer className="border-t bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/logo.png"
                                alt={brand}
                                className="h-8 w-8 object-contain"
                            />
                            <span className="text-sm font-semibold">
                                {brand}
                            </span>
                        </div>
                        <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                            Multi-tenant hospital management, connected to
                            Kenya's Health Information Exchange. Built to DHA
                            and ODPC standards.
                        </p>
                    </div>

                    <FooterCol
                        title="Product"
                        links={[
                            { href: '/#features', label: 'Features' },
                            { href: '/#hie', label: 'HIE Integration' },
                            { href: '/#pricing', label: 'Pricing' },
                            { href: '/#security', label: 'Security' },
                        ]}
                    />
                    <FooterCol
                        title="Company"
                        links={[
                            { href: '/careers', label: 'Careers' },
                            { href: '/blog', label: 'Blog' },
                            { href: '/contact', label: 'Contact' },
                            { href: '/#', label: 'About' },
                        ]}
                    />
                    <FooterCol
                        title="Legal"
                        links={[
                            { href: '/terms', label: 'Terms of Service' },
                            { href: '/privacy', label: 'Privacy Policy' },
                            { href: '/gdpr', label: 'Data Protection' },
                        ]}
                    />
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {brand}. All rights
                        reserved.
                    </p>
                    <p className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ODPC registered · DHA certified
                    </p>
                </div>
            </div>
        </footer>
    );
}