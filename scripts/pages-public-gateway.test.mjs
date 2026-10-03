import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicGateway, publicGatewayRoutes } from './pages-public-gateway.mjs';

const gateway = createPublicGateway(['^/$', '^/store/?$', '^/artists/[^/]+/?$', '^/store/[^/]+/checkout/?$']);

function captureEnv() {
  const forwarded = [];
  return {
    forwarded,
    env: {
      ASSETS: { fetch: async () => new Response('asset') },
      PUBLIC_SITE: {
        fetch: async (request) => {
          forwarded.push(request);
          return new Response('rendered');
        },
      },
    },
  };
}

test('the gateway forwards only Accept to the public renderer', async () => {
  const { env, forwarded } = captureEnv();
  const url = 'https://blackbox-records-web.pages.dev/_image?href=%2Fmedia%2Fcontent%2Fa%2Fb&w=80';
  await gateway.fetch(
    new Request(url, {
      method: 'HEAD',
      headers: { Accept: 'image/avif,image/webp,*/*', Cookie: 'session=staff', Authorization: 'Bearer staff' },
    }),
    env,
  );

  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0].method, 'HEAD');
  assert.equal(forwarded[0].url, url);
  assert.deepEqual([...forwarded[0].headers], [['accept', 'image/avif,image/webp,*/*']]);
});

test('the gateway defaults Accept and never forwards private namespaces', async () => {
  const { env, forwarded } = captureEnv();
  await gateway.fetch(new Request('https://blackbox-records-web.pages.dev/store/'), env);
  assert.deepEqual([...forwarded[0].headers], [['accept', '*/*']]);

  const blocked = await gateway.fetch(new Request('https://blackbox-records-web.pages.dev/api/store/items'), env);
  assert.equal(blocked.status, 404);
  assert.equal(blocked.headers.get('Cache-Control'), 'no-store');
  assert.equal(forwarded.length, 1);
});

test('route-built patterns admit dynamic routes and answer scanner paths without a renderer call', async () => {
  const { env, forwarded } = captureEnv();
  for (const path of ['/artists/new-band/', '/store/new-record/checkout/', '/content-version.json'])
    assert.equal((await gateway.fetch(new Request(`https://site.invalid${path}`), env)).status, 200);
  const count = forwarded.length;
  for (const path of ['/wp-login.php', '/.env', '/artists/band/admin/', '/media/content/unknown', '/store/admin/php']) {
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`), env);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(forwarded.length, count);
  const empty = createPublicGateway([]);
  assert.equal((await empty.fetch(new Request('https://site.invalid/store/'), env)).status, 404);
});

test('conditional HTML forwarding retains only Accept and If-None-Match', async () => {
  const { env, forwarded } = captureEnv();
  await gateway.fetch(
    new Request('https://site.invalid/', {
      headers: { 'If-None-Match': 'W/"published"', Cookie: 'private', Authorization: 'secret', Accept: 'text/html' },
    }),
    env,
  );
  assert.deepEqual(
    [...forwarded[0].headers],
    [
      ['accept', 'text/html'],
      ['if-none-match', 'W/"published"'],
    ],
  );
});

test('all favicon names bypass the renderer and preserve binary asset bytes', async () => {
  const { env, forwarded } = captureEnv();
  const bytes = new Uint8Array([137, 80, 78, 71, 255, 0, 128]);
  env.ASSETS.fetch = async () => new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
  for (const path of ['/favicon-96x96.png', '/favicon.svg', '/favicon.ico', '/_astro/logo.hash.png']) {
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`), env);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  }
  assert.equal(forwarded.length, 0);
  assert.deepEqual(publicGatewayRoutes.exclude, ['/assets/*', '/_astro/*', '/favicon*', '/robots.txt']);
});

test('cold and warm browser request traces spend one gateway and at most one renderer call per document', async () => {
  const { env, forwarded } = captureEnv();
  for (const visit of ['cold', 'warm']) {
    const before = forwarded.length;
    await gateway.fetch(
      new Request('https://site.invalid/store/', {
        headers: visit === 'warm' ? { 'If-None-Match': 'W/"published"' } : {},
      }),
      env,
    );
    for (const path of [
      '/_astro/client.hash.js',
      '/_astro/style.hash.css',
      '/assets/fonts/font.woff2',
      '/favicon-96x96.png',
    ])
      await gateway.fetch(new Request(`https://site.invalid${path}`), env);
    // Browser Images URLs are on the Images host; they never reach this gateway. Cold source fills remain separate.
    assert.equal(forwarded.length - before, 1);
  }
});
