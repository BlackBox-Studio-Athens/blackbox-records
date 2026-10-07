import { expect, test as base, type Page } from 'playwright/test';

import { attachSmokePageDiagnostics } from '../scripts/smoke-browser';
import type { RepresentativePaths } from '../scripts/smoke-core';

/** Published detail pages in the committed Local content; hosted smokes discover theirs instead. */
export const localRepresentativePaths: RepresentativePaths = {
  artist: '/artists/chronoboros/',
  news: '/news/lorem-ipsum/',
  release: '/releases/disintegration/',
  storeItem: '/store/disintegration-black-vinyl-lp/',
};

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
// Chromium reports the socket itself; Vite's client then logs its own connect and error-relay failures.
const devServerHotReloadSocket =
  /^(WebSocket connection to 'ws:\/\/|\[vite\] failed to connect to websocket|Failed to send error to Vite server)/;
// Firefox logs a font download that a resize or navigation cancelled (NS_BINDING_ABORTED, 0x804B0002) as an error;
// a missing or broken font reports another status and still fails.
const firefoxCancelledFont = /downloadable font: download failed .*status=2152398850 /;

export const test = base.extend({
  page: async ({ page }, use) => {
    // Keep runs off the external network. The actual faces are self-hosted in fonts.css;
    // an empty Google stylesheet prevents duplicate gstatic requests without replacing those faces.
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    // Production builds (the full stack's snapshot) also load the analytics script.
    await page.route('https://www.glancelytics.com/**', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: '' }),
    );
    // Local has no Cloudflare country endpoint; country-specific tests override this default Greek response.
    await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=GR\n' }));
    // The harness runs without the Worker: stub the Store reads (listing prices, item offer, cart delivery quote)
    // so every serving mode behaves alike.
    await page.route(/\/api\/store\/listing-prices(?:\?.*)?$/, (route) => route.fulfill({ json: [] }));
    await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote: null } }));
    await page.route(/\/api\/store\/items\/[^/?]+$/, (route) => {
      const slug = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
      return route.fulfill({ json: readyOffer(slug) });
    });
    const diagnostics = attachSmokePageDiagnostics(page);
    await use(page);
    diagnostics.dispose();
    expect(diagnostics.pageErrors, 'page errors').toEqual([]);
    const consoleErrors = diagnostics.consoleErrors.filter(
      (message) => !devServerHotReloadSocket.test(message) && !firefoxCancelledFont.test(message),
    );
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

/**
 * Clicks a shell surface trigger and reports whether the surface committed before the next task. A surface rendered
 * through React.lazy inside a Suspense boundary created on open appears no sooner than React's 300 ms fallback
 * throttle, even with its chunk cached; a warmed shell surface commits with the click itself.
 */
export async function openSurfaceWithinClickTask(page: Page, triggerSelector: string, surfaceSelector: string) {
  return page.evaluate(
    async ([trigger, surface]) => {
      document.querySelector<HTMLElement>(trigger)?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return {
        loadingStatus: [...document.querySelectorAll('[role="status"]')].some((element) =>
          /^Loading (menu|cart|detail)$/.test(element.textContent?.trim() ?? ''),
        ),
        visible: document.querySelector(surface) !== null,
      };
    },
    [triggerSelector, surfaceSelector] as const,
  );
}

/**
 * Starts watching for a speculative surface load before navigation. The returned wait resolves once a request whose
 * URL contains `moduleName` has been made and the network has then stayed quiet, so the module graph has loaded.
 * `waitForLoadState('networkidle')` cannot serve here: it resolves at once when the page was already idle earlier.
 */
export function watchSurfaceWarmup(page: Page, moduleName: string, quietMs = 500) {
  const inflight = new Set<unknown>();
  let requested = false;
  let lastChange = Date.now();
  page.on('request', (request) => {
    inflight.add(request);
    lastChange = Date.now();
    if (request.url().includes(moduleName)) requested = true;
  });
  const settle = (request: unknown) => {
    inflight.delete(request);
    lastChange = Date.now();
  };
  page.on('requestfinished', settle);
  page.on('requestfailed', settle);

  return async (timeout = 30_000) => {
    const deadline = Date.now() + timeout;
    while (!requested || inflight.size > 0 || Date.now() - lastChange < quietMs) {
      if (Date.now() > deadline) {
        throw new Error(
          `${moduleName} was ${requested ? 'requested but the network never settled' : 'never requested'}`,
        );
      }
      await page.waitForTimeout(50);
    }
  };
}
