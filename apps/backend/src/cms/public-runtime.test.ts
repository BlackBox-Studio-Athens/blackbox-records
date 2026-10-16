import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { publicInvalidationPath, publicPublicationTags } from './public-publication-cache';
import { publicPreorderIdentity, publicPreorderProjectionPath } from './public-preorder-projection';

it.each(['uat', 'local'] as const)(
  'runs %s invalidation through the default handler and real workerd',
  async (environment) => {
    const require = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'));
    const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
    const { build } = require('esbuild');
    const release = 'c'.repeat(40);
    const old = { id: crypto.randomUUID(), snapshotSha256: 'a'.repeat(64), generation: 1 };
    const next = { id: crypto.randomUUID(), snapshotSha256: 'b'.repeat(64), generation: 2 };
    // Load the production default handler and DO, with no SSR fixture or fake publication proof.
    // Seed only disposable HTML: an unexpected render fails this test instead of fabricating output.
    const compiled = await build({
      stdin: {
        resolveDir: dirname(fileURLToPath(import.meta.url)),
        loader: 'ts',
        contents: `import handler, { PublicSiteRuntime } from './public-runtime';
        import * as workers from 'cloudflare:workers';
        export { PublicImageRenderer } from './public-runtime';
        export class TestPublicSiteRuntime extends PublicSiteRuntime {
          seed(snapshot) {
            this.renderCache().put('${release}/' + snapshot + '/none/http://site.invalid/', {
              body: 'Persisted ' + snapshot, status: 200,
              headers: [['Content-Type', 'text/html'], ['Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30'], ['ETag', 'W/"' + snapshot + '"']],
            });
          }
        }
        let purges = [];
        export default { async fetch(request, env, ctx) {
          const path = new URL(request.url).pathname;
          if (path === '/__test/seed') {
            await env.PUBLIC_SITE_RUNTIME.getByName('public-v2').seed(await request.text());
            return new Response('Seeded');
          }
          if (path === '/__test/purges') return Response.json(purges);
          if (path === '/__test/publication-read') return env.PUBLIC_SITE_RUNTIME.getByName('publication-v2').fetch(new Request('http://site.invalid/content-version.json'));
          if (path === '/__test/image-invalidation') return ctx.exports.PublicImageRenderer.fetch(new Request('http://site.invalid${publicInvalidationPath}', {method: 'POST', body: await request.text()}));
          if (path === '/__test/capability') {
            const result = { available: !!ctx.cache, exportAvailable: !!workers.cache };
            try { result.result = ctx.cache ? await ctx.cache.purge({tags:['probe']}) : null; }
            catch(error) { result.error = error.message; }
            try { result.exportResult = workers.cache ? await workers.cache.purge({tags:['probe']}) : null; }
            catch(error) { result.exportError = error.message; }
            return Response.json(result);
          }
          // Only the provider purge boundary is stubbed. The production handler, RPC,
          // R2 read, snapshot selection and persisted HTML path run in workerd.
          const context = request.headers.has('X-Test-Native-Cache') ? ctx : new Proxy(ctx, {
            get(target, name) { return name === 'cache' ? { async purge(options) {
              purges.push(options);
              return { success: !request.headers.has('X-Test-Reject-Purge'), errors: [] };
            } } : Reflect.get(target, name, target); },
          });
          return handler.fetch(request, env, context);
        } };`,
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'neutral',
      conditions: ['workerd', 'worker', 'browser'],
      external: ['cloudflare:workers', 'node:*'],
      define: {
        PUBLIC_RELEASE_IDENTITY: JSON.stringify({ sha: release, runId: 'local', runNumber: 1 }),
        PUBLIC_BOOTSTRAP: 'null',
        PUBLIC_BASE_PATH: JSON.stringify('/'),
      },
      plugins: [
        {
          name: 'unused-astro-render-guard',
          setup(builder: {
            onResolve(options: { filter: RegExp }, callback: () => { path: string; namespace: string }): void;
            onLoad(
              options: { filter: RegExp; namespace: string },
              callback: () => { contents: string; loader: string },
            ): void;
          }) {
            builder.onResolve({ filter: /^(astro\/fetch|@astrojs\/cloudflare\/fetch)$/ }, () => ({
              path: 'guard',
              namespace: 'render-guard',
            }));
            builder.onLoad({ filter: /.*/, namespace: 'render-guard' }, () => ({
              contents:
                'export class FetchState {} export function astro() { throw new Error("Unexpected SSR"); } export function cf() {} export function finalize() { throw new Error("Unexpected SSR"); }',
              loader: 'js',
            }));
          },
        },
      ],
    });
    const options = convertV4MiniflareOptions({
      modules: true,
      script: compiled.outputFiles[0].text,
      compatibilityDate: '2026-09-16',
      compatibilityFlags: ['nodejs_compat'],
      durableObjects: { PUBLIC_SITE_RUNTIME: { className: 'TestPublicSiteRuntime', useSQLite: true } },
      r2Buckets: ['MEDIA'],
      bindings: { PRODUCT_ENVIRONMENT: environment, PUBLIC_IMAGE_TRANSFORM_ORIGIN: '' },
    });
    // Match production entrypoint cache enablement; the legacy conversion omits it.
    options.workers[0].config.cache = { enabled: false };
    options.workers[0].config.exports.default = { type: 'worker', cache: { enabled: true } };
    options.workers[0].config.exports.PublicImageRenderer = { type: 'worker', cache: { enabled: true } };
    const worker = new Miniflare(options);
    try {
      const bucket = await worker.getR2Bucket('MEDIA');
      const setPointer = (pointer: typeof old) =>
        bucket.put(`snapshots/${environment}/current.json`, JSON.stringify(pointer));
      const seed = (pointer: typeof old) =>
        worker.dispatchFetch('http://site.invalid/__test/seed', { method: 'POST', body: pointer.snapshotSha256 });
      const invalidate = (headers = {}) =>
        worker.dispatchFetch(`http://site.invalid${publicInvalidationPath}`, {
          method: 'POST',
          body: JSON.stringify(next),
          headers: { 'Content-Type': 'application/json', ...headers },
        });
      await setPointer(old);
      await seed(old);
      const page = await worker.dispatchFetch('http://site.invalid/');
      expect(await page.text()).toBe(`Persisted ${old.snapshotSha256}`);
      expect(page.headers.get('Cache-Tag')).toBe(publicPublicationTags(release, old.snapshotSha256).join(','));
      expect(page.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30, stale-while-revalidate=30');
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/__test/publication-read')).json()).content
          .publicationId,
      ).toBe(old.id);
      await setPointer(next);
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/content-version.json')).json()).content.publicationId,
      ).toBe(old.id);
      expect((await invalidate({ 'X-Test-Reject-Purge': '1' })).status).toBe(503);
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/content-version.json')).json()).content.publicationId,
      ).toBe(next.id);
      await seed(next);
      expect(await (await invalidate()).json()).toEqual(next);
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/__test/publication-read')).json()).content
          .publicationId,
      ).toBe(old.id);
      expect(
        (
          await worker.dispatchFetch('http://site.invalid/__test/image-invalidation', {
            method: 'POST',
            body: JSON.stringify(next),
          })
        ).status,
      ).toBe(405);
      const fresh = await worker.dispatchFetch('http://site.invalid/');
      expect(await fresh.text()).toBe(`Persisted ${next.snapshotSha256}`);
      expect(fresh.headers.get('Cache-Tag')).toBe(publicPublicationTags(release, next.snapshotSha256).join(','));
      expect(await (await worker.dispatchFetch('http://site.invalid/__test/purges')).json()).toEqual([
        { tags: ['blackbox-publication'] },
        { tags: ['blackbox-publication'] },
      ]);
      const native = await (await worker.dispatchFetch('http://site.invalid/__test/capability')).json();
      // Keep this local capability observation separate from tests of the provider-result boundary.
      mkdirSync(new URL('../../../../.codex-artifacts/performance-resume/', import.meta.url), { recursive: true });
      writeFileSync(
        new URL('../../../../.codex-artifacts/performance-resume/purge-runtime-capability.json', import.meta.url),
        JSON.stringify(native, null, 2) + '\n',
      );
      console.log('Installed native Workers Cache capability:', JSON.stringify(native));
      if (!native.available || native.error || !native.result?.success) {
        const response = await invalidate({ 'X-Test-Native-Cache': '1' });
        expect(response.status).toBe(environment === 'local' && !native.available ? 200 : 503);
        if (response.ok) expect(await response.json()).toEqual(next);
      }
      await bucket.delete(`snapshots/${environment}/current.json`);
      expect((await invalidate()).status).toBe(503);
      const { createPublicGateway } = await import(
        new URL('../../../../scripts/pages-public-gateway.mjs', import.meta.url).href
      );
      let calls = 0;
      const gateway = createPublicGateway(['^/.*$']);
      const bindings = {
        PUBLIC_SITE: {
          fetch() {
            calls++;
            throw new Error('Private path forwarded');
          },
        },
      };
      expect(
        (
          await gateway.fetch(
            new Request(`https://site.invalid${publicInvalidationPath}`, { method: 'POST' }),
            bindings,
          )
        ).status,
      ).toBe(405);
      expect((await gateway.fetch(new Request(`https://site.invalid${publicInvalidationPath}`), bindings)).status).toBe(
        404,
      );
      expect(calls).toBe(0);
    } finally {
      await worker.dispose();
    }
  },
  30_000,
);

