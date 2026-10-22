import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicGateway, publicGatewayRoutes } from './pages-public-gateway.mjs';

const gateway = createPublicGateway(['^/$', '^/store/?$', '^/artists/[^/]+/?$', '^/store/[^/]+/checkout/?$']);

test('the retired News slug redirects only after the target is published', async () => {
  const gateway = createPublicGateway(['^/news/[^/]+/?$']);
  for (const method of ['GET', 'HEAD']) {
    for (const suffix of ['', '/']) {
      let published = false;
      const requests = [];
      const { env } = captureEnv();
      env.PUBLIC_SITE.fetch = async (request) => {
        requests.push(request);
        const target = new URL(request.url).pathname === '/news/caregivers/';
        return new Response(request.method === 'HEAD' ? null : 'old article', {
          status: target && !published ? 404 : 200,
          headers: { 'Content-Type': 'text/html' },
        });
      };
      const request = new Request(`https://site.invalid/news/lorem-ipsum${suffix}?source=archive`, {
        method,
        headers: { Cookie: 'private', Authorization: 'secret', 'If-None-Match': 'old', Accept: 'text/html' },
      });
      const before = await gateway.fetch(request, env);
      // Before publication the old article serves as usual; its slashless form consolidates to the slash form first.
      if (suffix) {
        assert.equal(before.status, 200);
        assert.equal(before.headers.get('Location'), null);
      } else {
        assert.equal(before.status, 308);
        assert.equal(before.headers.get('Location'), 'https://site.invalid/news/lorem-ipsum/?source=archive');
      }
      assert.equal(requests.length, 2);
      assert.equal(requests[0].method, 'HEAD');
      assert.deepEqual([...requests[0].headers], [['accept', 'text/html']]);
      published = true;
      requests.length = 0;
      const after = await gateway.fetch(request, env);
      assert.equal(after.status, 308);
      assert.equal(after.headers.get('Location'), 'https://site.invalid/news/caregivers/?source=archive');
      assert.equal(after.headers.get('Cache-Control'), 'no-store');
      assert.equal(after.body, null);
      assert.equal(requests.length, 1);
    }
  }
});

test('a failed or non-HTML target check keeps the retired route working', async () => {
  const gateway = createPublicGateway(['^/news/[^/]+/?$']);
  for (const targetReply of [
    () => new Response('unavailable', { status: 503 }),
    () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    () => new Response(null, { status: 302, headers: { Location: '/login/' } }),
    () => Promise.reject(new Error('Renderer unavailable')),
  ]) {
    const { env } = captureEnv();
    env.PUBLIC_SITE.fetch = async (request) =>
      new URL(request.url).pathname === '/news/caregivers/'
        ? targetReply()
        : new Response('old article', { headers: { 'Content-Type': 'text/html' } });
    const response = await gateway.fetch(new Request('https://site.invalid/news/lorem-ipsum/'), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'old article');
    assert.equal(response.headers.get('Location'), null);
  }
});

test('the News redirect respects the target route allowlist after the old route retires', async () => {
  const { env, forwarded } = captureEnv();
  const oldOnly = createPublicGateway(['^/news/lorem-ipsum/$']);
  const request = new Request('https://site.invalid/news/lorem-ipsum/');
  assert.equal((await oldOnly.fetch(request, env)).status, 200);
  assert.equal(forwarded.length, 1);
  assert.equal(new URL(forwarded[0].url).pathname, '/news/lorem-ipsum/');
  env.PUBLIC_SITE.fetch = async () => new Response(null, { headers: { 'Content-Type': 'text/html' } });
  const newOnly = createPublicGateway(['^/news/caregivers/$']);
  assert.equal((await newOnly.fetch(request, env)).status, 308);
  assert.equal((await createPublicGateway([]).fetch(request, env)).status, 404);
});

function captureEnv() {
  const forwarded = [];
  return {
    forwarded,
    env: {
      ASSETS: { fetch: async () => new Response('asset') },
      PUBLIC_SITE: {
        fetch: async (request) => {
          forwarded.push(request);
          return new Response('rendered', { headers: { 'Content-Type': 'text/html' } });
        },
      },
    },
  };
}

test('slashless public documents redirect once, preserving queries for GET and HEAD', async () => {
  for (const path of ['/store', '/artists/afterwise']) {
    for (const method of ['GET', 'HEAD']) {
      const { env, forwarded } = captureEnv();
      const response = await gateway.fetch(
        new Request(`https://site.invalid${path}?utm_source=test&x=%2F`, { method }),
        env,
      );
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('Location'), `https://site.invalid${path}/?utm_source=test&x=%2F`);
      assert.equal(forwarded.length, 1);
      assert.equal(forwarded[0].url, response.headers.get('Location'));
      const destination = await gateway.fetch(new Request(response.headers.get('Location'), { method }), env);
      assert.equal(destination.status, 200);
      assert.equal(forwarded.length, 2);
    }
  }
});

