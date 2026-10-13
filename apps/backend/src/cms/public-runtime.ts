import { DurableObject, WorkerEntrypoint } from 'cloudflare:workers';
import { astro, FetchState } from 'astro/fetch';
import { cf, finalize } from '@astrojs/cloudflare/fetch';
import { isCmsCollection, type ContentSnapshot } from '@blackbox/content-model';
import { z } from 'zod';
import { publishedContext, type PublishedPreorders } from './published-reader';
import { readBoundedText } from './preview-content';
import { previewRenderContent, previewRenderSchema } from './preview-render-contract';
import {
  publicationPointerSchema,
  PublicSnapshotSelection,
  readPublishedSnapshot,
  type PublicationPointer,
  type PublicationEnvironment,
} from './published-storage';
import { notFound, PublicMedia, publicMediaBase } from './public-media';
import {
  acceptPublicPreorderProjection,
  invalidatePublicPublication,
  publicInvalidationPath,
  publicPublicationTags,
} from './public-publication-cache';
import { PublicPreorderStore, publicPreorderProjectionPath } from './public-preorder-projection';
import {
  PublicRenderCache,
  publicPageEtag,
  publicPageNotModified,
  publicCachedPageResponse,
} from './public-render-cache';

declare const PUBLIC_RELEASE_IDENTITY: { sha: string; runId: string; runNumber: number };
declare const PUBLIC_BOOTSTRAP: PublicationPointer | null;
declare const PUBLIC_BASE_PATH: string;
type Bindings = {
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  PRODUCT_ENVIRONMENT: PublicationEnvironment;
  PUBLIC_IMAGE_SOURCE_ORIGIN?: string;
  PUBLIC_IMAGE_TRANSFORM_ORIGIN: string;
  PUBLIC_SITE_RUNTIME: DurableObjectNamespace<PublicSiteRuntime>;
};
export default {
  async fetch(request: Request, env: Bindings, context: ExecutionContext) {
    const path = new URL(request.url).pathname.replace(/^\/blackbox-records(?=\/)/, '');
    if (path === publicInvalidationPath)
      return invalidatePublicPublication(
        request,
        (pointer) =>
          env.PUBLIC_SITE_RUNTIME.getByName('public-v2', { locationHint: 'eeur' }).invalidatePublication(pointer),
        context.cache,
        env.PRODUCT_ENVIRONMENT,
      );
    // Previews and publication validation render the same open pre-orders as public pages.
    if (path === publicPreorderProjectionPath)
      return acceptPublicPreorderProjection(
        request,
        (projection, identity) =>
          Promise.all(
            ['public-v2', 'publication-v2'].map((name) =>
              env.PUBLIC_SITE_RUNTIME.getByName(name, { locationHint: 'eeur' }).setPreorders(projection, identity),
            ),
          ),
        context.cache,
        env.PRODUCT_ENVIRONMENT,
      );
    if (/(?:^|\/)(?:assets|_astro)\//.test(path) || /^\/favicon[^/]*$/.test(path) || path === '/robots.txt')
      return env.ASSETS.fetch(request);
    if (path === '/_image') return context.exports.PublicImageRenderer.fetch(request);
    // The old object held only disposable caches. Publication validation and previews cannot block shopper SSR.
    return env.PUBLIC_SITE_RUNTIME.getByName(path.startsWith('/__publication/') ? 'publication-v2' : 'public-v2', {
      locationHint: 'eeur',
    }).fetch(request);
  },
} satisfies ExportedHandler<Bindings>;

export class PublicImageRenderer extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return this.env.PUBLIC_SITE_RUNTIME.getByName('public-v2', { locationHint: 'eeur' }).fetch(request);
  }
}

export class PublicSiteRuntime extends DurableObject<Bindings> {
  private selection = new PublicSnapshotSelection(
    this.env.MEDIA,
    this.env.PRODUCT_ENVIRONMENT,
    PUBLIC_BOOTSTRAP,
    (work) => this.ctx.waitUntil(work),
  );
  private pages: PublicRenderCache | undefined;
  private openPreorders: PublicPreorderStore | undefined;
  private media = new PublicMedia(this.env.MEDIA, this.env.PRODUCT_ENVIRONMENT, {
    sourceOrigin: this.env.PUBLIC_IMAGE_SOURCE_ORIGIN ?? '',
    transformationOrigin: this.env.PUBLIC_IMAGE_TRANSFORM_ORIGIN,
  });

