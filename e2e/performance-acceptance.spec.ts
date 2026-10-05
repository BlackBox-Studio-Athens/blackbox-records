import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Page, TestInfo } from 'playwright/test';

import { expect, localRepresentativePaths, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

const evidenceRoot = '.codex-artifacts/performance-resume/acceptance';
const galleryPath = 'store/dead-flag-blues-traumatique-cd/';
const profiles = [
  { width: 390, height: 844, dpr: 2 },
  { width: 390, height: 844, dpr: 3 },
  { width: 1440, height: 900, dpr: 1 },
];
const imageRoutes = [
  {
    route: 'releases/',
    selectors: ['[data-release-role="lead"] img', '[data-release-role="catalog"] img'],
  },
  { route: localRepresentativePaths.release.slice(1), selectors: ['.release-detail-cover__image'] },
  { route: 'news/', selectors: ['.news-card__image'] },
  { route: localRepresentativePaths.news.slice(1), selectors: ['.news-detail-lead__image'] },
  { route: localRepresentativePaths.artist.slice(1), selectors: ['.artist-detail-hero__image'] },
  { route: 'store/', selectors: ['.store-item-card__image'] },
  { route: 'store/distro/', selectors: ['.store-item-card__image'] },
  { route: localRepresentativePaths.storeItem.slice(1), selectors: ['.store-item-detail__image'] },
  {
    route: galleryPath,
    selectors: [
      '[data-store-gallery-live] .store-image-gallery__image',
      '[data-store-gallery-live] .store-image-gallery__thumbnail img',
    ],
  },
];

function save(name: string, value: unknown) {
  mkdirSync(evidenceRoot, { recursive: true });
  writeFileSync(path.join(evidenceRoot, `${name}.json`), JSON.stringify(value, null, 2));
}

function fingerprint() {
  const files = [
    'e2e/performance-acceptance.spec.ts',
    'e2e/fixtures.ts',
    'playwright.config.ts',
    'apps/web/src/components/store/StoreImageGallery.tsx',
    'apps/web/src/components/store/store-image-gallery.css',
    'apps/web/src/components/store/StoreItemCard.astro',
    'apps/web/src/components/store/StoreListingPricePresentation.ts',
    'apps/web/src/components/app-shell/store-listing-price-activation.ts',
    'apps/web/src/components/app-shell/store-cart/store-cart-bridge.ts',
    'apps/web/src/components/app-shell/AppShellRoot.tsx',
    'apps/web/src/components/app-shell/view/ShellOverlayPanel.tsx',
    'apps/web/src/components/app-shell/navigation/shell-page-snapshot.ts',
    'apps/web/src/layouts/StoreListingPricePrefetch.astro',
    'apps/web/src/styles/global.css',
    'apps/web/src/platform/lib/editorial-image.ts',
    ...imageRoutes.map(({ route }) => `apps/web/dist/${route}index.html`),
    ...readdirSync('apps/web/dist/_astro')
      .filter((file) =>
        /^(AppShellRoot|ShellOverlayPanel|StoreImageGallery|store-cart\.|store-cart-bridge\.)/.test(file),
      )
      .map((file) => `apps/web/dist/_astro/${file}`),
  ];
  const hashes = Object.fromEntries(
    [...new Set(files)].sort().map((file) => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]),
  );
  return {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
    sha256: createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),
    hashes,
  };
}

// The existing fixture mocks commerce reads. Additional browser contexts need the same local-only policy.
async function isolate(context: BrowserContext, baseURL: string) {
  const allowed = new URL(baseURL).origin;
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(baseURL).hostname);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/api/store/listing-prices')) return route.fulfill({ json: [] });
    if (url.pathname.endsWith('/api/store/delivery-quote')) return route.fulfill({ json: { quote: null } });
    if (/\/api\/store\/items\/[^/]+$/.test(url.pathname)) {
      const slug = url.pathname.split('/').pop()!;
      return route.fulfill({
        json: {
          storeItemSlug: slug,
          variantId: `${slug}_standard`,
          availability: { label: 'In stock', status: 'available' },
          canCheckout: true,
          catalogStatus: 'ready',
          price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
        },
      });
    }
    if (url.origin === allowed) return route.continue();
    return route.fulfill({
      contentType:
        request.resourceType() === 'stylesheet'
          ? 'text/css'
          : request.resourceType() === 'script'
            ? 'text/javascript'
            : 'text/html',
      body: request.resourceType() === 'document' ? '<button>Player fixture</button>' : '',
    });
  });
}

