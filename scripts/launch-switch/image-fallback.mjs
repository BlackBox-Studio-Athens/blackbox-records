import assert from 'node:assert/strict';

export async function verifyImageFallback({ html, origin, countRequest }) {
  const sources = new Set(html.match(/https:\/\/blackbox-records-web\.pages\.dev\/media\/content\/[a-f0-9]{64}/g));
  assert.ok(sources.size, 'Home has no published image for the fallback check.');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === 'https://images.blackboxrecordsathens.com') {
        // Controlled exhaustion: no new transformations or cache warming during acceptance.
        return route.fulfill({ status: 503, body: 'Image transformation unavailable' });
      }
      if (![origin, 'https://blackbox-records-web.pages.dev'].includes(url.origin)) return route.abort();
      if (url.pathname.startsWith('/media/content/') && !sources.has(url.href)) return route.abort();
      if (route.request().resourceType() === 'media') return route.abort();
      countRequest();
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    // The film intentionally hides the hero still; verify a rendered published image instead.
    const image = page.locator('img[src*="https://blackbox-records-web.pages.dev/media/content/"]:visible').first();
    await image.waitFor({ state: 'visible', timeout: 20_000 });
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      ({ element, sources }) => sources.includes(element.src) && element.complete && element.naturalWidth > 0,
      { element: await image.elementHandle(), sources: [...sources] },
      { timeout: 20_000 },
    );
    await image.evaluate((element) => element.decode());
    const result = await image.evaluate((element) => ({
      loaded: element.complete && element.naturalWidth > 0,
      srcset: element.getAttribute('srcset'),
      sourceCandidates: element.closest('picture')?.querySelectorAll('source[srcset]').length ?? 0,
    }));
    assert.ok(
      result.loaded && !result.srcset && !result.sourceCandidates,
      'Published image did not fall back cleanly.',
    );
    return { source: await image.getAttribute('src'), ...result };
  } finally {
    await browser.close();
  }
}
