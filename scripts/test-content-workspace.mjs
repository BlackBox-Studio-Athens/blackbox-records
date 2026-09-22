// Local-only browser regression: pnpm build:staff && node scripts/test-content-workspace.mjs
// Pass --serve for a fixture workspace at http://127.0.0.1:4399/content/.
import assert from 'node:assert/strict';
import { proseText, resolveProse } from '../packages/content-model/src/prose.ts';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, firefox } from 'playwright';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { exampleOrder } from '../apps/staff/src/components/orders/order-fixtures.test-support.ts';
import { previewPolicy } from '../apps/backend/src/cms/preview-policy.ts';

const root = resolve('apps/staff/dist');
const browserType = process.argv.includes('--firefox') ? firefox : chromium;
const contractViolation = process.argv.includes('--violate-original-artwork');
const expectedWebsiteUrl =
  {
    uat: 'https://blackbox-records-web-uat.pages.dev/',
    prd: 'https://blackbox-records-web.pages.dev/',
  }[process.env.STAFF_PREVIEW_ENVIRONMENT] || 'http://127.0.0.1:4321/blackbox-records/';
const artifacts = resolve(
  process.env.BLACKBOX_VALIDATION_REPORT_DIR || '.codex-artifacts/content-workspace',
  browserType.name(),
);
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
const sellingJourney = process.argv.includes('--selling');
if (sellingJourney)
  records.releases.push({
    ...structuredClone(records.releases[0]),
    id: 'releases-retained',
    slug: 'retained',
    data: { ...structuredClone(data.releases), title: 'Retained stocked CD' },
  });
