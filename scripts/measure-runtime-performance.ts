import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { chromium, type BrowserContext, type CDPSession, type Page, type Request } from 'playwright';

import {
  assertTraversalSetup,
  countStoreActivationRequests,
  extractStoreActivationMilestones,
  storeActivationRejectionReasons,
  summarize,
  summarizeStoreActivationRuns,
  summarizeTrace,
  type TraceEvent,
} from './runtime-performance-helpers';

type Profile =
  | 'desktop-distro-disclosure'
  | 'desktop-load'
  | 'desktop-store-activation'
  | 'legacy-scroll'
  | 'mobile-distro-disclosure'
  | 'mobile-load'
  | 'mobile-scroll'
  | 'mobile-store-activation'
  | 'wide-scroll';

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=') || 'true'];
  }),
);
const profile = (args.get('profile') ?? 'desktop-load') as Profile;
const baseUrl = args.get('base-url') ?? 'http://127.0.0.1:4321/blackbox-records/';
const routes = (args.get('routes') ?? 'home,store,store/distro').split(/[,\s]+/);
const runs = Number(args.get('runs') ?? (profile.startsWith('desktop-') ? 5 : 3));
const output = args.get('output') ?? `.codex-artifacts/runtime-performance/${Date.now()}-${profile}.json`;
const blockThirdPartyAnalytics = args.get('block-third-party-analytics') === 'true';
const expectedStoreCardCount = Number(args.get('store-card-count') ?? 104);
const productEnvironment = args.get('product-environment') ?? 'Local';
const traversalMode = args.get('traversal-mode') ?? 'preview';
if (!['preview', 'catalog'].includes(traversalMode)) throw new Error('Unknown traversal mode.');
const catalogGroup = Number(args.get('catalog-group') ?? 0);
if (!Number.isInteger(catalogGroup) || catalogGroup < 0) throw new Error('Invalid catalog group index.');
const buildDirectory = args.get('build-directory') ?? 'apps/web/dist';
const buildMode = args.get('build-mode') ?? 'production-static';
const STORE_ACTIVATION_TIMEOUT_MS = 120_000;

async function measurementTree() {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const files = execFileSync(
    'git',
    [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      'apps',
      'packages',
      'scripts',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const dirtyFiles = execFileSync('git', ['diff', 'HEAD', '--name-only', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  const hashFiles = async (paths: string[]) => {
    const hash = createHash('sha256');
    for (const path of [...new Set(paths)].sort()) {
      hash.update(path).update('\0');
      try {
        hash.update(await readFile(path));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        hash.update('<deleted>');
      }
    }
    return hash.digest('hex');
  };
  const artifacts = (await readdir(buildDirectory, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
  return {
    revision,
    sourceHash: await hashFiles(files),
    buildHash: await hashFiles(artifacts),
    dirtyFiles: await Promise.all(
      dirtyFiles.filter((file) => files.includes(file)).map(async (path) => ({ path, hash: await hashFiles([path]) })),
    ),
  };
}

const profiles = {
  'desktop-distro-disclosure': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'desktop-load': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'desktop-store-activation': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'mobile-load': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'mobile-distro-disclosure': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'wide-scroll': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4, step: 24, frames: 360 },
  'mobile-scroll': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, step: 24, frames: 300 },
  'mobile-store-activation': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'legacy-scroll': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, cpu: 4, step: 48, frames: 240 },
} as const;

async function readTrace(cdp: CDPSession) {
  const complete = new Promise<string>((resolve) =>
    cdp.once('Tracing.tracingComplete', ({ stream }: { stream: string }) => resolve(stream)),
  );
  await cdp.send('Tracing.end');
  const stream = await complete;
  let json = '';
  for (;;) {
    const chunk = (await cdp.send('IO.read', { handle: stream })) as { data: string; eof: boolean };
    json += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  return (JSON.parse(json) as { traceEvents: TraceEvent[] }).traceEvents;
}

async function configure(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page);
  const settings = profiles[profile];
  if (settings.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: settings.cpu });
  if (blockThirdPartyAnalytics) {
    await cdp.send('Network.enable');
    await cdp.send('Network.setBlockedURLs', { urls: ['https://www.glancelytics.com/*'] });
  }
  if ('network' in settings) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...settings.network });
  }
  await page.addInitScript(() => {
    const measurements = {
      cls: 0,
      lcp: null as null | Record<string, unknown>,
      longTasks: [] as number[],
      loafs: [] as number[],
      longTaskEntries: [] as Array<{ startTime: number; duration: number }>,
      loafEntries: [] as Array<{ startTime: number; duration: number; scripts?: unknown[] }>,
    };
    Object.assign(window, { __runtimePerformance: measurements });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        measurements.longTasks.push(entry.duration);
        measurements.longTaskEntries.push(entry.toJSON());
      }
    }).observe({ type: 'longtask', buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          measurements.loafs.push(entry.duration);
          measurements.loafEntries.push(entry.toJSON());
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
    }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShift[])
        if (!entry.hadRecentInput) measurements.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1) as LargestContentfulPaint | undefined;
      if (!entry) return;
      measurements.lcp = {
        time: entry.startTime,
        element: entry.element
          ? {
              tag: entry.element.tagName,
              id: entry.element.id,
              className: entry.element.className,
              text: entry.element.textContent?.trim().slice(0, 120),
            }
          : null,
        url: entry.url,
      };
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  return cdp;
}

