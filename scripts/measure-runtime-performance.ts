import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { chromium, type BrowserContext, type CDPSession, type Page, type Request } from 'playwright';

import {
  countStoreActivationRequests,
  describeRendererLongTasks,
  extractStoreActivationMilestones,
  storeActivationRejectionReasons,
  summarize,
  summarizeStoreActivationRuns,
  summarizeTrace,
  type TraceEvent,
} from './runtime-performance-helpers';

type Profile =
  | 'desktop-load'
  | 'desktop-idle'
  | 'touch-idle'
  | 'wheel-scroll'
  | 'crate-wheel'
  | 'crate-touch'
  | 'touch-scroll'
  | 'touch-home-input'
  | 'touch-home-menu'
  | 'desktop-store-activation'
  | 'legacy-scroll'
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
if (!Number.isInteger(runs) || runs < 1) throw new Error('Run count must be a positive integer.');
const scrollRuntime = args.get('scroll-runtime') ?? 'enabled';
if (!['enabled', 'native'].includes(scrollRuntime)) throw new Error('Unknown scroll runtime comparison.');
const veneerPreload = args.get('veneer-preload') ?? 'build';
const contentVisibility = args.get('content-visibility') ?? 'build';
if (![veneerPreload, contentVisibility].every((value) => ['build', 'enabled', 'disabled'].includes(value)))
  throw new Error('A/B options must be build, enabled or disabled.');
if (
  [
    'desktop-idle',
    'touch-idle',
    'wheel-scroll',
    'touch-scroll',
    'touch-home-input',
    'crate-wheel',
    'crate-touch',
  ].includes(profile) &&
  runs < 3
)
  throw new Error('Input and idle profiles require at least three runs.');
if (profile === 'touch-home-menu' && runs < 5) throw new Error('Home Menu diagnostics require at least five runs.');
const cpuOverride = args.has('cpu') ? Number(args.get('cpu')) : null;
const dprOverride = args.has('dpr') ? Number(args.get('dpr')) : null;
if (cpuOverride !== null && (!Number.isFinite(cpuOverride) || cpuOverride < 1)) throw new Error('Invalid CPU rate.');
if (dprOverride !== null && (!Number.isFinite(dprOverride) || dprOverride < 1)) throw new Error('Invalid DPR.');
const homeShowcase = args.get('home-showcase') ?? 'empty';
if (!['empty', 'populated'].includes(homeShowcase)) throw new Error('Unknown Home showcase state.');
const menuSwipe = args.get('menu-swipe') ?? 'swipe';
if (!['swipe', 'none'].includes(menuSwipe)) throw new Error('Unknown Home Menu gesture.');
const menuDelayMs = Number(args.get('menu-delay') ?? 250);
if (!Number.isInteger(menuDelayMs) || menuDelayMs < 0 || menuDelayMs > 5000)
  throw new Error('Home Menu delay must be an integer between 0 and 5000 ms.');
const menuTapMode = args.get('menu-tap') ?? 'locator';
if (!['locator', 'held'].includes(menuTapMode)) throw new Error('Unknown Home Menu tap mode.');
const heroFallback = args.get('hero-fallback') ?? 'build';
if (!['build', 'forced'].includes(heroFallback)) throw new Error('Unknown Home hero fallback mode.');
if (heroFallback === 'forced' && !['touch-home-input', 'touch-home-menu'].includes(profile))
  throw new Error('Forced hero fallback is only supported by Home touch profiles.');
const output = args.get('output') ?? `.codex-artifacts/runtime-performance/${Date.now()}-${profile}.json`;
const blockThirdPartyAnalytics = args.get('block-third-party-analytics') === 'true';
const expectedStoreCardCount = Number(args.get('store-card-count') ?? 104);
const productEnvironment = args.get('product-environment') ?? 'Local';
const buildDirectory = args.get('build-directory') ?? 'apps/web/dist';
const buildMode = args.get('build-mode') ?? 'production-static';
const STORE_ACTIVATION_TIMEOUT_MS = 120_000;