const sellingFixture = {
  amount: null,
  revision: 0,
  conflict: true,
  failRefresh: false,
  reads: 0,
  writes: [],
  publicationReads: 0,
};
records.artists.push({
  ...structuredClone(records.artists[0]),
  id: 'artists-2',
  slug: 'mass-culture',
  data: { ...structuredClone(artist), title: 'Mass Culture saved draft' },
  liveData: { ...structuredClone(artist), title: 'Mass Culture' },
  liveRevisionId: 'live-1',
  draftRevisionId: 'draft-1',
  _rev: '2',
});
const state = {
  initialStockReads: Promise.resolve(),
  conflict: false,
  failSave: false,
  failUpload: false,
  mediaFailure: false,
  publication: 'pending',
  saveCount: 0,
  saveDelay: 0,
  stockRevision: 3,
  orderDenied: false,
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
  overviewDraftDelay: 0,
  overviewPublicationDelay: 0,
  overviewOrdersDelay: 0,
  overviewDraftFailure: false,
  overviewPublicationFailure: false,
  overviewOrdersFailure: false,
  compactProbe: null,
  requests: [],
};
const publications = [];
const previewDocuments = new Map();
const previewBridge =
  ts.transpileModule(await readFile('apps/web/src/lib/private-preview.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText + '\nconnectPrivatePreview();';
const fixtureOrders = Array.from({ length: 51 }, (_, index) => ({
  ...structuredClone(exampleOrder),
  orderReference: `ORDER-${String(index).padStart(3, '0')}`,
  checkoutSessionId: `cs_test_${index}`,
  fulfillment: { ...structuredClone(exampleOrder.fulfillment), recipientName: `Test customer ${index}` },
}));
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
      for (const key of ['overviewDraftDelay', 'overviewPublicationDelay', 'overviewOrdersDelay'])
        if (typeof body?.[key] === 'number') state[key] = Math.min(10_000, Math.max(0, body[key]));
      for (const key of ['overviewDraftFailure', 'overviewPublicationFailure', 'overviewOrdersFailure'])
        if (typeof body?.[key] === 'boolean') state[key] = body[key];
      return ok({
        saveCount: state.saveCount,
        previewRequests: state.previewRequests.length,
        requests: state.requests,
      });
    }
    state.requests.push({ path: url.pathname, method: req.method, at: Date.now() });
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
    if (url.pathname === '/_emdash/api/blackbox/workspace') {
      if ((!url.search || url.searchParams.get('view') === 'overview') && state.overviewDraftDelay)
        await new Promise((resolve) => setTimeout(resolve, state.overviewDraftDelay));
      if ((!url.search || url.searchParams.get('view') === 'overview') && state.overviewDraftFailure) return fail(503);
      const collection = url.searchParams.get('collection');
      const id = url.searchParams.get('id');
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const area = url.searchParams.get('area') ?? 'all';
      const scope = url.searchParams.get('scope') ?? 'all';
      const format = url.searchParams.get('format');
      const items = Object.entries(records).flatMap(([section, entries]) =>
        (section === collection || !collection) &&
        (scope === 'all' || (scope === 'catalog') === ['artists', 'releases', 'distro'].includes(section))
          ? entries
              .filter(
                (item) =>
                  (!id || item.id === id || item.slug === id) &&
                  (!url.searchParams.has('variantId') ||
                    (url.searchParams.get('variantId') === 'variant_retained'
                      ? item.id === 'releases-retained'
                      : item.id === 'releases-1')) &&
                  (!q ||
                    String(item.data.title ?? '')
                      .toLowerCase()
                      .includes(q)) &&
                  (section !== 'distro' ||
                    ((!format || item.data.group === format) &&
                      (area === 'all' ||
                        (area === 'merch' ? item.data.group === 'Clothes' : item.data.group !== 'Clothes')))),
              )
              .map((item) => ({
                ...item,
                collection: section,
                publicationState: item.draftRevisionId
                  ? item.liveRevisionId
                    ? 'changes'
                    : 'draft'
                  : item.liveRevisionId
                    ? 'published'
                    : 'draft',
                selling:
                  section === 'releases' && item.id === 'releases-retained'
                    ? {
                        variantId: 'variant_retained',
                        storeItemSlug: 'retained',
                        itemType: sellingFixture.amount === null ? null : 'CDs',
                        quantity: 1,
                        onlineQuantity: 1,
                        amountMinor: sellingFixture.amount,
                        currencyCode: 'EUR',
                        catalogAvailability: 'withheld',
                        freshUntil: null,
                      }
                    : section === 'releases' && item.id === 'releases-1'
                      ? {
                          variantId: 'first',
                          storeItemSlug: 'barren-point',
                          itemType: 'Black vinyl LP',
                          quantity: 99,
                          onlineQuantity: 99,
                          amountMinor: 2800,
                          currencyCode: 'EUR',
                          catalogAvailability: 'published',
                          freshUntil: null,
                        }
                      : null,
              }))
          : [],
      );
      if (url.searchParams.get('sort') === 'title')
        items.sort((a, b) => String(a.data.title).localeCompare(String(b.data.title)) || a.id.localeCompare(b.id));
      const offset = Number(url.searchParams.get('cursor') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 25);
      return ok({
        items: items.slice(offset, offset + limit),
        nextCursor: items.length > offset + limit ? String(offset + limit) : undefined,
      });
    }
    if (url.pathname === '/api/internal/orders/search') {
      if (url.searchParams.get('status') === 'needs_review' && url.searchParams.get('limit') === '1') {
        await new Promise((resolve) => setTimeout(resolve, state.overviewOrdersDelay));
        if (state.overviewOrdersFailure) return fail(503);
      }
      if (state.orderDenied) return json({ error: 'Unauthorized', code: 'unauthorized' }, 403);
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const rows = fixtureOrders.filter((order) =>
        `${order.orderReference} ${order.fulfillment.recipientName} ${order.fulfillment.shopperContact.email} ${order.checkoutSessionId}`
          .toLowerCase()
          .includes(q),
      );
      const offset = Number(url.searchParams.get('cursor') ?? 0);
      return json({
        items: rows.slice(offset, offset + 25),
        nextCursor: rows.length > offset + 25 ? String(offset + 25) : null,
      });
    }
    if (url.pathname.startsWith('/api/internal/orders/checkout-sessions/')) {
      if (state.orderDenied) return json({ error: 'Unauthorized', code: 'unauthorized' }, 403);
      return json(fixtureOrders.find((order) => order.checkoutSessionId === url.pathname.split('/').at(-1)));
    }
    if (url.pathname === '/_emdash/api/blackbox/inventory-artwork') {
      return ok({
        items: JSON.parse(url.searchParams.get('items') ?? '[]').map((item) => ({
          ...item,
          image: {
            id: `artwork-${item.variantId}`,
            filename: `${item.variantId}.jpg`,
            storageKey: item.variantId === 'first' ? 'missing.jpg' : `${item.variantId}.jpg`,
            alt: `${item.variantId} artwork`,
          },
        })),
      });
    }
    if (url.pathname === '/api/internal/inventory' || url.pathname === '/api/internal/variants') {
      await state.initialStockReads;
      await new Promise((resolve) => setTimeout(resolve, state.searchDelay));
      if (state.searchFailure) return fail(503);
      const rows = [
        'first',
        'second',
        ...Array.from({ length: 250 }, (_, index) => `shelf-${String(index).padStart(3, '0')}`),
      ]
        .map((variantId, index) => ({
          variantId,
          storeItemSlug: variantId,
          displayName: variantId,
          sourceId: variantId,
          sourceKind: index < 2 ? 'release' : 'distro',
          itemType: index % 3 === 0 ? 'Clothes' : 'Tapes',
          quantity: 17,
          onlineQuantity: 10,
        }))
        .filter((item) => {
          const area = url.searchParams.get('area');
          const format = url.searchParams.get('format');
          const q = url.searchParams.get('q') ?? '';
          return (
            item.displayName.includes(q) &&
            (!format || item.itemType === format) &&
            (!area ||
              area === 'all' ||
              (area === 'release'
                ? item.sourceKind === 'release'
                : area === 'merch'
                  ? item.itemType === 'Clothes'
                  : item.sourceKind === 'distro' && item.itemType !== 'Clothes'))
          );
        });
      if (url.pathname.endsWith('/variants')) return json(rows.slice(0, 25));
      const offset = Number(url.searchParams.get('cursor') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 25);
      return json({
        items: rows.slice(offset, offset + limit),
        nextCursor: rows.length > offset + limit ? String(offset + limit) : undefined,
        before: new Date().toISOString(),
      });
    }
    if (/^\/api\/internal\/variants\/[^/]+\/stock\/counts$/.test(url.pathname)) {
      if (state.countFailure) return fail(503);
      if (body.expectedRevision !== state.stockRevision) return fail(409);
      state.stockRevision++;
      return json({
        stock: { quantity: body.countedQuantity, onlineQuantity: body.onlineQuantity, revision: state.stockRevision },
      });
    }
    if (/^\/api\/internal\/variants\/[^/]+\/selling$/.test(url.pathname)) {
      sellingFixture.reads++;
      const variantId = url.pathname.split('/')[4];
      if (sellingFixture.failRefresh) {
        sellingFixture.failRefresh = false;
        return fail(503);
      }
      if (variantId !== 'variant_retained' || sellingFixture.amount !== null)
        return json({
          state: 'ready',
          detail: {
            variantId,
            expectedRevision: sellingFixture.revision || 1,
            requiresLiveConfirmation: false,
            price: {
              kind: 'fixed',
              currencyCode: 'EUR',
              amountMinor: variantId === 'variant_retained' ? sellingFixture.amount : 2800,
            },
          },
        });
      return json({
        state: 'setup_required',
        variantId,
        expectedRevision: sellingFixture.revision,
        cmsRevision: '1',
        cmsSourceId: 'releases-retained',
        itemType: null,
        priceKind: 'fixed',
        requiresLiveConfirmation: false,
      });
    }
    if (/^\/api\/internal\/variants\/[^/]+\/price\/initialize$/.test(url.pathname)) {
      sellingFixture.writes.push(body);
      if (sellingFixture.conflict) {
        sellingFixture.conflict = false;
        sellingFixture.revision++;
        return fail(409);
      }
      assert.equal(body.expectedRevision, sellingFixture.revision);
      assert.equal(body.cmsRevision, '1');
      assert.equal(body.itemType, 'CDs');
      sellingFixture.amount = body.price.amountMinor;
      sellingFixture.revision++;
      sellingFixture.failRefresh = true;
      return json({ operationId: body.operationId, variantId: 'variant_retained', status: 'completed' });
    }
    if (/^\/api\/internal\/variants\/[^/]+\/publication$/.test(url.pathname)) {
      sellingFixture.publicationReads++;
      return json({
        expectedRevision: sellingFixture.revision || 1,
        cmsRevision: '1',
        requiresLiveConfirmation: false,
        title: 'Retained stocked CD',
        collection: 'releases',
        cmsSourceId: 'releases-retained',
        availability: 'withheld',
        pending: null,
      });
    }
    if (/^\/api\/internal\/variants\/[^/]+\/stock(?:\/history)?$/.test(url.pathname)) {
      const variantId = url.pathname.split('/')[4];
      if (url.pathname.endsWith('/history')) {
        await state.initialStockReads;
        await new Promise((resolve) => setTimeout(resolve, state.historyDelay));
        return state.historyFailure ? fail(503) : json({ entries: [] });
      }
      await new Promise((resolve) => setTimeout(resolve, state.detailDelay));
      return json({
        variantId,
        storeItemSlug: variantId,
        displayName: variantId,
        stock: {
          quantity: variantId === 'variant_retained' ? 1 : variantId === 'first' ? 17 : 29,
          onlineQuantity: variantId === 'variant_retained' ? 1 : 5,
          revision: state.stockRevision,
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
      if (body.publication) body.data = records[body.collection].find((item) => item.id === body.id).data;
      const title = String(body.data.title ?? body.collection);
      if (title === 'invalid preview') return json({ error: 'Check the preview fields.' }, 422);
      if (title === 'expired preview') return json({ error: 'Sign in again.' }, 403);
      if (title === 'unexpected preview') return json({ error: null });
      if (title === 'slow preview') await new Promise((resolve) => setTimeout(resolve, 1500));
      const context = randomUUID();
      const generation = Number(req.headers['x-preview-generation'] ?? 0);
      previewDocuments.set(context, {
        title,
        description: proseText(resolveProse(body.data.description ?? body.data.lead?.text, body.data.description_rich)),
        generation,
      });
      res.setHeader('X-Preview-Environment', 'local');
      return json({ context, url: `http://localhost:${server.address().port}/preview-document?__preview=${context}` });
    }
    if (url.pathname === '/_emdash/preview-release') {
      previewDocuments.delete(body.context);
      res.writeHead(204);
      return res.end();
    }
    if (url.pathname === '/preview-bridge.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      return res.end(previewBridge);
    }
    if (url.pathname === '/preview-document') {
      const context = url.searchParams.get('__preview');
      const item = previewDocuments.get(context);
      if (!item) return fail(410);
      const escape = (text) =>
        text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
      const config = escape(JSON.stringify({ context, generation: item.generation, parentOrigin: origin }));
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Security-Policy': previewPolicy(origin),
        'Cache-Control': 'private, no-store',
      });
      return res.end(
        `<!doctype html><html><head><meta name="blackbox-preview" content="${config}"><link rel="stylesheet" href="/preview-test.css"><script type="module" src="/preview-bridge.js"></script></head><body style="min-height:2000px"><h1>${escape(item.title)}</h1><p id="newsletter-signup-area">${escape(item.description)}</p><img src="/preview-test.png" alt="Preview fixture" loading="eager"></body></html>`,
      );
    }
    if (url.pathname === '/_emdash/api/blackbox/publication-review') {
      const entries = body.records.map((record) => {
        const item = records[record.collection].find((item) => item.id === record.recordId);
        return {
          collection: record.collection,
          recordId: item.id,
          expectedRevision: item._rev,
          title: item.data.title ?? item.data.label_name ?? record.collection,
          slug: item.slug,
          before: { ...item.data, title: 'Previously published title' },
          after: item.data,
          issues: [],
        };
      });
      return json({
        baseline: 'a'.repeat(64),
        environment: 'local',
        publicUrl: expectedWebsiteUrl,
        entries,
        dependencies: [],
        media: Object.fromEntries(
          media.map((item) => [item.id, { src: `/preview-test.png`, width: 96, height: 96, format: 'png' }]),
        ),
        referenceTitles: {},
        baselineReferenceTitles: {},
      });
    }
    if (url.pathname === '/_emdash/api/blackbox/publications/history') {
      if (state.historyFailure) return fail(503);
      const collection = url.searchParams.get('collection'),
        id = url.searchParams.get('recordId');
      return json({
        items: publications.filter(
          (item) => !id || item.entries?.some((entry) => entry.collection === collection && entry.recordId === id),
        ),
      });
    }
    if (/^\/_emdash\/api\/blackbox\/publications\/[^/]+$/.test(url.pathname)) {
      const publication = publications.find((item) => item.id === url.pathname.split('/').at(-1));
      if (!publication) return json({ error: 'Not found' }, 404);
      if (state.publication !== 'pending') publication.status = state.publication;
      return json(publication);
    }
    if (['/_emdash/api/blackbox/publications', '/_emdash/api/blackbox/content-publications'].includes(url.pathname)) {
      if (!body) {
        await new Promise((resolve) => setTimeout(resolve, state.overviewPublicationDelay));
        if (state.overviewPublicationFailure) return fail(503);
      }
      if (body) {
        assert.equal(url.pathname, '/_emdash/api/blackbox/content-publications');
        for (const record of body.records ?? [body]) {
          const selected = records[record.collection].find((item) => item.id === record.recordId);
          assert.equal(record.expectedRevision, selected._rev);
        }
        if (state.publication !== 'pending')
          for (const publication of publications)
            if (publication.status === 'pending') publication.status = state.publication;
        const existing = publications.find((item) => item.id === body.id);
        if (existing) return json(existing);
        publications.unshift({
          id: body.id,
          status: state.publication,
          requestedAt: Date.now(),
          environment: 'local',
          actorEmail: 'editor@example.com',
          entries: (body.records ?? [body]).map((record) => ({
            ...record,
            title: records[record.collection].find((item) => item.id === record.recordId).data.title,
          })),
        });
        if (state.publication === 'live') state.publicTitle = records.artists[0].data.title;
        return json(publications[0]);
      }
      if (state.publication !== 'pending')
        for (const publication of publications)
          if (publication.status === 'pending') publication.status = state.publication;
      return json({ items: publications });
    }
    if (url.pathname.startsWith('/_emdash/api/media/file/')) {
      if (state.compactProbe) state.compactProbe.originalRequests++;
      if (contractViolation && state.compactProbe) return fail(404);
      const key = url.pathname.split('/').at(-1);
      res.writeHead(200, { 'Content-Type': key.endsWith('.jpg') ? 'image/jpeg' : 'image/png' });
      return res.end(images[key] ? await readFile(resolve('apps/web/src/content', images[key])) : pixels);
    }
    if (url.pathname.startsWith('/_emdash/api/blackbox/thumbnails/')) {
      const key = decodeURIComponent(url.pathname.slice('/_emdash/api/blackbox/thumbnails/'.length));
      if (state.compactProbe) {
        state.compactProbe.thumbnailRequests++;
        state.compactProbe.byKey[key] = (state.compactProbe.byKey[key] ?? 0) + 1;
      }
      if (contractViolation && state.compactProbe) {
        res.writeHead(302, { Location: `/_emdash/api/media/file/${encodeURIComponent(key)}` });
        return res.end();
      }
      if (key === 'missing.jpg') return fail(404);
      if (state.compactProbe) state.compactProbe.thumbnailBytes += pixels.byteLength;
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' });
      return res.end(pixels);
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
      if (action === 'discard-draft') {
        assert.equal(req.method, 'POST');
        assert.equal(body._rev, item._rev);
        assert.ok(item.liveRevisionId && item.draftRevisionId);
        item.data = structuredClone(item.liveData);
        item.draftRevisionId = null;
        item._rev = String(Number(item._rev) + 1);
        return ok({ item, _rev: item._rev });
      }
      if (req.method === 'PUT') {
        await new Promise((resolve) => setTimeout(resolve, state.saveDelay));
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
await new Promise((resolve) =>
  server.listen(
    process.argv.includes('--serve') ? Number(process.env.BLACKBOX_FIXTURE_PORT ?? 4399) : 0,
    '127.0.0.1',
    resolve,
  ),
);
const origin = `http://127.0.0.1:${server.address().port}`;
if (process.argv.includes('--serve')) console.log(`Local CMS fixtures: ${origin}/content/`);
else if (sellingJourney) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await mkdir(artifacts, { recursive: true });
  try {
    await page.goto(`${origin}/stock/?variantId=variant_retained`);
    await page.getByRole('link', { name: 'Selling', exact: true }).click();
    await page.waitForURL(/collection=releases.*id=releases-retained.*tab=selling/);
    await page.getByText('No price set', { exact: true }).waitFor();
    assert.equal(sellingFixture.publicationReads, 0, 'Unfinished setup must not mount publication preflight');
    const amount = page.getByRole('textbox', { name: 'Price (EUR)', exact: true });
    assert.equal(await amount.inputValue(), '');
    await page.getByRole('combobox', { name: /^Format/ }).selectOption('CDs');
    await amount.focus();
    await page.keyboard.type('12,50');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.getByText(/Your amount is retained/).waitFor();
    assert.equal(await amount.inputValue(), '12,50');
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    assert.equal(await amount.inputValue(), '12,50');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('input[inputmode="decimal"]')?.value === '');
    await page.setViewportSize({ width: 320, height: 780 });
    await page.getByRole('combobox', { name: /^Format/ }).selectOption('CDs');
    await amount.fill('12.50');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 320));
    assert.ok((await page.getByRole('button', { name: 'Set price', exact: true }).boundingBox()).height >= 44);
    await page.screenshot({ path: resolve(artifacts, 'selling-initial-320.png'), fullPage: true });
    await page.getByRole('button', { name: 'Set price', exact: true }).click();
    await page.getByText('Price saved. Existing orders are unchanged.', { exact: true }).waitFor();
    await page.getByText(/Selling details could not be refreshed/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Set price', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.getByText('Current price: €12.50', { exact: true }).waitFor();
    assert.equal(sellingFixture.writes.length, 2, 'Conflict and corrected review submit once each');
    assert.equal(sellingFixture.writes[0].price.amountMinor, 1250);
    assert.equal(sellingFixture.writes[1].price.amountMinor, 1250);
    assert.ok(sellingFixture.publicationReads > 0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: resolve(artifacts, 'selling-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 320, height: 780 });
    await page.getByRole('button', { name: 'Change price', exact: true }).waitFor();
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= 320),
      'No horizontal overflow at 320px',
    );
    assert.ok((await page.getByRole('button', { name: 'Change price', exact: true }).boundingBox()).height >= 44);
    await page.screenshot({ path: resolve(artifacts, 'selling-320.png'), fullPage: true });
    await page.goto(`${origin}/stock/?variantId=variant_retained`);
    await page.getByRole('link', { name: 'Selling', exact: true }).waitFor();
    const stock = await (await page.request.get(`${origin}/api/internal/variants/variant_retained/stock`)).json();
    assert.equal(stock.stock.quantity, 1);
    assert.equal(stock.stock.onlineQuantity, 1);
    await page.goto(`${origin}/content/?collection=releases&id=releases-1&tab=selling`);
    await page.getByText('Current price: €28.00', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Change price', exact: true }).waitFor();
    console.log(
      'Retained Selling journey passed: keyboard, comma/point, conflict/Refresh, saved/read-failure, 320px, configured control, Stock handoff.',
    );
  } catch (error) {
    await page.screenshot({ path: resolve(artifacts, 'selling-failure.png'), fullPage: true });
    console.error((await page.locator('body').innerText()).slice(-2500));
    throw error;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
} else {
  const optionalChunk =
    /\/_astro\/(?:PublicationHistory|PublicationReviewFlow|ContentBodyEditor|ContentFields|ContentPreview|MediaLibrary|EditorialPicker|CatalogSelling)[^/]*\.(?:js|css)$/;
  async function assertClosedOptionalFeatures(browser) {
    for (const [label, path, ready] of [
      ['Overview', '/', (probe) => probe.getByRole('heading', { name: 'Overview', exact: true }).waitFor()],
      ['Stock', '/stock/', (probe) => probe.locator('.inventory-row').first().waitFor()],
      ['Orders', '/orders/', (probe) => probe.getByText('Test customer 0', { exact: true }).waitFor()],
      ['Pages', '/content/', (probe) => probe.getByRole('heading', { name: 'Pages', exact: true }).waitFor()],
      ['Releases', '/content/?collection=releases', (probe) => probe.locator('.cms-entry-row').first().waitFor()],
      ['Distro', '/content/?collection=distro', (probe) => probe.locator('.cms-entry-row').first().waitFor()],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const probe = await context.newPage();
      const requests = [];
      const resources = [];
      probe.on('request', (request) => requests.push(new URL(request.url()).pathname));
      probe.on('response', (response) => {
        if (['document', 'script', 'stylesheet'].includes(response.request().resourceType()))
          resources.push(response.text().catch(() => ''));
      });
      try {
        await probe.goto(`${origin}${path}`);
        await ready(probe);
        assert.deepEqual(
          requests.filter((requestPath) => optionalChunk.test(requestPath)),
          [],
          `${label} must not request closed history/editor chunks`,
        );
        const source = (await Promise.all(resources)).join('\n');
        assert.ok(!source.includes('.cms-media-grid'), `${label} must not contain unopened picker CSS`);
        assert.ok(!source.includes('.tiptap'), `${label} must not contain unopened rich editor CSS`);
      } finally {
        await context.close();
      }
    }
  }

  async function assertOptionalFeatures(browser) {
    const historyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const historyPage = await historyContext.newPage();
    historyPage.on('pageerror', (error) => console.error('History browser error:', error.message));
    const historyRequests = [];
    historyPage.on('request', (request) => historyRequests.push(new URL(request.url()).pathname));
    try {
      await historyPage.goto(`${origin}/`);
      const trigger = historyPage.getByRole('button', { name: 'Publication history', exact: true });
      await trigger.click();
      await historyPage.getByRole('heading', { name: 'Publication history', exact: true }).waitFor();
      assert.ok(
        historyRequests.some((requestPath) => /\/PublicationHistory[^/]*\.js$/.test(requestPath)),
        'Opening history must load the history chunk',
      );
      await historyPage.getByRole('button', { name: 'Close', exact: true }).click();
      await historyPage.waitForFunction(() => document.activeElement?.textContent?.includes('Publication history'));
      assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);

      state.historyFailure = true;
      await trigger.click();
      await historyPage.getByRole('alert').waitFor();
      state.historyFailure = false;
      await historyPage.getByRole('button', { name: 'Retry history', exact: true }).click();
      await historyPage.getByText('No publications recorded.', { exact: true }).waitFor();
    } catch (error) {
      await historyPage.screenshot({ path: resolve(artifacts, 'history-failure.png') });
      throw error;
    } finally {
      state.historyFailure = false;
      await historyContext.close();
    }

    const editorContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const editorPage = await editorContext.newPage();
    const editorRequests = [];
    editorPage.on('request', (request) => editorRequests.push(new URL(request.url()).pathname));
    try {
      await editorPage.goto(`${origin}/content/?collection=artists&id=artists-1`);
      await editorPage.getByLabel('Artist name', { exact: true }).waitFor();
      assert.ok(
        editorRequests.some((requestPath) => /\/ContentBodyEditor[^/]*\.js$/.test(requestPath)),
        'Opening an editor must load the editor chunk',
      );
      await editorPage.locator('style[data-href="staff-content-editor"]').waitFor({ state: 'attached' });
      assert.match(await editorPage.locator('style[data-href="staff-content-editor"]').textContent(), /@layer emdash/);
      assert.equal(await editorPage.locator('style[data-href="staff-content-editor"]').count(), 1);
      assert.equal(
        editorRequests.some((path) => /ContentBodyEditor[^/]*\.css$/.test(path)),
        false,
      );
    } finally {
      await editorContext.close();
    }
  }

  async function assertOverviewPanels(browser) {
    state.overviewOrdersDelay = 3000;
    const delayedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const delayedPage = await delayedContext.newPage();
    try {
      await delayedPage.goto(`${origin}/`);
      await delayedPage.getByRole('link', { name: /Ouranopithecus/ }).waitFor({ timeout: 1500 });
      assert.equal(await delayedPage.getByText('Loading recent work…', { exact: true }).count(), 0);
    } finally {
      await delayedContext.close();
    }

    state.overviewOrdersDelay = 0;
    state.overviewOrdersFailure = true;
    const failedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const failedPage = await failedContext.newPage();
    try {
      await failedPage.goto(`${origin}/`);
      await failedPage.getByRole('link', { name: /Ouranopithecus/ }).waitFor();
      await failedPage.getByRole('alert').filter({ hasText: 'Orders could not be read.' }).waitFor();
      assert.equal(await failedPage.getByRole('link', { name: /Ouranopithecus/ }).count(), 1);
    } finally {
      state.overviewOrdersFailure = false;
      await failedContext.close();
    }
  }

  async function assertNavigationStartup(browser) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const probe = await context.newPage();
    try {
      // Hold the selected list and inspect SSR plus the hydrated loading state.
      for (const collection of ['releases', 'distro']) {
        const response = await probe.request.get(`${origin}/content/?collection=${collection}`);
        assert.match(await response.text(), /Loading workspace/);
        const gate = Promise.withResolvers();
        await probe.route('**/_emdash/api/blackbox/workspace?*', async (route) => {
          await gate.promise;
          await route.continue();
        });
        await probe.goto(`${origin}/content/?collection=${collection}`);
        await probe.getByRole('status', { name: 'Loading content' }).waitFor();
        assert.equal(await probe.getByRole('heading', { name: 'Artists', exact: true }).count(), 0);
        assert.equal(await probe.getByText('No matching content. Try another search.', { exact: true }).count(), 0);
        assert.equal(await probe.locator('.cms-records [data-slot="badge"]').count(), 0);
        gate.resolve();
        await probe.locator('.cms-entry-row').first().waitFor();
        await probe.unroute('**/_emdash/api/blackbox/workspace?*');
      }
      await probe.locator('.cms-entry-row').first().click();
      await probe.locator('#content-editor-form input').first().waitFor();
      assert.equal(
        await probe.locator('.cms-editor-toolbar h1').evaluate((element) => element === document.activeElement),
        true,
      );
      await probe
        .getByRole('button', { name: /(?:Change|Choose) item image/i })
        .first()
        .click();
      await probe.locator('.cms-media').waitFor();
      await probe.locator('style[data-href="staff-content-media"]').waitFor({ state: 'attached' });
    } finally {
      await context.close();
    }
    const failureContext = await browser.newContext();
    const failurePage = await failureContext.newPage();
    try {
      await failurePage.route('**/ContentFields*.js', (route) => route.abort());
      await failurePage.goto(`${origin}/content/?collection=artists&id=artists-1`);
      await failurePage.getByRole('alert').filter({ hasText: 'Editor could not load.' }).waitFor();
      await failurePage.route('**/_emdash/api/blackbox/workspace?*', (route) =>
        route.fulfill({
          status: 503,
          json: { success: false, error: { message: 'Unavailable' } },
        }),
      );
      await failurePage.goto(`${origin}/content/?collection=releases`);
      await failurePage.getByText('We could not load these entries. Try again.', { exact: true }).waitFor();
      assert.equal(await failurePage.getByText('No matching content. Try another search.', { exact: true }).count(), 0);
      await failurePage.unroute('**/_emdash/api/blackbox/workspace?*');
      await failurePage.route('**/_emdash/api/blackbox/workspace?*', (route) =>
        route.fulfill({
          json: { success: true, data: { items: [] } },
        }),
      );
      await failurePage.reload();
      await failurePage.getByText('No matching content. Try another search.', { exact: true }).waitFor();
      assert.equal(await failurePage.locator('.cms-records [data-slot="badge"]').innerText(), '0');
    } finally {
      await failureContext.close();
    }
  }

  async function assertOverviewRefresh(browser) {
    const context = await browser.newContext();
    const probe = await context.newPage();
    let empty = false;
    let fail = false;
    let gate = Promise.withResolvers();
    const paths = [];
    const started = Promise.withResolvers();
    const overviewApi =
      /\/(?:_emdash\/api\/blackbox\/(?:workspace|publications)|api\/internal\/orders\/search)(?:\?|$)/;
    await probe.route(overviewApi, async (route) => {
      paths.push(new URL(route.request().url()).pathname);
      if (paths.length === 3) started.resolve();
      await gate.promise;
      if (fail)
        await route.fulfill({ status: 503, json: { success: false, error: { message: 'Refresh unavailable' } } });
      else if (empty) await route.fulfill({ json: { success: true, data: { items: [] }, items: [] } });
      else await route.continue();
    });
    const refresh = () =>
      probe.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('online'));
      });
    try {
      await probe.goto(`${origin}/`);
      await started.promise;
      await refresh();
      // Flush queued browser work while all three resources are still pending.
      await probe.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(paths.length, 3, 'Initial/focus/visibility/reconnect must share the three panel reads');
      empty = true;
      gate.resolve();
      await probe.getByText('No recent drafts to finish.', { exact: true }).waitFor();
      // The outer refresh wrapper deliberately has a 30-second freshness window.
      await probe.clock.install();
      await probe.clock.fastForward(31_000);
      gate = Promise.withResolvers();
      await refresh();
      await probe.getByText('Checking recent work…', { exact: true }).waitFor();
      assert.equal(await probe.getByText('No recent drafts to finish.', { exact: true }).count(), 1);
      assert.equal(await probe.getByText('Loading recent work…', { exact: true }).count(), 0);
      fail = true;
      gate.resolve();
      await probe.getByRole('button', { name: 'Retry recent drafts', exact: true }).waitFor();
      assert.equal(await probe.getByText('No recent drafts to finish.', { exact: true }).count(), 1);
      fail = false;
      empty = false;
      await probe.getByRole('button', { name: 'Retry recent drafts', exact: true }).click();
      await probe.getByRole('link', { name: /Ouranopithecus/ }).waitFor();
    } finally {
      gate.resolve();
      await context.close();
    }
  }

  async function assertStockStartup(browser) {
    const context = await browser.newContext();
    const probe = await context.newPage();
    const now = Date.now();
    await probe.clock.install({ time: now });
    await probe.clock.pauseAt(now + 1000);
    const reads = [];
    probe.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/internal/inventory') reads.push(url);
    });
    try {
      await probe.goto(`${origin}/stock/?q=shelf&cursor=25`);
      await probe.locator('.inventory-row').first().waitFor();
      assert.equal(reads.length, 1);
      assert.equal(reads[0].searchParams.get('q'), 'shelf');
      assert.equal(reads[0].searchParams.get('cursor'), '25');
      await Promise.all([
        probe.waitForResponse(
          (response) => response.url().includes('/api/internal/inventory?') && response.url().includes('area=distro'),
        ),
        probe.getByLabel('Inventory area', { exact: true }).selectOption('distro'),
      ]);
      await Promise.all([
        probe.waitForResponse(
          (response) => response.url().includes('/api/internal/inventory?') && response.url().includes('cursor='),
        ),
        probe.getByRole('button', { name: 'Next', exact: true }).click(),
      ]);
      const beforeTyping = reads.length;
      await probe.getByLabel('Search items', { exact: true }).fill('shelf-0');
      await probe.clock.runFor(150);
      await probe.getByLabel('Search items', { exact: true }).fill('shelf-01');
      await probe.clock.runFor(150);
      assert.equal(reads.length, beforeTyping);
      await Promise.all([
        probe.waitForResponse(
          (response) => response.url().includes('/api/internal/inventory?') && response.url().includes('q=shelf-01'),
        ),
        probe.clock.runFor(151),
      ]);
      assert.equal(reads.length, beforeTyping + 1);
      await probe
        .getByRole('status')
        .filter({ hasText: /items on this page/ })
        .waitFor();
      await probe.evaluate(() =>
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }),
      );
      const settledReads = reads.length;
      await probe.getByLabel('Inventory area', { exact: true }).selectOption('merch');
      await probe.clock.runFor(61_000);
      assert.equal(reads.length, settledReads, 'Hidden inventory navigation and polling pause reads');
      await Promise.all([
        probe.waitForResponse(
          (response) => response.url().includes('/api/internal/inventory?') && response.url().includes('area=merch'),
        ),
        probe.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
          document.dispatchEvent(new Event('visibilitychange'));
        }),
      ]);
      await probe
        .getByRole('status')
        .filter({ hasText: /items on this page/ })
        .waitFor();
      await context.setOffline(true);
      const beforeOffline = reads.length;
      await probe.getByLabel('Inventory area', { exact: true }).selectOption('distro');
      await probe.clock.runFor(61_000);
      assert.equal(reads.length, beforeOffline, 'Offline inventory navigation and polling pause reads');
      await Promise.all([
        probe.waitForResponse(
          (response) => response.url().includes('/api/internal/inventory?') && response.url().includes('area=distro'),
        ),
        context.setOffline(false),
      ]);
      await probe
        .getByRole('status')
        .filter({ hasText: /items on this page/ })
        .waitFor();
      const oldRead = Promise.withResolvers();
      const oldStarted = Promise.withResolvers();
      await probe.route('**/api/internal/inventory?*', async (route) => {
        if (new URL(route.request().url()).searchParams.get('q') === 'shelf-02') {
          oldStarted.resolve();
          await oldRead.promise;
        }
        await route.continue();
      });
      try {
        await probe.getByLabel('Search items', { exact: true }).fill('shelf-02');
        await probe.clock.runFor(301);
        await oldStarted.promise;
        await probe.getByLabel('Search items', { exact: true }).fill('shelf-03');
        await probe.clock.runFor(301);
        await probe.locator('.inventory-row').filter({ hasText: 'shelf-03' }).first().waitFor();
        const obsoleteResponse = probe.waitForResponse((response) => response.url().includes('q=shelf-02'));
        oldRead.resolve();
        await obsoleteResponse;
        await probe.clock.runFor(50);
        assert.ok(
          (await probe.locator('.inventory-row').allTextContents()).every((row) => row.includes('shelf-03')),
          'Obsolete inventory responses never replace the current typed query',
        );
      } finally {
        oldRead.resolve();
      }
    } finally {
      await context.close();
    }
  }

  const browser = await browserType.launch({ headless: true });
  const initialStockReads = Promise.withResolvers();
  state.initialStockReads = initialStockReads.promise;
  let page;
  try {
    await mkdir(artifacts, { recursive: true });
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    if (process.env.BLACKBOX_VALIDATION_TRACE === '1')
      await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    initialStockReads.resolve();
    await assertClosedOptionalFeatures(browser);
    await assertOptionalFeatures(browser);
    await assertOverviewPanels(browser);
    await assertNavigationStartup(browser);
    await assertOverviewRefresh(browser);
    await assertStockStartup(browser);
    await page.goto(`${origin}/content/?collection=about&id=about-1`);
    const opening = page.getByRole('textbox', { name: 'Opening text', exact: true });
    await opening.waitFor();
    await page.waitForTimeout(1800);
    assert.equal(records.about[0]._rev, '1', 'Opening rich editors does not convert or save legacy prose');
    assert.equal(records.about[0].data.lead.text, 'A collective in Athens.');
    const nestedSaved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response
          .request()
          .postDataJSON()
          ?.data?.lead?.text?.[0]?.children?.some((span) => span.marks?.includes('strong')),
    );
    await opening.press('ControlOrMeta+a');
    await opening.press('Backspace');
    await opening.pressSequentially('Formatted nested introduction');
    await opening.press('ControlOrMeta+a');
    await opening.press('ControlOrMeta+b');
    assert.equal((await nestedSaved).status(), 200);
    await page
      .frameLocator('iframe[title="Private site appearance preview"]')
      .getByText('Formatted nested introduction', { exact: true })
      .waitFor();
    assert.equal(proseText(records.about[0].data.lead.text), 'Formatted nested introduction');
    const richFrame = page.frames().find((frame) => frame.url().includes('/preview-document'));
    const focusConfig = await richFrame.evaluate(() => {
      const prose = document.createElement('div');
      prose.className = 'editorial-prose';
      prose.style.marginTop = '1500px';
      prose.innerHTML = '<p>First paragraph</p><ul><li>List item</li></ul>';
      document.body.append(prose);
      return JSON.parse(document.querySelector('meta[name="blackbox-preview"]').content);
    });
    await page.evaluate((config) => {
      const frame = document.querySelector('iframe[title="Private site appearance preview"]');
      frame.contentWindow.postMessage(
        { ...config, type: 'focus', text: 'First paragraph\n\nList item' },
        new URL(frame.src).origin,
      );
    }, focusConfig);
    await richFrame.waitForFunction(() => {
      const box = document.querySelector('.editorial-prose').getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight;
    });
    await page.goto(`${origin}/content/?collection=releases`);
    await page.getByRole('button', { name: 'Hide navigation', exact: true }).waitFor();
    const topNavigation = page.locator('.staff-top-navigation');
    assert.equal(await topNavigation.getByRole('link').count(), 6);
    await page.getByRole('button', { name: 'Hide navigation', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Show navigation', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Show navigation', exact: true }).click();
    for (const [name, path] of [
      ['Stock', '/stock/'],
      ['Orders', '/orders/'],
      ['Images', '/content/?view=media'],
      ['Website', '/content/'],
      ['Catalog', '/content/?collection=releases'],
      ['Overview', '/'],
    ]) {
      if (name === 'Stock')
        state.compactProbe = { originalRequests: 0, thumbnailRequests: 0, thumbnailBytes: 0, byKey: {} };
      await topNavigation.getByRole('link', { name, exact: true }).click();
      await page.waitForURL(`${origin}${path}`);
      await topNavigation.locator(`a[aria-current="page"]`).filter({ hasText: name }).waitFor();
      if (name === 'Stock') {
        await page.locator('.inventory-row').first().waitFor();
        assert.equal(await page.locator('.inventory-row').count(), 25);
        for (const row of await page.locator('.inventory-row').all()) await row.scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () =>
            document.querySelectorAll('.inventory-row img, .inventory-row .inventory-artwork-placeholder').length ===
            25,
        );
        await page.locator('#inventory-first .inventory-artwork-placeholder').waitFor();
        await page.waitForTimeout(250);
        assert.equal(state.compactProbe.originalRequests, 0, 'Compact stock rows must not request original media');
        assert.equal(state.compactProbe.thumbnailRequests, 25, 'Each compact stock row must request one thumbnail');
        assert.ok(state.compactProbe.thumbnailBytes <= 1024 * 1024, 'Compact thumbnails must stay under 1 MiB');
        const missingReads = state.compactProbe.byKey['missing.jpg'];
        assert.equal(missingReads, 1, 'Missing artwork should make one thumbnail request');
        await page.waitForTimeout(250);
        assert.equal(state.compactProbe.byKey['missing.jpg'], missingReads, 'Missing artwork must not retry');
        console.log(
          'Compact artwork contract probe:',
          JSON.stringify({
            originalRequests: state.compactProbe.originalRequests,
            thumbnailRequests: state.compactProbe.thumbnailRequests,
            thumbnailBytes: state.compactProbe.thumbnailBytes,
            missingReads,
          }),
        );
        state.compactProbe = null;
      }
      assert.equal(
        await page.locator('.staff-context-navigation').count(),
        ['Catalog', 'Website'].includes(name) ? 1 : 0,
      );
    }
    assert.equal(
      await page.getByRole('link', { name: 'View website', exact: true }).getAttribute('href'),
      expectedWebsiteUrl,
    );
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    for (const [name, href] of [
      ['Artist', '/content/?collection=artists&new=1'],
      ['Release', '/items/new/?kind=release'],
      ['Distro', '/items/new/?kind=distro'],
      ['Merch', '/items/new/?kind=merch'],
    ]) {
      assert.equal(await page.getByRole('menuitem', { name, exact: true }).getAttribute('href'), href);
    }
    await page.getByRole('menuitem', { name: 'Artist', exact: true }).click();
    await page.getByLabel('Artist name', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), '');
    await page.getByLabel('Artist name', { exact: true }).fill('Navigation test artist');
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).first().waitFor();
    for (const width of [390, 768, 1280, 1439, 1440, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await topNavigation.isVisible(), width >= 1440);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width < 1440) {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        const drawer = page.getByRole('dialog', { name: 'Staff workspace', exact: true });
        await drawer.waitFor();
        assert.equal(
          await drawer.getByRole('navigation', { name: 'Staff workspace', exact: true }).getByRole('link').count(),
          6,
        );
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
        await page.keyboard.press('Escape');
        await drawer.waitFor({ state: 'hidden' });
        assert.equal(
          await page
            .getByRole('button', { name: 'Menu', exact: true })
            .evaluate((button) => button === document.activeElement),
          true,
        );
      }
      await page.screenshot({ path: resolve(artifacts, `staff-navigation-${width}.png`) });
    }
    // A drawer link must wait for the editor's pending save, even with a slow response.
    await page.setViewportSize({ width: 390, height: 900 });
    state.saveDelay = 1000;
    await page.getByLabel('Artist name', { exact: true }).fill('Saved before switching area');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Staff workspace', exact: true })
      .getByRole('link', { name: 'Stock', exact: true })
      .click();
    await page.waitForURL(`${origin}/stock/`);
    assert.ok(records.artists.some((item) => item.data.title === 'Saved before switching area'));
    state.saveDelay = 0;
    await page.goBack();
    await page.getByLabel('Artist name', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Artist name', { exact: true }).inputValue(), 'Saved before switching area');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/content/?collection=artists&id=artists-1`);
    records.artists = records.artists.filter((item) => item.data.title !== 'Saved before switching area');
    const artistName = page.getByLabel('Artist name', { exact: true });
    await artistName.waitFor();
    const appearance = page.frameLocator('iframe[title="Private site appearance preview"]');
    await appearance.getByRole('heading', { name: 'Ouranopithecus', exact: true }).waitFor();
    await page.evaluate(() => {
      const frame = document.querySelector('iframe[title="Private site appearance preview"]');
      const url = new URL(frame.src);
      const data = {
        type: 'failed',
        stage: 'image',
        context: url.searchParams.get('__preview'),
        generation: Number(frame.dataset.previewGeneration),
      };
      for (const forged of [
        { origin: location.origin, source: frame.contentWindow, data },
        { origin: url.origin, source: window, data },
        { origin: url.origin, source: frame.contentWindow, data: { ...data, context: 'forged' } },
        { origin: url.origin, source: frame.contentWindow, data: { ...data, generation: data.generation + 1 } },
      ]) {
        const event = new MessageEvent('message', { origin: forged.origin, data: forged.data });
        Object.defineProperty(event, 'source', { value: forged.source });
        window.dispatchEvent(event);
      }
    });
    assert.equal(await page.getByRole('alert').filter({ hasText: 'Preview images could not load' }).count(), 0);
    await appearance.getByRole('heading', { name: 'Ouranopithecus', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Save draft', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Refresh preview', exact: true }).count(), 0);
    for (const width of [390, 768, 1280, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok((await artistName.boundingBox()).width > 200);
      if (width === 390) assert.ok((await artistName.boundingBox()).y <= 250, 'First field begins within 250px');
      await page.screenshot({ path: resolve(artifacts, `staff-editor-${width}.png`) });
    }
    const contrast = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('.cms-surface'));
      const context = document.createElement('canvas').getContext('2d');
      const luminance = (property) => {
        context.fillStyle = style.getPropertyValue(property).trim();
        context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      return [
        ['--foreground', '--background'],
        ['--muted-foreground', '--background'],
        ['--primary-foreground', '--primary'],
      ].map(([text, background]) => {
        const a = luminance(text),
          b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    assert.ok(
      contrast.every((ratio) => ratio >= 4.5),
      `Text contrast: ${contrast}`,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement !== document.body));
    await artistName.fill('');
    await page.waitForResponse(
      (response) => response.request().method() === 'PUT' && response.url().includes('/content/artists/'),
    );
    assert.equal(records.artists[0].data.title, '', 'Incomplete drafts save privately');
    assert.equal(state.publicTitle, 'Ouranopithecus', 'Saving does not publish');
    await page.getByRole('button', { name: 'Review changes', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Fix the highlighted' }).waitFor();
    state.saveDelay = 1200;
    await artistName.fill('Earlier typing');
    await page.waitForRequest((request) => request.method() === 'PUT' && request.url().includes('/content/artists/'));
    await artistName.fill('Newer typing survives');
    await page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.request().postDataJSON().data.title === 'Newer typing survives',
    );
    assert.equal(await artistName.inputValue(), 'Newer typing survives');
    assert.equal(records.artists[0].data.title, 'Newer typing survives');
    await artistName.fill('Save before leaving');
    await Promise.all([
      page.waitForRequest((request) => request.method() === 'PUT' && request.url().includes('/content/artists/')),
      page.getByRole('button', { name: 'Back to list', exact: true }).click(),
    ]);
    await artistName.fill('Last typing before leaving');
    await page.getByRole('button', { name: 'Back to list', exact: true }).waitFor({ state: 'hidden' });
    assert.equal(
      records.artists[0].data.title,
      'Last typing before leaving',
      'Navigation drains edits made during an in-flight save',
    );
    await page.getByRole('button', { name: /Last typing before leaving/ }).click();
    state.saveDelay = 0;
    state.failSave = true;
    await artistName.fill('Keep failed save');
    await page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
    assert.equal(await artistName.inputValue(), 'Keep failed save');
    await page.setViewportSize({ width: 390, height: 900 });
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Staff workspace', exact: true })
      .getByRole('link', { name: 'Orders', exact: true })
      .click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Keep editing', exact: true }).click();
    await page.getByRole('dialog', { name: 'Staff workspace', exact: true }).waitFor();
    await page
      .getByRole('dialog', { name: 'Staff workspace', exact: true })
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    assert.equal(
      await artistName.inputValue(),
      'Keep failed save',
      'Failed navigation retains both the drawer and local typing',
    );
    await page.setViewportSize({ width: 1600, height: 900 });
    state.failSave = false;
    await page.getByRole('button', { name: 'Retry save', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    await page.context().setOffline(true);
    await artistName.fill('Offline typing');
    await page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
    await page.context().setOffline(false);
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    assert.equal(records.artists[0].data.title, 'Offline typing');
    state.conflict = true;
    await artistName.fill('My conflicting text');
    await page.getByRole('alert').filter({ hasText: 'Someone changed this entry' }).waitFor();
    assert.equal(await artistName.inputValue(), 'My conflicting text');
    state.conflict = false;
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard unsaved changes' }).click();
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    await artistName.fill('Publication review');
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    const reviewed = records.artists[0]._rev;
    await page.evaluate(() =>
      sessionStorage.setItem(
        'blackbox-website-review:',
        JSON.stringify([
          { collection: 'artists', recordId: 'artists-2', expectedRevision: 'old', title: 'Mass Culture' },
        ]),
      ),
    );
    await page.getByRole('button', { name: 'Review changes', exact: true }).click();
    await page.getByRole('heading', { name: 'Review your changes', exact: true }).waitFor();
    assert.ok((await page.url()).includes('/content/'), 'Single-entry review stays in the editor');
    for (const width of [390, 768, 1280, 1600]) {
      await page.setViewportSize({ width, height: 960 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Guided review fits ${width}`,
      );
      await page.screenshot({ path: resolve(artifacts, `publication-guided-${width}.png`) });
    }
    const publishing = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/blackbox/content-publications'),
    );
    await page.getByRole('button', { name: 'Publish change', exact: true }).click();
    assert.equal((await publishing).postDataJSON().records[0].expectedRevision, reviewed);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Check status', exact: true }).click();
    state.publication = 'live';
    await page.getByRole('heading', { name: 'Your changes are on the website', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem('blackbox-website-review:'))[0].recordId),
      'artists-2',
      'Individual publication preserves grouped selection',
    );
    await page.getByRole('button', { name: 'Back to editing', exact: true }).click();
    await artistName.waitFor();
    // Asset failures retain useful preview content and offer a scoped retry.
    state.previewImageFailure = true;
    await artistName.fill('Image failure preview');
    await page.getByRole('alert').filter({ hasText: 'Preview images could not load' }).waitFor();
    state.previewImageFailure = false;
    await page.getByRole('button', { name: 'Retry preview', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    state.previewStyleFailure = true;
    await artistName.fill('Style failure preview');
    await page.getByRole('alert').filter({ hasText: 'Preview styles could not load' }).waitFor();
    state.previewStyleFailure = false;
    await page.getByRole('button', { name: 'Retry preview', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Preview up to date' }).waitFor();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const previewReads = state.previewRequests.length;
    await artistName.fill('Hidden preview');
    await page.waitForTimeout(1800);
    assert.equal(state.previewRequests.length, previewReads, 'Closed preview does no background work');
    await page.getByRole('button', { name: 'Change artist image', exact: true }).click();
    await page.getByLabel('Search images', { exact: true }).fill('mass-culture');
    await page.getByText('mass-culture-barren-point-cover.jpg', { exact: true }).first().waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await artistName.inputValue(), 'Hidden preview');
    await page.goto(`${origin}/items/new/?kind=release`);
    await page.setViewportSize({ width: 390, height: 900 });
    const kindField = page.getByLabel('Title', { exact: true });
    await kindField.waitFor();
    assert.ok((await kindField.boundingBox()).y <= 250, 'Creation starts within 250px');
    await page.getByLabel('Title', { exact: true }).fill('Unfinished release');
    await page.getByRole('status').filter({ hasText: 'Changes saved privately' }).waitFor();
    assert.ok(
      records.releases.some((item) => item.data.title === 'Unfinished release'),
      'Guided creation uses native private drafts',
    );
    assert.equal(
      state.requests.some((request) => request.method === 'POST' && request.path.includes('/api/internal/items')),
      false,
      'No price or stock before confirmation',
    );
    const descriptionEditor = page.getByRole('textbox', { name: 'Short description', exact: true });
    const richSaved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response
          .request()
          .postDataJSON()
          ?.data?.summary_rich?.some((block) => block.children?.some((span) => span.marks?.includes('strong'))),
    );
    await descriptionEditor.fill('Formatted item description');
    await descriptionEditor.press('ControlOrMeta+a');
    await descriptionEditor.press('ControlOrMeta+b');
    assert.equal((await richSaved).status(), 200);
    const created = records.releases.find((item) => item.data.title === 'Unfinished release');
    assert.equal(proseText(created.data.summary_rich), 'Formatted item description');
    assert.ok(created.data.summary_rich[0].children.some((span) => span.marks.includes('strong')));
    assert.ok(!created.data.summary, 'Rich edits do not synchronize a legacy summary');
    await page.screenshot({ path: resolve(artifacts, 'staff-add-release-390.png') });
    // Complete catalog filtering, pagination and browser navigation with 250 entries.
    const originalDistro = [...records.distro];
    records.distro.push(
      ...Array.from({ length: 250 }, (_, index) => ({
        ...originalDistro[0],
        id: `browse-${index}`,
        slug: `browse-${index}`,
        data: {
          ...originalDistro[0].data,
          title: `Browse ${String(index).padStart(3, '0')}`,
          group: index % 2 ? 'Tapes' : 'Clothes',
        },
      })),
    );
    await page.goto(`${origin}/content/?collection=distro`);
    await page.getByRole('combobox', { name: 'Catalog area', exact: true }).selectOption('merch');
    await page.getByRole('textbox', { name: 'Search distro and merch', exact: true }).fill('Browse');
    await page.getByRole('button', { name: /Browse 000/ }).waitFor();
    await page.getByRole('button', { name: /Browse 001/ }).waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: /Browse 050/ }).waitFor();
    await page.getByRole('button', { name: /Browse 050/ }).click();
    await page.locator('#content-title').waitFor();
    await page.goBack();
    await page.getByRole('button', { name: /Browse 050/ }).waitFor();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.getByRole('button', { name: /Browse 000/ }).waitFor();
    // Shared review retains selections across pages and publishes a mixed batch once.
    await page.goto(`${origin}/review/?scope=catalog`);
    await page.locator('.website-change-list article').first().waitFor();
    for (const width of [390, 768, 1280, 1440, 1600]) {
      await page.setViewportSize({ width, height: 960 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Review fits ${width}`);
      await page.screenshot({ path: resolve(artifacts, `website-review-${width}.png`) });
    }

    await page.getByRole('button', { name: 'Select ready changes on this page' }).click();
    await page.getByText('20/20 changes selected', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Select ready changes on this page' }).isEnabled(), false);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForURL((url) => url.searchParams.has('cursor'));
    await page.reload();
    await page.getByText('20/20 changes selected', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.getByRole('button', { name: 'Review selected changes', exact: true }).click();
    await page.getByRole('heading', { name: 'Review your changes', exact: true }).waitFor();
    const batch = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/blackbox/content-publications'),
    );
    state.publication = 'live';
    await page.getByRole('button', { name: 'Publish 20 changes', exact: true }).click();
    const chosen = (await batch).postDataJSON().records;
    assert.equal(chosen.length, 20);
    assert.ok(new Set(chosen.map((item) => item.collection)).size > 1);
    await page.getByRole('button', { name: 'Back to changes', exact: true }).click();
    await page.getByText('0/20 changes selected', { exact: true }).waitFor();
    records.distro = originalDistro;

    // Explicit visual-preview bypass and lost-response recovery reuse one operation
    // without replacing the unrelated grouped selection, even after reload.
    await page.goto(`${origin}/content/?collection=artists&id=artists-1`);
    await page.locator('#content-title').waitFor();
    await page.evaluate(() =>
      sessionStorage.setItem(
        'blackbox-website-review:',
        JSON.stringify([
          { collection: 'artists', recordId: 'artists-2', expectedRevision: 'old', title: 'Mass Culture' },
        ]),
      ),
    );
    state.previewImageFailure = true;
    state.publication = 'pending';
    await page.getByRole('button', { name: 'Review changes', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Preview images could not load' }).waitFor();
    const publicationCount = publications.length;
    const publicationRoute = '**/_emdash/api/blackbox/content-publications';
    await page.route(publicationRoute, async (route) => {
      await route.fetch();
      await route.abort('failed');
    });
    const lostResponse = page.waitForEvent('requestfailed', (request) =>
      request.url().endsWith('/blackbox/content-publications'),
    );
    await page.getByRole('button', { name: 'Publish without preview', exact: true }).click();
    await lostResponse;
    await page.getByRole('button', { name: 'Check status', exact: true }).waitFor();
    await page.unroute(publicationRoute);
    await page.goto(`${origin}/review/`);
    await page.getByRole('button', { name: 'Check status', exact: true }).waitFor();
    await page.reload();
    state.publication = 'live';
    await page.getByRole('heading', { name: 'Your changes are on the website', exact: true }).waitFor();
    assert.equal(
      publications.length,
      publicationCount + 1,
      'Lost response and reload do not create another publication',
    );
    assert.equal(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem('blackbox-website-review:'))[0].recordId),
      'artists-2',
    );
    state.previewImageFailure = false;

    await page.goto(`${origin}/content/?collection=artists&id=artists-2`);
    const savedDraftArtistName = page.getByLabel('Artist name', { exact: true });
    await savedDraftArtistName.waitFor();
    assert.equal(await savedDraftArtistName.inputValue(), 'Mass Culture saved draft');
    state.failSave = true;
    await savedDraftArtistName.fill('Local edit before discard');
    await page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
    await page.getByRole('button', { name: 'More draft actions' }).click();
    const savedDiscardItem = page.getByRole('menuitem', { name: 'Discard saved changes', exact: true });
    assert.equal(await savedDiscardItem.isDisabled(), true, 'Saved-draft discard waits for unsaved edits');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard unsaved changes', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
    state.failSave = false;
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    await page.waitForFunction(
      (expected) => document.querySelector('#content-title')?.value === expected,
      'Mass Culture saved draft',
    );
    assert.equal(await savedDraftArtistName.inputValue(), 'Mass Culture saved draft');
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard saved changes', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Keep saved changes', exact: true }).click();
    assert.equal(await savedDraftArtistName.inputValue(), 'Mass Culture saved draft');
    await page.getByRole('button', { name: 'More draft actions' }).click();
    await page.getByRole('menuitem', { name: 'Discard saved changes', exact: true }).click();
    const discardRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/content/artists/artists-2/discard-draft'),
    );
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard saved changes', exact: true }).click();
    await discardRequest;
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    await page.waitForFunction(
      (expected) => document.querySelector('#content-title')?.value === expected,
      'Mass Culture',
    );
    assert.equal(await savedDraftArtistName.inputValue(), 'Mass Culture');
    assert.equal(records.artists.find((item) => item.id === 'artists-2').data.title, 'Mass Culture');
    assert.equal(records.artists.find((item) => item.id === 'artists-2').draftRevisionId, null);

    await page.goto(`${origin}/stock/`);
    await page.locator('.inventory-row').first().waitFor();
    assert.equal(await page.locator('.inventory-row').count(), 25);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForURL(/cursor=25/);
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.waitForURL((url) => !url.searchParams.has('cursor'));
    await page.getByRole('combobox', { name: 'Inventory area' }).selectOption('release');
    await page.waitForFunction(() => document.querySelectorAll('.inventory-row').length === 2);
    await page.getByRole('button', { name: 'Count stock', exact: true }).click();
    await page.getByText('Count 1 of 2', { exact: true }).first().waitFor();
    await page.getByLabel('Physical stock counted').fill('15');
    await page.getByRole('button', { name: 'Record count and next' }).click();
    await page.getByText('Count 2 of 2', { exact: true }).first().waitFor();
    await page.reload();
    await page.getByText('Count 2 of 2', { exact: true }).first().waitFor();
    state.countFailure = true;
    await page.getByLabel('Physical stock counted').fill('14');
    await page.getByRole('button', { name: 'Record count and next' }).click();
    await page.getByRole('button', { name: 'I have reassessed this count' }).waitFor();
    assert.match(await page.locator('.stocktake-progress').innerText(), /1 recorded/);
    state.countFailure = false;
    await page.getByRole('button', { name: 'I have reassessed this count' }).click();
    await page.getByRole('button', { name: 'Record count and next' }).click();
    await page.waitForFunction(() => document.querySelector('.stocktake-progress')?.textContent.includes('2 recorded'));
    await page.getByRole('button', { name: 'Finish counting' }).click();

    for (const width of [390, 768, 1280, 1440, 1600]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`${origin}/stock/?variantId=first`);
      await page.getByLabel('How many?').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Stock fits ${width}`);
      if (width === 390)
        assert.ok((await page.getByLabel('What changed?').boundingBox()).y < 250, 'First stock input within 250px');
      await page.screenshot({ path: resolve(artifacts, `inventory-${width}.png`) });
    }
    // Stock reads must not erase unfinished counts.
    await page.clock.install();
    await page.goto(`${origin}/stock/?variantId=first`);
    await page.getByRole('group').getByRole('button', { name: 'Count stock', exact: true }).click();
    await page.getByLabel('Physical stock counted', { exact: true }).fill('12');
    const count = page.locator('#stock-count-counted-quantity');
    assert.equal(await count.inputValue(), '12');
    assert.equal(await page.getByRole('button', { name: 'Refresh', exact: true }).count(), 0);
    for (const width of [390, 768, 1280, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390)
        assert.ok((await count.boundingBox()).y <= 250, 'Selected stock starts with its editable count');
      await page.screenshot({ path: resolve(artifacts, `staff-stock-${width}.png`) });
    }
    state.stockRevision = 4;
    await page.clock.runFor(60_100);
    await page.getByRole('button', { name: /reassessed/ }).waitFor();
    assert.equal(await count.inputValue(), '12', 'Changed stock never clears entered counts');
    assert.equal(await page.getByRole('button', { name: 'Save count', exact: true }).isEnabled(), false);
    await page.goto(`${origin}/orders/`);
    await page.getByText('Test customer 0', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByText('Test customer 25', { exact: true }).waitFor();
    await page.getByLabel('Search orders', { exact: true }).fill('ORDER-050');
    await page.clock.runFor(350);
    await page.getByText('Test customer 50', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Open order:/ }).count(), 1);
    for (const width of [390, 768, 1280, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: resolve(artifacts, `staff-orders-${width}.png`) });
    }
    const orderReads = () => state.requests.filter((request) => request.path === '/api/internal/orders/search').length;
    await page.evaluate(() =>
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }),
    );
    const beforeHidden = orderReads();
    await page.clock.runFor(120_100);
    assert.equal(orderReads(), beforeHidden, 'Hidden tabs do not poll orders');
    await page.evaluate(() =>
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }),
    );
    state.orderDenied = true;
    await page.clock.runFor(60_100);
    await page.getByRole('heading', { name: 'Access required' }).waitFor();
    assert.equal(
      await page.getByText('Test customer 50', { exact: true }).count(),
      0,
      'Access denial clears protected data',
    );
    const pollingPage = await browser.newPage();
    try {
      state.publication = 'pending';
      publications.unshift({ id: '00000000-0000-4000-8000-000000000002', status: 'pending', requestedAt: Date.now() });
      await pollingPage.clock.install();
      await pollingPage.goto(`${origin}/content/`);
      await pollingPage.getByRole('button', { name: /Publishing.*pending/ }).waitFor();
      const reads = () =>
        state.requests.filter((request) => request.path === '/_emdash/api/blackbox/publications').length;
      await pollingPage.evaluate(() =>
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }),
      );
      const before = reads();
      await pollingPage.clock.runFor(120_000);
      assert.equal(reads(), before, 'Hidden publication polling is paused');
      await pollingPage.evaluate(() =>
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }),
      );
      await pollingPage.clock.runFor(30 * 60_000);
      await pollingPage.getByRole('button', { name: 'Check publication status' }).waitFor();
      state.publication = 'failed';
      await pollingPage.getByRole('button', { name: 'Check publication status' }).click();
      await pollingPage.getByRole('button', { name: 'Publication failed', exact: true }).waitFor();
    } finally {
      await pollingPage.close();
    }
    console.log(
      'Observed local fixture requests:',
      JSON.stringify(
        state.requests.reduce((counts, request) => {
          counts[request.path] = (counts[request.path] ?? 0) + 1;
          return counts;
        }, {}),
      ),
    );
    console.log('CMS workspace browser regression passed. Screenshots:', artifacts);
  } catch (error) {
    if (page) {
      await page
        .context()
        .tracing.stop({ path: resolve(artifacts, 'failure-trace.zip') })
        .catch(() => {});
      await page.screenshot({ path: resolve(artifacts, 'failure.png') });
      console.error((await page.locator('body').innerText()).slice(-3500));
    }
    throw error;
  } finally {
    initialStockReads.resolve();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
