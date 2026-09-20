import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';

const root = new URL('../../', import.meta.url);
const config = JSON.parse(await readFile(new URL('dist/server/wrangler.json', root), 'utf8'));
assert.equal(config.assets.run_worker_first, true);
assert.equal(config.d1_databases.length, 2);
assert.equal(new Set(config.d1_databases.map((db) => db.database_name)).size, 2);
assert.deepEqual(config.durable_objects.bindings.map((binding) => binding.class_name).sort(), [
  'CmsRuntime',
  'CommerceRuntime',
]);
const options = {
  config: fileURLToPath(new URL('dist/server/wrangler.json', root)),
  ip: '127.0.0.1',
  port: 8799,
  local: true,
  logLevel: 'error',
  experimental: { disableExperimentalWarning: true },
};
let worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), options);
try {
  const base = 'http://127.0.0.1:8799';
  const privatePaths = ['/stock/', '/orders/', '/items/', '/items/new/', '/content/'];
  let avoidedBytes = 0;
  const validators = new Map();
  const expectPrivateNoSession = (response) => {
    assert.match(response.headers.get('cache-control') ?? '', /private/);
    assert.equal(response.headers.get('set-cookie'), null);
  };
  for (const path of [...privatePaths]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    expectPrivateNoSession(response);
    const html = await response.text();
    assert.match(html, /BlackBox Records/i);
    const pageHead = await fetch(base + path, { method: 'HEAD' });
    assert.equal(pageHead.status, 200, `${path} HEAD`);
    assert.equal((await pageHead.arrayBuffer()).byteLength, 0, `${path} HEAD body`);
    assert.equal(pageHead.headers.get('cache-control'), 'private, no-store');
    expectPrivateNoSession(pageHead);
    const script = html.match(/(?:src|href|component-url)="(\/_astro\/[^"?]+\.js)"/);
    assert.ok(script, 'Staff module is included in the combined artifact');
    const asset = await fetch(base + script[1]);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('cache-control'), 'private, no-cache, must-revalidate');
    expectPrivateNoSession(asset);
    const etag = asset.headers.get('etag');
    assert.ok(etag);
    const bytes = (await asset.arrayBuffer()).byteLength;
    assert.ok(bytes > 0);
    validators.set(script[1], etag);
    const assetHead = await fetch(base + script[1], { method: 'HEAD' });
    assert.equal(assetHead.status, 200, `${script[1]} HEAD`);
    assert.equal(assetHead.headers.get('cache-control'), 'private, no-cache, must-revalidate');
    assert.equal((await assetHead.arrayBuffer()).byteLength, 0, `${script[1]} HEAD body`);
    expectPrivateNoSession(assetHead);
    for (const method of ['GET', 'HEAD']) {
      const conditional = await fetch(base + script[1], { method, headers: { 'If-None-Match': etag } });
      assert.equal(conditional.status, 304);
      assert.equal(conditional.headers.get('cache-control'), 'private, no-cache, must-revalidate');
      assert.equal((await conditional.arrayBuffer()).byteLength, 0);
      expectPrivateNoSession(conditional);
    }
    avoidedBytes += bytes;
    privatePaths.push(script[1]);
  }
  assert.equal((await fetch(base + '/_emdash/admin/')).status, 404);
  assert.equal((await fetch(base + '/api/store/capabilities')).status, 200);
  await worker.stop();
  worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
    ...options,
    vars: {
      PRODUCT_ENVIRONMENT: 'UAT',
      CMS_HOSTNAME: '127.0.0.1',
      CF_ACCESS_TEAM_DOMAIN: 'https://team.example',
      CF_ACCESS_POLICY_AUD: 'staff-audience',
    },
  });
  const protectedAsset = [...validators.entries()][0];
  assert.ok(protectedAsset);
  const [protectedPath, etag] = protectedAsset;
  for (const headers of [{}, { 'Cf-Access-Jwt-Assertion': 'not-a-jwt' }]) {
    const denied = await fetch(base + protectedPath, { headers });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('cache-control'), 'private, no-store');
    expectPrivateNoSession(denied);
    const deniedHead = await fetch(base + protectedPath, { method: 'HEAD', headers });
    assert.equal(deniedHead.status, 403);
    assert.equal((await deniedHead.arrayBuffer()).byteLength, 0);
    expectPrivateNoSession(deniedHead);
    const matching = await fetch(base + protectedPath, { headers: { ...headers, 'If-None-Match': etag } });
    assert.equal(matching.status, 403);
    assert.equal(matching.headers.get('cache-control'), 'private, no-store');
    expectPrivateNoSession(matching);
  }
  await worker.stop();
  worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
    ...options,
    vars: { PRODUCT_ENVIRONMENT: 'UAT', CMS_HOSTNAME: 'staff-uat.example' },
  });
  for (const path of privatePaths) assert.equal((await fetch(base + path)).status, 403, path);
  for (const [path, assetEtag] of validators) {
    const denied = await fetch(base + path, { headers: { 'If-None-Match': assetEtag } });
    assert.equal(denied.status, 403);
    assert.match(denied.headers.get('cache-control') ?? '', /no-store/);
    expectPrivateNoSession(denied);
  }
  console.log(`Local repeated module reads avoided ${avoidedBytes} decoded body bytes via authenticated 304s.`);
  console.log(
    'Combined staff/CMS artifact passed: staff HTML/modules, private caching, alias denial, and public commerce.',
  );
} finally {
  await worker.stop();
}
