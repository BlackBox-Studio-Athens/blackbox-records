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
    const pointer = await proxy.env.MEDIA.get('snapshots/local/current.json');
    return {
      migrations: (await rows('SELECT name FROM _emdash_migrations ORDER BY name')).map((row) => row.name),
      fields: await rows(`SELECT c.slug AS collection, f.slug, f.type FROM _emdash_fields f
        JOIN _emdash_collections c ON c.id = f.collection_id WHERE f.type = 'datetime' ORDER BY c.slug, f.slug`),
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
  const before = await inspect();
  assert.ok(before.migrations.includes('077_plugin_storage_revisions'), 'Requires an initialized 0.38 Local store');
  assert.ok(!before.migrations.includes('079_datetime_normalization'), 'Use a pre-upgrade Local backup');
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
  assert.equal(JSON.parse(migrate()).calendarDateFieldsToUpdate, 3);
  migrate('--apply');
  assert.equal(JSON.parse(migrate()).calendarDateFieldsToUpdate, 0);
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
    assert.deepEqual(
      after.dates,
      before.dates,
      'Calendar values and live/draft identities survive upgrade and restart',
    );
    assert.deepEqual(after.revisions, before.revisions, 'Retained revision data stays byte-for-byte intact');
    assert.deepEqual(after.stock, before.stock, 'Commerce stock remains untouched');
    assert.deepEqual(after.prices, before.prices, 'Commerce prices remain untouched');
    assert.equal(after.pointer, before.pointer, 'Restart must retain the accepted publication');
    assert.equal(after.fields.length, 0, 'Editorial dates no longer use datetime storage');
  }
  console.log(
    'EmDash 0.38 → 0.40.1 Local upgrade and restart passed: dates, revisions, stock and accepted publication preserved.',
  );
} finally {
  await worker?.stop();
  await rm(state, { recursive: true, force: true });
}
