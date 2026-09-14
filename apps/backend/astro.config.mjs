import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { validateCmsFreeTier, validateCmsResources } from './scripts/cms-resources.ts';

const localPath = (name) => fileURLToPath(new URL(name, import.meta.url)).replaceAll('\\', '/');
const target = process.env.BLACKBOX_BUILD_ENV || 'mock';
const { config, error } = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  readFileSync(localPath('wrangler.jsonc'), 'utf8'),
);
if (error) throw new Error('Invalid backend Wrangler configuration');
validateCmsFreeTier(config);
const { env: environments, ...base } = config;
const selected = target === 'local' ? base : environments[target];
if (!selected) throw new Error(`Unknown backend environment: ${target}`);
const resources = JSON.parse(readFileSync(localPath('cms-resources.json'), 'utf8'));
validateCmsResources(
  resources,
  [base, ...Object.values(environments)].flatMap((env) => env.d1_databases ?? []),
);
const cms = resources[selected.vars.PRODUCT_ENVIRONMENT === 'LOCAL' ? 'local' : target];
if (!cms?.database_id || !cms.bucket_name) throw new Error(`CMS resources must be explicitly configured for ${target}`);
if (selected.d1_databases.some((db) => db.database_id === cms.database_id || db.database_name === cms.database_name)) {
  throw new Error('CMS_DB and COMMERCE_DB must be separate');
}
const runtime = {
  ...base,
  ...selected,
  main: localPath('src/cms/index.ts'),
  ...(target === 'uat' ? { routes: [...(selected.routes ?? []), { pattern: cms.hostname, custom_domain: true }] } : {}),
  assets: { binding: 'ASSETS', run_worker_first: true, html_handling: 'auto-trailing-slash' },
  vars: {
    ...selected.vars,
    ...(selected.vars.PRODUCT_ENVIRONMENT === 'LOCAL'
      ? { EMDASH_MIGRATIONS_MODE: 'auto' }
      : {
          CMS_HOSTNAME: cms.hostname,
          CMS_OWNER_EMAIL: cms.owner_email,
          CF_ACCESS_TEAM_DOMAIN: cms.access_team_domain ?? selected.vars.CF_ACCESS_TEAM_DOMAIN,
          CF_ACCESS_POLICY_AUD: cms.access_policy_aud ?? selected.vars.CF_ACCESS_POLICY_AUD,
        }),
  },
  d1_databases: [
    ...selected.d1_databases.map((db) => ({ ...db, migrations_dir: localPath(db.migrations_dir) })),
    { binding: 'CMS_DB', database_name: cms.database_name, database_id: cms.database_id },
  ],
  r2_buckets: [{ binding: 'MEDIA', bucket_name: cms.bucket_name }],
  durable_objects: {
    bindings: [...selected.durable_objects.bindings, { name: 'CMS_RUNTIME', class_name: 'CmsRuntime' }],
  },
  migrations: [...base.migrations, { tag: 'cms-runtime-v1', new_sqlite_classes: ['CmsRuntime'] }],
};
mkdirSync(localPath('.emdash'), { recursive: true });
writeFileSync(localPath('.emdash/wrangler.build.json'), JSON.stringify(runtime, null, 2));

export default defineConfig({
  output: 'server',
  // Access verifies every private request; no additional Astro login session is needed.
  session: false,
  publicDir: '../staff/dist',
  adapter: cloudflare({ configPath: '.emdash/wrangler.build.json', imageService: 'passthrough' }),
  vite: { build: { rolldownOptions: { output: { strictExecutionOrder: true } } } },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'CMS_DB' }),
      storage: r2({ binding: 'MEDIA' }),
      migrations: { runtime: 'check', dev: 'auto' },
      auth: { type: 'blackbox-access', entrypoint: localPath('src/cms/auth.ts'), config: {} },
      plugins: [
        {
          id: 'blackbox-editorial',
          version: '1.0.0',
          format: 'standard',
          capabilities: ['content:write', 'media:read'],
          entrypoint: localPath('src/cms/editorial-plugin.ts'),
        },
      ],
    }),
  ],
});
