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
  for (const path of [
    '/favicon-96x96.png',
    '/favicon.svg',
    '/favicon.ico',
    '/favicon-maskable-512x512.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/manifest.webmanifest',
    '/_astro/logo.hash.png',
  ]) {
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`), env);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  }
  assert.equal(forwarded.length, 0);
  assert.deepEqual(publicGatewayRoutes.exclude, [
    '/assets/*',
    '/_astro/*',
    '/favicon*',
    '/apple-touch-icon*',
    '/manifest.webmanifest',
    '/robots.txt',
  ]);
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

test('unknown document paths get the static 404 page with one asset read and no renderer call', async () => {
  const { env, forwarded } = captureEnv();
  const assetReads = [];
  env.ASSETS.fetch = async (request) => {
    assetReads.push(new URL(request.url).pathname);
    return new Response('<!doctype html><title>404</title>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  };
  const html = { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' };
  const page = await gateway.fetch(new Request('https://site.invalid/artistz/?fbclid=1', { headers: html }), env);
  assert.equal(page.status, 404);
  assert.equal(page.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(page.headers.get('Cache-Control'), 'no-store, no-transform');
  assert.equal(await page.text(), '<!doctype html><title>404</title>');
  const head = await gateway.fetch(new Request('https://site.invalid/old/', { method: 'HEAD', headers: html }), env);
  assert.equal(head.status, 404);
  assert.equal(head.body, null);
  assert.deepEqual(assetReads, ['/404', '/404']);

  for (const [path, headers] of [
    ['/wp-login.php', { Accept: '*/*' }],
    ['/api/store/items', html],
    ['/_emdash/admin', html],
  ]) {
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`, { headers }), env);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'Not found');
  }
  assert.equal(assetReads.length, 2);
  assert.equal(forwarded.length, 0);
});

test('a missing 404 asset falls back to the plain-text 404', async () => {
  const { env } = captureEnv();
  env.ASSETS.fetch = async () => new Response('', { status: 404 });
  const response = await gateway.fetch(
    new Request('https://site.invalid/missing/', { headers: { Accept: 'text/html' } }),
    env,
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(await response.text(), 'Not found');
});

test('HTML and conditional replies prevent automatic injection without weakening cache or privacy headers', async () => {
  const gateway = createPublicGateway(['^/$', '^/email-preferences/$']);
  for (const [path, method, status, cache] of [
    ['/', 'GET', 200, 'public, max-age=0, s-maxage=30, stale-while-revalidate=30'],
    ['/', 'HEAD', 200, 'public, max-age=0'],
    ['/', 'GET', 304, 'public, max-age=0'],
    ['/email-preferences/', 'GET', 200, 'private, no-store'],
    ['/', 'GET', 503, 'no-store'],
    ['/', 'GET', 200, 'no-store, no-transform'],
  ]) {
    const { env } = captureEnv();
    env.PUBLIC_SITE.fetch = async () =>
      new Response(status === 304 ? null : '<p>Unchanged HTML</p>', {
        status,
        headers: {
          ...(status === 304 ? {} : { 'Content-Type': 'text/html; charset=utf-8' }),
          'Cache-Control': cache,
          'Referrer-Policy': 'no-referrer',
          'X-Robots-Tag': 'noindex',
          ETag: 'W/"same-content"',
        },
      });
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`, { method }), env);
    assert.equal(response.status, status);
    assert.equal(
      response.headers.get('Cache-Control'),
      cache.includes('no-transform') ? cache : `${cache}, no-transform`,
    );
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
    assert.equal(response.headers.get('ETag'), 'W/"same-content"');
    assert.equal(await response.text(), status === 304 || method === 'HEAD' ? '' : '<p>Unchanged HTML</p>');
  }
  const { env } = captureEnv();
  env.PUBLIC_SITE.fetch = async () =>
    new Response('image', { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' } });
  const image = await gateway.fetch(new Request('https://site.invalid/_image?href=fixture'), env);
  assert.equal(image.headers.get('Cache-Control'), 'public, max-age=300');
  assert.equal(await image.text(), 'image');
});