async function measurementTree() {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim();
  const files = execFileSync(
    'git',
    [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      'apps/web',
      'packages',
      'scripts/measure-runtime-performance.ts',
      'scripts/runtime-performance-helpers.ts',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
    { encoding: 'utf8', windowsHide: true },
  )
    .split('\0')
    .filter((path) => Boolean(path) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path));
  const dirtyFiles = execFileSync('git', ['diff', 'HEAD', '--name-only', '-z'], { encoding: 'utf8', windowsHide: true })
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
    sourceScope:
      'public frontend, shared packages, profile implementation and package configuration; test files excluded',
    sourceHash: await hashFiles(files),
    buildHash: await hashFiles(artifacts),
    dirtyFiles: await Promise.all(
      dirtyFiles.filter((file) => files.includes(file)).map(async (path) => ({ path, hash: await hashFiles([path]) })),
    ),
  };
}

const profiles = {
  'desktop-idle': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4 },
  'touch-idle': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, hasTouch: true, isMobile: true },
  'wheel-scroll': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4 },
  'crate-wheel': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4 },
  'crate-touch': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
  },
  'touch-scroll': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
  },
  'touch-home-input': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'touch-home-menu': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'desktop-load': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'desktop-store-activation': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'mobile-load': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'wide-scroll': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4, step: 24, frames: 360 },
  'mobile-scroll': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, step: 24, frames: 300 },
  'mobile-store-activation': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    hasTouch: true,
    isMobile: true,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'legacy-scroll': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, cpu: 4, step: 48, frames: 240 },
} as const;
if (!(profile in profiles)) throw new Error(`Unknown runtime profile: ${profile}`);

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
  // Both A/B arms use the same document interception; only the declared feature changes.
  if (heroFallback === 'forced')
    await context.addInitScript({
      content:
        "(() => { const nativeSupports = CSS.supports.bind(CSS); CSS.supports = (...args) => args.length === 1 && args[0] === 'animation-timeline: scroll()' ? false : nativeSupports(...args); })();",
    });
  if (veneerPreload !== 'build' || contentVisibility !== 'build' || heroFallback === 'forced')
    await context.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.fallback();
      const response = await route.fetch();
      if (!response.headers()['content-type']?.includes('text/html')) return route.fulfill({ response });
      let body = await response.text();
      if (veneerPreload === 'disabled')
        body = body.replace(/<link\b(?=[^>]*\brel=["']preload["'])(?=[^>]*veneer)[^>]*>/gi, '');
      if (contentVisibility === 'disabled')
        body = body.replace(
          '</head>',
          '<style>.store-item-card--listing{content-visibility:visible!important}</style></head>',
        );
      if (contentVisibility === 'enabled')
        body = body.replace(
          '</head>',
          '<style>.store-item-card--listing{content-visibility:auto!important;contain-intrinsic-block-size:auto 520px}</style></head>',
        );
      if (heroFallback === 'forced')
        body = body.replace(
          '</head>',
          '<style data-performance-hero-fallback>.homepage-hero-section__media-layer,.homepage-hero-section__media-layer::after{animation-timeline:auto!important;animation-duration:1s!important;animation-play-state:paused!important}</style></head>',
        );
      await route.fulfill({ response, body });
    });
  const cdp = await context.newCDPSession(page);
  const settings = profiles[profile];
  const cpu = cpuOverride ?? settings.cpu;
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
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
    categories:
      'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,blink.user_timing,loading',
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
  const storeLink = page.locator('[data-nav-accent="store"]').first();
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

async function traversalState(page: Page) {
  return page.evaluate(() => ({
    cardCount: document.querySelectorAll('[data-store-listing-price]').length,
    distroCardCount: document.querySelectorAll('[data-distro-search-item]').length,
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

// Store collections open in the Grid, so traversal scrolls the complete catalog from the top.
async function prepareTraversal(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  return { state: await traversalState(page) };
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

async function inputProfileRun(page: Page, cdp: CDPSession, tracePath: string, label: 'first' | 'repeat' | 'idle') {
  const inputType = profile.startsWith('touch-') ? 'touch' : 'wheel';
  if (label !== 'idle') {
    // tsx preserves nested callback names with __name; serialized browser callbacks need that helper locally.
    await page.evaluate(
      'globalThis.__name = (value, name) => Object.defineProperty(value, "name", { value: name, configurable: true })',
    );
    // Instrument frame cadence only during input. Idle tracing deliberately creates no rAF observer loop.
    await page.evaluate(() => {
      const state = { intervals: [] as number[], previous: 0, running: true, handle: 0 };
      Object.assign(window, { __inputFrames: state });
      const frame = (time: number) => {
        if (!state.running) return;
        if (state.previous) state.intervals.push(time - state.previous);
        state.previous = time;
        state.handle = requestAnimationFrame(frame);
      };
      state.handle = requestAnimationFrame(frame);
    });
  }
  await startTrace(cdp);
  const startedAt = await page.evaluate(() => performance.now());
  if (label === 'idle') {
    await page.waitForTimeout(5000);
  } else if (inputType === 'wheel') {
    await page.mouse.move(720, 500);
    for (let step = 0; step < 24; step += 1) {
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(32);
    }
    await page.waitForTimeout(1000);
  } else {
    for (let drag = 0; drag < 12; drag += 1) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 680 }] });
      for (let step = 1; step <= 8; step += 1) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 195, y: 680 - step * 55 }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);
  }
  const browser = await page.evaluate(
    ({ startedAt, idle }) => {
      const endedAt = performance.now();
      const root = window as unknown as {
        __inputFrames?: { intervals: number[]; running: boolean; handle: number };
        __runtimePerformance: { longTaskEntries: Array<{ startTime: number; duration: number }> };
      };
      if (root.__inputFrames) {
        root.__inputFrames.running = false;
        cancelAnimationFrame(root.__inputFrames.handle);
      }
      return {
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        scrollY,
        intervals: idle ? [] : (root.__inputFrames?.intervals ?? []),
        pointer: {
          fine: matchMedia('(pointer: fine)').matches,
          hover: matchMedia('(hover: hover)').matches,
          coarse: matchMedia('(pointer: coarse)').matches,
        },
        smoothRuntimePresent: document.documentElement.classList.contains('lenis'),
        longTasks: root.__runtimePerformance.longTaskEntries.filter(
          (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > startedAt,
        ),
      };
    },
    { startedAt, idle: label === 'idle' },
  );
  const events = await readTrace(cdp);
  await mkdir(dirname(tracePath), { recursive: true });
  await writeFile(tracePath, JSON.stringify({ traceEvents: events }));
  if (label !== 'idle' && browser.scrollY <= 0) throw new Error('Real input traversal did not scroll the document.');
  if (inputType === 'touch' && (!browser.pointer.coarse || browser.pointer.hover))
    throw new Error('Touch profile did not emulate a coarse hoverless pointer.');
  if (inputType === 'wheel' && (!browser.pointer.fine || !browser.pointer.hover))
    throw new Error('Wheel profile requires a fine pointer with hover.');
  if (scrollRuntime === 'native' && browser.smoothRuntimePresent)
    throw new Error('Native comparison still constructed Lenis.');
  return {
    label,
    inputType,
    ...browser,
    frameIntervals: summarize(browser.intervals),
    trace: summarizeTrace(events),
    tracePath,
    instrumentation:
      label === 'idle' ? 'trace only; no measurement rAF loop' : 'one measurement rAF callback per frame',
  };
}

/**
 * The Store Crate under real input on Distro: the first open, then one sideways wheel notch or one downward touch drag
 * per sleeve. The page must not scroll, and every gesture turns exactly one sleeve.
 */
async function crateRun(page: Page, cdp: CDPSession, tracePath: string) {
  const touch = profile === 'crate-touch';
  // tsx preserves nested callback names with __name; serialized browser callbacks need that helper locally.
  await page.evaluate(
    'globalThis.__name = (value, name) => Object.defineProperty(value, "name", { value: name, configurable: true })',
  );
  const landedMs = await page.evaluate(async () => {
    const start = performance.now();
    document.querySelector<HTMLButtonElement>('[data-store-crate-open]')!.click();
    await new Promise<void>((resolve) => {
      const check = () =>
        document.querySelector('.store-crate[data-store-crate="open"][data-store-crate-settled]')
          ? resolve()
          : requestAnimationFrame(check);
      check();
    });
    return performance.now() - start;
  });
  const slot = () =>
    page.evaluate(() =>
      Number(
        document
          .querySelector('[data-store-crate-counter]')!
          .textContent!.trim()
          .split(/\s*\/\s*/)[0],
      ),
    );
  const stage = (await page.locator('[data-store-crate-stage]').boundingBox())!;
  const x = stage.x + stage.width / 2;
  const y = stage.y + stage.height * 0.4;
  const gestures = touch ? 12 : 24;
  const before = { slot: await slot(), scrollY: await page.evaluate(() => window.scrollY) };
  await page.evaluate(() => {
    const state = { intervals: [] as number[], previous: 0, running: true, handle: 0 };
    Object.assign(window, { __inputFrames: state });
    const frame = (time: number) => {
      if (!state.running) return;
      if (state.previous) state.intervals.push(time - state.previous);
      state.previous = time;
      state.handle = requestAnimationFrame(frame);
    };
    state.handle = requestAnimationFrame(frame);
  });
  await startTrace(cdp);
  const startedAt = await page.evaluate(() => performance.now());
  if (touch) {
    for (let gesture = 0; gesture < gestures; gesture += 1) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step += 1) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + step * 20 }] });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(350);
    }
  } else {
    await page.mouse.move(x, y);
    for (let gesture = 0; gesture < gestures; gesture += 1) {
      await page.mouse.wheel(120, 0);
      await page.waitForTimeout(160);
    }
  }
  await page.waitForTimeout(1000);
  const browser = await page.evaluate((startedAt) => {
    const endedAt = performance.now();
    const root = window as unknown as {
      __inputFrames: { intervals: number[]; running: boolean; handle: number };
      __runtimePerformance: { longTaskEntries: Array<{ startTime: number; duration: number }> };
    };
    root.__inputFrames.running = false;
    cancelAnimationFrame(root.__inputFrames.handle);
    return {
      durationMs: endedAt - startedAt,
      scrollY: window.scrollY,
      intervals: root.__inputFrames.intervals,
      longTasks: root.__runtimePerformance.longTaskEntries.filter(
        (entry) => entry.startTime < endedAt && entry.startTime + entry.duration > startedAt,
      ),
      drawnSleeveImages: [...document.querySelectorAll<HTMLImageElement>('.store-crate-art')].filter((image) =>
        image.getAttribute('src'),
      ).length,
    };
  }, startedAt);
  const events = await readTrace(cdp);
  await mkdir(dirname(tracePath), { recursive: true });
  await writeFile(tracePath, JSON.stringify({ traceEvents: events }));
  const turned = (await slot()) - before.slot;
  if (turned !== gestures) throw new Error(`Expected ${gestures} sleeves to turn, ${turned} turned.`);
  if (Math.abs(browser.scrollY - before.scrollY) > 1) throw new Error('Crate input scrolled the page.');
  return {
    inputType: touch ? 'touch' : 'wheel',
    landedMs,
    gestures,
    turned,
    ...browser,
    frameIntervals: summarize(browser.intervals),
    maxLongTaskMs: Math.max(0, ...browser.longTasks.map((entry) => entry.duration)),
    trace: summarizeTrace(events),
    tracePath,
  };
}