async function instrument(page: Page) {
  await page.addInitScript(() => {
    type Evidence = {
      hydration: number | null;
      fetches: { url: string; start: number; cache: string; pathname: string; hydrated: boolean }[];
    };
    const evidence: Evidence = { hydration: null, fetches: [] };
    (window as unknown as { __acceptance: Evidence }).__acceptance = evidence;
    const hydrated = () => document.querySelector('astro-island[component-url*="AppShellRoot"]:not([ssr])') !== null;
    new MutationObserver(() => {
      if (evidence.hydration === null && hydrated()) evidence.hydration = performance.now();
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['ssr'] });
    const original = window.fetch;
    window.fetch = function (input, init) {
      evidence.fetches.push({
        url: input instanceof Request ? input.url : String(input),
        start: performance.now(),
        cache: init?.cache ?? (input instanceof Request ? input.cache : 'default'),
        pathname: location.pathname,
        hydrated: hydrated(),
      });
      return original.call(this, input, init);
    };
  });
}

async function timeline(page: Page) {
  return page.evaluate(() => {
    const evidence = (
      window as unknown as {
        __acceptance: {
          hydration: number | null;
          fetches: { url: string; start: number; cache: string; pathname: string; hydrated: boolean }[];
        };
      }
    ).__acceptance;
    return {
      ...evidence,
      now: performance.now(),
      resources: performance
        .getEntriesByType('resource')
        .map((entry) => ({ name: entry.name, start: entry.startTime, duration: entry.duration })),
    };
  });
}

test.beforeAll(() => save('fingerprint-before', fingerprint()));
test.afterAll(() => save('fingerprint-after', fingerprint()));
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  save(`failure-${testInfo.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 120)}`, {
    title: testInfo.title,
    status: testInfo.status,
    errors: testInfo.errors,
    url: page.url(),
    galleries: await page
      .locator('[data-store-image-gallery]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          live: node.querySelectorAll('[data-store-gallery-live]').length,
          fallbackHidden: node.querySelector<HTMLElement>('[data-store-gallery-fallback]')?.hidden,
          status: node.querySelector('[data-store-gallery-live] [role="status"]')?.textContent,
        })),
      )
      .catch(() => []),
  });
});
test.beforeEach(async ({ page, baseURL }) => {
  await isolate(page.context(), baseURL!);
});

test('empty Home defers the cart parser until its first cart event', async ({ page }) => {
  const scripts: { url: string; start: number }[] = [];
  const scriptBodies: { url: string; sha256: string; containsZod: boolean }[] = [];
  const bodyTasks: Promise<void>[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() !== 'script') return;
    bodyTasks.push(
      response.body().then((body) => {
        const source = body.toString('utf8');
        scriptBodies.push({
          url: response.url(),
          sha256: createHash('sha256').update(body).digest('hex'),
          containsZod: source.includes('ZodError') || source.includes('ZodType'),
        });
      }),
    );
  });
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push({ url: request.url(), start: Date.now() });
  });
  await instrument(page);
  await page.goto('./');
  await waitForShell(page);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Include idle warming before the first cart event.
  await Promise.all(bodyTasks);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  const parser = (url: string) => /\/store-cart\.[^/]+\.js(?:\?|$)/.test(url);
  const before = scripts.slice();
  const beforeBodies = scriptBodies.slice();
  const beforeTimeline = await timeline(page);
  expect(before.filter(({ url }) => parser(url))).toEqual([]);
  expect(before.filter(({ url }) => /(?:\/zod[./-]|\/zod\/)/i.test(url))).toEqual([]);
  expect(beforeBodies.length).toBeGreaterThan(0);
  expect(
    beforeBodies.filter(({ containsZod }) => containsZod),
    'Home script bodies contain no bundled Zod',
  ).toEqual([]);
  const eventAt = Date.now();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('blackbox:store-cart:open-requested')));
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await Promise.all(bodyTasks);
  const loaded = scripts.filter(({ url }) => parser(url));
  save('cart-demand-load', {
    before,
    beforeBodies,
    beforeTimeline,
    eventAt,
    after: scripts,
    afterBodies: scriptBodies,
    afterTimeline: await timeline(page),
    parserAssetContainsValidation: readdirSync('apps/web/dist/_astro')
      .filter((file) => /^store-cart\..*\.js$/.test(file))
      .map((file) => ({ file, safeParse: readFileSync(`apps/web/dist/_astro/${file}`, 'utf8').includes('safeParse') })),
  });
  expect(loaded).toHaveLength(1);
  const validationBodies = scriptBodies.filter(({ containsZod }) => containsZod);
  expect(validationBodies.length, 'cart demand-loading fetches Zod, including shared chunks').toBeGreaterThan(0);
  for (const body of validationBodies) {
    expect(scripts.find(({ url }) => url === body.url)?.start).toBeGreaterThanOrEqual(eventAt);
  }
  expect(loaded[0].start).toBeGreaterThanOrEqual(eventAt);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeHidden();
});