test('normalization respects the configured base and exact route allow-list', async () => {
  for (const base of ['/preview/', '/blackbox-records']) {
    const root = base.replace(/\/$/, '');
    const gateway = createPublicGateway([`^${root}/$`, `^${root}/store/$`, `^${root}/artists/[^/]+/?$`], base);
    const { env, forwarded } = captureEnv();
    for (const path of [root, `${root}/store`, `${root}/artists/afterwise`]) {
      const response = await gateway.fetch(new Request(`https://site.invalid${path}?q=1`), env);
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('Location'), `https://site.invalid${path}/?q=1`);
    }
    for (const path of ['/store', `${root}/about`, `${root}/storehouse`, `${root}/private/store`]) {
      assert.equal((await gateway.fetch(new Request(`https://site.invalid${path}`), env)).status, 404);
    }
    assert.equal(forwarded.length, 3);
  }
});

test('unknown documents inside a dynamic route keep their 404 instead of redirecting', async () => {
  for (const status of [404, 503]) {
    const { env, forwarded } = captureEnv();
    env.PUBLIC_SITE.fetch = async (request) => {
      forwarded.push(request);
      return new Response('Unavailable', {
        status,
        headers: { 'Content-Type': 'text/html', 'X-Robots-Tag': 'noindex' },
      });
    };
    const response = await gateway.fetch(new Request('https://site.invalid/artists/missing?q=1'), env);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Location'), null);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
    assert.equal(forwarded.length, 1);
  }
  const { env } = captureEnv();
  env.PUBLIC_SITE.fetch = async () => new Response('Not an HTML document');
  assert.equal(
    (await gateway.fetch(new Request('https://site.invalid/artists/not-a-document'), env)).headers.get('Location'),
    null,
  );
});

test('a conditional match still consolidates the slashless document', async () => {
  const { env } = captureEnv();
  env.PUBLIC_SITE.fetch = async () => new Response(null, { status: 304 });
  const response = await gateway.fetch(
    new Request('https://site.invalid/artists/afterwise?q=1', { headers: { 'If-None-Match': 'W/"published"' } }),
    env,
  );
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('Location'), 'https://site.invalid/artists/afterwise/?q=1');
});

test('assets, media, endpoints, overlays, private, checkout and unknown routes never gain a document redirect', async () => {
  const paths = [
    '/assets/image.png',
    '/_astro/client.js',
    '/_image',
    '/media/content/' + 'a'.repeat(64),
    '/api/store',
    '/_emdash/admin',
    '/__publication/current',
    '/content/item',
    '/stock/item',
    '/app-shell-overlay/artists/afterwise',
    '/email-preferences',
    '/store/checkout',
    '/store/item/checkout',
    '/unknown',
    '/artists/band/admin',
    '/release.json',
    '/content-version.json',
  ];
  const admitted = createPublicGateway(paths.map((path) => `^${path}/?$`));
  for (const path of paths) {
    const { env } = captureEnv();
    const response = await admitted.fetch(new Request(`https://site.invalid${path}?q=1`), env);
    assert.equal(response.headers.get('Location'), null, path);
    assert.notEqual(response.status, 308, path);
  }
});

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
  assert.equal(page.headers.get('Cache-Control'), 'no-store');
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

test('HTML and conditional replies preserve cache and privacy headers for automatic analytics', async () => {
  const gateway = createPublicGateway(['^/$', '^/email-preferences/$']);
  for (const [path, method, status, cache] of [
    ['/', 'GET', 200, 'public, max-age=0, s-maxage=30, stale-while-revalidate=30'],
    ['/', 'HEAD', 200, 'public, max-age=0'],
    ['/', 'GET', 304, 'public, max-age=0'],
    ['/email-preferences/', 'GET', 200, 'private, no-store'],
    ['/', 'GET', 503, 'no-store'],
    ['/', 'GET', 200, null],
    ['/', 'GET', 304, ''],
    ['/', 'GET', 200, 'no-store, no-transform'],
  ]) {
    const { env } = captureEnv();
    env.PUBLIC_SITE.fetch = async () =>
      new Response(status === 304 ? null : '<p>Unchanged HTML</p>', {
        status,
        headers: {
          ...(status === 304 ? {} : { 'Content-Type': 'text/html; charset=utf-8' }),
          ...(cache === null ? {} : { 'Cache-Control': cache }),
          'Referrer-Policy': 'no-referrer',
          'X-Robots-Tag': 'noindex',
          ETag: 'W/"same-content"',
        },
      });
    const response = await gateway.fetch(new Request(`https://site.invalid${path}`, { method }), env);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), cache || 'no-store');
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