async function homeShowcaseFixture(page: Page) {
  const candidates = JSON.parse(await readFile(join(buildDirectory, 'preorder-showcase.json'), 'utf8')) as Array<{
    slug: string;
    [key: string]: unknown;
  }>;
  const candidate = candidates[0];
  if (homeShowcase === 'populated' && !candidate) throw new Error('Built Home has no preorder candidate.');
  const showcase = homeShowcase === 'populated' && candidate ? [candidate] : [];
  await page.route('**/api/store/listing-prices*', (route) => {
    if (new URL(route.request().url()).searchParams.get('scope') !== 'preorders') return route.fallback();
    return route.fulfill({
      json: showcase.map((item) => ({
        storeItemSlug: item.slug,
        presentationState: 'ready',
        availabilityState: 'stocked',
        displayPrice: '€28.00',
        preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
      })),
    });
  });
  if (homeShowcase === 'populated')
    await page.route('**/preorder-showcase.json', (route) => route.fulfill({ json: [candidates[0]] }));
  return { state: homeShowcase, candidateSlug: candidate?.slug ?? null, chapterCount: showcase.length };
}

type HomeProbeEvent = {
  at: number;
  eventTime: number;
  isTrusted: boolean;
  menuTarget: boolean;
  pointerType: string | null;
  type: string;
};

