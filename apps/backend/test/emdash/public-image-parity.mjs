import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { loadStripeCatalogStoreItemContracts } from '../../../../scripts/stripe-catalog-contract.ts';
import { inventory } from '../../../../scripts/inventory-cms-content.mjs';

const origin = 'https://blackbox-records-web-uat.pages.dev';
const contracts = await loadStripeCatalogStoreItemContracts({
  productEnvironment: 'UAT',
  siteUrl: origin,
  basePath: '/',
});
const sources = new Map((await inventory()).media.map((media) => [media.path, media]));
const urls = new Set(contracts.flatMap((contract) => contract.productProjection.imageUrls));
assert.ok(urls.size > 0);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
for (const value of urls) {
  const url = new URL(value);
  assert.equal(url.origin, origin);
  assert.ok(url.pathname.startsWith('/assets/catalog/'));
  const relative = decodeURIComponent(url.pathname.slice('/assets/catalog/'.length));
  assert.ok(!relative.split('/').some((segment) => segment === '..' || segment.includes('\\')));
  const source = sources.get('apps/web/src/content/' + relative);
  assert.ok(source, value);
  const built = await readFile(new URL('../../../web/dist/assets/catalog/' + relative, import.meta.url));
  assert.equal(hash(built), source.sha256, `Built public image differs: ${value}`);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, value);
  assert.match(response.headers.get('content-type') ?? '', /^image\//);
  const hosted = new Uint8Array(await response.arrayBuffer());
  assert.equal(hosted.length, source.bytes, value);
  assert.equal(hash(hosted), source.sha256, `Hosted public image differs: ${value}`);
}
console.log(
  `Public image parity passed: ${urls.size} known UAT catalog URLs match both built assets and source SHA-256.`,
);
