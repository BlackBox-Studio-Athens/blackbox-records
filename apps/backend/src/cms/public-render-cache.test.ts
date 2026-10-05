import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { expect, it } from 'vitest';
import {
  PublicRenderCache,
  publicPageEtag,
  publicPageNotModified,
  publicCachedPageResponse,
} from './public-render-cache';

function storage() {
  const database = new DatabaseSync(':memory:');
  return {
    exec(query: string, ...bindings: (string | number)[]) {
      const statement = database.prepare(query);
      const rows = statement.columns().length ? statement.all(...bindings) : (statement.run(...bindings), []);
      return { toArray: () => rows, one: () => rows[0] };
    },
  } as unknown as SqlStorage;
}

const page = (body: string) => ({ body, headers: [] as [string, string][], status: 200 });

it('retains pages through a cache instance restart and separates release/snapshot/path keys', () => {
  const sql = storage();
  new PublicRenderCache(sql).put('release/snapshot/home', page('accepted HTML'));
  const restarted = new PublicRenderCache(sql);
  expect(restarted.get('release/snapshot/home')?.body).toBe('accepted HTML');
  expect(restarted.get('new-release/snapshot/home')).toBeUndefined();
  expect(restarted.get('release/new-snapshot/home')).toBeUndefined();
  expect(restarted.get('release/snapshot/store')).toBeUndefined();
});

it('evicts the least recently used entry by UTF-8 bytes, counts headers, and replaces without double accounting', () => {
  const sql = storage();
  const cache = new PublicRenderCache(sql, 50);
  cache.put('a', page('é'.repeat(10))); // 23 bytes including key and serialized headers
  cache.put('b', page('b'.repeat(20))); // 23 bytes
  expect(cache.get('a')).toBeDefined();
  cache.put('c', page('c'.repeat(20)));
  expect(cache.get('b')).toBeUndefined();
  expect(cache.get('a')).toBeDefined();
  expect(cache.get('c')).toBeDefined();
  cache.put('a', page('short'));
  cache.put('d', page('d'.repeat(10)));
  expect(cache.get('c')).toBeDefined();
  cache.put('oversized', page('x'.repeat(50)));
  expect(cache.get('oversized')).toBeUndefined();
  cache.put('headers', { ...page(''), headers: [['large', 'x'.repeat(60)]] });
  expect(cache.get('headers')).toBeUndefined();
});

it('retires older publication entries, retains the active HTML and JSON, and rejects late retired writes', () => {
  const sql = storage();
  const cache = new PublicRenderCache(sql, 140);
  cache.put('release/old/home', page('old HTML'));
  cache.put('release/old/showcase', page('old JSON'));
  cache.put('old-release/current/home', page('old code'));
  cache.put('release/current/home', page('HTML'));
  cache.retain('release/current/');
  expect(cache.get('release/old/home')).toBeUndefined();
  expect(cache.get('release/old/showcase')).toBeUndefined();
  expect(cache.get('old-release/current/home')).toBeUndefined();
  expect(cache.get('release/current/home')?.body).toBe('HTML');
  cache.put('release/current/showcase', page('JSON'));
  cache.put('release/old/showcase', page('late render'));
  cache.retain('release/current/');
  expect(cache.get('release/old/showcase')).toBeUndefined();
  expect(cache.get('release/current/showcase')?.body).toBe('JSON');
  // Removal must also release its accounted bytes for subsequent inserts and restarts.
  const restarted = new PublicRenderCache(sql, 140);
  restarted.retain('release/next/');
  restarted.put('release/next/showcase', page('x'.repeat(100)));
  expect(restarted.get('release/next/showcase')?.body).toBe('x'.repeat(100));
});

it('produces stable weak validators bound to identity and matches strong/weak lists and wildcard', async () => {
  const etag = await publicPageEtag('release/snapshot/home');
  expect(etag).toMatch(/^W\/"[a-f0-9]{64}"$/);
  expect(await publicPageEtag('release/snapshot/home')).toBe(etag);
  expect(await publicPageEtag('release/new-snapshot/home')).not.toBe(etag);
  for (const value of [etag, etag.slice(2), `"old", ${etag}`, '*'])
    expect(
      publicPageNotModified(new Request('https://site.invalid', { headers: { 'If-None-Match': value } }), etag),
    ).toBe(true);
  expect(
    publicPageNotModified(new Request('https://site.invalid', { headers: { 'If-None-Match': '"old"' } }), etag),
  ).toBe(false);
  const cached = {
    ...page('HTML bytes'),
    headers: [
      ['ETag', etag],
      ['Cache-Control', 'public, max-age=0'],
    ] as [string, string][],
  };
  const notModified = publicCachedPageResponse(
    new Request('https://site.invalid', { headers: { 'If-None-Match': etag } }),
    cached,
  );
  expect(notModified.status).toBe(304);
  expect(notModified.body).toBeNull();
  expect(notModified.headers.get('ETag')).toBe(etag);
  expect(publicCachedPageResponse(new Request('https://site.invalid', { method: 'HEAD' }), cached).body).toBeNull();
  expect(await publicCachedPageResponse(new Request('https://site.invalid'), cached).text()).toBe('HTML bytes');
});

it('reuses rendered HTML from real workerd SQLite storage after an object restart', async () => {
  // Reuse Wrangler's installed local runtime instead of adding a second Miniflare dependency.
  const wranglerRequire = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'));
  const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
  const cacheModule = stripTypeScriptTypes(readFileSync(new URL('./public-render-cache.ts', import.meta.url), 'utf8'), {
    mode: 'transform',
  }).replace(/^export (?=(?:const|class|function|async function)\b)/gm, '');
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      compatibilityDate: '2026-09-16',
      durableObjects: { CACHE: { className: 'CacheObject', useSQLite: true } },
      script: `import { DurableObject } from 'cloudflare:workers';
      ${cacheModule}
      export class CacheObject extends DurableObject {
        async fetch(request) {
          const path = new URL(request.url).pathname;
          if (path === '/restart') this.ctx.abort();
          const cache = new PublicRenderCache(this.ctx.storage.sql, 4096);
          if (path === '/put') cache.put('release/snapshot/home', {
            body: 'Persisted HTML', status: 200,
            headers: [['ETag', await publicPageEtag('release/snapshot/home')]],
          });
          const page = cache.get('release/snapshot/home');
          return page ? publicCachedPageResponse(request, page) : new Response('Missing', { status: 404 });
        }
      }
      export default { fetch(request, env) { return env.CACHE.getByName('public').fetch(request); } };`,
    }),
  );
  try {
    const written = await worker.dispatchFetch('http://site.invalid/put');
    const etag = written.headers.get('ETag')!;
    expect(await written.text()).toBe('Persisted HTML');
    // abort evicts this actor; its next request constructs a new object over the same SQLite storage.
    await worker.dispatchFetch('http://site.invalid/restart').catch(() => {});
    const restored = await worker.dispatchFetch('http://site.invalid/get');
    expect(await restored.text()).toBe('Persisted HTML');
    const validated = await worker.dispatchFetch('http://site.invalid/get', { headers: { 'If-None-Match': etag } });
    expect(validated.status).toBe(304);
    expect(await validated.text()).toBe('');
  } finally {
    await worker.dispose();
  }
}, 30_000);