type HomeProbeState = {
  events: HomeProbeEvent[];
  frames: Array<{ at: number }>;
  frameHandle: number;
  running: boolean;
};

async function installHomeInputProbe(page: Page) {
  // tsx names nested callbacks; serialized browser code needs the helper in the page realm.
  await page.evaluate(
    'globalThis.__name = (value, name) => Object.defineProperty(value, "name", { value: name, configurable: true })',
  );
  await page.evaluate(() => {
    const state: HomeProbeState = { events: [], frames: [], frameHandle: 0, running: true };
    const record = (event: Event) => {
      if (state.events.length >= 512) return;
      state.events.push({
        type: event.type,
        at: performance.now(),
        eventTime: event.timeStamp,
        isTrusted: event.isTrusted,
        pointerType: event instanceof PointerEvent ? event.pointerType : null,
        menuTarget:
          event.target instanceof Element &&
          Boolean(event.target.closest('[data-app-shell-mobile-navigation-trigger]')),
      });
    };
    for (const type of [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
      'pointerdown',
      'pointerup',
      'pointercancel',
      'click',
    ])
      document.addEventListener(type, record, { capture: true, passive: true });
    window.addEventListener('scroll', record, { passive: true });
    const frame = (at: number) => {
      if (!state.running) return;
      if (state.frames.length < 600) state.frames.push({ at });
      state.frameHandle = requestAnimationFrame(frame);
    };
    state.frameHandle = requestAnimationFrame(frame);
    Object.assign(window, { __homeInputProbe: state });
    performance.mark('home:probe-start');
  });
}

