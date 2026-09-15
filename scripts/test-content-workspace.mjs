// Local-only browser regression: pnpm build:staff && node scripts/test-content-workspace.mjs
// Pass --serve for a fixture workspace at http://127.0.0.1:4399/content/.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('apps/staff/dist');
const artifacts = resolve('.codex-artifacts/content-workspace');
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
      return ok({ saveCount: state.saveCount, previewRequests: state.previewRequests.length });
    }
    if (url.pathname === '/_emdash/preview') {
      state.previewRequests.push(body);
      const title = String(body.data.title ?? body.collection);
      if (title === 'invalid preview') return json({ error: 'Check the preview fields.' }, 422);
      if (title === 'expired preview') return json({ error: 'Sign in again.' }, 403);
      if (title === 'slow preview') await new Promise((resolve) => setTimeout(resolve, 1500));
      res.writeHead(200, { 'Content-Type': 'text/html', 'X-Preview-Environment': 'local' });
      const escaped = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      return res.end(`<!doctype html><html><body style="min-height:2000px"><h1>${escaped}</h1></body></html>`);
    }
    if (url.pathname === '/_emdash/api/blackbox/publications') {
      if (body) {
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
  const browser = await chromium.launch({ headless: true });
  let page;
  try {
    await mkdir(artifacts, { recursive: true });
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
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
    const appearance = page.frameLocator('iframe');
    await page.getByLabel('Artist name', { exact: true }).fill('slow preview');
    const previewDeadline = Date.now() + 10_000;
    while (
      Date.now() < previewDeadline &&
      !state.previewRequests.some((request) => request.data.title === 'slow preview')
    )
      await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(state.previewRequests.some((request) => request.data.title === 'slow preview'));
    await page.getByLabel('Artist name', { exact: true }).fill('Latest unsaved preview');
    await appearance.getByRole('heading', { name: 'Latest unsaved preview', exact: true }).waitFor();
    await new Promise((resolve) => setTimeout(resolve, 1600));
    assert.equal(await appearance.getByRole('heading').innerText(), 'Latest unsaved preview');
    assert.equal(state.saveCount, 0);
    await page.getByLabel('Artist name', { exact: true }).fill('expired preview');
    await page.getByRole('alert').filter({ hasText: 'Sign in again' }).waitFor();
    assert.equal(await appearance.getByRole('heading').innerText(), 'Latest unsaved preview');
    await page.getByLabel('Artist name', { exact: true }).fill('invalid preview');
    await page.getByRole('alert').filter({ hasText: 'Check the preview fields' }).waitFor();
    await page.getByText('Showing an outdated preview', { exact: false }).waitFor();
    await page.getByLabel('Artist name', { exact: true }).fill('Ouranopithecus draft');
    await page.getByRole('button', { name: 'Change artist image', exact: true }).click();
    await page.getByRole('heading', { name: 'Choose artist image' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Ouranopithecus draft');
    assert.equal(await page.getByRole('button', { name: 'Publish changes', exact: true }).isEnabled(), false);
    state.conflict = true;
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Someone changed' }).waitFor();
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Ouranopithecus draft');
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard changes and reload' }).click();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Ouranopithecus draft');
    state.conflict = false;
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard changes and reload' }).click();
    await page.getByRole('button', { name: 'Discard changes and reload' }).click();
    await page.waitForFunction(() => document.querySelector('#content-title')?.value === 'Ouranopithecus');
    await page.getByLabel('Artist name', { exact: true }).fill('Saved draft');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
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
    await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
    assert.deepEqual(state.lastWrite.data.image, { id: 'record-cover' });
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: /Publishing.*pending/ }).click();
    await page.getByText('Publication requested. Wait for Live', { exact: false }).waitFor();
    assert.equal(state.publicTitle, 'Ouranopithecus');
    await page.keyboard.press('Escape');
    state.publication = 'failed';
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: 'Publication failed', exact: true }).click();
    await page.getByText('Publication failed. Select Publish changes to try again.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    state.publication = 'live';
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByRole('button', { name: 'Latest publication live', exact: true }).click();
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
        await page.getByRole('button', { name: 'Mass Culture', exact: true }).click();
        await page
          .getByRole('status')
          .filter({ hasText: 'Save your draft or select Discard changes and reload' })
          .waitFor();
        await page.getByRole('button', { name: 'Return to draft' }).click();
        assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Mobile unsaved draft');
        await page.getByLabel('Artist name', { exact: true }).fill('Saved draft');
        await page.getByRole('button', { name: 'Save draft', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
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
    await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
    await page.getByRole('button', { name: 'Back to records' }).click();
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
    assert.equal(await page.locator('.staff-header').evaluate((el) => getComputedStyle(el).position), 'static');
    assert.deepEqual(errors, []);
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
