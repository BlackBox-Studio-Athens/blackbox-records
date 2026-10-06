import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publicGatewayRoutes } from './pages-public-gateway.mjs';

const target = process.argv[2];
assert.ok(['uat', 'prd'].includes(target));
const backend = resolve('apps/backend');
// No content identity: the renderer serves the accepted snapshot its R2 publication pointer names.
const result = spawnSync(process.execPath, ['scripts/build-public.mjs', target], {
  cwd: backend,
  stdio: 'inherit',
  windowsHide: true,
  env: {
    ...process.env,
    ASTRO_SITE_URL: `https://blackbox-records-web${target === 'uat' ? '-uat' : ''}.pages.dev`,
    ASTRO_BASE_PATH: '/',
    PUBLIC_BACKEND_BASE_URL: process.env[`${target.toUpperCase()}_PUBLIC_BACKEND_BASE_URL`],
    SHOW_REVIEW_SITE_MARKER: target === 'uat' ? 'true' : 'false',
  },
});
if (result.status !== 0) process.exit(result.status ?? 1);
const destination = `.codex-artifacts/release/${target}`;
cpSync(`${backend}/dist-public`, `${destination}/renderer`, { recursive: true });
cpSync(`${backend}/dist-public/client`, `${destination}/public`, { recursive: true });
const patterns = JSON.parse(readFileSync(`${backend}/.emdash/public-route-patterns.json`, 'utf8'));
assert.ok(Array.isArray(patterns) && patterns.length > 0 && patterns.every((pattern) => typeof pattern === 'string'));
const gateway = readFileSync('scripts/pages-public-gateway.mjs', 'utf8');
assert.ok(gateway.includes('const publicRoutePatterns = [];'));
writeFileSync(
  `${destination}/public/_worker.js`,
  gateway.replace('const publicRoutePatterns = [];', `const publicRoutePatterns = ${JSON.stringify(patterns)};`),
);
writeFileSync(`${destination}/public/_routes.json`, JSON.stringify(publicGatewayRoutes));
