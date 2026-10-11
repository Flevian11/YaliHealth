import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-svh bg-background text-foreground">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
        </div>
    );
}