async function readHomeInputProbe(page: Page) {
  return page.evaluate(() => {
    const state = (window as unknown as { __homeInputProbe: HomeProbeState }).__homeInputProbe;
    state.running = false;
    cancelAnimationFrame(state.frameHandle);
    return { events: state.events, frames: state.frames };
  });
}

async function dispatchHomeSwipe(page: Page, cdp: CDPSession) {
  const startedAt = await page.evaluate(() => {
    performance.mark('home:swipe-request');
    return performance.now();
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 680 }] });
  for (let step = 1; step <= 6; step += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 680 - step * 55 }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const endedAt = await page.evaluate(() => {
    performance.mark('home:swipe-end');
    return performance.now();
  });
  return { startedAt, endedAt };
}

async function tapHomeMenu(page: Page, heldTap?: { cdp: CDPSession; x: number; y: number }) {
  const requestedAt = await page.evaluate(() => {
    performance.mark('home:menu-tap-request');
    return performance.now();
  });
  const hostStartedAt = performance.now();
  let tapError: string | null = null;
  try {
    if (heldTap) {
      await heldTap.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: heldTap.x, y: heldTap.y }],
      });
      await page.waitForTimeout(80);
      await heldTap.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.locator('[data-app-shell-mobile-navigation-trigger]').tap();
    }
  } catch (error) {
    tapError = error instanceof Error ? error.message : String(error);
  }
  const menuOpened = await page
    .locator('[data-app-shell-mobile-navigation]')
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(
      () => true,
      () => false,
    );
  const menuOpenMs = menuOpened ? performance.now() - hostStartedAt : null;
  const expanded = await page.locator('[data-app-shell-mobile-navigation-trigger]').getAttribute('aria-expanded');
  const completedAt = await page.evaluate(() => {
    performance.mark('home:menu-tap-result');
    return performance.now();
  });
  return { requestedAt, completedAt, menuOpened, menuOpenMs, expanded, tapError };
}

