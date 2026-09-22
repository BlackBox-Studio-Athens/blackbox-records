// Run against pnpm dev:stack:stripe-mock. Mutates and restores two Local artist drafts.
import assert from 'node:assert/strict';
import { formattedProse } from './fixtures/prose.ts';
import { editorialWriteData } from '../apps/staff/src/lib/backend/editorial-api.ts';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const staff = process.env.PREVIEW_STAFF_ORIGIN || 'http://127.0.0.1:8787';
const site = `${process.env.PREVIEW_PUBLIC_ORIGIN || 'http://127.0.0.1:4321'}/blackbox-records`;
assert.ok(['http://127.0.0.1:8787', 'http://127.0.0.1:8799'].includes(staff));
assert.ok(['http://127.0.0.1:4321/blackbox-records', 'http://127.0.0.1:4339/blackbox-records'].includes(site));
const reviewCosts = [];
if (process.env.PREVIEW_FIXTURE_PERSIST_TO) {
  const identity = JSON.parse(await readFile(resolve(process.env.PREVIEW_FIXTURE_PERSIST_TO, 'identity.json'), 'utf8'));
  const home = (await api('content/home?limit=1')).data.items[0];
  assert.equal(home.id, identity.homeId, 'Refuse publication through another worktree’s Worker registry entry.');
}
async function api(path, body, method = 'POST') {
  const response = await fetch(`${staff}/_emdash/api/${path}`, {
    method: body ? method : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1', Origin: staff },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, `${path}: ${response.status}`);
  if (path === 'blackbox/publication-review')
    reviewCosts.push(Number(response.headers.get('X-Publication-Review-Reads')));
  return response.json();
}
async function save(item, data, collection = 'artists') {
  const path = `content/${collection}/${item.id}`;
  const current = (await api(path)).data;
  return (await api(path, { _rev: current._rev, data: editorialWriteData({ bio_rich: null, ...data }) }, 'PUT')).data;
}
async function publish(item, saved, extra = [], inspectPreview = async () => {}) {
  const started = performance.now();
  const input = {
    id: randomUUID(),
    records: [{ collection: 'artists', recordId: item.id, expectedRevision: saved._rev }, ...extra],
  };
  const review = await api('blackbox/publication-review', { records: input.records });
  assert.equal(review.dependencies.length, 0);
  assert.ok(review.entries.every((entry) => entry.issues.length === 0));
  input.baseline = review.baseline;
  const beforePreview = await api('blackbox/publications');
  const preview = await fetch(`${staff}/_emdash/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1', Origin: staff },
    body: JSON.stringify({
      collection: 'artists',
      id: item.id,
      publication: { records: input.records, baseline: input.baseline },
    }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(preview.status, 200, await preview.clone().text());
  const document = await preview.json();
  const rendered = await fetch(document.url);
  assert.equal(rendered.status, 200);
  const html = await rendered.text();
  assert.ok(html.includes(saved.item.data.genre), 'Shared-template publication preview shows selected saved content.');
  if (saved.item.data.bio_rich) {
    assert.match(html, /<strong>Bold description<\/strong>/);
    assert.ok(html.includes('Band website'));
  }
  assert.equal(preview.headers.get('X-Preview-Environment'), 'local');
  const imagePath = html
    .match(/src="([^" ]*(?:\/_preview\/media\/|href=%2F_preview%2Fmedia%2F)[^" ]+)"/)?.[1]
    ?.replaceAll('&amp;', '&');
  assert.ok(imagePath, 'Combined preview uses immutable accepted images');
  const image = await fetch(new URL(imagePath, document.url));
  assert.equal(image.status, 200, 'Accepted image is available through the private review route');
  await image.body?.cancel();
  await inspectPreview(document);
  const release = await fetch(`${staff}/_emdash/preview-release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: staff, 'X-EmDash-Request': '1' },
    body: JSON.stringify({ context: document.context }),
  });
  assert.equal(release.status, 204);
  assert.deepEqual(await api('blackbox/publications'), beforePreview, 'Review and preview never create a publication');
  await api('blackbox/content-publications', input);
  // Repeat the same request to exercise response-loss recovery without duplicate publication.
  await api('blackbox/content-publications', input);
  while (performance.now() - started < 60000) {
    const { items } = await api('blackbox/publications');
    const publication = items.find((entry) => entry.id === input.id);
    assert.notEqual(publication?.status, 'failed', JSON.stringify(publication));
    if (publication?.status === 'live') {
      const html = await fetch(`${site}/artists/${item.slug}/`).then((response) => response.text());
      assert.ok(html.includes(saved.item.data.genre));
      if (saved.item.data.bio_rich) {
        assert.match(html, /<strong>Bold description<\/strong>/);
        assert.match(html, /href="https:\/\/example.com\/band"/);
      }
      return Math.round(performance.now() - started);
    }
    await setTimeout(500);
  }
  assert.fail('Publication exceeded 60 seconds.');
}

