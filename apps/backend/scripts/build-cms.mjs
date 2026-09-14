import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateCmsFreeTier } from './cms-resources.ts';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const { values } = parseArgs({
  options: { env: { type: 'string', default: process.env.BLACKBOX_BUILD_ENV || 'mock' } },
});
if (!['local', 'mock', 'mock-api', 'uat', 'prd'].includes(values.env)) throw new Error('Unknown backend build target');
const seed = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/generate-cms-seed.ts'], { stdio: 'inherit' });
if (seed.status !== 0) process.exit(seed.status ?? 1);
const staffEnv = { ...process.env };
delete staffEnv.PUBLIC_BACKEND_BASE_URL;
const staff = spawnSync('pnpm', ['--filter', '@blackbox/staff', 'build'], {
  env: staffEnv,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (staff.status !== 0) process.exit(staff.status ?? 1);
const backendEnv = { ...process.env, BLACKBOX_BUILD_ENV: values.env };
delete backendEnv.CLOUDFLARE_ENV;
const backend = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
  env: backendEnv,
  stdio: 'inherit',
});
if (backend.status !== 0) process.exit(backend.status ?? 1);
// Check adapter output too: dependencies can inject bindings absent from source configuration.
validateCmsFreeTier(JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8')));
