import * as React from 'react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { resolveLinkAttributes } from '@/config/site';
import type { SiteNavigationItem } from '@/lib/site-data';
import { isCurrentPath } from '@/utils/urls';

type MobileNavigationSheetProps = {
  activeShellPathname: string;
  items: SiteNavigationItem[];
  onNavigate: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  siteTitle: string;
};

export default function MobileNavigationSheet({
  activeShellPathname,
  items,
  onNavigate,
  onOpenChange,
  open,
  siteTitle,
}: MobileNavigationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="top-[var(--header-height)] bottom-auto h-[calc(100dvh-var(--header-height))] w-[min(92vw,320px)] border-l border-border/80 bg-background/95 pt-6"
      >
        <div className="flex h-full flex-col gap-6">
          <SheetHeader>
            <SheetTitle className="font-display text-3xl tracking-[0.1em] uppercase">Menu</SheetTitle>
            <SheetDescription className="text-xs tracking-[0.16em] uppercase">{siteTitle}</SheetDescription>
          </SheetHeader>

          <nav className="grid gap-1" aria-label="Mobile" data-app-shell-mobile-navigation>
            {items.map((item) => {
              const navigationIsActive = activeShellPathname ? isCurrentPath(activeShellPathname, item.url) : false;
              const linkAttributes = resolveLinkAttributes(item.url);
              const isServicesNavigationItem = item.url === '/services/';
              const isStoreNavigationItem = item.url === '/store/';

              return (
                <a
                  key={item.id}
                  href={linkAttributes.href}
                  target={linkAttributes.target}
                  rel={linkAttributes.rel}
                  data-astro-prefetch={linkAttributes.shouldPrefetch ? true : undefined}
                  aria-current={navigationIsActive ? 'page' : undefined}
                  data-services-navigation-link={isServicesNavigationItem ? 'true' : undefined}
                  data-store-navigation-link={isStoreNavigationItem ? 'true' : undefined}
                  className={[
                    'relative inline-flex min-h-11 items-center border-b border-border/70 py-1 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors',
                    isStoreNavigationItem
                      ? 'border-l-2 border-l-[var(--store-accent-active)] pl-3 text-[var(--store-accent-active)] hover:text-[var(--store-accent-hover)]'
                      : isServicesNavigationItem
                        ? navigationIsActive
                          ? 'border-l-2 border-l-[var(--services-accent-active)] pl-3 text-[var(--services-accent-active)]'
                          : 'text-foreground/90 hover:text-[var(--services-accent-hover)]'
                        : navigationIsActive
                          ? 'border-l-2 border-l-foreground/85 pl-3 text-foreground'
                          : 'text-foreground/90 hover:text-foreground',
                  ].join(' ')}
                  onClick={onNavigate}
                >
                  {item.title}
                </a>
              );
            })}
          </nav>

          <button
            className="mt-auto w-full text-[11px] tracking-[0.18em] uppercase text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onNavigate}
          >
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
