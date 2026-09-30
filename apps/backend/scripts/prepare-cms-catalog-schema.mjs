import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { getPlatformProxy } from 'wrangler';
import { prepareCatalogSchema } from '../src/cms/catalog-schema.ts';

// Release step: runs the same idempotent native field setup as the admin-only
// catalog-schema route, so hosted CMS fields follow deployed code without a
// manual call. Run after EmDash core migrations and before deploying the CMS.
const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'local' },
    'persist-to': { type: 'string' },
    'confirm-live-cms-changes': { type: 'boolean', default: false },
  },
});
if (!['local', 'uat', 'prd'].includes(values.env)) throw new Error('Select local, uat or prd.');
const local = values.env === 'local';
if (!local && values['persist-to']) throw new Error('--persist-to is Local-only.');
if (values.env === 'prd' && !values['confirm-live-cms-changes'])
  throw new Error('PRD catalog schema preparation requires one-run --confirm-live-cms-changes.');
const backend = fileURLToPath(new URL('../', import.meta.url));
const resource = JSON.parse(readFileSync(join(backend, 'cms-resources.json'), 'utf8'))[values.env];
if (!resource?.database_name || !resource?.database_id) throw new Error('Target CMS resource is not configured.');
const configPath = join(backend, `.emdash/wrangler.catalog-schema-${values.env}.json`);
mkdirSync(join(backend, '.emdash'), { recursive: true });
writeFileSync(
  configPath,
  JSON.stringify({
    name: `blackbox-cms-catalog-schema-${values.env}`,
    compatibility_date: '2026-08-31',
    d1_databases: [
      {
        binding: 'CMS_DB',
        database_name: resource.database_name,
        database_id: resource.database_id,
        remote: !local,
      },
    ],
  }),
);
// Use the Kysely and D1 dialect copies EmDash itself runs with.
const require = createRequire(import.meta.url);
const { Kysely } = await import(pathToFileURL(createRequire(require.resolve('emdash/seed')).resolve('kysely')).href);
const { D1Dialect } = await import(
  pathToFileURL(createRequire(require.resolve('@emdash-cms/cloudflare/db/d1')).resolve('kysely-d1')).href
);
const proxy = await getPlatformProxy({
  configPath,
  persist: local ? { path: join(resolve(values['persist-to'] ?? join(backend, '.wrangler/state')), 'v3') } : false,
  remoteBindings: !local,
  envFiles: [],
});
const database = proxy.env.CMS_DB;
const db = new Kysely({ dialect: new D1Dialect({ database }) });
const fieldCount = () => database.prepare('SELECT count(*) AS total FROM _emdash_fields').first('total');
try {
  const fieldsBefore = await fieldCount();
  const response = await prepareCatalogSchema({ db });
  if (!response.ok) throw new Error(`Catalog schema preparation failed with ${response.status}.`);
  console.log(
    JSON.stringify({
      environment: values.env,
      database: resource.database_name,
      fieldsBefore,
      fieldsAfter: await fieldCount(),
    }),
  );
} finally {
  await db.destroy();
  await proxy.dispose();
}
