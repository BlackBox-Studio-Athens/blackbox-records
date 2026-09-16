import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = process.argv[2];
assert.ok(['uat', 'prd'].includes(target));
const identityPath = resolve(`.codex-artifacts/release-content/${target}/identity.json`);
assert.ok(
  JSON.parse(readFileSync(identityPath, 'utf8'))?.snapshotSha256,
  'Public runtime cutover requires an accepted snapshot.',
);
const backend = resolve('apps/backend');
const result = spawnSync(process.execPath, ['scripts/build-public.mjs', target], {
  cwd: backend,
  stdio: 'inherit',
  windowsHide: true,
  env: {
    ...process.env,
    PUBLIC_CONTENT_IDENTITY: identityPath,
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
cpSync('scripts/pages-public-gateway.mjs', `${destination}/public/_worker.js`);
writeFileSync(
  `${destination}/public/_routes.json`,
  JSON.stringify({ version: 1, include: ['/*'], exclude: ['/assets/*', '/_astro/*', '/favicon.*', '/robots.txt'] }),
);
