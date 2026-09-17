import assert from 'node:assert/strict';
import { sourceCollectionNames } from '@blackbox/content-model';

// Local only: previews are unsaved and the smoke verifies that stored drafts/history stay unchanged.
const base = 'http://127.0.0.1:8787';
const get = async (path) => {
  const response = await fetch(`${base}/_emdash/api/${path}`);
  assert.equal(response.status, 200, path);
  const body = await response.json();
  return body.data ?? body;
};
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  if (value.provider === 'local') return { id: value.id };
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
}
const headers = { Origin: base, 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const history = await get('blackbox/publications');
const results = [];
const browsers = [];
let restoreNewsletter;
if (process.argv.includes('--browsers')) {
  const { chromium, firefox } = await import('playwright');
  for (const type of [chromium, firefox]) {
    const browser = await type.launch();
    const page = await browser.newPage();
    await page.route(`${base}/preview-browser-fixture`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Local preview verification</title><iframe sandbox="allow-same-origin"></iframe>',
      }),
    );
    await page.goto(`${base}/preview-browser-fixture`);
    browsers.push({ name: type.name(), browser, page });
  }
}
try {
  for (const collection of Object.keys(sourceCollectionNames)) {
    const { items } = await get(`content/${collection}?limit=1`);
    assert.ok(items.length, `Missing Local fixture: ${collection}`);
    const before = await get(`content/${collection}/${items[0].id}`);
    const item = before.item;
    const data = clean(item.data);
    if (typeof data.title === 'string') data.title += ' — unsaved preview smoke';
    const body = JSON.stringify({ collection, id: item.id, slug: item.slug, data });
    for (const view of [
      'detail',
      ...(['artists', 'releases', 'news', 'distro'].includes(collection) ? ['listing'] : []),
    ]) {
      const start = performance.now();
      const response = await fetch(`${base}/_emdash/preview?view=${view}`, { method: 'POST', headers, body });
      const html = await response.text();
      assert.equal(response.status, 200, `${collection}/${view}: ${html.slice(0, 1000)}`);
      assert.match(response.headers.get('Cache-Control'), /private, no-store/);
      assert.match(response.headers.get('Content-Security-Policy'), /script-src 'none'/);
      assert.match(html, /<!DOCTYPE html>/i);
      assert.doesNotMatch(html, /<(?:script|iframe|object|embed)\b/i);
      assert.ok(!/<a\s[^>]*\shref=/i.test(html), `${collection}: interactive link remains`);
      if (collection === 'artists') assert.ok(html.includes('unsaved preview smoke'));
      for (const { name, page } of browsers) {
        console.error(`Checking ${name} ${collection}/${view}`);
        await page.evaluate((html) => {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('sandbox', 'allow-same-origin');
          iframe.onload = () => {
            if (iframe.contentDocument?.URL === 'about:srcdoc') iframe.dataset.loaded = 'true';
          };
          iframe.srcdoc = html;
          document.querySelector('iframe').replaceWith(iframe);
        }, html);
        await page.waitForFunction(() => document.querySelector('iframe').dataset.loaded === 'true', null, {
          timeout: 30_000,
        });
        const assets = await page.evaluate(async () => {
          const document = window.document.querySelector('iframe').contentDocument;
          await Promise.race([
            Promise.all([...Array.from(document.images).map((img) => img.decode()), document.fonts.ready]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Preview assets timed out')), 30_000)),
          ]);
          return {
            styles: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every((link) => !!link.sheet),
            images: document.images.length,
            background: document.defaultView.getComputedStyle(document.body).backgroundColor,
          };
        });
        assert.ok(assets.styles, `${name} ${collection}/${view}: stylesheet missing`);
        assert.notEqual(assets.background, 'rgba(0, 0, 0, 0)', `${name} ${collection}/${view}: unstyled`);
      }
      results.push({
        collection,
        view,
        ms: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(html),
        reads: Number(response.headers.get('X-Preview-Reads')),
        cacheMisses: Number(response.headers.get('X-Preview-Cache-Misses')),
      });
    }
    assert.deepEqual(await get(`content/${collection}/${item.id}`), before, `${collection} must remain unsaved`);
    for (const override of [{ Origin: 'https://example.com' }, { 'X-EmDash-Request': '' }]) {
      const response = await fetch(`${base}/_emdash/preview`, {
        method: 'POST',
        headers: { ...headers, ...override },
        body,
      });
      assert.equal(response.status, 403);
      await response.text();
    }
  }
  assert.deepEqual(await get('blackbox/publications'), history, 'Preview must not publish');
  const newsletter = (await get('content/newsletter?limit=1')).items[0];
  const newsletterBefore = await get(`content/newsletter/${newsletter.id}`);
  restoreNewsletter = { id: newsletter.id, data: clean(newsletterBefore.item.data) };
  for (const { name, page } of browsers) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/content/?collection=newsletter&id=${encodeURIComponent(newsletter.id)}`);
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await page.getByRole('button', { name: 'Mobile', exact: true }).click();
    const description = page.getByLabel('Description', { exact: true });
    const preview = page.frameLocator('iframe[title="Private site appearance preview"]');
    await description.fill('');
    await description.pressSequentially(`${name} unsaved newsletter description A`, { delay: 15 });
    await preview.getByText(`${name} unsaved newsletter description A`, { exact: true }).waitFor();
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.request().postDataJSON()?.data?.description === `${name} unsaved newsletter description B`,
    );
    await description.fill(`${name} unsaved newsletter description B`);
    await preview.getByText(`${name} unsaved newsletter description B`, { exact: true }).waitFor();
    assert.equal((await saved).status(), 200);
    assert.equal(
      (await get(`content/newsletter/${newsletter.id}`)).item.data.description,
      `${name} unsaved newsletter description B`,
    );
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    assert.equal(
      await preview.getByText(`${name} unsaved newsletter description B`, { exact: true }).isVisible(),
      true,
    );
    console.error(`Passed ${name} real newsletter successive unsaved edits`);
  }
  // Editor typing autosaves privately; preview POSTs above never save or publish.
  assert.deepEqual(await get('blackbox/publications'), history, 'UI previews must not publish');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await Promise.all(browsers.map(({ browser }) => browser.close()));
  if (restoreNewsletter) {
    const path = `content/newsletter/${restoreNewsletter.id}`;
    const current = await get(path);
    const restored = await fetch(`${base}/_emdash/api/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ _rev: current._rev, data: restoreNewsletter.data }),
    });
    assert.equal(restored.status, 200, 'Restore Local newsletter draft');
    assert.deepEqual(clean((await get(path)).item.data), restoreNewsletter.data);
  }
}
