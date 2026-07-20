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
    expect(source).toContain(
      "if (typeof window === 'undefined') return;\n\n    let disconnect: (() => void) | undefined;",
    );
    expect(source).not.toContain(
      "if (activeShellPathname !== '/store/distro/') {\n      setDistroSearchContainer(null);\n      return;\n    }\n\n    let disconnect: (() => void) | undefined;\n    let cancelled",
    );
    expect(source).toContain('.catch(() =>');
    expect(portalSource).toContain('storeCartBridgeFailed ?');
    expect(portalSource).toContain('Cart is unavailable.');

    for (const moduleName of ['ArtistsRosterFilters', 'StoreDistroSearch', 'ServicesInquiryForm', 'StoreCartButton']) {
      expect(portalSource).toContain(`const ${moduleName} = React.lazy(`);
    }
    expect(source).toContain("document.querySelector<HTMLElement>('[data-distro-search]')");
    expect(source).toContain(
      "if (activeShellPathname !== '/store/distro/') {\n      setDistroSearchContainer(null);\n      return;\n    }\n\n    let disconnect: (() => void) | undefined;\n    const connect = () =>",
    );
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
