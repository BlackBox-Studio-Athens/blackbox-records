import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateCmsFreeTier } from './cms-resources.ts';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const environment = process.argv[2] ?? 'local';
if (!['local', 'uat', 'prd'].includes(environment)) throw new Error('Select local, uat or prd.');
const env = { ...process.env, BLACKBOX_BUILD_ENV: environment };
// Runtime rendering reads its accepted snapshot; build-time collection loaders stay unused.
delete env.CMS_CONTENT_SOURCE;
delete env.CLOUDFLARE_ENV;
const result = spawnSync(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'build', '--config', 'astro.public.config.mjs'],
  { env, stdio: 'inherit', windowsHide: true },
);
if (result.status !== 0) process.exit(result.status ?? 1);
validateCmsFreeTier(JSON.parse(readFileSync('.emdash/wrangler.public.json', 'utf8')));
validateCmsFreeTier(JSON.parse(readFileSync('dist-public/server/wrangler.json', 'utf8')));
