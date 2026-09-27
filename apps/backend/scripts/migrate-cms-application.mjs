import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';

const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'local' },
    apply: { type: 'boolean', default: false },
    'persist-to': { type: 'string' },
    'confirm-live-cms-changes': { type: 'boolean', default: false },
  },
});
if (!['local', 'uat', 'prd'].includes(values.env)) throw new Error('Select local, uat or prd.');
const local = values.env === 'local';
if (!local && values['persist-to']) throw new Error('--persist-to is Local-only.');
if (values.env === 'prd' && values.apply && !values['confirm-live-cms-changes'])
  throw new Error('PRD application migrations require one-run --confirm-live-cms-changes.');
const backend = fileURLToPath(new URL('../', import.meta.url));
const persistTo = resolve(values['persist-to'] ?? join(backend, '.wrangler/state'));
const resource = JSON.parse(readFileSync(new URL('../cms-resources.json', import.meta.url), 'utf8'))[values.env];
if (!resource?.database_name || !resource?.database_id) throw new Error('Target CMS resource is not configured.');
const migrations = join(backend, 'cms-migrations');
const configPath = join(backend, `.emdash/wrangler.application-${values.env}.json`);
mkdirSync(join(backend, '.emdash'), { recursive: true });
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: `blackbox-cms-application-${values.env}`,
      compatibility_date: '2026-08-31',
      d1_databases: [
        {
          binding: 'CMS_DB',
          database_name: resource.database_name,
          database_id: resource.database_id,
          migrations_dir: migrations,
          migrations_table: '_blackbox_app_migrations',
          remote: !local,
        },
      ],
    },
    null,
    2,
  ),
);
const proxy = await getPlatformProxy({
  configPath,
  persist: local ? { path: join(persistTo, 'v3') } : false,
  remoteBindings: !local,
  envFiles: [],
});
let pending;
let privateDraftFieldsToUpdate = 0;
let calendarDateFieldsToUpdate = 0;
let releaseStageToAdd = false;
try {
  const db = proxy.env.CMS_DB;
  const exists = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_blackbox_app_migrations'")
    .first();
  const fieldsExist = await db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_emdash_fields'")
    .first();
  if (fieldsExist) {
    const releases = await db.prepare("SELECT id FROM _emdash_collections WHERE slug = 'releases'").first();
    if (releases) {
      const field = await db
        .prepare("SELECT type FROM _emdash_fields WHERE collection_id = ? AND slug = 'release_stage'")
        .bind(releases.id)
        .first();
      const columns = (await db.prepare('PRAGMA table_info(ec_releases)').all()).results;
      const column = columns.find((column) => column.name === 'release_stage');
      if ((field && field.type !== 'string') || (column && column.type.toLowerCase() !== 'text'))
        throw new Error('Unexpected release_stage schema; stop before changing content.');
      releaseStageToAdd = !field || !column;
      if (values.apply && releaseStageToAdd) {
        const statements = [];
        if (!column) statements.push(db.prepare('ALTER TABLE ec_releases ADD COLUMN release_stage TEXT'));
        if (!field)
          statements.push(
            db
              .prepare(
                `INSERT INTO _emdash_fields
          (id, collection_id, slug, label, type, column_type, required)
          VALUES ('blackbox-release-stage', ?, 'release_stage', 'Release stage', 'string', 'text', 0)`,
              )
              .bind(releases.id),
          );
        await db.batch(statements);
      }
    }
    // Run before EmDash 079_datetime_normalization, including before Local auto migrations.
    const calendarDates = `type = 'datetime' AND (
      (slug = 'release_date' AND collection_id IN (SELECT id FROM _emdash_collections WHERE slug IN ('releases', 'distro')))
      OR (slug = 'date' AND collection_id IN (SELECT id FROM _emdash_collections WHERE slug = 'news'))
    )`;
    calendarDateFieldsToUpdate = (
      await db.prepare(`SELECT count(*) AS total FROM _emdash_fields WHERE ${calendarDates}`).first()
    ).total;
    if (values.apply && calendarDateFieldsToUpdate)
      await db.prepare(`UPDATE _emdash_fields SET type = 'string' WHERE ${calendarDates}`).run();
    const collections = [
      'artists',
      'releases',
      'distro',
      'news',
      'navigation',
      'socials',
      'settings',
      'home',
      'about',
      'services',
      'newsletter',
      'distro_page',
      'purchase_information',
    ];
    const where =
      '"required" = 1 AND collection_id IN (SELECT id FROM _emdash_collections WHERE slug IN (SELECT value FROM json_each(?)))';
    const count = await db
      .prepare(`SELECT count(*) AS total FROM _emdash_fields WHERE ${where}`)
      .bind(JSON.stringify(collections))
      .first();
    privateDraftFieldsToUpdate = count.total;
    if (values.apply && count.total)
      await db
        .prepare(`UPDATE _emdash_fields SET "required" = 0 WHERE ${where}`)
        .bind(JSON.stringify(collections))
        .run();
  }
  const applied = exists
    ? (await db.prepare('SELECT name FROM _blackbox_app_migrations ORDER BY id').all()).results.map((row) => row.name)
    : [];
  pending = readdirSync(migrations)
    .filter((name) => name.endsWith('.sql') && !applied.includes(name))
    .sort();
  console.log(
    JSON.stringify(
      {
        environment: values.env,
        database: resource.database_name,
        applied,
        pending,
        privateDraftFieldsToUpdate,
        calendarDateFieldsToUpdate,
        releaseStageToAdd,
      },
      null,
      2,
    ),
  );
} finally {
  await proxy.dispose();
}
if (values.apply && pending.length) {
  const childEnv = { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' };
  delete childEnv.CLOUDFLARE_ENV;
  const result = spawnSync(
    process.execPath,
    [
      join(backend, 'node_modules/wrangler/bin/wrangler.js'),
      'd1',
      'migrations',
      'apply',
      'CMS_DB',
      local ? '--local' : '--remote',
      '--config',
      configPath,
      ...(local ? ['--persist-to', persistTo] : []),
    ],
    { cwd: backend, env: childEnv, stdio: ['ignore', 'inherit', 'inherit'] },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
