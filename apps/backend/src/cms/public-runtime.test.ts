import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { publicInvalidationPath, publicPublicationTags } from './public-publication-cache';

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
        import { PublicRenderCache } from './public-render-cache';
        export class TestPublicSiteRuntime extends PublicSiteRuntime {
          seed(snapshot) {
            new PublicRenderCache(this.ctx.storage.sql).put('${release}/' + snapshot + '/http://site.invalid/', {
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
      await seed(next);
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/content-version.json')).json()).content.publicationId,
      ).toBe(old.id);
      expect((await invalidate({ 'X-Test-Reject-Purge': '1' })).status).toBe(503);
      expect(
        (await (await worker.dispatchFetch('http://site.invalid/content-version.json')).json()).content.publicationId,
      ).toBe(next.id);
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