// Opt-in to the disposable worktree fixture; never edits canonical or hosted commerce storage.
if (process.env.PREVIEW_FIXTURE_PERSIST_TO) {
  const persistTo = resolve(process.env.PREVIEW_FIXTURE_PERSIST_TO);
  assert.ok(persistTo.startsWith(resolve('.codex-artifacts') + sep));
  assert.equal(staff, 'http://127.0.0.1:8799');
  assert.equal(site, 'http://127.0.0.1:4339/blackbox-records');
  const config = JSON.parse(await readFile('apps/backend/dist/server/wrangler.json', 'utf8'));
  assert.equal(config.vars.PRODUCT_ENVIRONMENT, 'LOCAL');
  const storage = resolve('.codex-artifacts/preview-publication-storage.json');
  await writeFile(
    storage,
    JSON.stringify({
      name: 'preview-publication-storage',
      compatibility_date: config.compatibility_date,
      d1_databases: config.d1_databases.filter((binding) => binding.binding === 'COMMERCE_DB'),
    }),
  );
  const require = createRequire(resolve('apps/backend/package.json'));
  const { getPlatformProxy } = await import(pathToFileURL(require.resolve('wrangler')));
  const proxy = await getPlatformProxy({
    configPath: storage,
    persist: { path: resolve(persistTo, 'v3') },
    envFiles: [],
  });
  try {
    const releaseSummary = (await api('content/releases?limit=1')).data.items[0];
    const release = (await api(`content/releases/${releaseSummary.id}`)).data.item;
    const artist = (await api(`content/artists/${release.data.artist}`)).data.item;
    const option = await proxy.env.COMMERCE_DB.prepare(
      "SELECT variantId, storeItemSlug FROM StoreItemOption WHERE sourceKind = 'release' AND sourceId = ? LIMIT 1",
    )
      .bind(release.slug)
      .first();
    assert.ok(option, 'The isolated release has a catalog identity.');
    const newSlug = option.storeItemSlug + '-preview-check';
    const form = new FormData();
    const bytes = await readFile('apps/staff/public/favicon-96x96.png');
    form.set('file', new Blob([bytes], { type: 'image/png' }), 'preview-publication-fixture.png');
    form.set(
      'thumbnail',
      new Blob([await sharp(bytes).resize({ width: 32, height: 32, fit: 'inside' }).png().toBuffer()], {
        type: 'image/png',
      }),
      'thumbnail.png',
    );
    form.set('width', '96');
    form.set('height', '96');
    const uploaded = await fetch(`${staff}/_emdash/api/media`, {
      method: 'POST',
      headers: { Origin: staff, 'X-EmDash-Request': '1' },
      body: form,
    });
    assert.ok([200, 201].includes(uploaded.status), await uploaded.clone().text());
    const imageId = (await uploaded.json()).data.item.id;
    const imageSource = (html) =>
      html
        .match(
          /src="([^" ]*(?:\/_preview\/media\/|href=%2F_preview%2Fmedia%2F|href=%2Fblackbox-records%2Fmedia%2Fcontent%2F)[^" ]+)"/,
        )?.[1]
        ?.replaceAll('&amp;', '&');
    try {
      await proxy.env.COMMERCE_DB.prepare('UPDATE StoreItemOption SET storeItemSlug = ? WHERE variantId = ?')
        .bind(newSlug, option.variantId)
        .run();
      const savedArtist = await save(artist, { ...artist.data, genre: `Related batch ${randomUUID()}` });
      const savedRelease = await save(release, { ...release.data, cover_image: { id: imageId } }, 'releases');
      let previewBytes;
      await publish(
        artist,
        savedArtist,
        [{ collection: 'releases', recordId: release.id, expectedRevision: savedRelease._rev }],
        async (document) => {
          const target = new URL(
            `/blackbox-records/releases/${release.slug}/?__preview=${document.context}`,
            document.url,
          );
          const response = await fetch(target);
          assert.equal(response.status, 200);
          const html = await response.text();
          assert.ok(html.includes(`/store/${newSlug}/`), 'Preview uses the selected Store Item identity.');
          assert.ok(imageSource(html));
          previewBytes = Buffer.from(await (await fetch(new URL(imageSource(html), target))).arrayBuffer());
          assert.deepEqual(previewBytes, bytes, 'Preview uses the newly selected image.');
        },
      );
      const target = `${site}/releases/${release.slug}/`;
      const html = await (await fetch(target)).text();
      assert.ok(html.includes(`/store/${newSlug}/`), 'Published output uses the same Store Item identity.');
      assert.ok(imageSource(html));
      assert.deepEqual(
        Buffer.from(await (await fetch(new URL(imageSource(html), target))).arrayBuffer()),
        previewBytes,
      );
      console.log(
        'Related Artist/Release batch: new media bytes and Store Item identity match actual published output.',
      );
    } finally {
      await proxy.env.COMMERCE_DB.prepare('UPDATE StoreItemOption SET storeItemSlug = ? WHERE variantId = ?')
        .bind(option.storeItemSlug, option.variantId)
        .run();
      const savedArtist = await save(artist, artist.data);
      const savedRelease = await save(release, release.data, 'releases');
      await publish(artist, savedArtist, [
        { collection: 'releases', recordId: release.id, expectedRevision: savedRelease._rev },
      ]);
      assert.ok(
        (await (await fetch(`${site}/releases/${release.slug}/`)).text()).includes(`/store/${option.storeItemSlug}/`),
      );
    }
  } finally {
    await proxy.dispose();
  }
}
const { items } = (await api('content/artists?limit=3')).data;
assert.ok(items.length >= 2);
const [selected, other] = await Promise.all(
  items.slice(0, 2).map(async (item) => (await api(`content/artists/${item.id}`)).data.item),
);
const marker = `Private draft ${randomUUID()}`;
try {
  await save(other, { ...other.data, genre: marker });
  const saved = await save(selected, {
    ...selected.data,
    bio_rich: formattedProse,
    genre: `Publication check ${randomUUID()}`,
  });
  const elapsedMs = await publish(selected, saved);
  const unrelated = await fetch(`${site}/artists/${other.slug}/`).then((response) => response.text());
  assert.ok(!unrelated.includes(marker), 'Unrelated draft leaked to the public site.');
  const second = (await api(`content/artists/${other.id}`)).data;
  const latest = (await api(`content/artists/${selected.id}`)).data;
  const batchElapsedMs = await publish(selected, latest, [
    { collection: 'artists', recordId: other.id, expectedRevision: second._rev },
  ]);
  const together = await fetch(`${site}/artists/${other.slug}/`).then((response) => response.text());
  assert.ok(together.includes(marker), 'Selected batch record did not go live.');
  console.log(
    JSON.stringify({
      elapsedMs,
      batchElapsedMs,
      unrelatedDraftPrivate: true,
      idempotency: true,
      reviewCmsReads: reviewCosts,
      combinedPreview: true,
    }),
  );
} finally {
  const restoredOther = await save(other, other.data);
  const restored = await save(selected, selected.data);
  await publish(selected, restored, [
    { collection: 'artists', recordId: other.id, expectedRevision: restoredOther._rev },
  ]);
}