test('one timed listing-price read for direct, shell and cached activations', async ({ page }) => {
  await instrument(page);
  let activation = 0;
  const offers: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/store/items/')) offers.push(request.url());
  });
  await page.route('**/api/store/listing-prices', (route) =>
    route.fulfill({
      json: [
        {
          storeItemSlug: 'dead-flag-blues-traumatique-cd',
          displayPrice: `€${++activation}.00`,
          presentationState: 'ready',
          availabilityState: 'stocked',
          lowStockQuantity: null,
        },
      ],
    }),
  );
  await page.goto('store/distro/');
  await waitForShell(page);
  const price = page.locator('[data-store-listing-price][data-store-item-slug="dead-flag-blues-traumatique-cd"]');
  await expect(price).toHaveText('€1.00');
  await page.waitForLoadState('networkidle');
  await plantSentinel(page);
  const direct = await timeline(page);
  const reads = (value: typeof direct) => value.fetches.filter(({ url }) => url.includes('/api/store/listing-prices'));
  expect(reads(direct)).toHaveLength(1);
  expect(reads(direct)[0].start).toBeLessThan(direct.hydration!);
  expect(reads(direct)[0].hydrated).toBe(false);

  const categories = page.getByRole('navigation', { name: 'Store categories' });
  const shellStart = await page.evaluate(() => performance.now());
  await categories.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(price).toHaveText('€2.00');
  await page.waitForLoadState('networkidle');
  const shell = await timeline(page);
  expect(reads(shell)).toHaveLength(2);
  const html = shell.fetches.find(
    ({ url, start }) => start >= shellStart && new URL(url, page.url()).pathname.endsWith('/store/'),
  );
  expect(html, 'shell activation fetched Store HTML').toBeTruthy();
  expect(reads(shell)[1].start).toBeGreaterThanOrEqual(shellStart);
  expect(reads(shell)[1].start).toBeLessThanOrEqual(html!.start + 100);

  const cachedStart = await page.evaluate(() => performance.now());
  await categories.getByRole('link', { name: 'Distro', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/distro\/$/);
  await expect(price).toHaveText('€3.00');
  await page.waitForLoadState('networkidle');
  const cached = await timeline(page);
  save('listing-activation', { direct, shellStart, shell, cachedStart, cached, offers });
  expect(reads(cached)).toHaveLength(3);
  expect(reads(cached).every(({ cache }) => cache === 'no-store')).toBe(true);
  expect(
    cached.fetches.filter(
      ({ url, start }) => start >= cachedStart && new URL(url, page.url()).pathname.endsWith('/store/distro/'),
    ),
  ).toEqual([]);
  expect(offers).toEqual([]);
  expect(await sentinelIntact(page)).toBe(true);
});

