import { AppearanceWidget } from '@/components/appearance-widget';
import { NotificationsPopover } from '@/components/notifications-popover';
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
import { useTenantPermissions } from '@/hooks/use-tenant-permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BedDouble,
    Building2,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Coins,
    CreditCard,
    FileText,
    FlaskConical,
    HeartPulse,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    Network,
    Pill,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    User,
    UserCog,
    Users,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

type NavItem = {
    label: string;
    href?: string;
    icon: any;
    soon?: boolean;
    permission?: string;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
        ],
    },
    {
        label: 'Clinical',
        items: [
            {
                label: 'Patients',
                href: '/patients',
                icon: Users,
                permission: 'patients.view',
            },
            {
                label: 'Visits',
                href: '/visits',
                icon: ClipboardList,
                permission: 'visits.view',
            },
            {
                label: 'Appointments',
                icon: CalendarClock,
                soon: true,
                permission: 'appointments.view',
            },
            {
                label: 'Encounters',
                icon: Stethoscope,
                soon: true,
                permission: 'encounters.view',
            },
            {
                label: 'Prescriptions',
                icon: Pill,
                soon: true,
                permission: 'prescriptions.view',
            },
            {
                label: 'Lab Orders',
                icon: FlaskConical,
                soon: true,
                permission: 'lab_orders.view',
            },
            {
                label: 'Wards & Beds',
                icon: BedDouble,
                soon: true,
                permission: 'wards.view',
            },
        ],
    },
    {
        label: 'HIE Integration',
        items: [
            {
                label: 'Registries',
                icon: Network,
                soon: true,
                permission: 'hie.registries.read',
            },
            {
                label: 'SHA Eligibility',
                icon: ShieldCheck,
                soon: true,
                permission: 'hie.eligibility.read',
            },
            {
                label: 'Consent',
                icon: HeartPulse,
                soon: true,
                permission: 'hie.consent.write',
            },
            {
                label: 'Claims & Preauths',
                icon: FileText,
                soon: true,
                permission: 'hie.claims.view',
            },
            {
                label: 'Shared Health Records',
                icon: ClipboardList,
                soon: true,
                permission: 'hie.shr.read',
            },
            {
                label: 'Terminology',
                icon: Sparkles,
                soon: true,
                permission: 'hie.registries.read',
            },
        ],
    },
    {
        label: 'Finance',
        items: [
            {
                label: 'Invoices',
                icon: CreditCard,
                soon: true,
                permission: 'invoices.view',
            },
            {
                label: 'Remittances',
                icon: Coins,
                soon: true,
                permission: 'remittances.view',
            },
            {
                label: 'Reports',
                icon: Activity,
                soon: true,
                permission: 'reports.view',
            },
        ],
    },
    {
        label: 'Administration',
        items: [
            {
                label: 'Staff & Users',
                href: '/staff',
                icon: UserCog,
                permission: 'staff.manage',
            },
            {
                label: 'HIE Credentials',
                icon: KeyRound,
                soon: true,
                permission: 'hie.credentials',
            },
            {
                label: 'Facility Settings',
                icon: Building2,
                soon: true,
                permission: 'facility.manage',
            },
            {
                label: 'Announcements',
                icon: Megaphone,
                href: '/announcements',
                permission: 'announcements.view',
            },
            {
                label: 'Settings',
                href: '/settings',
                icon: Settings,
            },
        ],
    },
];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
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
    const { can } = useTenantPermissions();

    // Filter nav items by permission
    const visibleGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.permission || can(item.permission),
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            {visibleGroups.map((group) => (
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
                                        title={
                                            collapsed ? item.label : undefined
                                        }
                                        className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/60 ${collapsed ? 'justify-center' : ''
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
                                    className={`relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${active
                                            ? 'bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        } ${collapsed ? 'justify-center' : ''}`}
                                >
                                    {active && !collapsed && (
                                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
                                    )}
                                    <item.icon
                                        className={`h-4 w-4 shrink-0 ${active
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : ''
                                            }`}
                                    />
                                    {!collapsed && (
                                        <span className="truncate">
                                            {item.label}
                                        </span>
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
    hospitalName,
    roleLabel,
    collapsed = false,
}: {
    user: UserShape;
    hospitalName: string;
    roleLabel: string;
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
                    <DropdownMenuContent
                        align="start"
                        side="top"
                        className="w-56"
                    >
                        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => router.post('/logout')}
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
                        <div className="truncate text-xs font-semibold">
                            {user.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                            {roleLabel}
                        </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56">
                    <DropdownMenuLabel>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-[11px] font-normal text-muted-foreground">
                            {hospitalName} · {roleLabel}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/settings/profile">
                            <User className="mr-2 h-4 w-4" /> Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings/security">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Security
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => router.post('/logout')}
                        className="text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default function TenantLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<{
        theme?: { brand: string };
        auth?: { user?: { name: string; email: string } };
        hospital?: { id: string; name: string };
        tenant_role?: string;
        flash?: { success?: string; error?: string };
    }>();

    const brand = props.theme?.brand ?? 'YaliHealth';
    const user = props.auth?.user;
    const hospitalName = props.hospital?.name ?? 'Hospital';
    const roleLabel = roleLabelFor(props.tenant_role);

    const isMobile = useIsMobile();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [flashDismissed, setFlashDismissed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('tenant.sidebar.collapsed');
        if (saved === '1') setCollapsed(true);
    }, []);

    useEffect(() => {
        setFlashDismissed(false);
    }, [props.flash]);

    const toggleCollapse = () => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem('tenant.sidebar.collapsed', next ? '1' : '0');
            return next;
        });
    };

    return (
        <div className="flex min-h-svh bg-muted/40">
            {!isMobile && (
                <aside
                    className={`sticky top-0 flex h-svh shrink-0 flex-col border-r bg-card transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-[260px]'
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
                                        {hospitalName}
                                    </div>
                                    <div className="truncate text-[11px] text-muted-foreground">
                                        {brand}
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
                    <UserFooter
                        user={user}
                        hospitalName={hospitalName}
                        roleLabel={roleLabel}
                        collapsed={collapsed}
                    />
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
                                        {hospitalName}
                                    </div>
                                    <div className="truncate text-[11px] font-normal text-muted-foreground">
                                        {brand}
                                    </div>
                                </div>
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex h-[calc(100svh-64px)] flex-col">
                            <SidebarNav
                                url={url}
                                onNavigate={() => setMobileOpen(false)}
                            />
                            <UserFooter
                                user={user}
                                hospitalName={hospitalName}
                                roleLabel={roleLabel}
                            />
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
                            placeholder="Search patients, appointments..."
                            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                        <NotificationsPopover />
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
                                        <Link href="/settings/profile">
                                            <User className="mr-2 h-4 w-4" />{' '}
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => router.post('/logout')}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />{' '}
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    {props.flash?.success && !flashDismissed && (
                        <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="flex-1">
                                {props.flash.success}
                            </span>
                            <button
                                onClick={() => setFlashDismissed(true)}
                                className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {props.flash?.error && !flashDismissed && (
                        <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="flex-1">
                                {props.flash.error}
                            </span>
                            <button
                                onClick={() => setFlashDismissed(true)}
                                className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <AppearanceWidget />
        </div>
    );
}

function roleLabelFor(role?: string): string {
    return (
        {
            hospital_admin: 'Hospital Administrator',
            doctor: 'Doctor',
            nurse: 'Nurse',
            receptionist: 'Receptionist',
            billing: 'Billing Officer',
        }[role ?? ''] ?? 'Staff'
    );
}