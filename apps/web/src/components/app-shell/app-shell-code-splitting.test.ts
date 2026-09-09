import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./AppShellRoot.tsx', import.meta.url)), 'utf8');
const portalSource = readFileSync(fileURLToPath(new URL('./view/ShellPortalOutlets.tsx', import.meta.url)), 'utf8');

describe('app shell startup closure', () => {
  it('keeps dormant presentation behind direct intent-owned imports', () => {
    for (const moduleName of ['MobileNavigationSheet', 'StoreCartDrawer', 'ShellOverlayPanel', 'ShellPlayerSurface']) {
      expect(source).toContain(`const ${moduleName} = lazy(`);
    }

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
    expect(source).toContain("document.querySelector<HTMLElement>('[data-distro-search]')");
    expect(source).toContain("const preloadStoreDistroSearch = () => import('@/components/store/StoreDistroSearch')");
    expect(source.match(/preloadStoreDistroSearch\(\)/g)).toHaveLength(2);
    expect(source).toContain("if (pathname === '/store/distro/')");
    expect(source).toContain('parseShellSectionRoute(new URL(href, window.location.href).pathname)');
    expect(source).toContain("route?.pathname === '/store/distro/'");
    expect(source).not.toContain("document.readyState === 'complete'");
    expect(source).not.toContain("window.addEventListener('load', connect");
    expect(source).toContain("activeShellPathname !== '/store/distro/'");
    expect(source).toContain("targetPathname: '/store/distro/'");
    expect(source).toContain("parseShellSectionRoute(activeShellPathname)?.kind !== 'store'");
    expect(source).toContain('getPreparedStoreListingPriceReader');
    expect(source).toContain('readPublicStoreListingPrices');
    expect(source).toContain('connectStoreListingPricePresentation({');
    expect(portalSource).toContain('role="status"');
    expect(portalSource).toContain('role="alert"');
  });
});