for (const width of [390, 1440]) {
  test(`gallery keyboard, thumbnails, pointer gestures and cached restoration at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(galleryPath);
    await waitForShell(page);
    await plantSentinel(page);
    const live = page.locator('[data-store-gallery-live]');
    const status = live.getByRole('status');
    const stage = live.locator('.store-image-gallery__stage');
    const thumbs = live.getByRole('button', { name: /^Show image/ });
    await expect(live).toHaveCount(1);
    const count = await thumbs.count();
    expect(count).toBeGreaterThan(1);
    const observations: unknown[] = [];
    async function selected(index: number, action: string) {
      await expect(status).toHaveText(`${index + 1} / ${count}`);
      await expect(thumbs.nth(index)).toHaveAttribute('aria-pressed', 'true');
      await expect(live.locator('.store-image-gallery__previous')).toHaveCount(0);
      const image = live.locator('.store-image-gallery__image');
      await expect
        .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
        .toBe(true);
      observations.push({
        action,
        index,
        image: await image.evaluate((node: HTMLImageElement) => ({
          currentSrc: node.currentSrc,
          alt: node.alt,
          waiting: node.hasAttribute('data-waiting'),
        })),
      });
      save(`gallery-${width}`, { width, count, observations });
    }
    await selected(0, 'initial');
    await expect(live.getByRole('button', { name: 'Previous image' })).toBeDisabled();
    await stage.focus();
    await page.keyboard.press('ArrowRight');
    await selected(1, 'keyboard right');
    await page.keyboard.press('Alt+ArrowLeft');
    await selected(1, 'modified key ignored');
    await page.keyboard.press('ArrowLeft');
    await selected(0, 'keyboard left');
    await page.keyboard.press('ArrowLeft');
    await selected(0, 'left boundary');
    await thumbs.last().click();
    await selected(count - 1, 'last thumbnail');
    await expect(live.getByRole('button', { name: 'Next image' })).toBeDisabled();
    await thumbs.first().click();
    await selected(0, 'first thumbnail');

    async function swipe(dx: number, dy: number) {
      await stage.scrollIntoViewIfNeeded();
      const box = (await stage.boundingBox())!;
      const x = box.x + box.width * 0.65,
        y = box.y + box.height * 0.5;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps: 8 });
      await page.mouse.up();
    }
    await swipe(-80, 5);
    await selected(1, 'horizontal pointer swipe');
    await swipe(5, -80);
    await selected(1, 'vertical pointer ignored');
    await swipe(25, 0);
    await selected(1, 'short pointer ignored');
    await swipe(80, 5);
    await selected(0, 'reverse pointer swipe');
    if (width === 390) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      const box = (await stage.boundingBox())!;
      const x = box.x + box.width * 0.7,
        y = box.y + Math.min(box.height * 0.5, 150);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step++)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * 12, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await selected(1, 'native horizontal touch');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await selected(1, 'touch cancellation');
      await cdp.detach();
    }
    await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
    await expect(page).toHaveURL(/\/blackbox-records\/$/);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${galleryPath}$`));
    await expect(live).toHaveCount(1);
    await selected(0, 'history cached reset');
    await stage.focus();
    await page.keyboard.press('ArrowRight');
    await selected(1, 'cached keyboard');
    expect(await sentinelIntact(page)).toBe(true);
    save(`gallery-${width}`, { width, count, observations });
  });
}

