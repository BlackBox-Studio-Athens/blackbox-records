import assert from 'node:assert/strict';
import { test } from 'node:test';
import gateway from './pages-public-gateway.mjs';

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
  assert.equal(forwarded.length, 1);
});
