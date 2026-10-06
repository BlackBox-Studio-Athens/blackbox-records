import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { editorialWriteData } from '../../staff/src/lib/backend/editorial-api.ts';
import { formattedProse } from '../../../scripts/fixtures/prose.ts';
import { proseText, sourceCollectionNames } from '@blackbox/content-model';

const leasedPreviews = new Set();
const fetch = async (input, init = {}) => {
  try {
    const response = await globalThis.fetch(input, { ...init, signal: AbortSignal.timeout(30000) });
    if (init.method === 'POST' && new URL(input).pathname === '/_emdash/preview' && response.ok) {
      leasedPreviews.add((await response.clone().json()).context);
    }
    if (init.method === 'POST' && new URL(input).pathname === '/_emdash/preview-release' && response.ok) {
      leasedPreviews.delete(JSON.parse(init.body).context);
    }
    return response;
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
async function releaseLeasedPreviews() {
  for (const context of leasedPreviews) {
    const released = await fetch(`${base}/_emdash/preview-release`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ context }),
    });
    await released.body?.cancel();
    leasedPreviews.delete(context);
  }
}
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
async function publishedItem(collection) {
  let cursor;
  do {
    const params = new URLSearchParams({ collection, limit: '25', sort: 'title' });
    if (cursor) params.set('cursor', cursor);
    const page = await get(`blackbox/workspace?${params}`);
    const item = page.items.find((item) => item.publicationState === 'published');
    if (item) return (await get(`content/${collection}/${item.id}`)).item;
    cursor = page.nextCursor;
  } while (cursor);
  throw new Error(`Public comparison requires an unchanged published Local ${collection} entry`);
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
        const item = await publishedItem(collection);
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
            // With an empty cart the header cart control exists only on store routes, so it is the hydration
            // signal there; elsewhere hydrated islands are.
            for (const target of [frame, publicPage]) {
              await target.waitForFunction(() => !window.document.querySelector('astro-island[client="load"][ssr]'));
              if (label.startsWith('store-'))
                await target.locator('header').getByRole('button', { name: 'Cart', exact: true }).waitFor();
            }
            if (label === 'store-detail') {
              for (const target of [frame, publicPage]) {
                await target.getByText('Checking availability', { exact: true }).waitFor({ state: 'hidden' });
              }
            }
            if (overlay) {
              const selector = `a[href*="/releases/${item.slug}/"]`;
              await frame.locator(selector).first().click();
              await publicPage.locator(selector).first().click();
              await frame.locator('.app-shell-content-overlay__panel h1').waitFor();
              await publicPage.locator('.app-shell-content-overlay__panel h1').waitFor();
            }
            if (label === 'store-listing') {
              for (const target of [frame, publicPage]) {
                // Compare complete catalog geometry rather than remembered offscreen size estimates.
                await target.addStyleTag({
                  content: '.store-item-card--listing{content-visibility:visible;contain-intrinsic-block-size:none}',
                });
                await target.locator('[data-distro-search]').scrollIntoViewIfNeeded();
                await target.getByRole('searchbox', { name: 'Search Store', exact: true }).waitFor();
                await target.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await target.waitForFunction(() => scrollY === 0);
              }
            }
            for (const target of [frame, publicPage]) {
              await target.waitForFunction(() =>
                [...document.querySelectorAll('link[href^="https://fonts.googleapis.com/css"]')].every(
                  (link) => link.sheet,
                ),
              );
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
            }
            const scope = overlay ? '.app-shell-content-overlay__panel' : 'main';
            if (label === 'home') {
              for (const target of [frame, publicPage]) {
                await target.locator('#newsletter-signup-area').scrollIntoViewIfNeeded();
                await target.getByRole('textbox', { name: 'Email address', exact: true }).waitFor();
                await target.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
                await target.waitForFunction(() => scrollY === 0);
              }
            }
            // content-visibility:auto can omit different offscreen card text from innerText.
            const property = label === 'store-listing' ? 'textContent' : 'innerText';
            const readText = (target) =>
              target.locator(scope).evaluate((element, property) => element[property], property);
            const text = await readText(publicPage);
            try {
              await frame.waitForFunction(
                ({ scope, text, property }) => document.querySelector(scope)?.[property] === text,
                { scope, text, property },
                { timeout: 30000 },
              );
            } catch (error) {
              await writeFile(
                resolve(artifacts, 'content-failure.json'),
                JSON.stringify(
                  {
                    name,
                    label,
                    width,
                    public: await readText(publicPage),
                    preview: await readText(frame),
                    previewCards: await frame.locator('[data-distro-search-item]').count(),
                    publicCards: await publicPage.locator('[data-distro-search-item]').count(),
                  },
                  null,
                  2,
                ),
              );
              throw error;
            }
            assert.equal(await readText(frame), await readText(publicPage), `${name}/${label}/${width} content`);
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
                  width: image.offsetWidth,
                  height: image.offsetHeight,
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
            // Firefox can rasterize the iframe's dialog a pixel higher; exact content and geometry are checked above.
            assert.ok(different / (a.length / 3) < 0.06, `${name}/${label}/${width} visual parity`);
            if (!overlay) {
              for (const target of [frame, publicPage])
                await target.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
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
  const item = await publishedItem('releases');
  const response = await fetch(`${base}/_emdash/preview?view=listing`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      collection: 'releases',
      id: item.id,
      slug: item.slug,
      data: {
        ...editorialWriteData(item.data),
        body: [
          {
            _type: 'iframe',
            _key: 'video-fixture',
            src: 'https://youtu.be/dQw4w9WgXcQ?autoplay=1',
            title: 'Editorial video fixture',
          },
        ],
      },
    }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const document = await response.json();
  const providerRequests = [];
  const providerPattern = /https:\/\/(?:bandcamp\.com|embed\.tidal\.com)\//;
  await page.route(providerPattern, async (route) => {
    providerRequests.push(route.request());
    await route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' });
  });
  const videoPattern = 'https://www.youtube-nocookie.com/embed/**';
  const videoRequests = [];
  await page.route(videoPattern, async (route) => {
    videoRequests.push(route.request().url());
    await route.fulfill({ contentType: 'text/html', body: '<p>Video fixture</p>' });
  });
  try {
    const shared = await page.context().newPage();
    try {
      const detailUrl = new URL(document.url);
      detailUrl.pathname = `/blackbox-records/releases/${item.slug}/`;
      await shared.goto(detailUrl.href);
      await shared.getByRole('button', { name: 'Load video', exact: true }).click();
      assert.equal(
        await shared.locator('[data-editorial-video] iframe').count(),
        0,
        'Shared private preview remains inert',
      );
    } finally {
      await shared.close();
    }
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
    await frame.locator(`[data-release-id="${item.slug}"] .release-card-image-shell`).click();
    await frame.getByRole('button', { name: 'Load video', exact: true }).waitFor();
    assert.equal(videoRequests.length, 0, 'Videos stay unloaded until explicit activation');
    await frame.getByRole('button', { name: 'Load video', exact: true }).click();
    await frame.locator('[data-editorial-video] iframe').waitFor();
    assert.equal(await originalPlayer.evaluate((element) => element.isConnected), true);
    assert.equal(
      await frame.locator('[data-editorial-video] iframe').getAttribute('src'),
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
    await frame.getByRole('button', { name: 'Close detail view', exact: true }).click();
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
      { waitUntil: 'domcontentloaded' },
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
    await page.unroute(videoPattern);
    await (await (await page.$('iframe')).contentFrame()).goto('about:blank');
    await fetch(`${base}/_emdash/preview-release`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ context: document.context }),
    });
  }
}
let restoreNewsletter;
async function checkStock(page, name) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/stock/?q=Disintegration&area=all`);
  await page.getByRole('button', { name: /Disintegration.*copies on hand/ }).click();
  const quantity = page.getByRole('spinbutton', { name: 'How many?', exact: true });
  const notes = page.getByRole('textbox', { name: 'Notes (optional)', exact: true });
  await quantity.fill('2');
  await notes.fill('Unfinished phone acceptance work');
  await page.getByRole('button', { name: 'Find another item', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: 'Search items', exact: true }).inputValue(), 'Disintegration');
  const returnToItem = page.getByRole('button', { name: 'Return to selected item', exact: true });
  await returnToItem.focus();
  await returnToItem.press('Enter');
  assert.equal(await quantity.inputValue(), '2');
  assert.equal(await notes.inputValue(), 'Unfinished phone acceptance work');
  assert.match(page.url(), /q=Disintegration/);
  assert.equal(await page.getByRole('textbox', { name: 'Search items', exact: true }).isVisible(), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: resolve('.codex-artifacts/staff-workspace', `${name}-stock-phone.png`) });
  await quantity.fill('');
  await notes.fill('');
  console.error(`Passed ${name} 390px Stock workbench, retained finder/work and keyboard return`);
}
async function checkStaffUploads(page, name) {
  const release = await publishedItem('releases');
  const other = (await get('content/releases?limit=25')).items.find((item) => item.id !== release.id);
  assert.ok(other, 'Entry-switch acceptance requires two Local releases');
  const documents = new Map(
    await Promise.all([release, other].map(async (item) => [item.id, await get(`content/releases/${item.id}`)])),
  );
  const media = (await get('media?limit=3')).items;
  assert.equal(media.length, 3);
  const buffer = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#222' } })
    .png()
    .toBuffer();
  const file = (name) => ({ name, mimeType: 'image/png', buffer });
  const attempts = [];
  const saves = [];
  let failed = false;
  let releaseUpload;
  const mediaPattern = '**/_emdash/api/media';
  const contentPattern = '**/_emdash/api/content/releases/*';
  await page.route(contentPattern, async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    const id = new URL(route.request().url()).pathname.split('/').at(-1);
    const document = documents.get(id);
    assert.ok(document, 'Only acceptance entries can be edited');
    const data = route.request().postDataJSON().data;
    saves.push({ id, data });
    await route.fulfill({ json: { success: true, data: { ...document, item: { ...document.item, data } } } });
  });
  await page.route(mediaPattern, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataBuffer().toString('latin1');
    const filename = body.match(/name="file"; filename="([^"]+)"/)?.[1];
    assert.ok(filename);
    assert.match(body, /name="thumbnail"; filename="thumbnail.png"/, 'Every editor upload uses the thumbnail uploader');
    attempts.push(filename);
    if (filename === 'failed.png' && !failed) {
      failed = true;
      return route.fulfill({ status: 503, json: { success: false } });
    }
    if (filename === 'late.png')
      await new Promise((resolve) => {
        releaseUpload = resolve;
      });
    const index = filename === 'failed.png' ? 1 : filename === 'last.png' || filename === 'cover-two.png' ? 2 : 0;
    await route.fulfill({ json: { success: true, data: { item: { ...media[index], filename } } } }).catch(() => {});
  });
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/content/?collection=releases&id=${release.id}`);
    await page.getByRole('heading', { name: release.data.title, exact: true }).waitFor();
    const closePreview = page.getByRole('button', { name: 'Close preview', exact: true }).first();
    if (await closePreview.isVisible()) await closePreview.click();
    const gallery = page.getByLabel('Upload photos', { exact: true });
    const initial = editorialWriteData(release.data).gallery ?? [];
    const firstSave = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.request().postDataJSON()?.data?.gallery?.length === initial.length + 2,
    );
    await gallery.setInputFiles([file('first.png'), file('failed.png'), file('last.png')]);
    await page.getByRole('button', { name: 'Retry failed images', exact: true }).waitFor();
    await firstSave;
    assert.deepEqual(
      saves
        .at(-1)
        .data.gallery.slice(initial.length)
        .map((row) => row.image.id),
      [media[0].id, media[2].id],
    );
    const retrySave = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.request().postDataJSON()?.data?.gallery?.length === initial.length + 3,
    );
    await page.getByRole('button', { name: 'Retry failed images', exact: true }).click();
    await retrySave;
    assert.deepEqual(attempts, ['first.png', 'failed.png', 'last.png', 'failed.png']);
    assert.equal(saves.at(-1).data.gallery.at(-1).image.id, media[1].id);
    await page.getByRole('button', { name: 'Change cover image', exact: true }).click();
    const cover = page.getByRole('dialog', { name: 'Choose cover image', exact: true });
    await cover.getByRole('button', { name: 'Upload', exact: true }).click();
    await cover.locator('input[type=file]:not(:disabled)').waitFor();
    await cover
      .getByLabel('Upload photos', { exact: true })
      .setInputFiles([file('cover-one.png'), file('cover-two.png')]);
    await cover.getByText('2 photos added in order.', { exact: true }).waitFor();
    assert.equal(await cover.isVisible(), true, 'A batch never selects several images for a cover');
    await cover.getByRole('button', { name: 'cover-one.png', exact: true }).click();
    await cover.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Full text', exact: true }).click();
    const fullText = page.getByRole('region', { name: 'Full text', exact: true });
    await fullText.getByRole('button', { name: 'Insert Image', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'Select image', exact: true });
    assert.ok(
      await picker.evaluate((dialog) => {
        const box = dialog.getBoundingClientRect();
        return dialog.contains(document.elementFromPoint(box.x + box.width / 2, box.y + 30));
      }),
      'Native image dialog must appear above sticky toolbars',
    );
    await picker.getByLabel('Choose files to upload', { exact: true }).setInputFiles(file('native.png'));
    await picker.getByRole('button', { name: 'Insert image', exact: true }).click();
    await picker.waitFor({ state: 'hidden' });
    await fullText.locator('[contenteditable] img').first().waitFor();
    assert.equal(attempts.filter((filename) => filename === 'native.png').length, 1);
    const saveCount = saves.length;
    await gallery.setInputFiles(file('late.png'));
    await page.getByRole('status').filter({ hasText: 'late.png' }).waitFor();
    await page.goto(`${base}/content/?collection=releases&id=${other.id}`);
    releaseUpload();
    await page.getByRole('textbox', { name: 'Release title', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('textbox', { name: 'Release title', exact: true }).inputValue(),
      other.data.title,
    );
    assert.ok(!saves.slice(saveCount).some((save) => save.id === other.id), 'Late results cannot edit another entry');
    console.error(
      `Passed ${name} batch order, partial failure/retry, singular cover, native uploader and entry switching`,
    );
  } finally {
    releaseUpload?.();
    await page.unroute(mediaPattern);
    await page.unroute(contentPattern);
  }
}
async function checkCalendar(page, name) {
  const items = Array.from({ length: 101 }, (_, index) => ({
    id: crypto.randomUUID(),
    status: 'live',
    requestedAt: Date.parse('2026-10-25T01:30:00Z'),
    entries: [{ collection: 'news', recordId: `fixture-${index}`, title: `Repeated update ${index}` }],
  }));
  const pattern = '**/_emdash/api/blackbox/publications/calendar?*';
  let failNextPage = true;
  await page.route(pattern, async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor');
    if (!cursor) return route.fulfill({ json: { items: items.slice(0, 100), nextCursor: 'next-page' } });
    if (failNextPage) {
      failNextPage = false;
      return route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } });
    }
    return route.fulfill({ json: { items: items.slice(100) } });
  });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/calendar/?month=2026-10`);
    await page.getByRole('alert').filter({ hasText: 'incomplete' }).waitFor();
    assert.equal(await page.locator('.publication-calendar-event').count(), 100);
    assert.equal(await page.getByRole('combobox', { name: 'View', exact: true }).inputValue(), 'agenda');
    await page.getByRole('button', { name: 'Retry calendar', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.publication-calendar-event').length === 101);
    assert.equal(await page.getByRole('alert').count(), 0);
    assert.match(page.url(), /month=2026-10/);
    assert.match(page.url(), /view=agenda/);
    await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('releases');
    await page.waitForURL(/collection=releases/);
    await page.screenshot({ path: resolve('.codex-artifacts/staff-workspace', `${name}-calendar-phone.png`) });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('combobox', { name: 'View', exact: true }).selectOption('month');
    await page.waitForURL(/view=month/);
    assert.equal(await page.locator('.publication-calendar-grid').isVisible(), true);
    console.error(`Passed ${name} calendar pagination, partial failure/retry, phone agenda and URL state`);
  } finally {
    await page.unroute(pattern);
  }
}
if (process.argv.includes('--browsers')) {
  const { chromium, firefox } = await import('playwright');
  for (const type of [chromium, firefox]) {
    if (process.env.PREVIEW_BROWSER && process.env.PREVIEW_BROWSER !== type.name()) continue;
    const browser = await type.launch();
    const context = await browser.newContext();
    // Routing disables the browser HTTP cache. Reuse real font responses within this
    // run so iframe replacement does not repeatedly cancel cross-origin downloads.
    const fontResponses = new Map();
    await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
      const url = route.request().url();
      let cached = fontResponses.get(url);
      if (!cached) {
        const response = await route.fetch({ maxRetries: 2 });
        assert.equal(response.status(), 200, `Font resource: ${url}`);
        cached = {
          response,
          body: url.startsWith('https://fonts.googleapis.com/')
            ? (await response.text()).replaceAll('font-display: optional', 'font-display: swap')
            : await response.body(),
        };
        fontResponses.set(url, cached);
      }
      await route.fulfill(cached);
    });
    const page = await context.newPage();
    page.on('response', async (response) => {
      if (response.request().method() !== 'POST') return;
      const path = new URL(response.url()).pathname;
      if (path === '/_emdash/preview' && response.ok()) {
        const document = await response.json().catch(() => null);
        if (document?.context) leasedPreviews.add(document.context);
      } else if (path === '/_emdash/preview-release' && response.ok()) {
        leasedPreviews.delete(response.request().postDataJSON()?.context);
      }
    });
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
    await page.goto(`${base}/content/`, { waitUntil: 'domcontentloaded' });
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
    if (typeof data.title === 'string' && collection !== 'socials') data.title += ' — unsaved preview smoke';
    if (collection === 'artists') data.bio_rich = formattedProse;
    if (collection === 'releases' || collection === 'distro') data.summary_rich = formattedProse;
    if (collection === 'releases')
      data.body = [
        {
          _type: 'image',
          _key: 'image-fixture',
          asset: { _ref: data.cover_image.id },
          alt: 'Editorial image fixture',
          caption: 'Editorial caption fixture',
          title: 'Editorial image title',
          alignment: 'right',
          displayWidth: 320,
          displayHeight: 320,
          link: { href: '/releases/', blank: true },
        },
        {
          _type: 'iframe',
          _key: 'video-fixture',
          src: 'https://vimeo.com/123456?autoplay=1',
          title: 'Editorial video fixture',
        },
      ];
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
      if (collection === 'releases' && view === 'detail') {
        assert.match(html, /Editorial caption fixture/);
        assert.match(html, /Editorial image title/);
        assert.match(html, /Load video/);
        assert.ok(!/<iframe[^>]+src="https:\/\/(?:player\.vimeo\.com|www\.youtube-nocookie\.com)/.test(html));
      }
      assert.match(rendered.headers.get('Content-Security-Policy'), /script-src 'self'/);
      assert.match(html, /<!DOCTYPE html>/i);
      if (collection === 'distro' && view === 'listing') {
        // Store listing cards show the projected title; rich description belongs to detail.
        assert.match(html, /<h2\b[^>]*>[^<]*unsaved preview smoke<\/h2>/, 'distro/listing: projected card title');
      } else if (['artists', 'releases', 'distro', 'about', 'purchase_information'].includes(collection)) {
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
    for (const command of ['Insert Image', 'Insert HTML', 'Insert Table', 'Code Block']) {
      assert.equal(
        await page.getByRole('button', { name: command, exact: true }).count(),
        0,
        `Short descriptions cannot insert ${command}`,
      );
    }
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
    await page.setViewportSize({ width: 2134, height: 982 });
    await page.getByRole('button', { name: 'Close preview', exact: true }).first().click();
    assert.equal(await page.locator('.cms-preview-panel').isVisible(), false);
    assert.equal(await page.locator('.cms-resize-handle').isVisible(), false);
    assert.ok(
      await page
        .locator('.cms-edit-panel')
        .evaluate(
          (panel) => panel.getBoundingClientRect().width / panel.parentElement.getBoundingClientRect().width > 0.95,
        ),
    );
    assert.ok(
      await page
        .locator('.cms-editor-body')
        .evaluate(
          (body) =>
            body.getBoundingClientRect().width / body.closest('.cms-edit-panel').getBoundingClientRect().width > 0.95,
        ),
      'Closing preview must remove the form width cap on wide desktops',
    );
    await mkdir(resolve('.codex-artifacts/staff-workspace'), { recursive: true });
    await page.screenshot({ path: resolve('.codex-artifacts/staff-workspace', `${name}-closed-preview-desktop.png`) });
    let previewRequests = 0;
    const countPreview = (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/_emdash/preview') previewRequests++;
    };
    page.on('request', countPreview);
    const closedCopy = `${name} edits while preview is closed`;
    const closedSave = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        proseText(response.request().postDataJSON()?.data?.description_rich) === closedCopy,
    );
    await description.press('ControlOrMeta+a');
    await description.pressSequentially(closedCopy);
    assert.equal((await closedSave).status(), 200);
    assert.equal(previewRequests, 0, 'Closed preview must stop preview requests while editing');
    page.off('request', countPreview);
    await page.getByRole('button', { name: 'Show preview', exact: true }).click();
    await preview.getByText(closedCopy, { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: 'Preview', exact: true }).click();
    await page.getByRole('button', { name: 'Close preview', exact: true }).last().click();
    assert.equal(await description.isVisible(), true, 'Closing phone Preview returns to Edit');
    assert.equal(await description.textContent(), closedCopy);
    await page.screenshot({ path: resolve('.codex-artifacts/staff-workspace', `${name}-closed-preview-phone.png`) });
    await checkCalendar(page, name);
    await checkStock(page, name);
    await checkStaffUploads(page, name);
    await releaseLeasedPreviews();
    console.error(`Passed ${name} real newsletter edits and formatting-only autosave`);
  }
  // Editor typing autosaves privately; preview POSTs above never save or publish.
  assert.deepEqual(await get('blackbox/publications'), history, 'UI previews must not publish');
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await Promise.all(
    browsers.map(async ({ browser, page }) => {
      await page.context().unrouteAll({ behavior: 'ignoreErrors' });
      await browser.close();
    }),
  );
  await releaseLeasedPreviews();
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
