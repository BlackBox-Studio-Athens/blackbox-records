import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { MainNavigation } from '@/lib/site-data';
import { navigationLinkAttributes } from '@/platform/utils/urls';
import { acquireLenisModalLock } from '../lenis-scroll';
import { MOBILE_NAVIGATION_TRIGGER_SELECTOR } from '../navigation/shell-document-click-intent';

type MobileNavigationSheetProps = {
  activeShellPathname: string;
  navigation: MainNavigation;
  onNavigate: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  siteTitle: string;
};

export default function MobileNavigationSheet({
  activeShellPathname,
  navigation,
  onNavigate,
  onOpenChange,
  open,
  siteTitle,
}: MobileNavigationSheetProps) {
  const scrollRootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!open || !scrollRoot) return;
    return acquireLenisModalLock(scrollRoot);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={scrollRootRef}
        data-lenis-scroll-root
        // Radix returns focus only to its own Trigger; the Menu button is rendered by Astro.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.querySelector<HTMLElement>(MOBILE_NAVIGATION_TRIGGER_SELECTOR)?.focus();
        }}
        side="right"
        className="top-[var(--header-height)] bottom-auto h-[calc(100dvh-var(--header-height))] w-[min(92vw,320px)] overflow-y-auto border-l border-border/80 bg-background/95 pt-6"
      >
        <div className="flex h-full flex-col gap-6">
          <SheetHeader>
            <SheetTitle className="font-display text-3xl tracking-[0.1em] uppercase">Menu</SheetTitle>
            <SheetDescription className="text-xs tracking-[0.16em] uppercase">{siteTitle}</SheetDescription>
          </SheetHeader>

          <nav className="grid gap-1" aria-label="Mobile" data-app-shell-mobile-navigation>
            {[navigation.home, ...navigation.sections].map((link) => (
              <a
                key={link.id}
                className="site-nav-link site-nav-link--menu"
                {...navigationLinkAttributes(link.url, activeShellPathname)}
                onClick={onNavigate}
              >
                <span className="site-nav-link__label">{link.title}</span>
              </a>
            ))}
          </nav>

          <Button className="mt-auto min-h-11 w-full" type="button" variant="ghost" onClick={onNavigate}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
