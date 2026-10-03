import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publicGatewayRoutes } from './pages-public-gateway.mjs';

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
// SSR output has no route HTML. Capture this artifact with this accepted snapshot before retaining either artifact.
const gateRoot = resolve(`.codex-artifacts/hosted-performance/${target}`);
mkdirSync(gateRoot, { recursive: true });
const documents = mkdtempSync(`${gateRoot}/documents-`);
const clientAssets = `${backend}/dist-public/client`;
for (const args of [
  ['scripts/capture-public-documents.mjs', target, documents],
  [
    'scripts/check-runtime-bundle-graphs.ts',
    `--documents=${documents}`,
    `--dist=${clientAssets}`,
    `--output=${documents}/bundles.json`,
  ],
  ['apps/web/scripts/check-image-markup.ts', `--documents=${documents}`, `--dist=${clientAssets}`],
]) {
  const gate = spawnSync(process.execPath, ['--import', 'tsx', ...args], {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  if (gate.status !== 0) process.exit(gate.status ?? 1);
}
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