async function homeMenuProbeRun(page: Page, cdp: CDPSession) {
  const fixture = await homeShowcaseFixture(page);
  await page.goto(routeUrl('home'), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-app-shell-ready]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const menuBox =
    menuTapMode === 'held' ? await page.locator('[data-app-shell-mobile-navigation-trigger]').boundingBox() : null;
  if (menuTapMode === 'held' && !menuBox) throw new Error('Home Menu trigger is not measurable.');
  await installHomeInputProbe(page);
  const swipe = menuSwipe === 'swipe' ? await dispatchHomeSwipe(page, cdp) : null;
  if (swipe && menuDelayMs) await page.waitForTimeout(menuDelayMs);
  const tap = await tapHomeMenu(
    page,
    menuBox ? { cdp, x: menuBox.x + menuBox.width / 2, y: menuBox.y + menuBox.height / 2 } : undefined,
  );
  const timeline = await readHomeInputProbe(page);
  const swipeTouchEnd = timeline.events.findLast((event) => event.type === 'touchend' && !event.menuTarget);
  const menuPointerDown = timeline.events.find((event) => event.type === 'pointerdown' && event.menuTarget);
  const menuClick = timeline.events.find((event) => event.type === 'click' && event.menuTarget);
  const scrollEventsBeforeTap = timeline.events.filter(
    (event) =>
      menuPointerDown &&
      event.type === 'scroll' &&
      event.at >= menuPointerDown.at - 200 &&
      event.at <= menuPointerDown.at,
  );
  return {
    fixture,
    menuSwipe,
    menuTapMode,
    requestedDelayMs: swipe ? menuDelayMs : null,
    swipe,
    tap,
    actualTouchEndToPointerDownMs: swipeTouchEnd && menuPointerDown ? menuPointerDown.at - swipeTouchEnd.at : null,
    scrollEventsInLast200Ms: scrollEventsBeforeTap.length,
    browserDispatchedMenuClick: Boolean(menuClick),
    scrollY: await page.evaluate(() => scrollY),
    timeline,
  };
}