  private renderCache() {
    return (this.pages ??= new PublicRenderCache(this.ctx.storage.sql));
  }

  // Without a usable stored projection, pages render with no pre-order claims.
  private preorders(): { projection: PublishedPreorders | null; identity: string } {
    try {
      return (
        (this.openPreorders ??= new PublicPreorderStore(this.ctx.storage.sql)).read() ?? {
          projection: null,
          identity: 'none',
        }
      );
    } catch {
      console.warn('Public pre-order projection unavailable');
      return { projection: null, identity: 'none' };
    }
  }

  /** Stores a changed projection; the next request's cache key retires pages rendered from the previous one. */
  async setPreorders(projection: PublishedPreorders, identity: string) {
    return (this.openPreorders ??= new PublicPreorderStore(this.ctx.storage.sql)).write(projection, identity);
  }

  async invalidatePublication(pointer: PublicationPointer) {
    const accepted = publicationPointerSchema.parse(pointer);
    await this.selection.invalidate(accepted);
    try {
      this.renderCache().retain(
        `${PUBLIC_RELEASE_IDENTITY.sha}/${accepted.snapshotSha256}/${this.preorders().identity}/`,
      );
    } catch {
      console.warn('Public render cache unavailable');
    }
  }

  private async render(request: Request, snapshot: ContentSnapshot, preorders: PublishedPreorders | null) {
    const mediaBase = publicMediaBase(new URL(request.url));
    return publishedContext.run({ snapshot, mediaBase, preorders }, async () => {
      const state = new FetchState(request);
      const asset = await cf(state, this.env, this.ctx as unknown as ExecutionContext);
      return asset ?? finalize(state, await astro(state));
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/blackbox-records(?=\/)/, '');
    try {
      if (path === '/__publication/preview' && request.method === 'POST') {
        const input = previewRenderSchema.parse(JSON.parse(await readBoundedText(request.body, 4 * 1024 * 1024)));
        const target = new URL(input.path, url);
        const targetPath = target.pathname.replace(/^\/blackbox-records(?=\/)/, '');
        if (
          target.origin !== url.origin ||
          target.search ||
          /^\/(?:api|_emdash|__publication|content|stock|_image|media|assets)(?:\/|$)/.test(targetPath) ||
          /\/checkout(?:\/|$)/.test(targetPath)
        )
          return new Response('Forbidden', { status: 403 });
        const response = await publishedContext.run(
          {
            snapshot: previewRenderContent(input),
            mediaBase: '',
            images: input.images,
            preorders: this.preorders().projection,
          },
          async () => {
            const state = new FetchState(new Request(target));
            const asset = await cf(state, this.env, this.ctx as unknown as ExecutionContext);
            return asset ?? finalize(state, await astro(state));
          },
        );
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'private, no-store');
        headers.set('X-Release-SHA', PUBLIC_RELEASE_IDENTITY.sha);
        const config = JSON.stringify({
          context: input.context,
          generation: input.generation,
          parentOrigin: input.parentOrigin,
          release: PUBLIC_RELEASE_IDENTITY.sha,
        })
          .replaceAll('&', '&amp;')
          .replaceAll('"', '&quot;')
          .replaceAll('<', '&lt;');
        return new HTMLRewriter()
          .on('head', {
            element(element) {
              element.prepend(`<meta name="blackbox-preview" content="${config}">`, { html: true });
            },
          })
          .on('script[src*="glancelytics.com"], link[rel="preconnect"], link[rel="dns-prefetch"]', {
            element(element) {
              element.remove();
            },
          })
          .transform(
            new Response(response.body ? await readBoundedText(response.body, 4 * 1024 * 1024) : null, {
              status: response.status,
              headers,
            }),
          );
      }
      // Private service-only preparation. The Pages gateway never forwards this namespace.
      if (path === '/__publication/validate' && request.method === 'POST') {
        const pointer = publicationPointerSchema
          .extend({
            records: z
              .array(
                z.object({
                  collection: z.string().refine(isCmsCollection),
                  slug: z.string().min(1).max(256),
                  withdrawnStoreItemSlugs: z
                    .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
                    .max(20)
                    .optional(),
                }),
              )
              .max(20)
              .optional(),
          })
          .parse(JSON.parse(await readBoundedText(request.body, 16384)));
        const snapshot = await readPublishedSnapshot(
          this.env.MEDIA,
          this.env.PRODUCT_ENVIRONMENT,
          pointer.snapshotSha256,
        );
        const paths = [PUBLIC_BASE_PATH];
        const withdrawnPaths = new Set<string>();
        for (const selected of pointer.records ?? []) {
          if (selected.withdrawnStoreItemSlugs) {
            if (
              selected.collection !== 'distro' ||
              snapshot.records.some((record) => record.collection === 'distro' && record.slug === selected.slug) ||
              snapshot.storeItems?.some((item) => item.sourceKind === 'distro' && item.sourceId === selected.slug)
            )
              throw new Error('Withdrawn content is still in the candidate.');
            for (const slug of selected.withdrawnStoreItemSlugs) {
              withdrawnPaths.add(`${PUBLIC_BASE_PATH}store/${encodeURIComponent(slug)}/`);
              withdrawnPaths.add(`${PUBLIC_BASE_PATH}store/${encodeURIComponent(slug)}/checkout/`);
            }
          }
          if (selected && ['artists', 'releases', 'news'].includes(selected.collection)) {
            paths.push(
              `${PUBLIC_BASE_PATH}${selected.collection}/`,
              `${PUBLIC_BASE_PATH}${selected.collection}/${encodeURIComponent(selected.slug)}/`,
              `${PUBLIC_BASE_PATH}app-shell-overlay/${selected.collection}/${encodeURIComponent(selected.slug)}/`,
            );
          } else if (selected && ['about', 'services'].includes(selected.collection))
            paths.push(`${PUBLIC_BASE_PATH}${selected.collection}/`);
          else if (selected && ['distro', 'purchase_information'].includes(selected.collection))
            paths.push(`${PUBLIC_BASE_PATH}store/`);
        }
        for (const path of new Set(paths)) {
          const response = await this.render(new Request(new URL(path, url)), snapshot, this.preorders().projection);
          if (!response.ok) {
            await response.body?.cancel();
            throw new Error('Candidate could not render.');
          }
          await readBoundedText(response.body, 4 * 1024 * 1024);
        }
        for (const path of withdrawnPaths) {
          const response = await this.render(new Request(new URL(path, url)), snapshot, this.preorders().projection);
          await response.body?.cancel();
          if (response.status !== 404) throw new Error('Withdrawn product route is still available.');
        }
        return Response.json({ ...PUBLIC_RELEASE_IDENTITY, snapshotSha256: pointer.snapshotSha256 });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      if (/^\/(?:api|_emdash|__publication|content|stock)(?:\/|$)/.test(path)) return notFound();
      if (path === '/_image') {
        const source = new URL(url.searchParams.get('href') ?? '', url);
        const imagePath = source.pathname.replace(/^\/blackbox-records(?=\/)/, '');
        if (source.origin === url.origin && /^\/(?:_astro|assets)\//.test(imagePath))
          return this.env.ASSETS.fetch(new Request(source, { method: request.method }));
        return this.media.transformed(request, source, () => this.selection.content());
      }
      if (path.startsWith('/media/')) return this.media.media(request, path, () => this.selection.content());
      const { pointer } = await this.selection.selected();
      if (path === '/content-version.json' || path === '/release.json')
        return Response.json(
          {
            ...PUBLIC_RELEASE_IDENTITY,
            publicationMode: 'runtime',
            content: {
              publicationId: pointer.id,
              snapshotSha256: pointer.snapshotSha256,
              ciRunId: pointer.ciRunId ?? 'runtime',
            },
          },
          { headers: { 'Cache-Control': 'no-store', 'X-Content-SHA256': pointer.snapshotSha256 } },
        );
      const preorders = this.preorders();
      const key = `${PUBLIC_RELEASE_IDENTITY.sha}/${pointer.snapshotSha256}/${preorders.identity}/${url.origin}${url.pathname}`;
      // Unversioned Local builds share the zero SHA; retained HTML would reference a previous build's assets.
      const versioned = PUBLIC_RELEASE_IDENTITY.sha !== '0'.repeat(40);
      let cached;
      try {
        if (versioned && !url.search) {
          const pages = this.renderCache();
          pages.retain(`${PUBLIC_RELEASE_IDENTITY.sha}/${pointer.snapshotSha256}/${preorders.identity}/`);
          cached = pages.get(key);
        }
      } catch {
        console.warn('Public render cache unavailable');
      }
      if (cached) {
        // Also tag persisted pages written before tag invalidation was introduced.
        const headers = new Headers(cached.headers);
        headers.set('Cache-Tag', publicPublicationTags(PUBLIC_RELEASE_IDENTITY.sha, pointer.snapshotSha256).join(','));
        return publicCachedPageResponse(request, { ...cached, headers: [...headers] });
      }
      const { snapshot, pointer: selectedPointer } = await this.selection.content();
      // A refresh may have completed while reading the cache; render and identity must use the same snapshot.
      const renderKey = `${PUBLIC_RELEASE_IDENTITY.sha}/${selectedPointer.snapshotSha256}/${preorders.identity}/${url.origin}${url.pathname}`;
      const response = await this.render(new Request(url, { method: 'GET' }), snapshot, preorders.projection);
      const headers = new Headers(response.headers);
      const contentType = headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
      if (contentType !== 'text/html') {
        if (contentType === 'application/json' || response.status !== 200 || url.search || headers.has('Set-Cookie'))
          headers.set('Cache-Control', 'no-store');
        return new Response(request.method === 'HEAD' ? null : response.body, {
          status: response.status,
          headers,
        });
      }
      let cacheable =
        versioned &&
        response.status === 200 &&
        !url.search &&
        !headers.has('Set-Cookie') &&
        !/\b(?:private|no-store)\b/i.test(headers.get('Cache-Control') ?? '');
      // ponytail: 30 s fresh + 30 s stale-while-revalidate keeps edge staleness inside the 60 s publication target.
      headers.set(
        'Cache-Control',
        cacheable ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' : 'no-store',
      );
      headers.set('X-Content-SHA256', selectedPointer.snapshotSha256);
      headers.set('X-Release-SHA', PUBLIC_RELEASE_IDENTITY.sha);
      if (cacheable) {
        headers.set('ETag', await publicPageEtag(renderKey));
        headers.set(
          'Cache-Tag',
          publicPublicationTags(PUBLIC_RELEASE_IDENTITY.sha, selectedPointer.snapshotSha256).join(','),
        );
      }
      const body = await readBoundedText(response.body, 4 * 1024 * 1024);
      // Activation or a pushed projection can retire this render while its body is being read, after the edge purge.
      if (
        cacheable &&
        ((await this.selection.selected()).pointer.snapshotSha256 !== selectedPointer.snapshotSha256 ||
          this.preorders().identity !== preorders.identity)
      ) {
        cacheable = false;
        headers.set('Cache-Control', 'no-store');
        for (const header of ['ETag', 'Last-Modified', 'Cache-Tag']) headers.delete(header);
      }
      // ponytail: retain bounded buffering so render/read failures still return 503 before any response is sent.
      try {
        if (cacheable) this.renderCache().put(renderKey, { body, status: response.status, headers: [...headers] });
      } catch {
        console.warn('Public render cache unavailable');
      }
      if (cacheable && publicPageNotModified(request, headers.get('ETag')!))
        return new Response(null, { status: 304, headers });
      return new Response(request.method === 'HEAD' ? null : body, { status: response.status, headers });
    } catch (error) {
      console.error('Public render failed', error instanceof Error ? error.message : 'Unknown error');
      return new Response('The site is temporarily unavailable. Please try again.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' },
      });
    }
  }
}
