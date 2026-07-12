import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { chromium, type BrowserContext, type CDPSession, type Page } from 'playwright';

import { summarize, summarizeTrace, type TraceEvent } from './runtime-performance-helpers';

type Profile = 'desktop-load' | 'mobile-load' | 'wide-scroll' | 'mobile-scroll' | 'legacy-scroll';

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=') || 'true'];
  }),
);
const profile = (args.get('profile') ?? 'desktop-load') as Profile;
const baseUrl = args.get('base-url') ?? 'http://127.0.0.1:4321/blackbox-records/';
const routes = (args.get('routes') ?? 'home,store,distro').split(/[,\s]+/);
const runs = Number(args.get('runs') ?? (profile === 'desktop-load' ? 5 : 3));
const output = args.get('output') ?? `.codex-artifacts/runtime-performance/${Date.now()}-${profile}.json`;
const blockThirdPartyAnalytics = args.get('block-third-party-analytics') === 'true';

const profiles = {
  'desktop-load': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  'mobile-load': {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpu: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  'wide-scroll': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 4, step: 24, frames: 360 },
  'mobile-scroll': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, step: 24, frames: 300 },
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
    };
    Object.assign(window, { __runtimePerformance: measurements });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) measurements.longTasks.push(entry.duration);
    }).observe({ type: 'longtask', buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) measurements.loafs.push(entry.duration);
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

async function scrollTraversal(page: Page, cdp: CDPSession, label: 'first' | 'repeat') {
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
      let previous = performance.now();
      for (let frame = 0; frame < frames; frame += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const now = performance.now();
        intervals.push(now - previous);
        previous = now;
        window.scrollBy(0, step);
      }
      const measurements = (window as unknown as { __runtimePerformance: { longTasks: number[]; loafs: number[] } })
        .__runtimePerformance;
      return { intervals, scrollY: window.scrollY, longTasks: measurements.longTasks, loafs: measurements.loafs };
    },
    { frames: settings.frames, step: settings.step },
  );
  const trace = summarizeTrace(await readTrace(cdp));
  return { label, frameIntervals: summarize(browser.intervals), ...browser, trace };
}

function routeUrl(route: string) {
  const path = route === 'home' ? '' : `${route}/`;
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
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
          const first = await scrollTraversal(page, cdp, 'first');
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(500);
          const repeat = profile === 'legacy-scroll' ? null : await scrollTraversal(page, cdp, 'repeat');
          results.push({ route, run, profile, first, repeat });
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    `${JSON.stringify({ commit: process.env.RUNTIME_PERFORMANCE_COMMIT ?? 'record-with-git-rev-parse', baseUrl, profile, settings: profiles[profile], runs, routes, blockThirdPartyAnalytics, capturedAt: new Date().toISOString(), results }, null, 2)}\n`,
  );
  console.log(output);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
