import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Flag,
    HeartPulse,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    Network,
    Palette,
    Plug,
    Search,
    Settings,
    ShieldCheck,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

type NavItem = {
    label: string;
    href?: string;
    icon: any;
    soon?: boolean;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Tenants',
        items: [
            { label: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
            { label: 'Onboarding', icon: UserPlus, soon: true },
            { label: 'Subscription Plans', icon: CreditCard, soon: true },
            { label: 'Feature Flags', icon: Flag, soon: true },
        ],
    },
    {
        label: 'Platform',
        items: [
            { label: 'Super Admins', icon: Users, soon: true },
            { label: 'Roles & Permissions', icon: ShieldCheck, soon: true },
            { label: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
            { label: 'API Health', icon: Plug, soon: true },
        ],
    },
    {
        label: 'HIE Integration',
        items: [
            { label: 'Tenant Connections', icon: Network, soon: true },
            { label: 'Terminology', icon: HeartPulse, soon: true },
            { label: 'Reference Data', icon: ShieldCheck, soon: true },
        ],
    },
    {
        label: 'System',
        items: [
            { label: 'Theme', href: '/admin/theme', icon: Palette },
            { label: 'Announcements', icon: Megaphone, soon: true },
            { label: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

type UserShape = { name: string; email: string } | undefined;

function SidebarNav({
    collapsed = false,
    url,
    onNavigate,
}: {
    collapsed?: boolean;
    url: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
                <div key={group.label} className="mb-6">
                    {!collapsed && (
                        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                            {group.label}
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {group.items.map((item) => {
                            const active =
                                item.href &&
                                (item.href === '/'
                                    ? url === '/'
                                    : url.startsWith(item.href));

                            if (item.soon) {
                                return (
                                    <div
                                        key={item.label}
                                        title={collapsed ? item.label : undefined}
                                        className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/60 ${
                                            collapsed ? 'justify-center' : ''
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 truncate">
                                                    {item.label}
                                                </span>
                                                <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                    Soon
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href!}
                                    onClick={onNavigate}
                                    title={collapsed ? item.label : undefined}
                                    className={`relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
                                        active
                                            ? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    } ${collapsed ? 'justify-center' : ''}`}
                                >
                                    {active && !collapsed && (
                                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
                                    )}
                                    <item.icon
                                        className={`h-4 w-4 shrink-0 ${
                                            active ? 'text-emerald-600 dark:text-emerald-400' : ''
                                        }`}
                                    />
                                    {!collapsed && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}

function UserFooter({
    user,
    collapsed = false,
}: {
    user: UserShape;
    collapsed?: boolean;
}) {
    if (!user) return null;

    if (collapsed) {
        return (
            <div className="shrink-0 border-t p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex w-full justify-center rounded-lg p-2 transition hover:bg-muted">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-600 text-[10px] font-semibold text-white">
                                {initials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="w-56">
                        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => router.post('/admin/logout')}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className="shrink-0 border-t p-3">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition hover:bg-muted">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-emerald-600 text-[11px] font-semibold text-white">
                            {initials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{user.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                            {user.email}
                        </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56">
                    <DropdownMenuLabel>My account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/admin/profile">
                            <User className="mr-2 h-4 w-4" /> Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/admin/settings">
                            <Settings className="mr-2 h-4 w-4" /> Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => router.post('/admin/logout')}
                        className="text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<{
        theme?: { brand: string };
        auth?: { user?: { name: string; email: string } };
    }>();

    const brand = props.theme?.brand ?? 'YaliHealth';
    const user = props.auth?.user;

    const isMobile = useIsMobile();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('admin.sidebar.collapsed');
        if (saved === '1') setCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem('admin.sidebar.collapsed', next ? '1' : '0');
            return next;
        });
    };

    return (
        <div className="flex min-h-svh bg-muted/40">
            {!isMobile && (
                <aside
                    className={`sticky top-0 flex h-svh shrink-0 flex-col border-r bg-card transition-[width] duration-200 ${
                        collapsed ? 'w-[72px]' : 'w-[260px]'
                    }`}
                >
                    <div className="flex h-16 shrink-0 items-center justify-between border-b px-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <img
                                src="/images/logo.png"
                                alt={brand}
                                className="h-9 w-9 shrink-0 object-contain"
                            />
                            {!collapsed && (
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold leading-tight">
                                        {brand}
                                    </div>
                                    <div className="truncate text-[11px] text-muted-foreground">
                                        Super Admin
                                    </div>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Collapse sidebar"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {collapsed && (
                        <div className="flex shrink-0 justify-center border-b py-2">
                            <button
                                onClick={toggleCollapse}
                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Expand sidebar"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <SidebarNav collapsed={collapsed} url={url} />
                    <UserFooter user={user} collapsed={collapsed} />
                </aside>
            )}

            {isMobile && (
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="w-[280px] p-0">
                        <SheetHeader className="border-b px-4 py-3 text-left">
                            <SheetTitle className="flex items-center gap-2.5">
                                <img
                                    src="/images/logo.png"
                                    alt={brand}
                                    className="h-8 w-8 shrink-0 object-contain"
                                />
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold leading-tight">
                                        {brand}
                                    </div>
                                    <div className="truncate text-[11px] font-normal text-muted-foreground">
                                        Super Admin
                                    </div>
                                </div>
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex h-[calc(100svh-64px)] flex-col">
                            <SidebarNav
                                url={url}
                                onNavigate={() => setMobileOpen(false)}
                            />
                            <UserFooter user={user} />
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-6">
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileOpen(true)}
                            className="h-9 w-9 shrink-0"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="relative max-w-md flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-muted">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-emerald-600 text-[11px] font-semibold text-white">
                                                {initials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="text-sm font-medium">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {user.email}
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/profile">
                                            <User className="mr-2 h-4 w-4" /> Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => router.post('/admin/logout')}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}