it('reuses published HTML through the public gateway and retires it on publication or projection change', async () => {
  const require = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'));
  const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
  const { build } = require('esbuild');
  const release = 'c'.repeat(40);
  const reader = JSON.stringify(fileURLToPath(new URL('./published-reader.ts', import.meta.url)));
  const preorders = JSON.stringify(fileURLToPath(new URL('./published-preorders.ts', import.meta.url)));
  // Only Astro dispatch is a fixture; Home reads the production accepted context and pushed projection.
  const fixtures: Record<string, string> = {
    'astro/fetch': `import { getCollection } from ${reader};
      import { readOpenPreorders } from ${preorders};
      export const renders = {};
      let signalPause;
      export const paused = new Promise(resolve => { signalPause = resolve; });
      export let resume;
      export class FetchState { constructor(request) { this.request = request; } }
      export async function astro(state) {
        const url = new URL(state.request.url);
        renders[url.pathname] = (renders[url.pathname] ?? 0) + 1;
        if (url.pathname === '/') {
          const [record] = await getCollection('releases');
          const response = new Response('<html><head></head><body>' + JSON.stringify(record.data.clips ?? []) + '|' +
            JSON.stringify(readOpenPreorders()) + '</body></html>', {headers: {'Content-Type': 'text/html'}});
          const headers = new Headers(response.headers);
          if (url.hostname === 'private.invalid') headers.set('Cache-Control', 'private, max-age=60');
          if (url.hostname === 'no-store.invalid') headers.set('Cache-Control', 'no-store');
          if (url.hostname === 'cookie.invalid') headers.set('Set-Cookie', 'private=1');
          if (url.hostname === 'paused.invalid') {
            headers.set('Last-Modified', 'Mon, 05 Oct 2026 00:00:00 GMT');
            const body = await response.text();
            return new Response(new ReadableStream({pull(controller) {
              signalPause();
              return new Promise(resolve => { resume = () => {
                controller.enqueue(new TextEncoder().encode(body)); controller.close(); resolve();
              }; });
            }}, {highWaterMark: 0}), {headers});
          }
          return new Response(response.body, {status: url.hostname === 'error.invalid' ? 500 : 200, headers});
        }
        if (url.pathname === '/other.json') return Response.json({price: 123}, {headers: {'Cache-Control': 'public, max-age=3600'}});
        const [record] = await getCollection('releases');
        const headers = {'Content-Type': 'text/html'};
        if (url.pathname === '/private/') headers['Cache-Control'] = 'private, max-age=60';
        return new Response('<html><head></head><body>' + JSON.stringify(record.data.clips ?? []) + '</body></html>', {headers});
      }`,
    '@astrojs/cloudflare/fetch':
      'export function cf() {} export function finalize(state, response) { return response; }',
  };
  const compiled = await build({
    stdin: {
      resolveDir: dirname(fileURLToPath(import.meta.url)),
      loader: 'ts',
      contents: `import handler, { PublicSiteRuntime } from './public-runtime';
        import { renders, paused, resume } from 'astro/fetch';
        export class TestPublicSiteRuntime extends PublicSiteRuntime {
          keys() { return this.ctx.storage.sql.exec('SELECT key FROM public_render_cache ORDER BY key').toArray(); }
          restart() { this.ctx.abort(); }
        }
        let purges = 0;
        export default { async fetch(request, env, ctx) {
          const runtime = env.PUBLIC_SITE_RUNTIME.getByName('public-v2');
          const path = new URL(request.url).pathname;
          if (path === '/__test/stats') return Response.json({renders, purges, keys: await runtime.keys()});
          if (path === '/__test/restart') return runtime.restart();
          if (path === '/__test/paused') { await paused; return new Response('Paused'); }
          if (path === '/__test/resume') { resume(); return new Response('Resumed'); }
          const context = new Proxy(ctx, {get(target, name) {
            return name === 'cache' ? {async purge() {
              purges++;
              return {success: !request.headers.has('X-Test-Reject-Purge'), errors: []};
            }} : Reflect.get(target, name, target);
          }});
          return handler.fetch(request, env, context);
        } };`,
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    conditions: ['workerd', 'worker', 'browser'],
    external: ['cloudflare:workers', 'node:*'],
    define: {
      PUBLIC_RELEASE_IDENTITY: JSON.stringify({ sha: release, runId: 'local', runNumber: 1 }),
      PUBLIC_BOOTSTRAP: 'null',
      PUBLIC_BASE_PATH: JSON.stringify('/'),
    },
    plugins: [
      {
        name: 'accepted-render-fixture',
        setup(builder: {
          onResolve(
            options: { filter: RegExp },
            callback: (args: { path: string }) => { path: string; namespace?: string },
          ): void;
          onLoad(
            options: { filter: RegExp; namespace: string },
            callback: (args: { path: string }) => { contents: string; loader: string; resolveDir: string },
          ): void;
        }) {
          builder.onResolve({ filter: /^(astro\/fetch|@astrojs\/cloudflare\/fetch)$/ }, ({ path }) => ({
            path,
            namespace: 'fixture',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({
            contents: fixtures[path]!,
            loader: 'js',
            resolveDir: dirname(fileURLToPath(import.meta.url)),
          }));
        },
      },
    ],
  });
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: compiled.outputFiles[0].text,
      compatibilityDate: '2026-09-16',
      compatibilityFlags: ['nodejs_compat'],
      durableObjects: { PUBLIC_SITE_RUNTIME: { className: 'TestPublicSiteRuntime', useSQLite: true } },
      r2Buckets: ['MEDIA'],
      bindings: { PRODUCT_ENVIRONMENT: 'uat', PUBLIC_IMAGE_TRANSFORM_ORIGIN: '' },
    }),
  );
  try {
    const bucket = await worker.getR2Bucket('MEDIA');
    const { createPublicGateway } = await import(
      new URL('../../../../scripts/pages-public-gateway.mjs', import.meta.url).href
    );
    const gateway = createPublicGateway(['^/$', '^/releases/lotus/$', '^/private/$', '^/other\\.json$']);
    const read = (path: string, options?: RequestInit) =>
      gateway.fetch(new Request(`http://site.invalid${path}`, options), {
        PUBLIC_SITE: {
          fetch: (request: Request) =>
            worker.dispatchFetch(request.url, { method: request.method, headers: request.headers }),
        },
      });
    const stats = async () => (await worker.dispatchFetch('http://site.invalid/__test/stats')).json();
    const home = async (response: Response) => {
      const [, clips, projected] = /<body>(.*)\|(.*)<\/body>/.exec(await response.text())!;
      return { clips: JSON.parse(clips!), preorders: JSON.parse(projected!) };
    };
    const snapshot = async (clipId: string | null, generation: number) => {
      const json = JSON.stringify({
        schemaVersion: 1,
        environment: 'uat',
        records: [
          {
            collection: 'artists',
            id: 'sidus',
            slug: 'sidus',
            revisionId: 'artist',
            data: {
              title: 'Sidus',
              genre: 'Rock',
              bio: 'Biography',
              image: { id: 'image' },
              image_alt: 'Portrait',
            },
          },
          {
            collection: 'releases',
            id: 'lotus',
            slug: 'lotus',
            revisionId: `release-${generation}`,
            data: {
              title: 'LOTUS',
              artist: 'sidus',
              cover_image: { id: 'image' },
              cover_image_alt: 'Lotus',
              catalog_number: 'BBR#001',
              release_stage: 'upcoming',
              clips: clipId ? [{ title: 'Embrace The Void', youtube_video_id: clipId }] : [],
            },
          },
        ],
        media: [
          {
            id: 'image',
            sha256: 'a'.repeat(64),
            filename: 'image.png',
            mimeType: 'image/png',
            size: 1,
            width: 1,
            height: 1,
          },
        ],
        storeItems: [
          { sourceKind: 'release', sourceId: 'lotus', storeItemSlug: 'lotus-vinyl', variantId: 'variant_lotus' },
        ],
      });
      const snapshotSha256 = createHash('sha256').update(json).digest('hex');
      await bucket.put(`snapshots/uat/manifest/${snapshotSha256}`, json, { sha256: snapshotSha256 });
      return { id: crypto.randomUUID(), snapshotSha256, generation };
    };
    const activate = async (pointer: Awaited<ReturnType<typeof snapshot>>, reject = false) => {
      await bucket.put('snapshots/uat/current.json', JSON.stringify(pointer));
      return worker.dispatchFetch(`http://site.invalid${publicInvalidationPath}`, {
        method: 'POST',
        body: JSON.stringify(pointer),
        headers: { 'Content-Type': 'application/json', ...(reject ? { 'X-Test-Reject-Purge': '1' } : {}) },
      });
    };
    expect((await read('/')).status).toBe(503);
    const old = await snapshot(null, 1);
    expect((await activate(old)).status).toBe(200);
    const head = await read('/', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    const etag = head.headers.get('ETag')!;
    expect(etag).toMatch(/^W\/"[a-f0-9]{64}"$/);
    expect(head.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30, stale-while-revalidate=30');
    const initial = await read('/');
    expect(initial.headers.get('X-Content-SHA256')).toBe(old.snapshotSha256);
    expect(initial.headers.get('Cache-Tag')).toBe(publicPublicationTags(release, old.snapshotSha256).join(','));
    expect(await home(initial)).toEqual({ clips: [], preorders: [] });
    for (const method of ['GET', 'HEAD']) {
      const conditional = await read('/', {
        method,
        headers: { 'If-None-Match': `"other", ${etag.slice(2)}`, Cookie: 'draft=1', Authorization: 'private' },
      });
      expect(conditional.status).toBe(304);
      expect(await conditional.text()).toBe('');
      expect(conditional.headers.get('ETag')).toBe(etag);
      expect(conditional.headers.get('Cache-Control')).toBe(head.headers.get('Cache-Control'));
    }
    expect((await stats()).renders['/']).toBe(1);
    await worker.dispatchFetch('http://site.invalid/__test/restart').catch(() => {});
    expect((await read('/')).headers.get('ETag')).toBe(etag);
    expect((await stats()).renders['/']).toBe(1);
    const html = await read('/releases/lotus/');
    const htmlEtag = html.headers.get('ETag')!;
    expect((await read('/releases/lotus/', { headers: { 'If-None-Match': htmlEtag } })).status).toBe(304);
    expect((await stats()).renders['/releases/lotus/']).toBe(1);

    const next = await snapshot('MOA5YZDOR6A', 2);
    // A staged manifest alone is private, including an uncached query-bearing read.
    expect((await home(await read('/?draft=1'))).clips).toEqual([]);
    await worker.dispatchFetch('http://site.invalid/__test/restart').catch(() => {});
    const rejected = await activate(next, true);
    expect(rejected.status).toBe(503);
    expect(rejected.headers.get('Cache-Control')).toBe('private, no-store');
    expect((await stats()).keys).toEqual([]);
    const changed = await read('/', { headers: { 'If-None-Match': etag } });
    expect(changed.status).toBe(200);
    expect(changed.headers.get('ETag')).not.toBe(etag);
    expect((await home(changed)).clips[0].youtube_video_id).toBe('MOA5YZDOR6A');
    const changedHtml = await read('/releases/lotus/', { headers: { 'If-None-Match': htmlEtag } });
    expect(changedHtml.status).toBe(200);
    expect(await changedHtml.text()).toContain('MOA5YZDOR6A');
    const beforeRetry = await stats();
    expect(
      beforeRetry.keys.every(({ key }: { key: string }) => key.startsWith(`${release}/${next.snapshotSha256}/`)),
    ).toBe(true);
    expect((await activate(next)).status).toBe(200);
    await read('/');
    expect((await stats()).renders).toEqual(beforeRetry.renders);

    for (const [clipId, generation] of [
      ['abcdefghijk', 3],
      [null, 4],
    ] as const) {
      const pointer = await snapshot(clipId, generation);
      expect((await activate(pointer)).status).toBe(200);
      const previousTag = await read('/', { headers: { 'If-None-Match': etag } });
      expect(previousTag.status).toBe(200);
      expect((await home(previousTag)).clips[0]?.youtube_video_id ?? null).toBe(clipId);
      const page = await read('/releases/lotus/');
      expect(page.headers.get('X-Content-SHA256')).toBe(pointer.snapshotSha256);
      expect(await page.text()).toBe(
        `<html><head></head><body>${JSON.stringify(clipId ? [{ title: 'Embrace The Void', youtube_video_id: clipId }] : [])}</body></html>`,
      );
      expect(
        (await stats()).keys.every(({ key }: { key: string }) =>
          key.startsWith(`${release}/${pointer.snapshotSha256}/`),
        ),
      ).toBe(true);
    }
    const candidate = await (await bucket.get(`snapshots/uat/manifest/${next.snapshotSha256}`))!.json();
    const context = crypto.randomUUID();
    for (let repeat = 0; repeat < 2; repeat++) {
      const preview = await worker.dispatchFetch('http://site.invalid/__publication/preview', {
        method: 'POST',
        body: JSON.stringify({
          context,
          generation: 1,
          parentOrigin: 'http://staff.invalid',
          path: '/releases/lotus/',
          content: { records: candidate.records, storeItems: candidate.storeItems },
          images: { image: { src: `/_preview/media/${context}/image`, width: 1, height: 1, format: 'png' } },
        }),
      });
      expect(preview.status).toBe(200);
      expect(preview.headers.get('Cache-Control')).toBe('private, no-store');
      expect(await preview.text()).toContain('MOA5YZDOR6A');
    }
    expect((await home(await read('/'))).clips).toEqual([]);
    const warm = await stats();
    for (const path of [
      '/other.json',
      '/private/',
      '/?query=1',
      '/api/store/listing-prices',
      '/content-version.json',
      '/release.json',
    ]) {
      const response = await read(path);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('ETag')).toBeNull();
    }
    for (const host of ['private', 'no-store', 'cookie', 'error']) {
      for (let repeat = 0; repeat < 2; repeat++) {
        const response = await worker.dispatchFetch(`http://${host}.invalid/`, {
          headers: { 'If-None-Match': '*' },
        });
        expect(response.status).toBe(host === 'error' ? 500 : 200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.get('ETag')).toBeNull();
      }
    }
    const after = await stats();
    expect(after.keys).toEqual(warm.keys);
    expect(after.renders['/'] - warm.renders['/']).toBe(9);
    const inFlight = worker.dispatchFetch('http://paused.invalid/', {
      headers: { 'If-None-Match': '*' },
    });
    await worker.dispatchFetch('http://site.invalid/__test/paused');
    const replacement = await snapshot('MOA5YZDOR6A', 5);
    try {
      expect((await activate(replacement)).status).toBe(200);
    } finally {
      await worker.dispatchFetch('http://site.invalid/__test/resume');
    }
    const retired = await inFlight;
    expect(retired.status).toBe(200);
    expect(retired.headers.get('Cache-Control')).toBe('no-store');
    for (const header of ['ETag', 'Last-Modified', 'Cache-Tag']) expect(retired.headers.get(header)).toBeNull();
    expect((await home(retired)).clips).toEqual([]);
    expect((await stats()).keys).toEqual([]);
    const current = await read('/');
    expect(current.headers.get('X-Content-SHA256')).toBe(replacement.snapshotSha256);
    expect((await home(current)).clips[0].youtube_video_id).toBe('MOA5YZDOR6A');
    expect(
      (
        await read('/', {
          method: 'HEAD',
          headers: { 'If-None-Match': current.headers.get('ETag')! },
        })
      ).status,
    ).toBe(304);
    console.log('Published HTML cache seam:', JSON.stringify(after));

    // The open pre-order projection arrives privately, binds HTML reuse, and purges only when it changes.
    const push = (body: unknown) =>
      worker.dispatchFetch(`http://site.invalid${publicPreorderProjectionPath}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    const projection = {
      items: [
        {
          storeItemSlug: 'lotus-vinyl',
          displayPrice: '€28.00',
          shipEstimate: { kind: 'month' as const, month: '2026-11', part: null },
        },
      ],
    };
    const identity = await publicPreorderIdentity(projection);
    const unprojected = (await stats()).purges;
    for (const invalid of [
      { items: [{ ...projection.items[0], storeItemSlug: 'Lotus Vinyl' }] },
      { items: 'lotus-vinyl' },
      { items: [], padding: 'x'.repeat(70_000) },
    ])
      expect((await push(invalid)).status).toBe(400);
    const gatewayCalls: string[] = [];
    const gatewayBindings = { PUBLIC_SITE: { fetch: (request: Request) => (gatewayCalls.push(request.url), null) } };
    expect(
      (
        await gateway.fetch(
          new Request(`http://site.invalid${publicPreorderProjectionPath}`, {
            method: 'POST',
            body: JSON.stringify(projection),
            headers: { 'Content-Type': 'application/json' },
          }),
          gatewayBindings,
        )
      ).status,
    ).toBe(405);
    expect(
      (await gateway.fetch(new Request(`http://site.invalid${publicPreorderProjectionPath}`), gatewayBindings)).status,
    ).toBe(404);
    expect(gatewayCalls).toEqual([]);
    expect((await stats()).purges).toBe(unprojected);
    const unprojectedEtag = current.headers.get('ETag')!;
    const accepted = await push(projection);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ changed: true, identity });
    expect((await stats()).purges).toBe(unprojected + 1);
    const projected = await read('/', { headers: { 'If-None-Match': unprojectedEtag } });
    expect(projected.status).toBe(200);
    const projectedEtag = projected.headers.get('ETag')!;
    expect(projectedEtag).not.toBe(unprojectedEtag);
    expect((await home(projected)).preorders).toEqual(projection.items);
    expect(
      (await stats()).keys.every(({ key }: { key: string }) =>
        key.startsWith(`${release}/${replacement.snapshotSha256}/${identity}/`),
      ),
    ).toBe(true);
    const projectedRenders = (await stats()).renders['/'];
    expect(await (await push(projection)).json()).toEqual({ changed: false, identity });
    expect((await stats()).purges).toBe(unprojected + 1);
    await worker.dispatchFetch('http://site.invalid/__test/restart').catch(() => {});
    expect((await read('/', { headers: { 'If-None-Match': projectedEtag } })).status).toBe(304);
    expect((await home(await read('/'))).preorders).toEqual(projection.items);
    expect((await stats()).renders['/']).toBe(projectedRenders);
    const projectedPreview = await worker.dispatchFetch('http://site.invalid/__publication/preview', {
      method: 'POST',
      body: JSON.stringify({
        context,
        generation: 2,
        parentOrigin: 'http://staff.invalid',
        path: '/',
        content: { records: candidate.records, storeItems: candidate.storeItems },
        images: { image: { src: `/_preview/media/${context}/image`, width: 1, height: 1, format: 'png' } },
      }),
    });
    expect(projectedPreview.status).toBe(200);
    expect(await projectedPreview.text()).toContain('lotus-vinyl');
  } finally {
    await worker.dispose();
  }
}, 30_000);
