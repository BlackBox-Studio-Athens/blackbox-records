import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getPlatformProxy, unstable_dev } from 'wrangler';
import sharp from 'sharp';
import { inventory, parseMarkdown } from '../../../../scripts/inventory-cms-content.mjs';
import { markdownTreeToPortableText } from '../../../../scripts/cms-markdown.mjs';
import { DISTRO_GROUP_VALUES, sourceCollectionNames } from '@blackbox/content-model';
import { createCmsSnapshotReaders } from '../../../../scripts/cms-snapshot-readers.mjs';
import { captureCmsSnapshot } from '../../../../scripts/capture-cms-snapshot.mjs';
import { stageCmsSnapshot } from '../../../../scripts/stage-cms-snapshot.mjs';
import { writeCmsSnapshot } from '../../../../scripts/export-cms-snapshot.mjs';
import { readContentSnapshot } from '../../../web/src/lib/content-snapshot.ts';
import { claimPublicationDispatch } from '../../src/cms/publication-journal.ts';

const root = new URL('../../', import.meta.url);
const stateRoot = realpathSync(fileURLToPath(new URL('.emdash/', root)));
const localState = mkdtempSync(join(stateRoot, 'publication-smoke-'));
const workflowToken = 'a'.repeat(64);
let worker;
try {
  const commerceMigration = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('node_modules/wrangler/bin/wrangler.js', root)),
      'd1',
      'migrations',
      'apply',
      'COMMERCE_DB',
      '--local',
      '--persist-to',
      localState,
      '--config',
      fileURLToPath(new URL('dist/server/wrangler.json', root)),
    ],
    { env: { ...process.env, CI: 'true' }, encoding: 'utf8', windowsHide: true },
  );
  assert.equal(commerceMigration.status, 0, commerceMigration.stdout + commerceMigration.stderr);
  worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
    config: fileURLToPath(new URL('dist/server/wrangler.json', root)),
    ip: '127.0.0.1',
    port: 8799,
    local: true,
    persist: true,
    persistTo: localState,
    envFiles: [],
    vars: { CMS_PUBLICATION_EXPORT_TOKEN: workflowToken, CONTENT_PUBLICATION_MODE: 'workflow' },
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true },
  });
  const stock = await fetch('http://127.0.0.1:8799/api/internal/variants');
  assert.equal(stock.status, 200, await stock.clone().text());
  assert.deepEqual(await stock.json(), []);
  async function request(path, method = 'GET', body) {
    const form = body instanceof FormData;
    const response = await fetch('http://127.0.0.1:8799/_emdash/api' + path, {
      method,
      headers: { 'X-EmDash-Request': '1', ...(form ? {} : { 'Content-Type': 'application/json' }) },
      body: form ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    assert.ok(
      response.headers.getSetCookie().every((cookie) => !cookie.startsWith('astro-session=')),
      'Access-authenticated CMS requests must not create a rate-limited KV login session',
    );
    const text = await response.text();
    try {
      return { status: response.status, body: JSON.parse(text) };
    } catch {
      throw new Error(`${method} ${path} returned ${response.status}: ${text.slice(0, 400)}`);
    }
  }
  const pixels = await sharp({ create: { width: 40, height: 60, channels: 3, background: '#333' } })
    .png()
    .toBuffer();
  for (const [bytes, type, filename, width] of [
    [new TextEncoder().encode('<script>alert(1)</script>'), 'image/png', 'unsafe.png'],
    [pixels.subarray(0, 16), 'image/png', 'truncated.png'],
    [pixels.subarray(0, 40), 'image/png', 'header-only.png'],
    [pixels, 'image/jpeg', 'wrong.jpg'],
    [pixels, 'image/png', '../escape.png'],
    [pixels, 'image/png', 'dimensions.png', '999'],
    [new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/svg+xml', 'unsafe.svg'],
  ]) {
    const invalid = new FormData();
    invalid.set('file', new Blob([bytes], { type }), filename);
    if (width) invalid.set('width', width);
    assert.equal((await request('/media', 'POST', invalid)).status, 400, filename);
  }
  const form = new FormData();
  form.set('file', new Blob([pixels], { type: 'image/png' }), 'schema-check.png');
  form.set('thumbnail', new Blob([pixels], { type: 'image/png' }), 'thumbnail.png');
  const media = await request('/media', 'POST', form);
  assert.equal(media.status, 201, JSON.stringify(media.body));
  const oversized = new FormData();
  oversized.set('file', new Blob([new Uint8Array(22 * 1024 * 1024)], { type: 'image/png' }), 'oversized.png');
  assert.equal((await request('/media', 'POST', oversized)).status, 413);
  assert.equal((await request('/media', 'GET')).body.data.items.length, 1, 'Rejected uploads must not create media');
  assert.equal((await request('/media/import', 'POST', { url: 'https://foreign.invalid/image.png' })).status, 405);
  const manifest = await inventory();
  let artistId;
  for (const [collection, sourceName] of Object.entries(sourceCollectionNames)) {
    const record = manifest.records.find((item) => item.collection === sourceName);
    const imagePaths = new Set(
      manifest.media.flatMap((item) =>
        item.references.filter((ref) => ref.source === record.source).map((ref) => ref.original),
      ),
    );
    const data = JSON.parse(JSON.stringify(record.data), (name, value) => {
      if (name === '$schema') return undefined;
      return typeof value === 'string' && imagePaths.has(value) && name !== 'logo'
        ? { id: media.body.data.item.id }
        : value;
    });
    if (collection === 'artists') delete data.slug;
    if (collection === 'releases') data.artist = artistId;
    if (record.body.trim()) data.body = markdownTreeToPortableText(parseMarkdown(record.body));
    const path = '/content/' + collection;
    for (const invalid of [{ ...data, provider_id: 'forged' }]) {
      const rejected = await request(path, 'POST', { slug: 'invalid-check', data: invalid });
      assert.ok(rejected.status >= 400 && rejected.status < 500, collection + ': ' + JSON.stringify(rejected));
    }
    const created = await request(path, 'POST', { slug: `schema-check-${Date.now()}`, data });
    assert.equal(created.status, 201, collection + ': ' + JSON.stringify(created));
    if (collection === 'artists') artistId = created.body.data.item.id;
    const idPath = path + '/' + created.body.data.item.id;
    let current = await request(idPath);
    if (collection === 'artists') {
      const incomplete = await request(idPath, 'PUT', {
        _rev: current.body.data._rev,
        data: { title: '', bio: 'Still writing' },
      });
      assert.equal(incomplete.status, 200, JSON.stringify(incomplete));
      assert.equal(
        (await request(idPath + '/publish', 'POST', { _rev: incomplete.body.data._rev })).status,
        422,
        'Incomplete drafts cannot publish',
      );
      const complete = await request(idPath, 'PUT', { _rev: incomplete.body.data._rev, data });
      assert.equal(complete.status, 200, JSON.stringify(complete));
      current = await request(idPath);
    }
    if (collection === 'releases' || collection === 'distro') {
      assert.equal(current.body.data.item.draftRevisionId, null, 'A fresh native draft has no draft revision yet');
      const artworkUrl = 'http://127.0.0.1:8799/media/published/' + createHash('sha256').update(pixels).digest('hex');
      if (collection === 'releases') assert.equal((await fetch(artworkUrl)).status, 404, 'Draft artwork stays private');
      const approve = () =>
        fetch('http://127.0.0.1:8799/_emdash/api/blackbox/item-artwork', {
          method: 'POST',
          headers: { Origin: 'http://127.0.0.1:8799', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection, entryId: current.body.data.item.id, _rev: current.body.data._rev }),
        });
      const approved = await approve();
      assert.equal(approved.status, 200, await approved.clone().text());
      assert.equal((await approved.json()).imageUrl, artworkUrl.replace(':8799/', ':8787/'));
      assert.equal((await approve()).status, 200, 'Approval safely replays');
      const image = await fetch(artworkUrl);
      assert.equal(image.status, 200);
      assert.equal(image.headers.get('cache-control'), 'public, max-age=31536000, immutable');
      assert.deepEqual(Buffer.from(await image.arrayBuffer()), pixels);
      assert.equal(
        (await request(idPath)).body.data.item.status,
        'draft',
        'Artwork approval does not publish the item',
      );
    }
    assert.equal((await request(idPath, 'PUT', { _rev: current.body.data._rev, data, slug: 'renamed' })).status, 400);
    assert.equal((await request(path, 'POST', { slug: '../unsafe', data })).status, 400);
    assert.equal((await request(path, 'POST', { slug: 'metadata-check', data, status: 'published' })).status, 400);
    const saved = await request(idPath, 'PUT', { _rev: current.body.data._rev, data });
    assert.equal(saved.status, 200, collection + ': ' + JSON.stringify(saved));
    assert.equal((await request(idPath, 'PUT', { _rev: current.body.data._rev, data })).status, 409);
    if (!['news', 'socials'].includes(collection)) {
      const rejected = await request(idPath, 'DELETE', { _rev: saved.body.data._rev, confirm: true });
      assert.ok(rejected.status >= 400 && rejected.status < 500, JSON.stringify(rejected));
    } else {
      for (const body of [
        { confirm: true },
        { _rev: saved.body.data._rev },
        { _rev: saved.body.data._rev, confirm: false },
      ]) {
        assert.equal((await request(idPath, 'DELETE', body)).status, 400);
      }
      assert.equal((await request(idPath, 'DELETE', { _rev: current.body.data._rev, confirm: true })).status, 409);
      assert.equal((await request(idPath)).status, 200);
      assert.equal(
        (await request(idPath + '/permanent', 'DELETE', { _rev: saved.body.data._rev, confirm: true })).status,
        405,
      );
      assert.equal((await request(idPath, 'DELETE', { _rev: saved.body.data._rev, confirm: true })).status, 200);
      assert.equal((await request(idPath)).status, 404);
    }
    if (collection === 'releases' || collection === 'news') {
      const invalid = collection === 'releases' ? { artist: 'missing-artist' } : { image: { id: 'missing-media' } };
      const rejected = await request(path, 'POST', { slug: 'invalid-reference', data: { ...data, ...invalid } });
      assert.ok(rejected.status >= 400 && rejected.status < 500, JSON.stringify(rejected));
    }
    let publicationPath = idPath;
    if (['news', 'socials'].includes(collection)) {
      const replacement = await request(path, 'POST', { slug: 'published-check', data });
      assert.equal(replacement.status, 201, JSON.stringify(replacement));
      publicationPath = path + '/' + replacement.body.data.item.id;
    }
    const toPublish = await request(publicationPath);
    const published = await request(publicationPath + '/publish', 'POST', { _rev: toPublish.body.data._rev });
    assert.equal(published.status, 200, JSON.stringify(published));
    if (collection === 'artists' || collection === 'releases') {
      const edited = await request(idPath, 'PUT', {
        _rev: published.body.data._rev,
        data: { ...data, title: 'UNPUBLISHED-SNAPSHOT-MARKER' },
      });
      assert.equal(edited.status, 200, JSON.stringify(edited));
    }
  }
  assert.equal((await request('/admin/api-tokens', 'POST', { name: 'Too broad', scopes: ['admin'] })).status, 400);
  const exportCredential = await request('/admin/api-tokens', 'POST', {
    name: 'Local export smoke',
    scopes: ['content:read', 'media:read'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(exportCredential.status, 201);
  const exportReaders = createCmsSnapshotReaders({
    environment: 'local',
    target: 'http://127.0.0.1:8799/',
    token: exportCredential.body.data.token,
  });
  const snapshot = await captureCmsSnapshot(exportReaders);
  for (const [path, method] of [
    ['/_emdash/api/content/artists', 'POST'],
    ['/_emdash/api/admin/api-tokens', 'GET'],
    ['/api/internal/orders', 'GET'],
  ]) {
    const rejected = await fetch('http://127.0.0.1:8799' + path, {
      method,
      headers: { Authorization: `Bearer ${exportCredential.body.data.token}` },
    });
    assert.equal(rejected.status, 403);
    await rejected.body?.cancel();
  }
  assert.equal((await request('/admin/api-tokens/' + exportCredential.body.data.info.id, 'DELETE')).status, 200);
  await assert.rejects(exportReaders.readRevision(snapshot.snapshot.records[0].revisionId), /401/);
  assert.equal(snapshot.snapshot.media.length, 1, 'Shared published media is captured once');
  assert.deepEqual(Buffer.from(snapshot.files.get(snapshot.snapshot.media[0].sha256)), pixels);
  assert.equal(snapshot.snapshot.records.length, 13);
  assert.equal(snapshot.json.includes('UNPUBLISHED-SNAPSHOT-MARKER'), false);
  const buildInput = await writeCmsSnapshot(snapshot, join(localState, 'public-snapshot'), 'local');
  const loaded = await readContentSnapshot(buildInput);
  assert.deepEqual(loaded.snapshot, snapshot.snapshot);
  assert.equal(loaded.media.size, 1);
  await assert.rejects(writeCmsSnapshot(snapshot, join(localState, 'public-snapshot'), 'local'), { code: 'EEXIST' });
  const publicationResponse = await fetch('http://127.0.0.1:8799/_emdash/api/blackbox/publications', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:8799', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: crypto.randomUUID(), requestedRevision: snapshot.snapshot.records[0].revisionId }),
  });
  assert.equal(publicationResponse.status, 503, 'Unapplied application migrations must fail closed without bootstrap');
  assert.deepEqual(await publicationResponse.json(), {
    type: '/problems/publication_unavailable',
    title: 'Publication unavailable.',
    status: 503,
    detail: 'Publication is temporarily unavailable.',
    code: 'publication_unavailable',
    error: 'PUBLICATION_UNAVAILABLE',
  });
  const migrate = (...args) => {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('scripts/migrate-cms-application.mjs', root)), '--persist-to', localState, ...args],
      { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  assert.deepEqual(JSON.parse(migrate()).pending, [
    '0001_publications.sql',
    '0002_publication_dispatch.sql',
    '0003_local_publication_receipt.sql',
    '0004_runtime_publication.sql',
  ]);
  migrate('--apply');
  assert.deepEqual(JSON.parse(migrate()).pending, []);
  const workspaceSummary = await request('/blackbox/workspace?collection=artists');
  assert.equal(workspaceSummary.status, 200, JSON.stringify(workspaceSummary));
  assert.ok(
    workspaceSummary.body.data.items.every(
      (item) => item.collection === 'artists' && item.publicationState === 'draft',
    ),
  );

  // Compare the supported native repository projection with the retained general reader.
  const legacyOverview = await request('/blackbox/workspace');
  const overview = await request('/blackbox/workspace?view=overview');
  assert.equal(overview.status, 200, JSON.stringify(overview));
  const summary = (result) =>
    result.body.data.items.map(({ id, slug, collection, data, updatedAt, publicationState, acceptedRevisionId }) => ({
      id,
      slug,
      collection,
      title: data.title,
      label: data.label_name,
      updatedAt,
      publicationState,
      acceptedRevisionId,
    }));
  assert.deepEqual(summary(overview), summary(legacyOverview));
  assert.ok(overview.body.data.items.length <= 20);

  const publicationInput = { id: crypto.randomUUID(), requestedRevision: snapshot.snapshot.records[0].revisionId };
  const sendPublication = () =>
    fetch('http://127.0.0.1:8799/_emdash/api/blackbox/publications', {
      method: 'POST',
      headers: { Origin: 'http://127.0.0.1:8799', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify(publicationInput),
    });
  const accepted = await sendPublication();
  assert.equal(accepted.status, 202, await accepted.clone().text());
  const publication = await accepted.json();
  assert.equal(publication.status, 'pending');
  assert.deepEqual(JSON.parse(migrate('--apply')).pending, []);
  assert.deepEqual(await (await sendPublication()).json(), publication);
  const statusResponse = await fetch('http://127.0.0.1:8799/_emdash/api/blackbox/publications/' + publication.id);
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), publication);
  const journal = await getPlatformProxy({
    configPath: fileURLToPath(new URL('.emdash/wrangler.application-local.json', root)),
    persist: { path: join(localState, 'v3') },
    remoteBindings: false,
    envFiles: [],
  });
  let dispatch;
  try {
    dispatch = await claimPublicationDispatch(journal.env.CMS_DB, 'local');
  } finally {
    await journal.dispose();
  }
  assert.equal(dispatch.id, publication.id);
  const bindRun = (token, ciRunId = '12345') =>
    fetch('http://127.0.0.1:8799/_emdash/api/blackbox/publications/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: publication.id,
        dispatchToken: dispatch.dispatchToken,
        ciRunId,
        codeSha: 'c'.repeat(40),
      }),
    });
  const deniedRun = await bindRun('b'.repeat(64));
  assert.equal(deniedRun.status, 403);
  await deniedRun.body?.cancel();
  for (let attempt = 0; attempt < 2; attempt++) {
    const bound = await bindRun(workflowToken);
    assert.equal(bound.status, 200, await bound.clone().text());
    assert.deepEqual(await bound.json(), { id: publication.id, status: 'pending' });
  }
  const conflictingRun = await bindRun(workflowToken, '54321');
  assert.equal(conflictingRun.status, 409);
  await conflictingRun.body?.cancel();
  const uploadSnapshot = (kind, body) =>
    fetch(`http://127.0.0.1:8799/_emdash/api/blackbox/publications/${kind}`, {
      method: 'PUT',
      body,
      headers: {
        Authorization: `Bearer ${workflowToken}`,
        'X-Publication-ID': publication.id,
        'X-CI-Run-ID': '12345',
        'Content-Type': kind === 'media' ? 'application/octet-stream' : 'application/json',
      },
    });
  const incomplete = await uploadSnapshot('snapshot', snapshot.json);
  assert.equal(incomplete.status, 503, 'A snapshot with missing media cannot complete');
  await incomplete.body?.cancel();
  assert.deepEqual(
    await stageCmsSnapshot({
      environment: 'local',
      target: 'http://127.0.0.1:8799/',
      publicationId: publication.id,
      ciRunId: '12345',
      token: workflowToken,
      capture: snapshot,
    }),
    { id: publication.id, snapshotSha256: snapshot.sha256 },
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    const completed = await uploadSnapshot('snapshot', snapshot.json);
    assert.equal(completed.status, 200, await completed.clone().text());
    assert.deepEqual(await completed.json(), { id: publication.id, snapshotSha256: snapshot.sha256 });
  }
  const revisionPath = '/revisions/' + snapshot.snapshot.records[0].revisionId;
  assert.equal((await request(revisionPath)).status, 200);
  const restore = await fetch('http://127.0.0.1:8799/_emdash/api' + revisionPath + '/restore', {
    method: 'POST',
    headers: { 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(restore.status, 404);
  await restore.body?.cancel();
  for (const path of [
    `snapshots/local/manifest/${snapshot.sha256}`,
    `snapshots/local/media/${snapshot.snapshot.media[0].sha256}`,
    '%73napshots%2Flocal%2Fmedia%2Fprivate',
    'backups/private.sql',
  ]) {
    const response = await fetch('http://127.0.0.1:8799/_emdash/api/media/file/' + path);
    assert.equal(response.status, 404, 'Reserved storage must not use the generic media route');
    await response.body?.cancel();
  }
  console.log(
    'All 13 compiled CMS collections passed valid saves, rejected invalid writes, stale saves, references and deletion restrictions.',
  );
  // Real installed EmDash runtime: fixed private drafts, native opaque cursors,
  // duplicate titles and timestamp ties. Browser fixtures cannot prove this contract.
  const catalog = [];
  for (let index = 0; index < 251; index++) {
    const data = {
      title: `Pagination fixture ${String(Math.floor(index / 3)).padStart(3, '0')}`,
      artist_or_label: 'Local fixture',
      group: DISTRO_GROUP_VALUES[index % DISTRO_GROUP_VALUES.length],
      image: { id: media.body.data.item.id },
      image_alt: 'Fixture',
      summary: '',
      gallery: [],
      order: index,
    };
    const created = await request('/content/distro', 'POST', { slug: `pagination-${index}`, data });
    assert.equal(created.status, 201, JSON.stringify(created));
    catalog.push(created.body.data.item);
  }
  // Seed timestamp ties directly in this disposable 0.38.0 native database.
  // Sequential HTTP creates otherwise receive distinct millisecond timestamps.
  const nativeFixture = await getPlatformProxy({
    configPath: fileURLToPath(new URL('.emdash/wrangler.application-local.json', root)),
    persist: { path: join(localState, 'v3') },
    remoteBindings: false,
    envFiles: [],
  });
  try {
    const result = await nativeFixture.env.CMS_DB.prepare(
      "UPDATE ec_distro SET updated_at = ? WHERE slug LIKE 'pagination-%'",
    )
      .bind('2026-09-23T00:00:00.000Z')
      .run();
    assert.equal(result.success, true);
  } finally {
    await nativeFixture.dispose();
  }
  for (const sort of ['title', 'updated']) {
    for (const [area, format] of [
      ['all', ''],
      ['merch', ''],
      ['distro', ''],
      ...DISTRO_GROUP_VALUES.map((format) => ['all', format]),
    ]) {
      const expected = catalog.filter(
        (item) =>
          (!format || item.data.group === format) &&
          (area === 'all' || (area === 'merch') === (item.data.group === 'Clothes')),
      );
      const ids = [];
      const values = [];
      const cursors = new Set();
      let cursor;
      do {
        const params = new URLSearchParams({ collection: 'distro', q: 'Pagination fixture', limit: '25', sort, area });
        if (format) params.set('format', format);
        if (cursor) params.set('cursor', cursor);
        const response = await request(`/blackbox/workspace?${params}`);
        assert.equal(response.status, 200, JSON.stringify(response));
        const page = response.body.data;
        assert.ok(page.items.length <= 25);
        assert.ok(page.items.every((item) => item.selling === null));
        ids.push(...page.items.map((item) => item.id));
        values.push(...page.items.map((item) => (sort === 'title' ? item.data.title : item.updatedAt)));
        cursor = page.nextCursor;
        if (cursor) {
          assert.ok(!cursors.has(cursor), 'Native continuation must progress');
          cursors.add(cursor);
        }
      } while (cursor);
      assert.equal(new Set(ids).size, ids.length, `No duplicates: ${sort}/${area}/${format}`);
      assert.ok(
        values.every((value) => typeof value === 'string'),
        'Native sort values must be present',
      );
      if (area === 'all' && !format)
        assert.ok(new Set(values).size < values.length, `The native fixture exercises duplicate ${sort} values`);
      assert.deepEqual(
        ids.toSorted(),
        expected.map((item) => item.id).toSorted(),
        `Complete native traversal: ${sort}/${area}/${format}`,
      );
      assert.deepEqual(
        values,
        sort === 'title' ? values.toSorted() : values.toSorted().reverse(),
        `Native ordering: ${sort}/${area}/${format}`,
      );
    }
  }
  console.log(
    'Native EmDash catalog pagination: 251 mixed drafts, both sorts, duplicate titles, filters and final pages passed.',
  );
} finally {
  await worker?.stop();
  assert.equal(dirname(realpathSync(localState)), stateRoot, 'Unsafe smoke cleanup path');
  rmSync(localState, { recursive: true, force: true });
}
