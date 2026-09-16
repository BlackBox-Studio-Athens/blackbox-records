// Local-only browser regression: pnpm build:staff && node scripts/test-content-workspace.mjs
// Pass --serve for a fixture workspace at http://127.0.0.1:4399/content/.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, firefox } from 'playwright';
import { previewPolicy } from '../apps/backend/src/cms/preview-policy.ts';

const root = resolve('apps/staff/dist');
const browserType = process.argv.includes('--firefox') ? firefox : chromium;
const artifacts = resolve('.codex-artifacts/content-workspace', browserType.name());
const pixels = await readFile('apps/staff/public/favicon-96x96.png');
const media = [
  {
    id: 'artist-photo',
    filename: 'Ouranopithecus-band-photo.jpg',
    alt: 'Ouranopithecus band portrait',
    storageKey: 'artist-photo.jpg',
  },
  {
    id: 'record-cover',
    filename: 'mass-culture-barren-point-cover.jpg',
    alt: 'Barren Point sleeve',
    storageKey: 'record-cover.jpg',
  },
  {
    id: 'chronoboros',
    filename: 'Chronoboros-band-logo.jpg',
    alt: 'Chronoboros artwork',
    storageKey: 'chronoboros.jpg',
  },
];
const images = {
  'artist-photo.jpg': 'artists/Ouranopithecus-band-photo.jpg',
  'record-cover.jpg': 'releases/mass-culture-barren-point-cover.jpg',
  'chronoboros.jpg': 'artists/Chronoboros-band-logo.jpg',
};
const artist = {
  title: 'Ouranopithecus',
  genre: 'Post-rock',
  country: 'Greece',
  image: { id: media[0].id },
  image_alt: 'Band portrait',
  bio: 'Independent music from Athens. New recordings, live shows, and a shared love of loud guitars.',
  profile_links: [{ label: 'Bandcamp', url: 'https://example.com' }],
  videos: [],
  upcoming_release: '',
  body: [
    {
      _type: 'block',
      _key: 'paragraph',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'text', text: 'Music made together in Athens.', marks: [] }],
    },
  ],
};
const data = {
  artists: artist,
  releases: {
    title: 'Barren Point',
    artist: 'artists-1',
    release_date: '2026-09-01',
    cover_image: { id: media[1].id },
    cover_image_alt: 'Barren Point sleeve',
    formats: ['Vinyl'],
    credits: [],
    body: artist.body,
  },
  news: {
    title: 'New recordings from Athens',
    date: '2026-09-15',
    summary: 'A new chapter for the label.',
    image: { id: media[0].id },
    image_alt: 'Band portrait',
    body: artist.body,
  },
  distro: {
    title: 'Barren Point LP',
    artist_or_label: 'Mass Culture',
    group: 'Vinyl',
    image: { id: media[1].id },
    image_alt: 'Album sleeve',
    summary: 'A record from our distro shelf.',
    gallery: [],
    order: 1,
  },
  socials: { title: 'Bandcamp', url: 'https://example.com', order: 1 },
  navigation: { title: 'Artists', url: '/artists/', order: 1, show_in_header: true, show_in_footer: true },
  settings: {
    label_name: 'BlackBox Records',
    established_year: 2018,
    url: 'https://example.com',
    logo: '/logo.png',
    location: { locality: 'Athens', country: 'Greece' },
  },
  home: {
    hero: {
      tagline: 'Music made together',
      image: { id: media[0].id },
      image_alt: 'Band portrait',
      scroll_indicator_text: 'Explore',
    },
    news: { title: 'News', link_text: 'Read more', link_url: '/news/' },
    artists: { title: 'Artists', button_text: 'Meet the roster', button_link: '/artists/' },
  },
  about: {
    hero: {
      title: 'About BlackBox',
      section_label: 'The label',
      image: { id: media[0].id },
      image_alt: 'Band portrait',
    },
    lead: { text: 'A collective in Athens.' },
    story: { title: 'Our story', paragraphs: ['We make records.'] },
    contact: { title: 'Contact', intro: 'Talk to us', items: [] },
    stats: { items: [] },
  },
  services: {
    hero: { title: 'Services', intro: 'Working together', cta_text: 'Contact' },
    services: { items: [] },
    process: { title: 'Process', intro: 'Make a record', steps: [] },
    inquiry: { title: 'Get in touch', intro: 'Tell us more', email: 'label@example.com', submit_text: 'Send' },
  },
  distro_page: { hero: { title: 'Distro', intro: 'Records we love.' }, group_intros: { vinyl: 'Vinyl records' } },
  newsletter: {
    section_label: 'Keep in touch',
    title: 'Newsletter',
    description: 'News from the label',
    placeholder: 'you@example.com',
    button_label: 'Subscribe',
    note: 'Occasional updates.',
  },
  purchase_information: {
    publication: 'pending',
    content: {
      revision: '2026-09-15',
      seller: { name: 'BlackBox', address: 'Athens', support_email: 'label@example.com' },
      terms: {},
      privacy: {},
    },
  },
};
const records = Object.fromEntries(
  Object.entries(data).map(([collection, data]) => [
    collection,
    [{ id: `${collection}-1`, slug: `${collection}-slug`, data, _rev: '1' }],
  ]),
);
records.artists.push({
  ...structuredClone(records.artists[0]),
  id: 'artists-2',
  slug: 'mass-culture',
  data: { ...structuredClone(artist), title: 'Mass Culture' },
});
const state = {
  conflict: false,
  failSave: false,
  failUpload: false,
  mediaFailure: false,
  publication: 'pending',
  saveCount: 0,
  lastWrite: null,
  publicTitle: artist.title,
  previewRequests: [],
  diagnostics: [],
  previewStyleFailure: false,
  previewImageFailure: false,
  previewFontDisplay: null,
  searchDelay: 0,
  historyDelay: 0,
  detailDelay: 0,
  searchFailure: false,
  historyFailure: false,
  requests: [],
};
const publications = [];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  const ok = (data) => json({ success: true, data });
  const fail = (status) => json({ success: false, error: { message: 'Fixture request failed. Try again.' } }, status);
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    const body = req.headers['content-type']?.includes('application/json') && bytes.length ? JSON.parse(bytes) : null;
    if (url.pathname === '/__fixture' && process.argv.includes('--serve')) {
      if (['pending', 'failed', 'live'].includes(body?.publication)) state.publication = body.publication;
      if (typeof body?.mediaFailure === 'boolean') state.mediaFailure = body.mediaFailure;
      for (const key of ['previewStyleFailure', 'previewImageFailure', 'searchFailure', 'historyFailure'])
        if (typeof body?.[key] === 'boolean') state[key] = body[key];
      for (const key of ['searchDelay', 'historyDelay', 'detailDelay'])
        if (typeof body?.[key] === 'number') state[key] = Math.min(10_000, Math.max(0, body[key]));
      return ok({
        saveCount: state.saveCount,
        previewRequests: state.previewRequests.length,
        requests: state.requests,
      });
    }
    state.requests.push({ path: url.pathname, at: Date.now() });
    if (url.pathname === '/preview-test.css') {
      if (state.previewStyleFailure) return fail(503);
      res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-store' });
      return res.end(
        'body {background: #121212; color: white}' +
          (state.previewFontDisplay
            ? `@font-face {font-family: PreviewFont; src: url('/preview-font.woff2'); font-display: ${state.previewFontDisplay};} body {font-family: PreviewFont, sans-serif}`
            : ''),
      );
    }
    if (url.pathname === '/preview-font.woff2') return fail(503);
    if (url.pathname === '/preview-test.png') {
      if (state.previewImageFailure) return fail(503);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(pixels);
    }
    if (url.pathname === '/api/internal/variants') {
      await new Promise((resolve) => setTimeout(resolve, state.searchDelay));
      if (state.searchFailure) return fail(503);
      return json(
        ['first', 'second'].map((variantId) => ({
          variantId,
          storeItemSlug: variantId,
          displayName: variantId,
          sourceKind: 'release',
        })),
      );
    }
    if (/^\/api\/internal\/variants\/[^/]+\/stock(?:\/history)?$/.test(url.pathname)) {
      const variantId = url.pathname.split('/')[4];
      if (url.pathname.endsWith('/history')) {
        await new Promise((resolve) => setTimeout(resolve, state.historyDelay));
        return state.historyFailure ? fail(503) : json({ entries: [] });
      }
      await new Promise((resolve) => setTimeout(resolve, state.detailDelay));
      return json({
        variantId,
        storeItemSlug: variantId,
        displayName: variantId,
        stock: {
          quantity: variantId === 'first' ? 17 : 29,
          onlineQuantity: 5,
          revision: 3,
          updatedAt: '2026-09-15T12:00:00Z',
        },
      });
    }
    if (url.pathname === '/_emdash/preview-diagnostics') {
      state.diagnostics.push(body);
      res.writeHead(204);
      return res.end();
    }
    if (url.pathname === '/_emdash/preview') {
      res.setHeader('X-Preview-Request-Id', '00000000-0000-4000-8000-000000000001');
      res.setHeader('X-Preview-Generation', req.headers['x-preview-generation'] ?? '0');
      res.setHeader('X-Release-SHA', 'local');
      state.previewRequests.push(body);
      const title = String(body.data.title ?? body.collection);
      if (title === 'invalid preview') return json({ error: 'Check the preview fields.' }, 422);
      if (title === 'expired preview') return json({ error: 'Sign in again.' }, 403);
      if (title === 'unexpected preview') return json({ error: null });
      if (title === 'slow preview') await new Promise((resolve) => setTimeout(resolve, 1500));
      res.writeHead(200, { 'Content-Type': 'text/html', 'X-Preview-Environment': 'local' });
      const escaped = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      const description = String(body.data.description ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
      return res.end(
        `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${previewPolicy(origin)}"><link rel="stylesheet" href="/preview-test.css"></head><body style="min-height:2000px"><h1>${escaped}</h1><p id="newsletter-signup-area">${description}</p><img src="/preview-test.png" alt="Preview fixture" loading="eager"></body></html>`,
      );
    }
    if (['/_emdash/api/blackbox/publications', '/_emdash/api/blackbox/content-publications'].includes(url.pathname)) {
      if (body) {
        assert.equal(url.pathname, '/_emdash/api/blackbox/content-publications');
        for (const record of body.records ?? [body]) {
          const selected = records[record.collection].find((item) => item.id === record.recordId);
          assert.equal(record.expectedRevision, selected._rev);
        }
        if (state.publication !== 'pending')
          for (const publication of publications)
            if (publication.status === 'pending') publication.status = state.publication;
        publications.unshift({ id: body.id, status: state.publication, requestedAt: Date.now() });
        if (state.publication === 'live') state.publicTitle = records.artists[0].data.title;
        return json(publications[0]);
      }
      return json({ items: publications });
    }
    if (url.pathname.startsWith('/_emdash/api/media/file/')) {
      const key = url.pathname.split('/').at(-1);
      res.writeHead(200, { 'Content-Type': key.endsWith('.jpg') ? 'image/jpeg' : 'image/png' });
      return res.end(images[key] ? await readFile(resolve('apps/web/src/content', images[key])) : pixels);
    }
    if (url.pathname === '/_emdash/api/media') {
      if (req.method === 'POST') {
        if (state.failUpload) return fail(500);
        const uploaded = { id: 'uploaded', filename: 'uploaded.png', alt: null, storageKey: 'uploaded.png' };
        media.unshift(uploaded);
        return ok({ item: uploaded });
      }
      if (state.mediaFailure) return fail(500);
      const matching = media.filter((item) =>
        item.filename.toLowerCase().includes((url.searchParams.get('q') || '').toLowerCase()),
      );
      const offset = Number(url.searchParams.get('cursor') || 0);
      return ok({
        items: matching.slice(offset, offset + 2),
        ...(matching.length > offset + 2 ? { nextCursor: String(offset + 2) } : {}),
      });
    }
    if (url.pathname.startsWith('/_emdash/api/media/'))
      return ok({ item: media.find((item) => item.id === url.pathname.split('/').at(-1)) });
    if (url.pathname.startsWith('/_emdash/api/content/')) {
      const [, , , , collection, id, action] = url.pathname.split('/');
      const list = records[collection] || [];
      const item = list.find((row) => row.id === id || row.slug === id);
      if (action === 'publish') {
        item.liveRevisionId = 'live-1';
        return ok({ item, _rev: item._rev });
      }
      if (req.method === 'PUT') {
        if (state.conflict) return fail(409);
        if (state.failSave) return fail(500);
        assert.equal(body._rev, item._rev);
        state.lastWrite = body;
        state.saveCount++;
        item.data = body.data;
        item._rev = String(Number(item._rev) + 1);
        return ok({ item, _rev: item._rev });
      }
      if (req.method === 'DELETE') {
        assert.equal(body.confirm, true);
        records[collection] = list.filter((row) => row !== item);
        return ok({});
      }
      if (req.method === 'POST') {
        const created = { id: body.slug, slug: body.slug, data: body.data, _rev: '1' };
        list.unshift(created);
        return ok({ item: created, _rev: '1' });
      }
      if (id) return item ? ok({ item, _rev: item._rev }) : fail(404);
      const matching = list.filter((item) =>
        String(item.data.title || '')
          .toLowerCase()
          .includes((url.searchParams.get('q') || '').toLowerCase()),
      );
      const offset = Number(url.searchParams.get('cursor') || 0);
      return ok({
        items: matching.slice(offset, offset + 1),
        ...(matching.length > offset + 1 ? { nextCursor: String(offset + 1) } : {}),
      });
    }
    if (url.pathname.startsWith('/_emdash/api/')) return ok({ items: [] });
    const path = resolve(root, '.' + decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    if (!path.startsWith(root + sep)) return fail(403);
    res.writeHead(200, {
      'Content-Type':
        {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
        }[extname(path)] || 'application/octet-stream',
    });
    res.end(await readFile(path));
  } catch (error) {
    res.statusCode = 500;
    res.end(String(error));
  }
});
await new Promise((resolve) => server.listen(process.argv.includes('--serve') ? 4399 : 0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
if (process.argv.includes('--serve')) console.log(`Local CMS fixtures: ${origin}/content/`);
else {
  const browser = await browserType.launch({ headless: true });
  let page;
  try {
    await mkdir(artifacts, { recursive: true });
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    state.searchDelay = 1500;
    state.historyDelay = 1500;
    state.detailDelay = 50;
    await page.goto(`${origin}/stock/?variantId=first`);
    await page.waitForFunction(() => document.querySelector('#stock-count-counted-quantity')?.value === '17');
    await page.getByRole('button', { name: 'Count stock', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Save count', exact: true }).isEnabled(), true);
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.getByText('Loading stock history', { exact: true }).isVisible(), true);
    assert.equal(await page.getByRole('button', { name: 'Searching items', exact: true }).isEnabled(), false);
    await page.getByRole('button', { name: 'first Label release', exact: true }).waitFor();
    state.detailDelay = 1000;
    const firstRead = page.waitForRequest((request) => request.url().endsWith('/first/stock'));
    await page.getByRole('button', { name: 'first Label release', exact: true }).click();
    await firstRead;
    assert.equal(await page.getByRole('button', { name: 'Save count', exact: true }).isEnabled(), false);
    state.detailDelay = 10;
    await page.getByRole('button', { name: 'second Label release', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#stock-count-counted-quantity')?.value === '29');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(await page.locator('#stock-count-counted-quantity').inputValue(), '29');
    await page.getByRole('button', { name: 'Adjust stock', exact: true }).click();
    await page.getByText('After this change', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Count stock', exact: true }).click();
    state.searchFailure = true;
    state.historyFailure = true;
    state.searchDelay = state.historyDelay = state.detailDelay = 0;
    await page.reload();
    await page.getByRole('alert').filter({ hasText: 'History could not load' }).waitFor();
    await page.waitForFunction(() => document.querySelector('#stock-count-counted-quantity')?.value === '29');
    await page.getByRole('button', { name: 'Count stock', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Save count', exact: true }).isEnabled(), true);
    state.searchFailure = state.historyFailure = false;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await page.getByLabel('Artist name', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Choose from Artists' }).click();
    await page.getByRole('button', { name: 'Show more', exact: true }).click();
    await page.getByRole('option', { name: 'Mass Culture', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Choose from Artists' }).click();
    await page.getByRole('combobox', { name: 'Search artists' }).fill('Ouranopithecus');
    await page.getByRole('button', { name: 'Search', exact: true }).press('Enter');
    await page.getByRole('option', { name: 'Ouranopithecus', exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'Search artists' }).press('ArrowDown');
    await page.getByRole('combobox', { name: 'Search artists' }).press('Enter');
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Choose from Artists' }).click();
    await page.getByRole('combobox', { name: 'Search artists' }).fill('');
    await page.getByRole('button', { name: 'Search', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Show more', exact: true }).press('Enter');
    await page.getByRole('option', { name: 'Mass Culture', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(state.previewRequests.length, 0, 'Preview stays closed until requested');
    await page.getByRole('button', { name: 'Show preview', exact: true }).click();
    const appearance = page.frameLocator('iframe[title="Private site appearance preview"]');
    await appearance.getByRole('heading').waitFor();
    const previewCountBeforeInvalid = state.previewRequests.length;
    const saveCountBeforeInvalid = state.saveCount;
    const artistName = page.getByLabel('Artist name', { exact: true });
    await artistName.fill('   ');
    await artistName.blur();
    await page.getByText('Enter a value.', { exact: true }).waitFor();
    await page.getByRole('status').filter({ hasText: 'Fix the highlighted fields' }).waitFor();
    assert.equal(state.previewRequests.length, previewCountBeforeInvalid, 'Invalid edits do not request previews');
    assert.equal(await page.getByRole('button', { name: 'Publish changes', exact: true }).isEnabled(), false);
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Fix the highlighted field' }).waitFor();
    assert.equal(state.saveCount, saveCountBeforeInvalid, 'Invalid edits do not save');
    await artistName.fill('Ouranopithecus');
    await artistName.blur();
    await appearance.getByRole('heading', { name: 'Ouranopithecus', exact: true }).waitFor();
    const artistLink = page.getByLabel('Website address', { exact: true }).first();
    await artistLink.fill('not-a-url');
    await artistLink.blur();
    await page.getByText('Use a full HTTPS URL.', { exact: true }).first().waitFor();
    const previewCountBeforeNestedInvalid = state.previewRequests.length;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Fix the highlighted field' }).waitFor();
    assert.equal(state.saveCount, saveCountBeforeInvalid, 'Nested invalid edits do not save');
    assert.equal(state.previewRequests.length, previewCountBeforeNestedInvalid, 'Nested invalid edits do not preview');
    await artistLink.fill('https://example.com');
    await artistLink.blur();
    await page.evaluate(() =>
      document.querySelector('iframe[title="Private site appearance preview"]').contentWindow.scrollTo(0, 120),
    );
    await page.getByRole('button', { name: 'Hide preview', exact: true }).click();
    const hiddenReads = state.previewRequests.length;
    await artistName.fill('Edited with preview hidden');
    await page.waitForTimeout(850);
    assert.equal(state.previewRequests.length, hiddenReads);
    await page.getByRole('button', { name: 'Show preview', exact: true }).click();
    await appearance.getByRole('heading', { name: 'Edited with preview hidden' }).waitFor();
    await page.waitForFunction(
      () => document.querySelector('iframe[title="Private site appearance preview"]').contentWindow.scrollY === 120,
    );
    assert.equal(
      await page.evaluate(
        () => document.querySelector('iframe[title="Private site appearance preview"]').contentWindow.scrollY,
      ),
      120,
    );
    await artistName.fill('Ouranopithecus');
    await appearance.getByRole('heading', { name: 'Ouranopithecus', exact: true }).waitFor();
    state.previewFontDisplay = 'optional';
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    state.previewFontDisplay = 'swap';
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Preview fonts could not load' }).waitFor();
    assert.equal(await appearance.getByRole('heading').innerText(), 'Ouranopithecus');
    state.previewFontDisplay = null;
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    state.previewImageFailure = true;
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Preview images could not load' }).waitFor();
    assert.equal(await appearance.getByRole('heading').innerText(), 'Ouranopithecus');
    await page.getByText('Diagnostic details', { exact: true }).click();
    await page.getByRole('button', { name: 'Copy diagnostic details' }).waitFor();
    await page.waitForFunction(() => document.querySelector('details[open]'));
    assert.equal(state.diagnostics.at(-1)?.stage, 'image');
    assert.equal(state.diagnostics.at(-1)?.requestId, '00000000-0000-4000-8000-000000000001');
    state.previewImageFailure = false;
    const priorAssets = state.requests.filter((request) => request.path === '/preview-test.png').length;
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    assert.ok(state.requests.filter((request) => request.path === '/preview-test.png').length > priorAssets);
    state.previewStyleFailure = true;
    let failedReports = 0;
    await page.route('**/_emdash/preview-diagnostics', (route) => {
      failedReports++;
      return route.fulfill({ status: 503, body: 'Unavailable' });
    });
    await page.reload();
    await page.getByRole('alert').filter({ hasText: 'Preview styles could not load' }).waitFor();
    await page.waitForTimeout(150);
    assert.equal(failedReports, 1, 'Diagnostic delivery failure must not retry');
    assert.equal(await page.getByLabel('Artist name', { exact: true }).isEnabled(), true);
    await page.unroute('**/_emdash/preview-diagnostics');
    assert.equal(await page.locator('iframe[title="Private site appearance preview"]').count(), 0);
    state.previewStyleFailure = false;
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await appearance.getByRole('heading').waitFor();
    await artistName.fill('slow preview');
    const previewDeadline = Date.now() + 10_000;
    while (
      Date.now() < previewDeadline &&
      !state.previewRequests.some((request) => request.data.title === 'slow preview')
    )
      await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(state.previewRequests.some((request) => request.data.title === 'slow preview'));
    await artistName.fill('Latest unsaved preview');
    await appearance.getByRole('heading', { name: 'Latest unsaved preview', exact: true }).waitFor();
    await new Promise((resolve) => setTimeout(resolve, 1600));
    assert.equal(await appearance.getByRole('heading').innerText(), 'Latest unsaved preview');
    assert.equal(state.saveCount, 0);
    await artistName.fill('expired preview');
    await page.getByRole('alert').filter({ hasText: 'Sign in again' }).waitFor();
    assert.equal(await appearance.getByRole('heading').innerText(), 'Latest unsaved preview');
    await artistName.fill('invalid preview');
    await page.getByRole('alert').filter({ hasText: 'Check the preview fields' }).waitFor();
    await page.getByText('Showing the last successful preview', { exact: false }).waitFor();
    await artistName.fill('unexpected preview');
    await page.getByRole('alert').filter({ hasText: 'unexpected response' }).waitFor();
    assert.equal(await page.getByRole('alert').filter({ hasText: 'Sign in again' }).count(), 0);
    await artistName.fill('Ouranopithecus draft');
    await page.getByRole('button', { name: 'Change artist image', exact: true }).click();
    await page.getByRole('heading', { name: 'Choose artist image' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await artistName.inputValue(), 'Ouranopithecus draft');
    assert.equal(await page.getByRole('button', { name: 'Publish changes', exact: true }).isEnabled(), false);
    state.conflict = true;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Someone changed' }).waitFor();
    assert.equal(await artistName.inputValue(), 'Ouranopithecus draft');
    const discard = page.getByRole('button', { name: 'Discard changes', exact: true });
    assert.equal(await discard.isVisible(), true);
    assert.equal(await discard.isEnabled(), true);
    await discard.click();
    await page.getByRole('alertdialog').waitFor();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.textContent === 'Discard changes');
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Ouranopithecus draft');
    state.conflict = false;
    await discard.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#content-title')?.value === 'Ouranopithecus');
    await page.getByLabel('Artist name', { exact: true }).fill('Saved draft');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
    assert.equal(state.saveCount, 1);
    assert.deepEqual(state.lastWrite.data.image, { id: 'artist-photo' });
    assert.equal(state.publicTitle, 'Ouranopithecus');
    await page.getByRole('button', { name: 'Expand preview', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(
      await page
        .getByRole('button', { name: 'Expand preview', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.getByRole('button', { name: 'Change artist image' }).click();
    await page.getByRole('button', { name: 'mass-culture-barren-point-cover.jpg', exact: true }).click();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
    assert.deepEqual(state.lastWrite.data.image, { id: 'record-cover' });
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: /Publishing.*pending/ }).click();
    await page.getByText('Publication requested. Wait for Live', { exact: false }).waitFor();
    assert.equal(state.publicTitle, 'Ouranopithecus');
    await page.keyboard.press('Escape');
    state.publication = 'failed';
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: /Publication failed/ }).click();
    await page.getByText('Publication failed. Select Publish changes to try again.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    state.publication = 'live';
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: /Latest publication live/ }).click();
    await page.getByText('Publication is live on fresh public page loads.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    const editor = page.getByRole('textbox', { name: 'Full text', exact: true });
    await editor.waitFor();
    await editor.click();
    await page.keyboard.press('Control+b');
    assert.equal(await page.locator('[data-slot="sidebar"][data-state]').getAttribute('data-state'), 'expanded');
    await page.screenshot({ path: resolve(artifacts, 'editor-desktop.png') });
    await page.getByRole('button', { name: 'Images', exact: true }).click();
    await page.getByRole('button', { name: 'Show more images' }).click();
    await page.getByRole('button', { name: 'Chronoboros-band-logo.jpg', exact: true }).waitFor();
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    await page.locator('.cms-media-list-card').first().waitFor();
    await page.getByRole('button', { name: 'Grid view', exact: true }).click();
    await page.getByLabel('Search images', { exact: true }).fill('no-match');
    await page.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).click();
    await page.getByText('No matching images', { exact: true }).waitFor();
    await page.getByLabel('Search images', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).click();
    await page
      .getByLabel('Upload an image', { exact: true })
      .setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
    await page.getByRole('alert').filter({ hasText: 'Choose a JPG' }).waitFor();
    await page
      .getByLabel('Upload an image', { exact: true })
      .setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
    await page.getByRole('alert').filter({ hasText: 'Choose a JPG' }).waitFor();
    state.failUpload = true;
    await page
      .getByLabel('Upload an image', { exact: true })
      .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: pixels });
    await page.getByRole('alert').filter({ hasText: 'We could not confirm' }).waitFor();
    state.failUpload = false;
    await page
      .getByLabel('Upload an image', { exact: true })
      .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: pixels });
    await page.getByRole('status').filter({ hasText: 'uploaded.png uploaded.' }).waitFor();
    await page.getByRole('button', { name: 'uploaded.png', exact: true }).click();
    await page.getByRole('dialog').filter({ hasText: 'uploaded.png' }).waitFor();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: resolve(artifacts, 'media-desktop.png') });
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
      await page.getByRole('button', { name: 'Artists', exact: true }).click();
      await page.getByLabel('Artist name', { exact: true }).waitFor();
      await page.locator('.cms-editor').evaluate((el) => {
        el.scrollTop = 0;
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: resolve(artifacts, `editor-${width}.png`) });
      if (width === 390) {
        await page.getByLabel('Artist name', { exact: true }).fill('Mobile unsaved draft');
        await page.getByRole('button', { name: 'Back to records' }).click();
        await page.getByRole('alertdialog').waitFor();
        await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Back to records');
        assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Mobile unsaved draft');
        await page.getByLabel('Artist name', { exact: true }).fill('Saved draft');
        await page.getByRole('button', { name: 'Save draft', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
        await page.getByRole('button', { name: 'Back to records' }).click();
        await page.getByRole('button', { name: 'Show more', exact: true }).click();
        await page.getByRole('button', { name: 'Mass Culture', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
      await page.getByRole('button', { name: 'Images', exact: true }).click();
      await page.getByRole('heading', { name: 'Images', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: resolve(artifacts, `media-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    state.mediaFailure = true;
    await page.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).click();
    await page.getByRole('alert').filter({ hasText: 'We could not confirm' }).waitFor();
    state.mediaFailure = false;
    await page.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).click();
    await page.getByRole('button', { name: 'uploaded.png', exact: true }).waitFor();

    await page.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await page.getByLabel('Artist name', { exact: true }).waitFor();
    const sidebar = page.locator('[data-slot="sidebar"]');
    if ((await sidebar.getAttribute('data-state')) !== 'expanded')
      await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await page.getByRole('button', { name: 'Home page', exact: true }).click();
    await page.locator('#content-editor-form').waitFor();
    assert.equal(new URL(page.url()).searchParams.get('id'), 'home-1');
    assert.equal(await page.locator('[aria-label^="Choose from "]').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Back to records', exact: true }).count(), 0);

    for (const collection of [
      'home',
      'about',
      'services',
      'distro_page',
      'purchase_information',
      'newsletter',
      'settings',
    ]) {
      await page.goto(`${origin}/content/?collection=${collection}`);
      await page.locator('#content-editor-form').waitFor();
      assert.equal(new URL(page.url()).searchParams.get('id'), `${collection}-1`);
      assert.equal(await page.locator('[aria-label^="Choose from "]').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Back to records', exact: true }).count(), 0);
    }

    const savedArtistData = structuredClone(records.artists[0].data);
    records.artists[0].data = { ...savedArtistData, image: null };
    await page.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await page.getByLabel('Artist name', { exact: true }).waitFor();
    const saveCountBeforeImageInvalid = state.saveCount;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByText('Invalid input: expected object, received undefined', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-content-path="image"][aria-invalid="true"]').count(), 1);
    assert.equal(state.saveCount, saveCountBeforeImageInvalid, 'Missing images do not save');
    records.artists[0].data = savedArtistData;

    const savedReleaseData = structuredClone(records.releases[0].data);
    records.releases[0].data = { ...savedReleaseData, artist: '' };
    await page.goto(`${origin}/content/?collection=releases&id=releases-1`);
    await page.getByRole('combobox', { name: 'Artist', exact: true }).waitFor();
    const saveCountBeforeRelationshipInvalid = state.saveCount;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByText('Too small: expected string to have >=1 characters', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-content-path="artist"][aria-invalid="true"]').count(), 1);
    assert.equal(state.saveCount, saveCountBeforeRelationshipInvalid, 'Missing relationships do not save');
    records.releases[0].data = savedReleaseData;

    // Every collection still renders its existing fields through direct links.
    for (const collection of Object.keys(records)) {
      await page.goto(`${origin}/content/?collection=${collection}&id=${collection}-1`);
      await page.locator('#content-editor-form').waitFor();
      assert.ok(await page.locator('#content-editor-form input, #content-editor-form textarea').count());
      if (['releases', 'distro'].includes(collection))
        assert.equal(await page.getByRole('button', { name: 'Publish changes', exact: true }).count(), 0);
    }
    await page.goto(`${origin}/content/?collection=socials&id=socials-1`);
    await page.getByLabel('Link name', { exact: true }).fill('Interrupted save');
    state.failSave = true;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'We could not confirm' }).waitFor();
    assert.equal(await page.getByLabel('Link name', { exact: true }).inputValue(), 'Interrupted save');
    state.failSave = false;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
    await page.getByRole('button', { name: 'Back to records' }).click();
    await page.getByRole('button', { name: 'Add social link', exact: true }).click();
    await page.getByLabel('Link name', { exact: true }).fill('New social link');
    assert.equal(await page.getByRole('button', { name: 'Discard changes', exact: true }).isEnabled(), true);
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.getByRole('heading', { name: 'Social links', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add social link', exact: true }).click();
    await page.getByLabel('Link name', { exact: true }).fill('New social link');
    await page.getByLabel('Profile link', { exact: true }).fill('https://example.com/new');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Draft created.' }).waitFor();
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Move to trash' }).click();
    await page.getByRole('button', { name: 'Keep content', exact: true }).click();
    assert.equal(records.socials.length, 2);
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Move to trash' }).click();
    await page.getByRole('button', { name: 'Move to trash', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Moved to trash.' }).waitFor();
    assert.equal(records.socials.length, 1);

    // The shared picker still works in the existing Item Setup flow.
    await page.goto(`${origin}/items/new/`);
    await page.getByRole('combobox', { name: 'Artist', exact: true }).click();
    await page.getByRole('option', { name: 'Saved draft', exact: true }).click();
    assert.match(await page.getByRole('combobox', { name: 'Artist', exact: true }).innerText(), /Saved draft/);
    await page.getByRole('button', { name: 'Choose artwork', exact: true }).click();
    await page.getByRole('button', { name: 'uploaded.png', exact: true }).click();
    await page.getByRole('button', { name: 'Change artwork', exact: true }).waitFor();
    await page.getByText('Ready to continue', { exact: true }).waitFor();
    await page.goto(`${origin}/orders/`);
    await page.getByRole('heading', { name: 'Orders', exact: true }).waitFor();
    await page.locator('.order-toolbar select').first().waitFor();
    await page.getByText('Latest 100 orders by creation time', { exact: false }).waitFor();
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.locator('.staff-header').evaluate((el) => getComputedStyle(el).position), 'static');
    assert.deepEqual(errors, []);
    const responsive = await browser.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' });
    await responsive.goto(`${origin}/`);
    await responsive.waitForURL('**/content/');
    assert.equal(await responsive.locator('.staff-brand').getAttribute('href'), '/content/');
    await responsive.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await responsive.getByRole('button', { name: 'Show preview', exact: true }).waitFor();
    for (const width of [1600, 1280]) {
      await responsive.setViewportSize({ width, height: 900 });
      await responsive.screenshot({ path: resolve(artifacts, `editor-closed-${width}.png`) });
      await responsive.getByRole('button', { name: 'Show preview', exact: true }).click();
      await responsive.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
      assert.equal(await responsive.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await responsive.screenshot({ path: resolve(artifacts, `editor-open-${width}.png`) });
      await responsive.getByRole('button', { name: 'Hide preview', exact: true }).click();
    }
    await responsive.reload();
    await responsive.getByRole('button', { name: 'Show preview', exact: true }).waitFor();
    await responsive.getByRole('button', { name: 'Show preview', exact: true }).click();
    await responsive.setViewportSize({ width: 390, height: 900 });
    assert.equal(
      await responsive.getByRole('tab', { name: 'Edit', exact: true }).getAttribute('aria-selected'),
      'true',
    );
    await responsive.getByRole('tab', { name: 'Preview', exact: true }).click();
    await responsive.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await responsive.getByRole('tab', { name: 'Edit', exact: true }).click();
    await responsive.close();
    const noStorage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await noStorage.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Unavailable');
        },
      });
    });
    await noStorage.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await noStorage.getByRole('button', { name: 'Show preview', exact: true }).click();
    await noStorage.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await noStorage.close();
    const newsletter = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await newsletter.goto(`${origin}/content/?collection=newsletter&id=newsletter-1`);
    await newsletter.getByRole('button', { name: 'Show preview', exact: true }).click();
    const newsletterPreview = newsletter.frameLocator('iframe[title="Private site appearance preview"]');
    await newsletterPreview.getByText('News from the label', { exact: true }).waitFor();
    await newsletter.getByRole('button', { name: 'Mobile', exact: true }).click();
    const description = newsletter.getByLabel('Description', { exact: true });
    await description.fill('');
    await description.pressSequentially('First unsaved newsletter description', { delay: 20 });
    await newsletterPreview.getByText('First unsaved newsletter description', { exact: true }).waitFor();
    await description.fill('Second unsaved newsletter description');
    await newsletter.getByRole('status').filter({ hasText: 'Updating preview' }).waitFor();
    await newsletterPreview.getByText('Second unsaved newsletter description', { exact: true }).waitFor();
    await newsletter.getByRole('button', { name: 'Save draft', exact: true }).click();
    await newsletter.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
    await newsletter.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await newsletter.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await newsletter.reload();
    await newsletterPreview.getByText('Second unsaved newsletter description', { exact: true }).waitFor();
    await newsletter.route('**/_emdash/preview?*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'x-preview-generation': '999999' } });
    });
    await newsletter.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await newsletter.getByRole('alert').filter({ hasText: 'outdated response' }).waitFor();
    assert.equal(state.diagnostics.at(-1).stage, 'freshness');
    assert.ok(state.diagnostics.at(-1).requestedGeneration > state.diagnostics.at(-1).displayedGeneration);
    assert.equal(
      await newsletterPreview.getByText('Second unsaved newsletter description', { exact: true }).isVisible(),
      true,
    );
    await newsletter.unroute('**/_emdash/preview?*');
    await newsletter.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await newsletter.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await newsletter.close();

    // Real timers are replaced only in this isolated polling page; requests still hit the fixture server.
    const polling = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    publications.unshift({ id: 'polling-test', status: 'pending', requestedAt: Date.now() + 1000 });
    await polling.clock.install();
    await polling.goto(`${origin}/content/`);
    await polling.getByRole('button', { name: /Publishing.*pending/ }).waitFor();
    const refreshButton = polling.getByRole('button', { name: 'Refresh publication status', exact: true });
    assert.equal(await refreshButton.isVisible(), true, 'Refresh is available without opening history');
    await polling.getByRole('button', { name: /Publishing.*pending/ }).click();
    await polling.getByText('Current', { exact: true }).waitFor();
    await polling.getByText('Earlier failure', { exact: true }).first().waitFor();
    await polling.keyboard.press('Escape');
    const refreshed = polling.waitForResponse('**/_emdash/api/blackbox/publications');
    await refreshButton.click();
    await refreshed;
    const autoRefresh = polling.waitForResponse('**/_emdash/api/blackbox/publications');
    await polling.clock.fastForward(15_000);
    await autoRefresh;
    const countReads = () =>
      state.requests.filter((request) => request.path === '/_emdash/api/blackbox/publications').length;
    await polling.evaluate(() =>
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }),
    );
    const hiddenPublicationReads = countReads();
    await polling.clock.fastForward(60_000);
    assert.equal(countReads(), hiddenPublicationReads, 'Hidden pages do not poll');
    let releaseRefresh;
    const holdRefresh = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    let concurrentReads = 0;
    await polling.route('**/_emdash/api/blackbox/publications', async (route) => {
      concurrentReads++;
      await holdRefresh;
      await route.continue();
    });
    const returnedRefresh = polling.waitForRequest('**/_emdash/api/blackbox/publications');
    await polling.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
    });
    await returnedRefresh;
    await polling.clock.fastForward(15_000);
    assert.equal(concurrentReads, 1, 'Focus, visibility and timer share one request');
    assert.equal(await refreshButton.isEnabled(), false);
    const returnedResponse = polling.waitForResponse('**/_emdash/api/blackbox/publications');
    releaseRefresh();
    await returnedResponse;
    await polling.unroute('**/_emdash/api/blackbox/publications');
    await polling.clock.fastForward(30 * 60_000);
    await polling.getByRole('button', { name: 'Still pending · Check again', exact: true }).waitFor();
    const stoppedReads = countReads();
    await polling.clock.fastForward(60_000);
    assert.equal(countReads(), stoppedReads, 'Automatic polling stops at the bound');
    publications[0].status = 'live';
    await refreshButton.click();
    await polling.getByRole('button', { name: 'Latest publication live', exact: true }).waitFor();
    await polling.close();
    state.publication = 'live';
    const batch = await browser.newPage();
    await batch.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await batch.getByRole('button', { name: 'Add to publication', exact: true }).click();
    await batch.goto(`${origin}/content/?collection=newsletter&id=newsletter-1`);
    await batch.getByRole('button', { name: 'Add to publication', exact: true }).click();
    await batch.reload();
    await batch.getByText('Selected for publication (2)', { exact: true }).click();
    const batchRequest = batch.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/_emdash/api/blackbox/content-publications'),
    );
    await batch.getByRole('button', { name: 'Publish selected (2)', exact: true }).click();
    const payload = (await batchRequest).postDataJSON();
    assert.deepEqual(
      payload.records.map((record) => record.collection),
      ['artists', 'newsletter'],
    );
    await batch.getByRole('button', { name: 'Latest publication live', exact: true }).waitFor();
    await batch.close();
    console.log('CMS workspace browser regression passed. Screenshots:', artifacts);
  } catch (error) {
    if (page) {
      await page.screenshot({ path: resolve(artifacts, 'failure.png') });
      console.error((await page.locator('body').innerText()).slice(-3500));
    }
    throw error;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