test('local release gallery overlay remounts without replacing the playing iframe or card link', async ({ page }) => {
  // Committed release content has no gallery. Exercise its supported portal with the real Store SSR placeholder.
  const overlayFixture = await page.evaluate(
    ([overlayHtml, galleryHtml]) => {
      const parser = new DOMParser();
      const fragment = parser
        .parseFromString(overlayHtml, 'text/html')
        .querySelector('[data-app-shell-overlay-fragment]')!;
      const gallery = parser
        .parseFromString(galleryHtml, 'text/html')
        .querySelector<HTMLElement>('[data-store-image-gallery]')!;
      const props = JSON.parse(gallery.dataset.storeImageGallery!);
      props.priority = false;
      gallery.dataset.storeImageGallery = JSON.stringify(props);
      fragment.append(gallery);
      return fragment.outerHTML;
    },
    [
      readFileSync('apps/web/dist/app-shell-overlay/releases/disintegration/index.html', 'utf8'),
      readFileSync(`apps/web/dist/${galleryPath}index.html`, 'utf8'),
    ],
  );
  const overlayRequests: number[] = [];
  await page.route('**/app-shell-overlay/releases/disintegration/', async (route) => {
    overlayRequests.push(Date.now());
    // Ensure the cold panel mounts before this local fragment arrives; cached reopening needs no request.
    await new Promise((resolve) => setTimeout(resolve, 200));
    return route.fulfill({ contentType: 'text/html', body: overlayFixture });
  });
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);
  await page.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  const original = (await iframe.elementHandle())!;
  await page.getByRole('button', { name: 'Minimize player' }).click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Store', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/$/);
  expect(await original.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Releases', exact: true }).click();
  await expect(page).toHaveURL(/\/releases\/$/);
  const link = page.locator('a[href$="/releases/disintegration/"]').first();
  const href = await link.getAttribute('href');
  const loops: unknown[] = [];
  for (let iteration = 0; iteration < 2; iteration++) {
    await link.click();
    const live = page.locator('[data-store-gallery-live]');
    await expect(page.locator('[data-store-image-gallery]')).toHaveCount(1);
    await expect.soft(live, `gallery mounts in overlay loop ${iteration}`).toHaveCount(1, { timeout: 5000 });
    const liveGalleries = await live.count();
    const fallbackHidden = await page
      .locator('[data-store-gallery-fallback]')
      .evaluate((node: HTMLElement) => node.hidden);
    if (liveGalleries === 1) {
      await live.getByRole('button', { name: 'Next image' }).click();
      await expect(live.getByRole('status')).toHaveText('2 / 3');
    }
    expect(await original.evaluate((element) => element.isConnected)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(live).toHaveCount(0);
    await expect(link).toHaveAttribute('href', href!);
    loops.push({
      iteration,
      liveGalleries,
      fallbackHidden,
      overlayRequests: overlayRequests.length,
      galleryClosed: true,
      iframeRetained: await original.evaluate((element) => element.isConnected),
    });
    save('gallery-iframe-loop', {
      fixture: 'local release fragment with real Store gallery placeholder, delayed 200ms',
      overlayRequests,
      loops,
      href,
    });
  }
  expect(await sentinelIntact(page)).toBe(true);
  await page.getByRole('button', { name: 'Open player' }).click();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
  expect(await original.evaluate((element) => element.isConnected)).toBe(true);
  save('gallery-iframe-loop', {
    fixture: 'local release fragment with real Store gallery placeholder',
    loops,
    iterations: 2,
    iframeRetained: true,
    sentinelRetained: true,
    href,
  });
});

test('gallery static fallback keeps artwork and disabled controls before JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await isolate(context, baseURL!);
  try {
    const page = await context.newPage();
    await page.goto(galleryPath);
    const fallback = page.locator('[data-store-gallery-fallback]');
    await expect(fallback).toBeVisible();
    await expect(page.locator('[data-store-gallery-live]')).toHaveCount(0);
    await expect(fallback.getByRole('button', { name: 'Previous image' })).toBeDisabled();
    await expect(fallback.getByRole('button', { name: 'Next image' })).toBeDisabled();
    for (const button of await fallback.getByRole('button', { name: /^Show image/ }).all())
      await expect(button).toBeDisabled();
    const image = fallback.locator('.store-image-gallery__image');
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
    save('gallery-static-fallback', { artworkLoaded: true, liveGalleries: 0, controlsDisabled: true });
  } finally {
    await context.close();
  }
});

