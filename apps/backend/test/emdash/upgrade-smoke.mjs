import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { getPlatformProxy, unstable_dev } from 'wrangler';

const backend = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({ options: { 'source-state': { type: 'string' } } });
// Copy only a stopped Local store. The supplied source is never opened by Wrangler or modified.
const source = resolve(values['source-state'] ?? join(backend, '.wrangler/state'));
const state = await mkdtemp(join(backend, '.emdash/upgrade-'));
let worker;
const configPath = join(backend, 'dist/server/wrangler.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
assert.equal(config.vars.PRODUCT_ENVIRONMENT, 'LOCAL');
const storageConfig = join(state, 'storage.json');
async function inspect() {
  const proxy = await getPlatformProxy({
    configPath: storageConfig,
    persist: { path: join(state, 'v3') },
    envFiles: [],
  });
  try {
    const db = proxy.env.CMS_DB;
    const rows = async (sql) => (await db.prepare(sql).all()).results;
    const dates = {};
    for (const [collection, field] of [
      ['releases', 'release_date'],
      ['distro', 'release_date'],
      ['news', 'date'],
    ])
      dates[collection] = await rows(
        `SELECT id, ${field}, status, live_revision_id, draft_revision_id FROM ec_${collection} ORDER BY id`,
      );
    const releaseGalleryField = await db
      .prepare(
        `SELECT f.id, f.type, f.column_type, f.required
      FROM _emdash_fields f JOIN _emdash_collections c ON c.id = f.collection_id
      WHERE c.slug = 'releases' AND f.slug = 'gallery'`,
      )
      .first();
    const releaseGalleryColumn = (await rows('PRAGMA table_info(ec_releases)')).find(
      (column) => column.name === 'gallery',
    );
    const distroGalleryField = await db
      .prepare(
        `SELECT f.type, f.column_type, f.required
      FROM _emdash_fields f JOIN _emdash_collections c ON c.id = f.collection_id
      WHERE c.slug = 'distro' AND f.slug = 'gallery'`,
      )
      .first();
    const distroGalleryColumn = (await rows('PRAGMA table_info(ec_distro)')).find(
      (column) => column.name === 'gallery',
    );
    const pointer = await proxy.env.MEDIA.get('snapshots/local/current.json');
    return {
      migrations: (await rows('SELECT name FROM _emdash_migrations ORDER BY name')).map((row) => row.name),
      fields: await rows(`SELECT c.slug AS collection, f.slug, f.type FROM _emdash_fields f
        JOIN _emdash_collections c ON c.id = f.collection_id WHERE f.type = 'datetime' ORDER BY c.slug, f.slug`),
      releaseGallery: { field: releaseGalleryField ?? null, column: releaseGalleryColumn ?? null },
      distroGallery: { field: distroGalleryField ?? null, column: distroGalleryColumn ?? null },
      dates,
      revisions: await rows('SELECT id, collection, entry_id, data FROM revisions ORDER BY id'),
      stock: (await proxy.env.COMMERCE_DB.prepare('SELECT * FROM Stock ORDER BY rowid').all()).results,
      prices: (await proxy.env.COMMERCE_DB.prepare('SELECT * FROM StoreOfferSnapshot ORDER BY rowid').all()).results,
      pointer: pointer ? await pointer.text() : null,
    };
  } finally {
    await proxy.dispose();
  }
}
async function createPendingReleaseDraft() {
  const proxy = await getPlatformProxy({
    configPath: storageConfig,
    persist: { path: join(state, 'v3') },
    envFiles: [],
  });
  try {
    const db = proxy.env.CMS_DB;
    const release = await db
      .prepare('SELECT id, live_revision_id FROM ec_releases WHERE live_revision_id IS NOT NULL ORDER BY id LIMIT 1')
      .first();
    assert.ok(release, 'Requires a published Release to create the migration draft fixture');
    const revision = await db
      .prepare('SELECT data, author_id FROM revisions WHERE id = ? AND collection = ? AND entry_id = ?')
      .bind(release.live_revision_id, 'releases', release.id)
      .first();
    assert.ok(revision, 'Requires the published Release revision');
    const data = JSON.parse(revision.data);
    assert.equal(typeof data.cover_image?.id, 'string', 'Requires a media-backed Release cover');
    data.title = `${data.title} migration draft`;
    data.gallery = [{ image: { id: data.cover_image.id }, image_alt: 'Migration draft gallery image' }];
    const draftId = crypto.randomUUID();
    await db
      .prepare('INSERT INTO revisions (id, collection, entry_id, data, author_id) VALUES (?, ?, ?, ?, ?)')
      .bind(draftId, 'releases', release.id, JSON.stringify(data), revision.author_id)
      .run();
    await db.prepare('UPDATE ec_releases SET draft_revision_id = ? WHERE id = ?').bind(draftId, release.id).run();
    return draftId;
  } finally {
    await proxy.dispose();
  }
}
try {
  for (const binding of ['d1', 'r2'])
    await cp(join(source, 'v3', binding), join(state, 'v3', binding), { recursive: true });
  await writeFile(
    storageConfig,
    JSON.stringify({
      name: 'emdash-upgrade-storage',
      compatibility_date: config.compatibility_date,
      d1_databases: config.d1_databases,
      r2_buckets: config.r2_buckets,
    }),
  );
  console.log('Copied Local D1/R2 into disposable upgrade storage.');
  const draftId = await createPendingReleaseDraft();
  const before = await inspect();
  assert.ok(before.dates.releases.some((release) => release.draft_revision_id === draftId));
  assert.equal(before.distroGallery.field?.type, 'json');
  assert.equal(before.distroGallery.field?.column_type.toLowerCase(), 'json');
  assert.equal(before.distroGallery.field?.required, 0);
  assert.equal(before.distroGallery.column?.type.toLowerCase(), 'json');
  assert.equal(before.distroGallery.column?.notnull, 0);
  const pendingDraftBefore = before.revisions.find((revision) => revision.id === draftId);
  assert.ok(pendingDraftBefore);
  assert.equal(JSON.parse(pendingDraftBefore.data).gallery[0].image.id.length > 0, true);
  assert.ok(
    before.migrations.includes('077_plugin_storage_revisions'),
    'Requires an initialized 0.38 or newer Local store',
  );
  const calendarFieldsToUpdate = before.migrations.includes('079_datetime_normalization') ? 0 : 3;
  assert.ok(
    Object.values(before.dates).some((rows) => rows.length),
    'Requires populated date-bearing content',
  );
  assert.ok(before.revisions.length, 'Requires retained revisions');
  const migrate = (...args) => {
    const result = spawnSync(
      process.execPath,
      [join(backend, 'scripts/migrate-cms-application.mjs'), '--persist-to', state, ...args],
      {
        encoding: 'utf8',
        windowsHide: true,
        env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  const planned = JSON.parse(migrate());
  assert.equal(planned.calendarDateFieldsToUpdate, calendarFieldsToUpdate);
  assert.equal(planned.releaseGalleryToAdd, !before.releaseGallery.field || !before.releaseGallery.column);
  migrate('--apply');
  const applied = JSON.parse(migrate());
  assert.equal(applied.calendarDateFieldsToUpdate, 0);
  assert.equal(applied.releaseGalleryToAdd, false);
  assert.deepEqual(applied.pending, []);
  for (let start = 0; start < 2; start++) {
    worker = await unstable_dev(join(backend, 'dist/server/entry.mjs'), {
      config: configPath,
      ip: '127.0.0.1',
      port: 8797,
      local: true,
      persistTo: state,
      envFiles: [],
      logLevel: 'error',
      experimental: { disableExperimentalWarning: true },
    });
    const response = await fetch('http://127.0.0.1:8797/_emdash/api/content/news?limit=1');
    assert.equal(response.status, 200, await response.text());
    await worker.stop();
    worker = undefined;
    const after = await inspect();
    assert.ok(after.migrations.includes('085_taxonomy_def_groups'));
    assert.ok(after.migrations.includes('086_relations_structural'));
    assert.ok(after.migrations.includes('087_reference_field_relations'));
    assert.deepEqual(
      after.dates,
      before.dates,
      'Calendar values and live/draft identities survive upgrade and restart',
    );
    assert.deepEqual(after.revisions, before.revisions, 'Retained revision data stays byte-for-byte intact');
    assert.equal(after.releaseGallery.field?.type, 'json');
    assert.equal(after.releaseGallery.field?.column_type.toLowerCase(), 'json');
    assert.equal(after.releaseGallery.field?.required, 0);
    assert.equal(after.releaseGallery.column?.type.toLowerCase(), 'json');
    assert.equal(after.releaseGallery.column?.notnull, 0);
    assert.deepEqual(
      after.revisions.find((revision) => revision.id === draftId),
      pendingDraftBefore,
      'The pending Release draft, including its gallery, survives schema migration and restart',
    );
    assert.deepEqual(after.stock, before.stock, 'Commerce stock remains untouched');
    assert.deepEqual(after.prices, before.prices, 'Commerce prices remain untouched');
    assert.equal(after.pointer, before.pointer, 'Restart must retain the accepted publication');
    assert.equal(after.fields.length, 0, 'Editorial dates no longer use datetime storage');
  }
  console.log(
    'EmDash Local upgrade to 0.41.0 and restart passed: Release gallery schema, pending draft, dates, revisions, stock and accepted publication preserved.',
  );
} finally {
  await worker?.stop();
  await rm(state, { recursive: true, force: true });
}
