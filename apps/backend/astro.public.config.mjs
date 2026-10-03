import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicWorkerName } from './scripts/cms-resources.ts';

const local = (path) => fileURLToPath(new URL(path, import.meta.url)).replaceAll('\\', '/');
const { default: tailwindcss } = await import(
  pathToFileURL(createRequire(new URL('../web/package.json', import.meta.url)).resolve('@tailwindcss/vite')).href
);
const environment = process.env.BLACKBOX_BUILD_ENV || 'local';
if (!['local', 'uat', 'prd'].includes(environment)) throw new Error('Select a public environment.');
const resources = JSON.parse(readFileSync(local('cms-resources.json'), 'utf8'))[environment];
const content = process.env.PUBLIC_CONTENT_IDENTITY
  ? JSON.parse(readFileSync(process.env.PUBLIC_CONTENT_IDENTITY, 'utf8'))
  : null;
const bootstrap = content
  ? { id: content.publicationId, snapshotSha256: content.snapshotSha256, ciRunId: content.ciRunId, generation: 0 }
  : null;
const identity = {
  sha: process.env.SOURCE_SHA || '0'.repeat(40),
  runId: process.env.GITHUB_RUN_ID || 'local',
  runNumber: Number(process.env.GITHUB_RUN_NUMBER || 0),
};
const config = {
  name: publicWorkerName(environment),
  main: local('src/cms/public-runtime.ts'),
  compatibility_date: '2026-09-16',
  compatibility_flags: ['nodejs_compat'],
  workers_dev: false,
  assets: { binding: 'ASSETS', run_worker_first: true },
  vars: {
    PRODUCT_ENVIRONMENT: environment,
    // Canonical Images source: an approved origin in the Images zone settings, independent of the public hostname.
    PUBLIC_IMAGE_SOURCE_ORIGIN: {
      local: '',
      uat: 'https://blackbox-records-web-uat.pages.dev',
      prd: 'https://blackbox-records-web.pages.dev',
    }[environment],
    PUBLIC_IMAGE_TRANSFORM_ORIGIN: environment === 'local' ? '' : 'https://images.blackboxrecordsathens.com',
  },
  r2_buckets: [{ binding: 'MEDIA', bucket_name: resources.bucket_name }],
  durable_objects: { bindings: [{ name: 'PUBLIC_SITE_RUNTIME', class_name: 'PublicSiteRuntime' }] },
  cache: { enabled: false },
  exports: {
    default: { type: 'worker', cache: { enabled: true } },
    PublicImageRenderer: { type: 'worker', cache: { enabled: true } },
    PublicSiteRuntime: { type: 'durable-object', storage: 'sqlite' },
  },
  observability: { enabled: true },
};
mkdirSync(local('.emdash'), { recursive: true });
writeFileSync(local('.emdash/wrangler.public.json'), JSON.stringify(config));

export default defineConfig({
  srcDir: '../web/src',
  publicDir: '../web/public',
  outDir: './dist-public',
  site: process.env.ASTRO_SITE_URL || 'http://127.0.0.1:4321',
  base: process.env.ASTRO_BASE_PATH || '/blackbox-records/',
  output: 'server',
  session: false,
  adapter: cloudflare({ configPath: '.emdash/wrangler.public.json', imageService: 'passthrough' }),
  integrations: [
    react(),
    {
      name: 'published-runtime-routes',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (route.component.replaceAll('\\', '/').includes('/pages/assets/catalog/')) {
            route.component = local('src/cms/public-asset.ts');
            route.prerender = false;
          }
        },
      },
    },
  ],
  vite: {
    build: { rolldownOptions: { output: { strictExecutionOrder: true } } },
    plugins: [
      tailwindcss(),
      {
        name: 'published-purchase-reader',
        enforce: 'pre',
        resolveId(id, importer) {
          const path = (id.startsWith('.') && importer ? resolve(dirname(importer.split('?')[0]), id) : id)
            .replaceAll('\\', '/')
            .replace(/\.ts$/, '');
          if (
            path === '@/platform/lib/purchase-information' ||
            path === local('../web/src/platform/lib/purchase-information')
          )
            return this.environment.name === 'client'
              ? local('../web/src/lib/published-purchase-browser.ts')
              : local('src/cms/published-purchase-information.ts');
        },
      },
    ],
    resolve: {
      alias: [
        { find: '@/lib/content-reader', replacement: local('src/cms/published-reader.ts') },
        { find: '@', replacement: local('../web/src') },
      ],
    },
    define: {
      PUBLIC_RELEASE_IDENTITY: JSON.stringify(identity),
      PUBLIC_BOOTSTRAP: JSON.stringify(bootstrap),
      PUBLIC_BASE_PATH: JSON.stringify(process.env.ASTRO_BASE_PATH || '/blackbox-records/'),
    },
  },
});