for (const profile of profiles)
  for (const route of imageRoutes) {
    test(`responsive ${route.route} at ${profile.width}@${profile.dpr}`, async ({
      browser,
      baseURL,
    }, testInfo: TestInfo) => {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: profile.dpr,
        isMobile: profile.width === 390,
        hasTouch: profile.width === 390,
      });
      await isolate(context, baseURL!);
      if (route.route === 'releases/')
        await context.route('**/api/store/listing-prices*', (request) =>
          request.fulfill({
            json: ['disintegration-black-vinyl-lp', 'caregivers-vinyl'].map((storeItemSlug) => ({
              storeItemSlug,
              presentationState: 'ready',
              availabilityState: 'stocked',
              displayPrice: '€28.00',
              preorder: null,
            })),
          }),
        );
      const page = await context.newPage();
      const bytes = new Map<string, { bytes: number; sha256: string; contentType: string }>();
      const pending: Promise<void>[] = [];
      page.on('response', (response) => {
        if (response.request().resourceType() !== 'image') return;
        pending.push(
          response
            .body()
            .then((body) => {
              bytes.set(response.url(), {
                bytes: body.length,
                sha256: createHash('sha256').update(body).digest('hex'),
                contentType: response.headers()['content-type'] ?? '',
              });
            })
            .catch(() => {}),
        );
      });
      try {
        await page.goto(route.route);
        await waitForShell(page);
        const images: unknown[] = [];
        for (const selector of route.selectors) {
          const image = page.locator(selector).first();
          await expect(image).toBeVisible();
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
            .toBe(true);
          // Let layout and responsive selection settle after scrolling a lazy card into view.
          await page.waitForTimeout(100);
          const picked = await image.evaluate((node: HTMLImageElement) => {
            const box = node.getBoundingClientRect(),
              style = getComputedStyle(node);
            const candidates = [...node.srcset.matchAll(/(\S+)\s+(\d+)w/g)].map((match) => ({
              url: new URL(match[1], location.href).href,
              width: Number(match[2]),
            }));
            const selected = candidates.find(({ url }) => url === node.currentSrc);
            const width = box.width,
              height = box.height;
            const intrinsicWidth = Number(node.getAttribute('width')) || node.naturalWidth;
            const intrinsicHeight = Number(node.getAttribute('height')) || node.naturalHeight;
            const paintedWidth =
              style.objectFit === 'contain' ? Math.min(width, (height * intrinsicWidth) / intrinsicHeight) : width;
            const requiredWidth = paintedWidth * devicePixelRatio;
            const smallestCovering =
              candidates.find(({ width }) => width >= requiredWidth - 1)?.width ?? candidates.at(-1)?.width;
            const slot = node.sizes
              .split(/,(?![^(]*\))/)
              .map((part) => part.trim())
              .find((part) => {
                const match = /^\(([^)]+)\)\s+(.+)$/.exec(part);
                return !match || matchMedia(`(${match[1]})`).matches;
              });
            const length = slot?.replace(/^\([^)]+\)\s+/, '') ?? '';
            const probe = document.createElement('div');
            probe.style.cssText = `position:fixed;visibility:hidden;width:${length};height:0`;
            document.body.append(probe);
            const declaredSlot = probe.getBoundingClientRect().width;
            probe.remove();
            const resource = performance.getEntriesByName(node.currentSrc).at(-1) as
              PerformanceResourceTiming | undefined;
            return {
              currentSrc: node.currentSrc,
              src: node.src,
              srcset: node.srcset,
              sizes: node.sizes,
              dpr: devicePixelRatio,
              viewport: innerWidth,
              width,
              height,
              paintedWidth,
              intrinsicWidth,
              intrinsicHeight,
              requiredWidth,
              declaredSlot,
              objectFit: style.objectFit,
              candidates,
              candidateWidth: selected?.width,
              smallestCovering,
              loading: node.loading,
              fetchPriority: node.fetchPriority,
              timing: resource
                ? {
                    start: resource.startTime,
                    duration: resource.duration,
                    transferSize: resource.transferSize,
                    encodedBodySize: resource.encodedBodySize,
                  }
                : null,
            };
          });
          await Promise.all(pending);
          const body = bytes.get(picked.currentSrc);
          const covering = picked.candidates.find(({ width }) => width === picked.smallestCovering)!;
          expect(new URL(covering.url).origin).toBe(new URL(baseURL!).origin);
          const coveringAsset = readFileSync(
            path.join('apps/web/dist', new URL(covering.url).pathname.replace(new URL(baseURL!).pathname, '')),
          );
          images.push({
            selector,
            ...picked,
            body,
            smallestCoveringAsset: {
              bytes: coveringAsset.length,
              sha256: createHash('sha256').update(coveringAsset).digest('hex'),
              source: 'built local asset, no extra browser request',
            },
          });
          save(
            `${route.route.replace(/\/$/, '').replaceAll('/', '-')}-${profile.width}x${profile.height}@${profile.dpr}`,
            { profile, route: route.route, images },
          );
          expect.soft(picked.candidateWidth, `${selector}: selected srcset candidate`).toBeDefined();
          expect
            .soft(
              picked.candidateWidth,
              `${selector}: smallest candidate covering painted slot (${picked.paintedWidth}px at DPR ${picked.dpr})`,
            )
            .toBe(picked.smallestCovering);
          expect.soft(body?.bytes, `${selector}: measured response body bytes`).toBeGreaterThan(0);
          if (selector.includes('thumbnail'))
            expect.soft(picked.candidates.map(({ width }) => width)).toEqual([144, 216]);
          if (route.route === 'news/') expect.soft(picked.fetchPriority).toBe('high');
        }
        await testInfo.attach('responsive-candidates', {
          body: JSON.stringify({ profile, route: route.route, images }, null, 2),
          contentType: 'application/json',
        });
      } finally {
        await context.close();
      }
    });
  }
