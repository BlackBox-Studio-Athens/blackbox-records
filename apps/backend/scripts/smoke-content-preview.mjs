import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { editorialWriteData } from '../../staff/src/lib/backend/editorial-api.ts';
import { formattedProse } from '../../../scripts/fixtures/prose.ts';
import { proseText, sourceCollectionNames } from '@blackbox/content-model';

const fetch = async (input, init = {}) => {
  try {
    return await globalThis.fetch(input, { ...init, signal: AbortSignal.timeout(30000) });
  } catch (error) {
    throw new Error(`${init.method ?? 'GET'} ${new URL(input).pathname} failed`, { cause: error });
  }
};

// Local only: previews are unsaved and the smoke verifies that stored drafts/history stay unchanged.
const base = process.env.PREVIEW_STAFF_ORIGIN || 'http://127.0.0.1:8787';
assert.ok(['http://127.0.0.1:8787', 'http://127.0.0.1:8799'].includes(base), 'Local fixture only');
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
for (let attempt = 0; attempt < 2; attempt++) {
  const response = await fetch(`${base}/_emdash/api/blackbox/catalog-schema`, { method: 'POST', headers });
  assert.equal(response.status, 200, 'Native additive schema setup is repeatable');
  await response.body?.cancel();
}
const results = [];
const browsers = [];
async function showPreview(page, url) {
  await page.evaluate((url) => {
    const previous = window.document.querySelector('iframe');
    const frame = previous.cloneNode(false);
    delete frame.dataset.loaded;
    delete frame.dataset.failed;
    delete frame.dataset.action;
    frame.src = url;
    previous.replaceWith(frame);
  }, url);
}
async function comparePublicPreviews() {
  const site = process.env.PREVIEW_PUBLIC_ORIGIN || 'http://127.0.0.1:4321';
  assert.ok(['http://127.0.0.1:4321', 'http://127.0.0.1:4339'].includes(site), 'Local public fixture only');
  const artifacts = resolve('.codex-artifacts/preview-parity');
  await mkdir(artifacts, { recursive: true });
  const pairs = [];
  for (const { name, page } of browsers) {
    await page.addStyleTag({
      content:
        'html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{display:block;border:0;width:100%;height:100vh}',
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const publicPage = await page.context().newPage();
    await publicPage.emulateMedia({ reducedMotion: 'reduce' });
    // Both sides must have warm optional fonts before comparing their layout.
    await publicPage.goto(`${site}/blackbox-records/`);
    await publicPage.evaluate(() => document.fonts.ready);
    try {
      for (const [label, collection, view, overlay] of [
        ['home', 'home', 'detail', false],
        ['release-detail', 'releases', 'detail', false],
        ['release-overlay', 'releases', 'listing', true],
        ['store-listing', 'distro', 'listing', false],
        ['store-detail', 'distro', 'detail', false],
      ]) {
        const listed = (await get(`content/${collection}?limit=1`)).items[0];
        const item = (await get(`content/${collection}/${listed.id}`)).item;
        const response = await fetch(`${base}/_emdash/preview?view=${view}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ collection, id: item.id, slug: item.slug, data: editorialWriteData(item.data) }),
        });
        assert.equal(response.status, 200, await response.clone().text());
        const document = await response.json();
        try {
          for (const width of [390, 1280]) {
            console.error(`Comparing ${name}/${label}/${width}`);
            const probe = await fetch(document.url);
            assert.equal(probe.status, 200, await probe.text());
            const viewport = { width, height: 900 };
            await page.setViewportSize(viewport);
            await publicPage.setViewportSize(viewport);
            await page.mouse.move(0, 0);
            await publicPage.mouse.move(0, 0);
            await showPreview(page, document.url);
            await publicPage.goto(new URL(new URL(document.url).pathname, site).href);
            await page.waitForFunction(() => window.document.querySelector('iframe').dataset.loaded === 'true', null, {
              timeout: 30000,
            });
            const frame = await (await page.$('iframe')).contentFrame();
            await publicPage.waitForFunction(() => !window.document.querySelector('astro-island[client="load"][ssr]'));
            for (const target of [frame, publicPage])
              await target.locator('header').getByRole('button', { name: 'Cart', exact: true }).waitFor();
            if (overlay) {
              const selector = `a[href*="/releases/${item.slug}/"]`;
              await frame.locator(selector).first().click();
              await publicPage.locator(selector).first().click();
              await frame.getByRole('dialog').waitFor();
              await publicPage.getByRole('dialog').waitFor();
              await frame.getByRole('dialog').locator('h1').waitFor();
              await publicPage.getByRole('dialog').locator('h1').waitFor();
            }
            if (label === 'store-listing') {
              for (const target of [frame, publicPage]) {
                await target.locator('[data-distro-search]').scrollIntoViewIfNeeded();
                await target.getByRole('searchbox', { name: 'Search distro', exact: true }).waitFor();
                await target.evaluate(() => scrollTo(0, 0));
              }
            }
            for (const target of [frame, publicPage])
              await target.evaluate(async () => {
                await document.fonts.ready;
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                await Promise.all(
                  [...document.images]
                    .filter((image) => {
                      const box = image.getBoundingClientRect();
                      return box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0;
                    })
                    .map((image) => image.decode()),
                );
              });
            const scope = overlay ? '[role="dialog"]' : 'main';
            assert.equal(
              await frame.locator(scope).innerText(),
              await publicPage.locator(scope).innerText(),
              `${name}/${label}/${width} content`,
            );
            const headings = `${scope} h1, ${scope} h2`;
            assert.deepEqual(
              await frame.locator(headings).allTextContents(),
              await publicPage.locator(headings).allTextContents(),
              `${name}/${label}/${width} headings`,
            );
            const layout = (target) =>
              target.locator(scope).evaluate((root) => ({
                height: Math.round(root.getBoundingClientRect().height),
                headerHeight: Math.round(document.querySelector('header').getBoundingClientRect().height),
                footerHeight: Math.round(document.querySelector('footer').getBoundingClientRect().height),
                images: [...root.querySelectorAll('img')].map((image) => ({
                  alt: image.alt,
                  width: Math.round(image.getBoundingClientRect().width),
                  height: Math.round(image.getBoundingClientRect().height),
                  fit: getComputedStyle(image).objectFit,
                })),
              }));
            const actualLayout = await layout(frame);
            const publicLayout = await layout(publicPage);
            if (JSON.stringify(actualLayout) !== JSON.stringify(publicLayout)) {
              const inspect = (target) =>
                target.evaluate(() => ({
                  fonts: [...document.fonts].map((font) => ({
                    family: font.family,
                    status: font.status,
                    weight: font.weight,
                  })),
                  elements: [
                    ...document.querySelectorAll('main section, main h1, main h2, main p, #newsletter-signup-area *'),
                  ].map((element) => ({
                    tag: element.tagName,
                    text: element.textContent?.trim().slice(0, 55),
                    height: element.getBoundingClientRect().height,
                    font: getComputedStyle(element).font,
                  })),
                }));
              await writeFile(
                resolve(artifacts, 'layout-failure.json'),
                JSON.stringify({ preview: await inspect(frame), public: await inspect(publicPage) }, null, 2),
              );
            }
            assert.deepEqual(actualLayout, publicLayout, `${name}/${label}/${width} full layout`);
            const filename = `${name}-${label}-${width}`;
            const expected = await publicPage.screenshot({
              path: resolve(artifacts, `${filename}-public.png`),
              animations: 'disabled',
            });
            const actual = await page.screenshot({
              path: resolve(artifacts, `${filename}-preview.png`),
              animations: 'disabled',
            });
            const a = await sharp(actual).removeAlpha().raw().toBuffer();
            const b = await sharp(expected).removeAlpha().raw().toBuffer();
            assert.equal(a.length, b.length);
            let different = 0;
            for (let i = 0; i < a.length; i += 3)
              if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > 20)
                different++;
            pairs.push({ name, label, width, differentPixelRatio: different / (a.length / 3) });
            if (!overlay) {
              for (const target of [frame, publicPage])
                await target.evaluate(() => scrollTo(0, document.body.scrollHeight));
              await publicPage.screenshot({
                path: resolve(artifacts, `${filename}-public-footer.png`),
                animations: 'disabled',
              });
              await page.screenshot({
                path: resolve(artifacts, `${filename}-preview-footer.png`),
                animations: 'disabled',
              });
            }
          }
        } finally {
          await (await (await page.$('iframe')).contentFrame()).goto('about:blank');
          await fetch(`${base}/_emdash/preview-release`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ context: document.context }),
          });
        }
      }
      await checkInteractions(page, name);
    } finally {
      await publicPage.close();
    }
  }
  await writeFile(
    resolve(artifacts, `pairs-${process.env.PREVIEW_BROWSER || 'both'}.json`),
    JSON.stringify(pairs, null, 2),
  );
  console.log('Paired public/preview screenshots:', pairs);
}
async function checkInteractions(page, name) {
  const listed = (await get('content/releases?limit=1')).items[0];
  const item = (await get(`content/releases/${listed.id}`)).item;
  const response = await fetch(`${base}/_emdash/preview?view=listing`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ collection: 'releases', id: item.id, slug: item.slug, data: editorialWriteData(item.data) }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const document = await response.json();
  const providerRequests = [];
  const providerPattern = /https:\/\/(?:bandcamp\.com|embed\.tidal\.com)\//;
  await page.route(providerPattern, async (route) => {
    providerRequests.push(route.request());
    await route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' });
  });
  try {
    await showPreview(page, document.url);
    await page.waitForFunction(() => window.document.querySelector('iframe').dataset.loaded === 'true');
    const frame = await (await page.$('iframe')).contentFrame();
    await frame.evaluate(() => {
      window.previewTestIdentity = {};
    });
    const originalDocument = await frame.evaluateHandle(() => window.previewTestIdentity);
    await frame.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
    const player = frame.locator('[data-music-streaming-service-embedded-player-iframe]');
    await player.waitFor();
    await player.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
    await frame.getByRole('button', { name: /Minimize/ }).click();
    const originalPlayer = await player.elementHandle();
    await frame.locator('header').getByRole('link', { name: 'Store', exact: true }).first().click();
    await frame.getByRole('searchbox', { name: 'Search Store', exact: true }).waitFor();
    assert.equal(await originalPlayer.evaluate((element) => element.isConnected), true);
    assert.ok(providerRequests.length);
    for (const request of providerRequests) {
      assert.ok(!request.url().includes(document.context));
      assert.equal(request.headers().referer, undefined);
      assert.equal(request.headers().cookie, undefined);
    }
    await frame.getByRole('button', { name: 'Stop player' }).click();
    await frame.getByRole('searchbox', { name: 'Search Store', exact: true }).fill('zzzz-no-preview-match');
    await frame.waitForFunction(
      () =>
        ![...window.document.querySelectorAll('[data-distro-search-item]')].some(
          (item) => item.getBoundingClientRect().height > 0,
        ),
    );
    await frame.getByRole('searchbox', { name: 'Search Store', exact: true }).fill('');
    await frame.evaluate(() => history.back());
    await frame.waitForFunction(() => location.pathname.endsWith('/releases/'));
    await frame.locator('main h1').filter({ hasText: 'Releases' }).waitFor();
    await frame.evaluate(() => history.forward());
    await frame.getByRole('searchbox', { name: 'Search Store', exact: true }).waitFor();
    assert.equal(await originalDocument.evaluate((value) => value === window.previewTestIdentity), true);
    assert.equal(new URL(frame.url()).searchParams.get('__preview'), document.context);
    // Store detail is a normal document navigation; its new shell still uses the same selection.
    await frame.goto(
      new URL(`/blackbox-records/store/disintegration-black-vinyl-lp/?__preview=${document.context}`, document.url)
        .href,
    );
    await frame.getByRole('button', { name: 'Add To Cart', exact: true }).click();
    await frame.getByRole('dialog').getByRole('link', { name: 'Checkout', exact: true }).click();
    await page.waitForFunction(() => window.document.querySelector('iframe').dataset.action);
    assert.ok(!new URL(frame.url()).pathname.includes('/checkout/'));
    assert.deepEqual(await frame.evaluate(() => Object.keys(localStorage)), []);
    await frame.getByRole('button', { name: 'Continue Shopping', exact: true }).click();
    await frame.locator('header').getByRole('link', { name: 'Store', exact: true }).first().click();
    await frame.getByRole('searchbox', { name: 'Search Store', exact: true }).waitFor();
    await frame.getByRole('button', { name: 'Cart, 1 item', exact: true }).click();
    await frame.locator('[data-store-cart-line-item]').waitFor();
    console.error(
      `Passed ${name} shell history/search, memory cart, denied checkout and persistent player integration`,
    );
  } finally {
    await page.unroute(providerPattern);
    await (await (await page.$('iframe')).contentFrame()).goto('about:blank');
    await fetch(`${base}/_emdash/preview-release`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ context: document.context }),
    });
  }
}
let restoreNewsletter;
if (process.argv.includes('--browsers')) {
  const { chromium, firefox } = await import('playwright');
  for (const type of [chromium, firefox]) {
    if (process.env.PREVIEW_BROWSER && process.env.PREVIEW_BROWSER !== type.name()) continue;
    const browser = await type.launch();
    const context = await browser.newContext();
    // Keep the actual font files, but remove optional-font timing from paired layout comparisons.
    await context.route('https://fonts.googleapis.com/**', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replaceAll('font-display: optional', 'font-display: swap'),
      });
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    page.on('pageerror', (error) => console.error(type.name(), error.message));
    page.on('requestfailed', (request) => {
      const reason = request.failure()?.errorText;
      if (reason !== 'net::ERR_ABORTED' && reason !== 'NS_BINDING_ABORTED')
        console.error('Failed request', new URL(request.url()).pathname, reason);
    });
    page.on('response', (response) => {
      if (response.status() >= 400)
        console.error('Failed response', response.status(), new URL(response.url()).pathname);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(type.name(), message.text().slice(0, 500));
    });
    // Keep Chromium's real loopback address-space classification for the private iframe.
    await page.goto(`${base}/content/`);
    await page.setContent(
      '<!doctype html><title>Local preview verification</title><style>html,body{margin:0}iframe{display:block;border:0;width:100vw;height:100vh}</style><iframe sandbox="allow-scripts allow-same-origin"></iframe>',
    );
    await page.evaluate(() => {
      window.addEventListener('message', (event) => {
        const iframe = document.querySelector('iframe');
        if (event.source !== iframe.contentWindow || event.origin !== new URL(iframe.src).origin) return;
        if (event.data.context !== new URL(iframe.src).searchParams.get('__preview')) return;
        if (event.data.type === 'ready') {
          iframe.dataset.loaded = 'true';
          event.source.postMessage({ ...event.data, type: 'activate' }, event.origin);
        }
        if (event.data.type === 'failed') iframe.dataset.failed = event.data.stage;
        if (event.data.type === 'action') iframe.dataset.action = event.data.message;
      });
    });
    browsers.push({ name: type.name(), browser, page });
  }
}
try {
  for (const collection of process.argv.includes('--pairs-only') ? [] : Object.keys(sourceCollectionNames)) {
    const { items } = await get(`content/${collection}?limit=1`);
    assert.ok(items.length, `Missing Local fixture: ${collection}`);
    const before = await get(`content/${collection}/${items[0].id}`);
    const item = before.item;
    const data = editorialWriteData(item.data);
    if (typeof data.title === 'string') data.title += ' — unsaved preview smoke';
    if (collection === 'artists') data.bio_rich = formattedProse;
    if (collection === 'releases' || collection === 'distro') data.summary_rich = formattedProse;
    if (collection === 'about') data.lead.text = formattedProse;
    if (collection === 'purchase_information') {
      // Preview-only fixture: exercise the approved public document without saving approval or wording.
      data.publication = 'approved';
      data.content = JSON.parse(
        JSON.stringify(data.content)
          .replaceAll(/to be confirmed/gi, 'Local test fixture')
          .replaceAll('example.invalid', 'example.com'),
      );
      data.content.terms.dispatch.summary = formattedProse;
      data.content.terms.dispatch.paragraphs[0] = formattedProse;
    }
    const body = JSON.stringify({ collection, id: item.id, slug: item.slug, data });
    for (const view of [
      'detail',
      ...(['artists', 'releases', 'news', 'distro'].includes(collection) ? ['listing'] : []),
    ]) {
      const start = performance.now();
      const response = await fetch(`${base}/_emdash/preview?view=${view}`, { method: 'POST', headers, body });
      assert.equal(response.status, 200, await response.clone().text());
      assert.match(response.headers.get('Cache-Control'), /private, no-store/);
      const document = await response.json();
      const rendered = await fetch(document.url);
      const html = await rendered.text();
      assert.equal(rendered.status, 200, collection + '/' + view + ': ' + html.slice(0, 500));
      assert.match(rendered.headers.get('Content-Security-Policy'), /script-src 'self'/);
      assert.match(html, /<!DOCTYPE html>/i);
      if (['artists', 'releases', 'distro', 'about', 'purchase_information'].includes(collection)) {
        assert.match(html, /<strong>Bold description<\/strong>/, `${collection}/${view}: rich prose`);
      }
      assert.match(html, /blackbox-preview/);
      assert.ok(!html.includes('srcdoc='));
      if (collection === 'artists') assert.ok(html.includes('unsaved preview smoke'));
      for (const { name, page } of browsers) {
        console.error('Checking ' + name + ' ' + collection + '/' + view);
        await showPreview(page, document.url);
        try {
          await page.waitForFunction(() => window.document.querySelector('iframe').dataset.loaded === 'true', null, {
            timeout: 30000,
          });
        } catch (error) {
          console.error(
            'Preview readiness:',
            await page.evaluate(() => ({ ...window.document.querySelector('iframe').dataset })),
          );
          console.error(
            'Frame locations:',
            page.frames().map((frame) => frame.url().split('?')[0]),
          );
          const failed = await (await page.$('iframe')).contentFrame();
          if (failed)
            console.error(
              await failed.evaluate(() => ({
                styles: [...window.document.querySelectorAll('link[rel="stylesheet"]')].map((link) => ({
                  href: link.href,
                  loaded: !!link.sheet,
                })),
                islands: [...window.document.querySelectorAll('astro-island')].map((island) => ({
                  client: island.getAttribute('client'),
                  ssr: island.hasAttribute('ssr'),
                })),
                failedImages: [...window.document.images]
                  .filter((image) => image.complete && !image.naturalWidth)
                  .map((image) => image.currentSrc),
              })),
            );
          throw error;
        }
        const frame = await (await page.$('iframe')).contentFrame();
        assert.equal(new URL(frame.url()).searchParams.get('__preview'), document.context);
        const assets = await frame.evaluate(() => ({
          styles: [...window.document.querySelectorAll('link[rel="stylesheet"]')].every((link) => !!link.sheet),
          background: getComputedStyle(window.document.body).backgroundColor,
        }));
        assert.ok(assets.styles, name + ' ' + collection + ': stylesheet missing');
        assert.notEqual(assets.background, 'rgba(0, 0, 0, 0)');
        console.error('Rendered ' + name + ' ' + collection + '/' + view);
      }
      for (const path of ['/_emdash/api/content/news', '/api/internal/variants', '/api/checkout/sessions']) {
        const denied = await fetch(new URL(path + '?__preview=' + document.context, document.url));
        assert.ok([403, 410].includes(denied.status));
        await denied.body?.cancel();
      }
      const deniedWrite = await fetch(document.url, { method: 'POST', body: '{}' });
      assert.equal(deniedWrite.status, 403);
      await deniedWrite.body?.cancel();
      if (collection === 'artists' && view === 'detail') {
        for (const [path, status] of [
          ['/_image?href=https%3A%2F%2Funtrusted.invalid%2Fimage.png', 403],
          [`/_preview/media/${document.context}/not-selected`, 410],
          [`/assets/catalog/releases/not-selected.png?__preview=${document.context}`, 410],
          [`/_preview/api/${document.context}/api/store/delivery-quote`, 410],
        ]) {
          const denied = await fetch(new URL(path, document.url));
          assert.equal(denied.status, status, path);
          await denied.body?.cancel();
        }
        const redirectUrl = new URL(`/blackbox-records/distro/?__preview=${document.context}`, document.url).href;
        const redirect = await fetch(redirectUrl);
        assert.equal(redirect.status, 200);
        assert.ok((await redirect.text()).includes(`/store/distro/?__preview=${document.context}`));
        for (const { page } of browsers) {
          await showPreview(page, redirectUrl);
          await page.waitForFunction(() => window.document.querySelector('iframe').dataset.loaded === 'true');
          const destination = new URL((await (await page.$('iframe')).contentFrame()).url());
          assert.equal(destination.origin, new URL(document.url).origin);
          assert.equal(destination.pathname, '/blackbox-records/store/distro/');
          assert.equal(destination.searchParams.get('__preview'), document.context);
        }
      }
      for (const { page } of browsers) await (await (await page.$('iframe')).contentFrame()).goto('about:blank');
      const released = await fetch(base + '/_emdash/preview-release', {
        method: 'POST',
        headers,
        body: JSON.stringify({ context: document.context }),
      });
      assert.equal(released.status, 204);
      const expired = await fetch(document.url);
      assert.equal(expired.status, 410);
      await expired.body?.cancel();
      results.push({
        collection,
        view,
        ms: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(html),
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
  if (browsers.length) await comparePublicPreviews();
  const newsletter = (await get('content/newsletter?limit=1')).items[0];
  const newsletterBefore = await get(`content/newsletter/${newsletter.id}`);
  restoreNewsletter = {
    id: newsletter.id,
    data: {
      ...clean(newsletterBefore.item.data),
      description_rich: newsletterBefore.item.data.description_rich ?? null,
    },
  };
  for (const { name, page } of browsers) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/content/?collection=newsletter&id=${encodeURIComponent(newsletter.id)}`);
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await page.getByRole('button', { name: 'Mobile', exact: true }).click();
    const description = page.getByRole('textbox', { name: 'Description', exact: true });
    const preview = page.frameLocator('iframe[title="Private site appearance preview"]');
    await description.press('ControlOrMeta+a');
    await description.press('Backspace');
    await description.pressSequentially(`${name} unsaved newsletter description A`, { delay: 15 });
    await preview.getByText(`${name} unsaved newsletter description A`, { exact: true }).waitFor();
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        proseText(response.request().postDataJSON()?.data?.description_rich) ===
          `${name} unsaved newsletter description B`,
    );
    await description.press('ControlOrMeta+a');
    await description.press('Backspace');
    await description.pressSequentially(`${name} unsaved newsletter description B`);
    await preview.getByText(`${name} unsaved newsletter description B`, { exact: true }).waitFor();
    assert.equal((await saved).status(), 200);
    assert.equal(
      proseText((await get(`content/newsletter/${newsletter.id}`)).item.data.description_rich),
      `${name} unsaved newsletter description B`,
    );
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    assert.equal(
      await preview.getByText(`${name} unsaved newsletter description B`, { exact: true }).isVisible(),
      true,
    );
    const wasBold = (await description.locator('strong').count()) > 0;
    await description.press('ControlOrMeta+a');
    const formattingSaved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response
          .request()
          .postDataJSON()
          ?.data?.description_rich?.some((block) => block.children?.some((span) => span.marks?.includes('strong'))) ===
          !wasBold,
    );
    await description.press('ControlOrMeta+b');
    assert.equal((await formattingSaved).status(), 200);
    await preview
      .locator('strong')
      .filter({ hasText: `${name} unsaved newsletter description B` })
      .waitFor({ state: wasBold ? 'detached' : 'visible' });
    assert.equal(
      (await get(`content/newsletter/${newsletter.id}`)).item.data.description,
      newsletterBefore.item.data.description,
      'Rich edits leave the legacy string unchanged',
    );
    console.error(`Passed ${name} real newsletter edits and formatting-only autosave`);
  }
  // Editor typing autosaves privately; preview POSTs above never save or publish.
  assert.deepEqual(await get('blackbox/publications'), history, 'UI previews must not publish');
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  console.error(error);
  throw error;
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