async function homeInputRun(page: Page, cdp: CDPSession, tracePrefix: string) {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('pageerror', (error) => errors.push(error.message));
  const fixture = await homeShowcaseFixture(page);
  await startTrace(cdp);
  await page.goto(routeUrl('home'), { waitUntil: 'domcontentloaded' });
  await installHomeInputProbe(page);
  const swipe = await dispatchHomeSwipe(page, cdp);
  await page.waitForSelector('html[data-app-shell-ready]', { state: 'attached' });
  await page.waitForTimeout(250);
  const tap = await tapHomeMenu(page);
  const timeline = await readHomeInputProbe(page);
  if (tap.menuOpened) {
    await page.keyboard.press('Escape');
    await page.locator('[data-app-shell-mobile-navigation]').waitFor({ state: 'hidden' });
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  const early = await page.evaluate(() => {
    const measurements = (
      window as unknown as {
        __runtimePerformance: { longTaskEntries: Array<{ startTime: number; duration: number }> };
      }
    ).__runtimePerformance;
    return {
      scrollY,
      pointer: { coarse: matchMedia('(pointer: coarse)').matches, hover: matchMedia('(hover: hover)').matches },
      longTasks: measurements.longTaskEntries,
      showcaseRendered: Boolean(document.querySelector('#preorders')),
    };
  });
  const firstScrollEvent = timeline.events.find((event) => event.type === 'scroll' && event.at >= swipe.startedAt);
  const nextFrameCallback = timeline.frames.find((frame) => firstScrollEvent && frame.at >= firstScrollEvent.at);
  const earlyEvents = await readTrace(cdp);
  const earlyTracePath = `${tracePrefix}-early.trace.json`;
  await mkdir(dirname(earlyTracePath), { recursive: true });
  await writeFile(earlyTracePath, JSON.stringify({ traceEvents: earlyEvents }));
  if (!early.pointer.coarse || early.pointer.hover || !firstScrollEvent)
    throw new Error('Home early input did not run as a touch scroll.');
  if (early.showcaseRendered !== (homeShowcase === 'populated'))
    throw new Error('Home showcase fixture did not render its declared state.');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const first = await inputProfileRun(page, cdp, `${tracePrefix}-first.trace.json`, 'first');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const repeat = await inputProfileRun(page, cdp, `${tracePrefix}-repeat.trace.json`, 'repeat');
  const heroFade = [];
  for (const top of [0, 150, 300, 500]) {
    await page.evaluate((position) => window.scrollTo({ top: position, behavior: 'instant' }), top);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    heroFade.push(
      await page.evaluate(() => {
        const media = document.querySelector<HTMLElement>('.homepage-hero-section__media-layer');
        return {
          scrollY,
          mediaOpacity: media ? getComputedStyle(media).opacity : null,
          veilOpacity: media ? getComputedStyle(media, '::after').opacity : null,
          supportsScrollTimeline: CSS.supports('animation-timeline: scroll()'),
          forcedOverridePresent: Boolean(document.querySelector('[data-performance-hero-fallback]')),
        };
      }),
    );
  }
  return {
    fixture,
    early: {
      ...early,
      firstScrollEventMs: firstScrollEvent.at - swipe.startedAt,
      nextFrameCallbackAfterScrollEventMs: nextFrameCallback ? nextFrameCallback.at - swipe.startedAt : null,
      swipe,
      tap,
      menuOpened: tap.menuOpened,
      menuOpenMs: tap.menuOpenMs,
      menuExpanded: tap.expanded,
      timeline,
      errors,
      trace: summarizeTrace(earlyEvents),
      rendererLongTasks: describeRendererLongTasks(earlyEvents),
      traceMarks: earlyEvents
        .filter((event) => event.name.startsWith('home:'))
        .map((event) => ({ name: event.name, startUs: event.ts ?? null })),
      tracePath: earlyTracePath,
    },
    first,
    repeat,
    heroFade,
    requests: {
      total: requests.length,
      destinations: requests.filter((url) => /\/app-shell-overlay\/|\/store\/$/.test(new URL(url).pathname)),
      listing: requests.filter((url) => new URL(url).pathname.endsWith('/api/store/listing-prices')),
    },
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
    if (profile === 'touch-home-input' || profile === 'touch-home-menu') {
      const settings = profiles[profile];
      for (let run = 1; run <= runs; run += 1) {
        const context = await browser.newContext({
          viewport: settings.viewport,
          deviceScaleFactor: dprOverride ?? settings.deviceScaleFactor,
          hasTouch: settings.hasTouch,
          isMobile: settings.isMobile,
        });
        const page = await context.newPage();
        const cdp = await configure(context, page);
        results.push({
          route: 'home',
          run,
          profile,
          result:
            profile === 'touch-home-input'
              ? await homeInputRun(page, cdp, `${output}.home-${run}`)
              : await homeMenuProbeRun(page, cdp),
        });
        await context.close();
      }
    } else if (['desktop-idle', 'touch-idle', 'wheel-scroll', 'touch-scroll'].includes(profile)) {
      for (const route of routes) {
        for (let run = 1; run <= runs; run += 1) {
          const settings = profiles[profile];
          const context = await browser.newContext({
            viewport: settings.viewport,
            deviceScaleFactor: dprOverride ?? settings.deviceScaleFactor,
            hasTouch: 'hasTouch' in settings && settings.hasTouch,
            isMobile: 'isMobile' in settings && settings.isMobile,
          });
          const blockedRuntimeAssets: string[] = [];
          if (scrollRuntime === 'native')
            await context.route(/\/lenis[^/]*\.js(?:\?|$)/, async (route) => {
              blockedRuntimeAssets.push(route.request().url());
              await route.abort();
            });
          const page = await context.newPage();
          const cdp = await configure(context, page);
          await page.goto(routeUrl(route), { waitUntil: 'networkidle' });
          await page.waitForTimeout(5000);
          const tracePrefix = `${output}.${route.replaceAll('/', '-')}-${run}`;
          if (profile.endsWith('idle')) {
            results.push({
              route,
              run,
              profile,
              scrollRuntime,
              blockedRuntimeAssets,
              result: await inputProfileRun(page, cdp, `${tracePrefix}-idle.trace.json`, 'idle'),
            });
          } else {
            const setup = await prepareTraversal(page);
            await page.waitForTimeout(1000);
            const first = await inputProfileRun(page, cdp, `${tracePrefix}-first.trace.json`, 'first');
            await page.evaluate(() => {
              window.scrollTo({ top: 0, behavior: 'instant' });
            });
            await page.waitForTimeout(1000);
            const repeat = await inputProfileRun(page, cdp, `${tracePrefix}-repeat.trace.json`, 'repeat');
            results.push({ route, run, profile, scrollRuntime, blockedRuntimeAssets, setup, first, repeat });
          }
          await context.close();
        }
      }
    } else if (profile.startsWith('crate-')) {
      for (let run = 1; run <= runs; run += 1) {
        const settings = profiles[profile];
        const context = await browser.newContext({
          viewport: settings.viewport,
          deviceScaleFactor: dprOverride ?? settings.deviceScaleFactor,
          hasTouch: 'hasTouch' in settings && settings.hasTouch,
          isMobile: 'isMobile' in settings && settings.isMobile,
        });
        const page = await context.newPage();
        const cdp = await configure(context, page);
        await page.goto(routeUrl('store/distro'), { waitUntil: 'networkidle' });
        await page.waitForSelector('.store-crate[data-store-crate-ready]');
        await page.waitForTimeout(2000);
        results.push({
          route: 'store/distro',
          run,
          profile,
          result: await crateRun(page, cdp, `${output}.crate-${run}.trace.json`),
        });
        await context.close();
      }
    } else if (profile.endsWith('store-activation')) {
      for (let run = 1; run <= runs; run += 1) {
        const settings = profiles[profile];
        const context = await browser.newContext({
          viewport: settings.viewport,
          deviceScaleFactor: dprOverride ?? settings.deviceScaleFactor,
          hasTouch: 'hasTouch' in settings && settings.hasTouch,
          isMobile: 'isMobile' in settings && settings.isMobile,
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
            deviceScaleFactor: dprOverride ?? settings.deviceScaleFactor,
            hasTouch: 'hasTouch' in settings && settings.hasTouch,
            isMobile: 'isMobile' in settings && settings.isMobile,
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
  const homeProfile = profile === 'touch-home-input' || profile === 'touch-home-menu';
  const report = {
    commit: tree.revision,
    tree,
    finalTree,
    treeUnchanged,
    browserVersion: browser.version(),
    buildDirectory,
    buildMode,
    cacheState: 'fresh browser context per run',
    baseUrl,
    productEnvironment,
    profile,
    scrollRuntime,
    veneerPreload,
    contentVisibility,
    heroFallback: homeProfile ? heroFallback : undefined,
    settings: {
      ...profiles[profile],
      cpu: cpuOverride ?? profiles[profile].cpu,
      deviceScaleFactor: dprOverride ?? profiles[profile].deviceScaleFactor,
    },
    homeShowcase: homeProfile ? homeShowcase : undefined,
    menuSwipe: profile === 'touch-home-menu' ? menuSwipe : undefined,
    menuTapMode: profile === 'touch-home-menu' ? menuTapMode : undefined,
    menuDelayMs: profile === 'touch-home-menu' && menuSwipe === 'swipe' ? menuDelayMs : undefined,
    runs,
    routes: homeProfile ? ['home'] : routes,
    expectedStoreCardCount,
    blockThirdPartyAnalytics,
    capturedAt: new Date().toISOString(),
    method:
      profile === 'touch-home-input'
        ? 'fresh-context early touch swipe and Menu tap, then settled first/repeat touch traversal; scroll event and frame callback are not visual presentation timestamps'
        : profile === 'touch-home-menu'
          ? 'settled Home, controlled swipe-to-Menu tap with bounded browser event/frame timeline'
          : profile.endsWith('store-activation')
            ? 'fresh-context same-document Store activation'
            : 'existing runtime profile',
    runOrder: results.map((result) => ('run' in result ? result.run : null)),
    summary: profile.endsWith('store-activation')
      ? summarizeStoreActivationRuns(results.map((entry) => entry.result))
      : undefined,
    results,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(output);
  if (!treeUnchanged) throw new Error('Measurement inputs changed during the run; evidence is invalid.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