async function startTrace(cdp: CDPSession) {
  await cdp.send('Tracing.start', {
    categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,loading',
    transferMode: 'ReturnAsStream',
  });
}

async function loadRun(page: Page, cdp: CDPSession, url: string) {
  const responses: Array<{ url: string; status: number; time: number }> = [];
  const start = Date.now();
  page.on('response', (response) =>
    responses.push({ url: response.url(), status: response.status(), time: Date.now() - start }),
  );
  await startTrace(cdp);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const browser = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const measurements = (
      window as unknown as { __runtimePerformance: { cls: number; lcp: unknown; longTasks: number[]; loafs: number[] } }
    ).__runtimePerformance;
    return {
      ttfb: nav.responseStart,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      ...measurements,
      transferBytes: nav.transferSize + resources.reduce((total, resource) => total + resource.transferSize, 0),
      resourceCount: resources.length + 1,
      fonts: resources.filter(
        (resource) => resource.initiatorType === 'css' || /\.(woff2?|ttf)(\?|$)/.test(resource.name),
      ),
      islands: document.querySelectorAll('astro-island').length,
      hydratedIslands: document.querySelectorAll('astro-island:not([ssr])').length,
      priceLabels: [...document.querySelectorAll('[data-store-offer-price]')].map((element) =>
        element.textContent?.trim(),
      ),
    };
  });
  const trace = summarizeTrace(await readTrace(cdp));
  return {
    ...browser,
    trace,
    routeErrors: responses.filter((response) => response.status >= 400),
    storeRequests: responses.filter((response) => /\/api\/(store\/capabilities|store\/offers)/.test(response.url)),
  };
}

type StoreRequestKind = 'listing-projection' | 'per-card-store-offer' | 'store-html';

function classifyStoreRequest(request: Request): StoreRequestKind | null {
  const pathname = new URL(request.url()).pathname;
  if (pathname.endsWith('/api/store/listing-prices')) return 'listing-projection';
  if (/\/api\/store\/items\/[^/]+\/?$/.test(pathname)) return 'per-card-store-offer';
  if (request.resourceType() === 'fetch' && pathname.endsWith('/store/')) return 'store-html';
  return null;
}

