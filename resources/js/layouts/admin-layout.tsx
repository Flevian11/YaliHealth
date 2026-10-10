import { Button } from '@/components/ui/button';
import { Link, router, usePage } from '@inertiajs/react';
import { Building2, LayoutDashboard, LogOut, Plus } from 'lucide-react';
import { ReactNode } from 'react';

const nav = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();

    return (
        <div className="min-h-svh bg-background">
            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-8">
                        <div>
                            <div className="text-sm font-semibold">YaliHealth</div>
                            <div className="text-xs text-muted-foreground">Super Admin</div>
                        </div>
                        <nav className="flex items-center gap-1">
                            {nav.map((item) => {
                                const active =
                                    item.href === '/'
                                        ? url === '/'
                                        : url.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                                            active
                                                ? 'bg-muted font-medium'
                                                : 'text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" asChild>
                            <Link href="/admin/hospitals/create">
                                <Plus className="h-4 w-4" />
                                New Hospital
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.post('/admin/logout')}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
    );
}