import { expect, test as base, type Page } from 'playwright/test';

import { attachSmokePageDiagnostics } from '../scripts/smoke-browser';

// Minimal ready PublicStoreOffer (apps/backend/openapi/public-openapi.json).
function readyOffer(storeItemSlug: string) {
  return {
    storeItemSlug,
    variantId: `${storeItemSlug}_standard`,
    availability: { label: 'In stock', status: 'available' },
    canCheckout: true,
    catalogStatus: 'ready',
    price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
  };
}

// The site opens no WebSockets; only Vite's hot-reload client does under astro dev, and its failures are not site errors.
const devServerHotReloadSocket = "WebSocket connection to 'ws://";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Keep runs off the external network: SiteLayout loads Google Fonts with display=optional, so an empty stylesheet
    // only changes the typeface and prevents gstatic font requests entirely.
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    // Production builds (the full stack's snapshot) also load the analytics script.
    await page.route('https://www.glancelytics.com/**', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: '' }),
    );
    // The harness runs without the Worker: stub the Store reads (listing prices, item offer, cart delivery quote)
    // so every serving mode behaves alike.
    await page.route('**/api/store/listing-prices', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote: null } }));
    await page.route(/\/api\/store\/items\/[^/?]+$/, (route) => {
      const slug = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
      return route.fulfill({ json: readyOffer(slug) });
    });
    const diagnostics = attachSmokePageDiagnostics(page);
    await use(page);
    diagnostics.dispose();
    expect(diagnostics.pageErrors, 'page errors').toEqual([]);
    const consoleErrors = diagnostics.consoleErrors.filter((message) => !message.startsWith(devServerHotReloadSocket));
    expect(consoleErrors, 'console errors').toEqual([]);
  },
});

export { expect };

/** Waits until an Astro island has hydrated; Astro removes its `ssr` attribute afterwards. */
export async function waitForIsland(page: Page, component: string): Promise<void> {
  await page.waitForFunction(
    (name) => document.querySelector(`astro-island[component-url*="${name}"]:not([ssr])`) !== null,
    component,
  );
}

/** Waits until the persistent shell island has hydrated (scripts/measure-runtime-performance.ts). */
export async function waitForShell(page: Page): Promise<void> {
  await waitForIsland(page, 'AppShellRoot');
}

/** Marks the current document so a later check can prove no full reload happened. */
export async function plantSentinel(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __e2eSentinel?: boolean }).__e2eSentinel = true;
  });
}

export async function sentinelIntact(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __e2eSentinel?: boolean }).__e2eSentinel === true);
}