async function storeActivationRun(page: Page, cdp: CDPSession, browserVersion: string) {
  const requests: Array<{
    cacheControl?: string | null;
    error?: string | null;
    kind: StoreRequestKind;
    responseMs?: number;
    startMs: number;
    status?: number;
    url: string;
  }> = [];
  const requestsByObject = new Map<Request, (typeof requests)[number]>();
  const responseTasks: Promise<void>[] = [];
  const consoleErrors: string[] = [];
  let clickAt: number | null = null;

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (clickAt === null) return;
    const kind = classifyStoreRequest(request);
    if (!kind) return;
    const record = { kind, startMs: performance.now() - clickAt, url: request.url() };
    requests.push(record);
    requestsByObject.set(request, record);
  });
  page.on('requestfailed', (request) => {
    const record = requestsByObject.get(request);
    if (record) record.error = request.failure()?.errorText ?? 'request failed';
  });
  page.on('response', (response) => {
    const record = requestsByObject.get(response.request());
    if (!record || clickAt === null) return;
    responseTasks.push(
      (async () => {
        record.responseMs = performance.now() - clickAt!;
        record.status = response.status();
        record.cacheControl = await response.headerValue('cache-control');
      })(),
    );
  });

  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await page.goto(routeUrl('home'), { waitUntil: 'load' });
  await page.waitForFunction(
    () => document.querySelector('astro-island[component-url*="AppShellRoot"]:not([ssr])') !== null,
    undefined,
    { timeout: STORE_ACTIVATION_TIMEOUT_MS },
  );
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const storeLink = page.locator('[data-store-navigation-link="true"]').first();
  await storeLink.waitFor({ state: 'attached' });

  clickAt = performance.now();
  const veilClosedAt = page
    .waitForFunction(
      () => document.querySelector('.app-shell-section-transition-veil')?.getAttribute('data-state') !== 'closed',
      undefined,
      { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
    )
    .then(() =>
      page.waitForFunction(
        () => document.querySelector('.app-shell-section-transition-veil')?.getAttribute('data-state') === 'closed',
        undefined,
        { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
      ),
    )
    .then(() => performance.now());
  const storeContentAt = page
    .waitForFunction(
      (expectedCount) =>
        location.pathname.endsWith('/store/') &&
        document.querySelectorAll('[data-store-listing-price]').length === expectedCount,
      expectedStoreCardCount,
      { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
    )
    .then(() => performance.now());
  const pricesSettledAt = page
    .waitForFunction(
      (expectedCount) => {
        const prices = [...document.querySelectorAll('[data-store-listing-price]')];
        return (
          prices.length === expectedCount &&
          prices.every((price) => price.getAttribute('data-store-listing-price-state') !== 'loading')
        );
      },
      expectedStoreCardCount,
      { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
    )
    .then(() => performance.now());

  await storeLink.evaluate((element: HTMLElement) => element.click());
  const [storeContentTimestamp, veilClosedTimestamp, pricesSettledTimestamp] = await Promise.all([
    storeContentAt,
    veilClosedAt,
    pricesSettledAt,
  ]);
  await Promise.all(responseTasks);

  const browserState = await page.evaluate(() => {
    const prices = [...document.querySelectorAll('[data-store-listing-price]')];
    return {
      cardCount: prices.length,
      documentHasFocus: document.hasFocus(),
      settledPriceCount: prices.filter((price) => price.getAttribute('data-store-listing-price-state') !== 'loading')
        .length,
      visibilityState: document.visibilityState,
    };
  });
  const milestones = extractStoreActivationMilestones({
    clickAt,
    pricesSettledAt: pricesSettledTimestamp,
    storeContentAt: storeContentTimestamp,
    veilClosedAt: veilClosedTimestamp,
  });
  const requestCounts = countStoreActivationRequests(requests.map((request) => request.url));
  const storeHtmlRequest = requests.find((request) => request.kind === 'store-html');
  const listingProjectionRequest = requests.find((request) => request.kind === 'listing-projection');

  return {
    ...milestones,
    ...browserState,
    browserVersion,
    consoleErrors,
    listingProjectionRequest,
    rejectionReasons: storeActivationRejectionReasons({
      cardCount: browserState.cardCount,
      expectedCardCount: expectedStoreCardCount,
      storeHtmlRequestStartMs: storeHtmlRequest?.startMs ?? null,
      visibilityState: browserState.visibilityState,
    }),
    requestCounts,
    requests,
    responseToStoreContentMs:
      storeHtmlRequest?.responseMs === undefined
        ? null
        : milestones.clickToStoreContentMs - storeHtmlRequest.responseMs,
    storeHtmlRequest,
    storeRequestErrors: requests.filter((request) => request.error || (request.status ?? 0) >= 400),
  };
}

async function distroDisclosureRun(page: Page, entry: 'direct' | 'shell') {
  let releaseDistroModule = () => undefined;
  const distroModuleGate = new Promise<void>((resolve) => {
    releaseDistroModule = resolve;
  });
  let distroModulePaused = false;

  await page.route('**/*StoreDistroSearch*', async (route) => {
    if (!distroModulePaused) {
      distroModulePaused = true;
      await distroModuleGate;
    }
    await route.continue();
  });

  const distroModuleRequest = page.waitForRequest((request) => request.url().includes('StoreDistroSearch'), {
    timeout: STORE_ACTIVATION_TIMEOUT_MS,
  });
  // Navigation can fail before this promise is awaited; preserve that original error.
  void distroModuleRequest.catch(() => undefined);

  if (entry === 'direct') {
    await page.goto(routeUrl('store/distro'), { waitUntil: 'commit' });
  } else {
    await page.goto(routeUrl('store'), { waitUntil: 'load' });
    await page.waitForFunction(
      () => document.querySelector('astro-island[component-url*="AppShellRoot"]:not([ssr])') !== null,
      undefined,
      { timeout: STORE_ACTIVATION_TIMEOUT_MS },
    );
    const distroLink = page.locator('a[href$="/store/distro/"]').first();
    await distroLink.waitFor({ state: 'attached' });
    await distroLink.evaluate((element: HTMLElement) => element.click());
    await page.waitForFunction(
      () => location.pathname.endsWith('/store/distro/') && document.querySelector('[data-distro-search-root]'),
      undefined,
      { timeout: STORE_ACTIVATION_TIMEOUT_MS },
    );
  }

  const group = page.locator('[data-distro-search-root] [data-store-coverflow-group]').first();
  const toggle = group.locator('[data-store-coverflow-toggle]');
  await toggle.waitFor({ state: 'visible' });

  const controllerReadyBeforeClick = await group.getAttribute('data-store-coverflow-ready');
  const clickAt = performance.now();
  await toggle.evaluate((element: HTMLElement) => element.click());
  const pendingBeforeRelease = await group.getAttribute('data-store-coverflow-pending-disclosure');
  await distroModuleRequest;
  const releaseAt = performance.now();
  releaseDistroModule();

  await page.waitForFunction(
    () => {
      const element = document.querySelector<HTMLElement>('[data-distro-search-root] [data-store-coverflow-group]');
      return element?.hasAttribute('data-store-coverflow-ready') && element.dataset.storeCoverflowMode === 'catalog';
    },
    undefined,
    { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
  );
  const catalogAt = performance.now();
  await page.waitForFunction(
    () => {
      const element = document.querySelector<HTMLElement>('[data-distro-search-root] [data-store-coverflow-group]');
      return (
        element?.dataset.storeCoverflowMode === 'catalog' &&
        !element.hasAttribute('data-store-coverflow-transitioning') &&
        !element.hasAttribute('data-store-coverflow-reveal')
      );
    },
    undefined,
    { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
  );
  const firstRevealCompleteAt = performance.now();

  await toggle.evaluate((element: HTMLElement) => element.click());
  await page.waitForFunction(
    () => {
      const element = document.querySelector<HTMLElement>('[data-store-coverflow-group]');
      return (
        element?.dataset.storeCoverflowMode === 'preview' && !element.hasAttribute('data-store-coverflow-transitioning')
      );
    },
    undefined,
    { polling: 'raf', timeout: STORE_ACTIVATION_TIMEOUT_MS },
  );

  const ready = await page.evaluate(async () => {
    const element = document.querySelector<HTMLElement>('[data-distro-search-root] [data-store-coverflow-group]')!;
    const button = element.querySelector<HTMLButtonElement>('[data-store-coverflow-toggle]')!;
    const measurements = (
      window as unknown as {
        __runtimePerformance: {
          cls: number;
          longTaskEntries: Array<{ startTime: number; duration: number }>;
          loafEntries: Array<{ startTime: number; duration: number }>;
        };
      }
    ).__runtimePerformance;

    const start = performance.now();
    button.click();
    const clickHandlerMs = performance.now() - start;
    const animations = element.querySelector<HTMLElement>('[data-store-coverflow-reveal-mask]')?.getAnimations() ?? [];
    const stateAtNextFrame = await new Promise<{ ariaExpanded: string | null; mode: string | undefined }>((resolve) =>
      requestAnimationFrame(() =>
        resolve({ ariaExpanded: button.getAttribute('aria-expanded'), mode: element.dataset.storeCoverflowMode }),
      ),
    );
    await Promise.allSettled(animations.map((animation) => animation.finished));
    const endedAt = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const longTaskEntries = measurements.longTaskEntries.filter(
      (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > start,
    );
    const loafEntries = measurements.loafEntries.filter(
      (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > start,
    );

    return {
      ariaExpanded: button.getAttribute('aria-expanded'),
      cls: measurements.cls,
      clickHandlerMs,
      startedAt: start,
      endedAt,
      longTaskEntries,
      loafEntries,
      longTasks: longTaskEntries.map((entry) => entry.duration),
      mode: element.dataset.storeCoverflowMode,
      stateAtNextFrame,
      visualMs: endedAt - start,
    };
  });

  const visualBudgetMs = profile.startsWith('desktop-') ? 250 : 350;
  const maxLongTaskMs = Math.max(0, ...ready.longTasks);
  return {
    entry,
    firstClick: {
      clickToCatalogMs: catalogAt - clickAt,
      clickToRevealCompleteMs: firstRevealCompleteAt - clickAt,
      controllerReadyBeforeClick: controllerReadyBeforeClick !== null,
      pendingBeforeRelease: pendingBeforeRelease !== null,
      releaseToCatalogMs: catalogAt - releaseAt,
    },
    ready,
    rejectionReasons: [
      controllerReadyBeforeClick !== null ? 'controller was ready before delayed first click' : null,
      pendingBeforeRelease === null ? 'first click was not retained before module release' : null,
      ready.mode !== 'catalog' || ready.ariaExpanded !== 'true' ? 'ready click did not enter catalog mode' : null,
      ready.stateAtNextFrame.mode !== 'catalog' || ready.stateAtNextFrame.ariaExpanded !== 'true'
        ? 'catalog state was not ready by the next animation frame'
        : null,
      ready.visualMs > visualBudgetMs ? `visual reveal took ${ready.visualMs.toFixed(1)}ms` : null,
      maxLongTaskMs >= 50 ? `disclosure produced a ${maxLongTaskMs.toFixed(1)}ms long task` : null,
    ].filter(Boolean),
  };
}

async function traversalState(page: Page) {
  return page.evaluate(() => ({
    groups: [...document.querySelectorAll<HTMLElement>('[data-store-coverflow-group]')].map((group) => ({
      id: group.id,
      ready: group.hasAttribute('data-store-coverflow-ready'),
      mode: group.getAttribute('data-store-coverflow-mode'),
      cardCount: group.querySelectorAll('[data-store-coverflow-card]').length,
      chunks: [...group.querySelectorAll<HTMLElement>('.distro-group-chunk')].map((chunk) => ({
        display: getComputedStyle(chunk).display,
        contentVisibility: getComputedStyle(chunk).contentVisibility,
        intrinsicBlockSize: getComputedStyle(chunk).containIntrinsicBlockSize,
      })),
    })),
    cardCount: document.querySelectorAll('[data-store-listing-price]').length,
    distroCardCount: document.querySelectorAll('[data-distro-search-item]').length,
    coverflowCardCount: document.querySelectorAll('[data-store-coverflow-card]').length,
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    fontStatus: document.fonts.status,
    images: [...document.images].map((image) => ({
      url: image.currentSrc,
      complete: image.complete,
      width: image.naturalWidth,
    })),
    resources: performance.getEntriesByType('resource').map((entry) => entry.toJSON()),
  }));
}

async function prepareTraversal(page: Page) {
  if (!(await page.locator('[data-store-coverflow-group]').count())) {
    if (new URL(page.url()).pathname.includes('/store')) throw new Error('Store traversal has no groups.');
    return { readyAt: null, disclosures: [], state: await traversalState(page) };
  }
  await page.waitForFunction(() => {
    const groups = [...document.querySelectorAll('[data-store-coverflow-group]')];
    return groups.length > 0 && groups.every((group) => group.hasAttribute('data-store-coverflow-ready'));
  });
  const readyAt = await page.evaluate(() => performance.now());
  const disclosures: Array<{
    groupIndex: number;
    durationMs: number;
    handlerMs: number;
    handlerScrollY: number;
    scrollY: number;
    longTasks: number[];
    loafs: number[];
  }> = [];
  if (traversalMode === 'catalog') {
    const groups = page.locator('[data-store-coverflow-group]');
    if (catalogGroup >= (await groups.count())) throw new Error('Catalog group does not exist.');
    for (const index of [catalogGroup]) {
      const group = groups.nth(index);
      if ((await group.getAttribute('data-store-coverflow-mode')) !== 'preview') continue;
      // DOM activation avoids Playwright scrolling through the first corridor to click.
      const click = await group.locator('[data-store-coverflow-toggle]').evaluate((element: HTMLElement) => {
        const start = performance.now();
        element.click();
        return { start, handlerMs: performance.now() - start, scrollY: window.scrollY };
      });
      await page.waitForFunction((groupIndex) => {
        const element = document.querySelectorAll('[data-store-coverflow-group]')[groupIndex];
        return (
          element?.getAttribute('data-store-coverflow-mode') === 'catalog' &&
          !element.hasAttribute('data-store-coverflow-transitioning') &&
          !element.hasAttribute('data-store-coverflow-reveal')
        );
      }, index);
      const disclosure = await page.evaluate((start) => {
        const end = performance.now();
        const measurements = (
          window as unknown as {
            __runtimePerformance: {
              longTaskEntries: Array<{ startTime: number; duration: number }>;
              loafEntries: Array<{ startTime: number; duration: number }>;
            };
          }
        ).__runtimePerformance;
        return {
          durationMs: end - start,
          scrollY: window.scrollY,
          longTasks: measurements.longTaskEntries
            .filter((entry) => entry.startTime < end && entry.startTime + entry.duration > start)
            .map((entry) => entry.duration),
          loafs: measurements.loafEntries
            .filter((entry) => entry.startTime < end && entry.startTime + entry.duration > start)
            .map((entry) => entry.duration),
        };
      }, click.start);
      disclosures.push({ groupIndex: index, handlerMs: click.handlerMs, handlerScrollY: click.scrollY, ...disclosure });
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const state = await traversalState(page);
  assertTraversalSetup(state.groups, false);
  if (traversalMode === 'catalog') assertTraversalSetup([state.groups[catalogGroup]], true);
  return { readyAt, disclosures, state };
}

async function scrollTraversal(page: Page, cdp: CDPSession, label: 'first' | 'repeat', tracePath: string) {
  const settings = profiles[profile] as (typeof profiles)['wide-scroll'];
  await page.evaluate(() => {
    const measurements = (window as unknown as { __runtimePerformance: { longTasks: number[]; loafs: number[] } })
      .__runtimePerformance;
    measurements.longTasks = [];
    measurements.loafs = [];
  });
  await startTrace(cdp);
  const browser = await page.evaluate(
    async ({ frames, step }) => {
      const intervals: number[] = [];
      const callbackIntervals: number[] = [];
      const startedAt = performance.now();
      let previousFrame = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
      let previousCallback = performance.now();
      for (let frame = 0; frame < frames; frame += 1) {
        window.scrollBy(0, step);
        const frameAt = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
        const now = performance.now();
        intervals.push(frameAt - previousFrame);
        callbackIntervals.push(now - previousCallback);
        previousFrame = frameAt;
        previousCallback = now;
      }
      const endedAt = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const measurements = (
        window as unknown as {
          __runtimePerformance: {
            longTaskEntries: Array<{ startTime: number; duration: number }>;
            loafEntries: Array<{ startTime: number; duration: number; scripts?: unknown[] }>;
          };
        }
      ).__runtimePerformance;
      const longTaskEntries = measurements.longTaskEntries.filter(
        (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > startedAt,
      );
      const loafEntries = measurements.loafEntries.filter(
        (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > startedAt,
      );
      return {
        intervals,
        callbackIntervals,
        startedAt,
        endedAt,
        scrollY: window.scrollY,
        longTaskEntries,
        loafEntries,
        longTasks: longTaskEntries.map((entry) => entry.duration),
        loafs: loafEntries.map((entry) => entry.duration),
      };
    },
    { frames: settings.frames, step: settings.step },
  );
  const events = await readTrace(cdp);
  const trace = summarizeTrace(events);
  await mkdir(dirname(tracePath), { recursive: true });
  await writeFile(tracePath, JSON.stringify({ traceEvents: events }));
  return {
    label,
    cadenceClock: 'requestAnimationFrame timestamp',
    frameIntervals: summarize(browser.intervals),
    callbackCadence: summarize(browser.callbackIntervals),
    ...browser,
    trace,
    tracePath,
    state: await traversalState(page),
  };
}

function routeUrl(route: string) {
  const path = route === 'home' ? '' : `${route}/`;
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
}

async function main() {
  const tree = await measurementTree();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    if (profile.endsWith('distro-disclosure')) {
      for (let run = 1; run <= runs; run += 1) {
        for (const entry of ['direct', 'shell'] as const) {
          const settings = profiles[profile];
          const context = await browser.newContext({
            viewport: settings.viewport,
            deviceScaleFactor: settings.deviceScaleFactor,
          });
          const page = await context.newPage();
          await configure(context, page);
          results.push({ run, profile, entry, result: await distroDisclosureRun(page, entry) });
          await context.close();
        }
      }
    } else if (profile.endsWith('store-activation')) {
      for (let run = 1; run <= runs; run += 1) {
        const settings = profiles[profile];
        const context = await browser.newContext({
          viewport: settings.viewport,
          deviceScaleFactor: settings.deviceScaleFactor,
        });
        const page = await context.newPage();
        const cdp = await configure(context, page);
        results.push({ run, profile, result: await storeActivationRun(page, cdp, browser.version()) });
        await context.close();
      }
    } else {
      for (const route of routes) {
        for (let run = 1; run <= runs; run += 1) {
          const settings = profiles[profile];
          const context = await browser.newContext({
            viewport: settings.viewport,
            deviceScaleFactor: settings.deviceScaleFactor,
          });
          const page = await context.newPage();
          const cdp = await configure(context, page);
          const url = routeUrl(route);
          if (profile.endsWith('load')) {
            results.push({ route, run, profile, result: await loadRun(page, cdp, url) });
          } else {
            await page.goto(url, { waitUntil: 'networkidle' });
            await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
            await page.evaluate(() => window.scrollTo(0, 0));
            const tracePrefix = `${output}.${route.replaceAll('/', '-')}-${run}`;
            await startTrace(cdp);
            const setup = await prepareTraversal(page);
            const setupEvents = await readTrace(cdp);
            const setupTracePath = `${tracePrefix}-setup.trace.json`;
            await mkdir(dirname(setupTracePath), { recursive: true });
            await writeFile(setupTracePath, JSON.stringify({ traceEvents: setupEvents }));
            const setupTrace = summarizeTrace(setupEvents);
            const first = await scrollTraversal(page, cdp, 'first', `${tracePrefix}-first.trace.json`);
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(500);
            const repeat =
              profile === 'legacy-scroll'
                ? null
                : await scrollTraversal(page, cdp, 'repeat', `${tracePrefix}-repeat.trace.json`);
            results.push({ route, run, profile, setup, setupTrace, setupTracePath, first, repeat });
          }
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const finalTree = await measurementTree();
  const treeUnchanged = JSON.stringify(tree) === JSON.stringify(finalTree);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    `${JSON.stringify({ commit: tree.revision, tree, finalTree, treeUnchanged, browserVersion: browser.version(), buildDirectory, buildMode, cacheState: 'fresh browser context per run', traversalMode, catalogGroup, baseUrl, productEnvironment, profile, settings: profiles[profile], runs, routes, expectedStoreCardCount, blockThirdPartyAnalytics, capturedAt: new Date().toISOString(), method: profile.endsWith('distro-disclosure') ? 'fresh-context delayed and ready Store Distro disclosure' : profile.endsWith('store-activation') ? 'fresh-context same-document Store activation' : 'existing runtime profile', runOrder: results.map((result) => ('run' in result ? result.run : null)), summary: profile.endsWith('store-activation') ? summarizeStoreActivationRuns(results.map((entry) => entry.result)) : undefined, results }, null, 2)}\n`,
  );
  console.log(output);
  if (!treeUnchanged) throw new Error('Measurement inputs changed during the run; evidence is invalid.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
