import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import MarketingLayout from '@/layouts/marketing-layout';
import SettingsLayout from '@/layouts/settings/layout';
import TenantLayout from '@/layouts/tenant-layout';

const appName = import.meta.env.VITE_APP_NAME || 'YaliHealth';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return MarketingLayout;
            case name.startsWith('marketing/'):
                return MarketingLayout;

            case name === 'admin/Login':
                return null;
            case name.startsWith('admin/'):
                return AdminLayout;

            case name === 'auth/redirecting':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;

            case name.startsWith('settings/'):
                return [TenantLayout, SettingsLayout];

            case name.startsWith('tenant/'):
                return TenantLayout;

            default:
                return TenantLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();