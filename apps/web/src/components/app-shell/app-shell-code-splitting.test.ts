import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';
import { connectShellSurfaceIntent, createShellSurfaceLoader, warmShellSurface } from './view/shell-surface-loader';

const source = readFileSync(fileURLToPath(new URL('./AppShellRoot.tsx', import.meta.url)), 'utf8');
const portalSource = readFileSync(fileURLToPath(new URL('./view/ShellPortalOutlets.tsx', import.meta.url)), 'utf8');

describe('app shell startup closure', () => {
  it.each(['pointerover', 'pointerdown', 'focusin'])('warms both cart modules on Store card %s', async (eventType) => {
    const selector = /const STORE_CART_INTENT_SELECTOR =\s*'([^']+)'/.exec(source)?.[1];
    expect(selector).toBeDefined();
    expect(source).toContain(
      '{ selector: STORE_CART_INTENT_SELECTOR, warm: () => warmShellSurface(storeCartDrawerSurface) }',
    );
    expect(source).toMatch(
      /const storeCartDrawerSurface = createShellSurfaceLoader\(\(\) =>\s*Promise\.all\(\[\s*import\('@\/components\/store\/cart\/StoreCartDrawer'\),\s*import\('@\/components\/store\/checkout\/DeliverySummary'\)/,
    );
    const drawer = vi.fn(async () => ({}));
    const summary = vi.fn(async () => ({}));
    const surface = createShellSurfaceLoader(() => Promise.all([drawer(), summary()]));
    const listeners = new Map<string, EventListener>();
    const disconnect = connectShellSurfaceIntent(
      {
        addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
        removeEventListener: (type: string) => listeners.delete(type),
      } as never,
      [{ selector: selector!, warm: () => warmShellSurface(surface) }],
    );
    expect(drawer).not.toHaveBeenCalled();
    expect(summary).not.toHaveBeenCalled();
    const card = {
      closest: (value: string) =>
        value.split(',').some((part) => part.trim() === '[data-store-card-buy]') ? card : null,
    };
    const event = { target: card } as unknown as Event;
    listeners.get(eventType)!(event);
    listeners.get(eventType)!(event);
    await surface.load();
    expect(drawer).toHaveBeenCalledTimes(1);
    expect(summary).toHaveBeenCalledTimes(1);
    disconnect();
    expect(listeners.size).toBe(0);
  });

  it('keeps dormant presentation behind direct intent-owned imports', () => {
    for (const [loaderName, modulePath] of [
      ['mobileNavigationSheetSurface', './view/MobileNavigationSheet'],
      ['shellOverlayPanelSurface', './view/ShellOverlayPanel'],
      ['shellPlayerSurface', './view/ShellPlayerSurface'],
      ['storeCartDrawerSurface', '@/components/store/cart/StoreCartDrawer'],
    ]) {
      expect(source).toContain(`const ${loaderName} = createShellSurfaceLoader(`);
      expect(source).toContain(`import('${modulePath}')`);
    }
    expect(source).toContain("import('@/components/store/checkout/DeliverySummary')");
    // Opening a surface never suspends: React reveals a Suspense fallback no sooner than 300 ms later.
    expect(source).not.toMatch(/\bSuspense\b/);
    expect(source).not.toMatch(/\blazy\(/);

    expect(source).toContain('connectShellDocumentEventRouting');
    expect(source).toContain('openShellSectionNavigation');
    expect(source).toContain('normalizeAppPathname(initialPathname)');
    expect(source).toContain(
      "setStoreCartHeaderContainer(document.querySelector<HTMLElement>('[data-store-cart-header-root]'))",
    );
    expect(source).toContain('.catch(() =>');
    expect(portalSource).toContain('storeCartBridgeFailed ?');
    expect(portalSource).toContain('Cart is unavailable.');

    for (const moduleName of ['ArtistsRosterFilters', 'StoreDistroSearch', 'ServicesInquiryForm', 'StoreCartButton']) {
      expect(portalSource).toContain(`const ${moduleName} = React.lazy(`);
    }
    expect(source).toContain(
      "activeShellPathname === '/store/distro/' ? '[data-distro-search]' : '[data-store-search]'",
    );
    expect(source).toContain("const preloadStoreDistroSearch = () => import('@/components/store/StoreDistroSearch')");
    expect(source.match(/preloadStoreDistroSearch\(\)/g)).toHaveLength(2);
    expect(source).toContain(
      "if (kind !== 'store') return undefined;\n    void preloadStoreDistroSearch().catch(() => undefined);",
    );
    expect(source).toContain('parseShellSectionRoute(new URL(href, window.location.href).pathname)');
    expect(source).not.toContain("document.readyState === 'complete'");
    expect(source).not.toContain("window.addEventListener('load', connect");
    expect(source).toContain('targetPathname: activeShellPathname');
    expect(source).toContain("parseShellSectionRoute(activeShellPathname)?.kind !== 'store'");
    expect(source).toContain('getPreparedStoreListingPriceReader');
    expect(source).toContain('readPublicStoreListingPrices');
    expect(source).toContain('connectStoreListingPricePresentation({');
    expect(portalSource).toContain('role="status"');
    expect(portalSource).toContain('role="alert"');
  });
});
