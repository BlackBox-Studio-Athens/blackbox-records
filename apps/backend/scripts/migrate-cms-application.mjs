import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';

const { values } = parseArgs({
  options: { apply: { type: 'boolean', default: false }, 'persist-to': { type: 'string' } },
});
const backend = fileURLToPath(new URL('../', import.meta.url));
const persistTo = resolve(values['persist-to'] ?? join(backend, '.wrangler/state'));
const resource = JSON.parse(readFileSync(new URL('../cms-resources.json', import.meta.url), 'utf8')).local;
if (!resource?.database_name || !resource?.database_id) throw new Error('Local CMS resource is not configured.');
const migrations = join(backend, 'cms-migrations');
const configPath = join(backend, '.emdash/wrangler.application-local.json');
mkdirSync(join(backend, '.emdash'), { recursive: true });
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: 'blackbox-cms-application-local',
      compatibility_date: '2026-08-31',
      d1_databases: [
        {
          binding: 'CMS_DB',
          database_name: resource.database_name,
          database_id: resource.database_id,
          migrations_dir: migrations,
          migrations_table: '_blackbox_app_migrations',
        },
      ],
    },
    null,
    2,
  ),
);
const proxy = await getPlatformProxy({
  configPath,
  persist: { path: join(persistTo, 'v3') },
  remoteBindings: false,
  envFiles: [],
});
let pending;
try {
  const db = proxy.env.CMS_DB;
  const exists = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_blackbox_app_migrations'")
    .first();
  const applied = exists
    ? (await db.prepare('SELECT name FROM _blackbox_app_migrations ORDER BY id').all()).results.map((row) => row.name)
    : [];
  pending = readdirSync(migrations)
    .filter((name) => name.endsWith('.sql') && !applied.includes(name))
    .sort();
  console.log(JSON.stringify({ environment: 'local', database: resource.database_name, applied, pending }, null, 2));
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
      '--local',
      '--config',
      configPath,
      '--persist-to',
      persistTo,
    ],
    { cwd: backend, env: childEnv, stdio: ['ignore', 'inherit', 'inherit'] },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
