import { DurableObject, WorkerEntrypoint } from 'cloudflare:workers';
import { astro, FetchState } from 'astro/fetch';
import { cf, finalize } from '@astrojs/cloudflare/fetch';
import { isCmsCollection, type ContentSnapshot } from '@blackbox/content-model';
import { z } from 'zod';
import { publishedContext } from './published-reader';
import { readBoundedText } from './preview-content';
import { previewRenderContent, previewRenderSchema } from './preview-render-contract';
import {
  publicationPointerSchema,
  readPublicationPointer,
  readPublishedSnapshot,
  type PublicationPointer,
  type PublicationEnvironment,
} from './published-storage';
import { deliverPublicCmsImage } from './public-image-transform';

declare const PUBLIC_RELEASE_IDENTITY: { sha: string; runId: string; runNumber: number };
declare const PUBLIC_BOOTSTRAP: PublicationPointer | null;
declare const PUBLIC_BASE_PATH: string;
type Bindings = {
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  PRODUCT_ENVIRONMENT: PublicationEnvironment;
  PUBLIC_IMAGE_TRANSFORM_ORIGIN: string;
  PUBLIC_SITE_RUNTIME: DurableObjectNamespace<PublicSiteRuntime>;
};

export default {
  async fetch(request: Request, env: Bindings, context: ExecutionContext) {
    const path = new URL(request.url).pathname.replace(/^\/blackbox-records(?=\/)/, '');
    if (/(?:^|\/)(?:assets|_astro)\//.test(path)) return env.ASSETS.fetch(request);
    if (path === '/_image') return context.exports.PublicImageRenderer.fetch(request);
    return env.PUBLIC_SITE_RUNTIME.getByName('public').fetch(request);
  },
} satisfies ExportedHandler<Bindings>;

export class PublicImageRenderer extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    return this.env.PUBLIC_SITE_RUNTIME.getByName('public').fetch(request);
  }
}

export class PublicSiteRuntime extends DurableObject<Bindings> {
  private current: { pointer: PublicationPointer; snapshot: ContentSnapshot; checkedAt: number } | undefined;
  private pages = new Map<string, { body: string; headers: [string, string][]; status: number }>();
  private pageBytes = 0;

  private async selected() {
    if (this.current && Date.now() - this.current.checkedAt < 5000) return this.current;
    let stored;
    try {
      stored = await readPublicationPointer(this.env.MEDIA, this.env.PRODUCT_ENVIRONMENT);
    } catch (error) {
      if (!this.current) throw error;
      this.current.checkedAt = Date.now();
      return this.current;
    }
    const pointer = stored?.pointer ?? PUBLIC_BOOTSTRAP;
    if (!pointer) throw new Error('No accepted publication.');
    const snapshot =
      this.current?.pointer.snapshotSha256 === pointer.snapshotSha256
        ? this.current.snapshot
        : await readPublishedSnapshot(this.env.MEDIA, this.env.PRODUCT_ENVIRONMENT, pointer.snapshotSha256);
    if (this.current?.pointer.snapshotSha256 !== pointer.snapshotSha256) {
      this.pages.clear();
      this.pageBytes = 0;
    }
    return (this.current = { pointer, snapshot, checkedAt: Date.now() });
  }

  private async render(request: Request, pointer: PublicationPointer, snapshot: ContentSnapshot) {
    const base = new URL(request.url).pathname.startsWith('/blackbox-records/') ? '/blackbox-records' : '';
    return publishedContext.run(
      { snapshot, mediaBase: `${base}/media/content/${pointer.snapshotSha256}` },
      async () => {
        const state = new FetchState(request);
        const asset = await cf(state, this.env, this.ctx as unknown as ExecutionContext);
        return asset ?? finalize(state, await astro(state));
      },
    );
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
          { snapshot: previewRenderContent(input), mediaBase: '', images: input.images },
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
              .array(z.object({ collection: z.string().refine(isCmsCollection), slug: z.string().min(1).max(256) }))
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
        for (const selected of pointer.records ?? []) {
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
          const response = await this.render(new Request(new URL(path, url)), pointer, snapshot);
          if (!response.ok) {
            await response.body?.cancel();
            throw new Error('Candidate could not render.');
          }
          await readBoundedText(response.body, 4 * 1024 * 1024);
        }
        return Response.json({ ...PUBLIC_RELEASE_IDENTITY, snapshotSha256: pointer.snapshotSha256 });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      if (/^\/(?:api|_emdash|__publication|content|stock)(?:\/|$)/.test(path))
        return new Response('Not found', { status: 404 });
      if (path === '/_image') {
        const source = new URL(url.searchParams.get('href') ?? '', url);
        const imagePath = source.pathname.replace(/^\/blackbox-records(?=\/)/, '');
        const publicMedia = /^\/media\/content\/[a-f0-9]{64}\/[a-f0-9]{64}$/.test(imagePath);
        const staticAsset = /^\/(?:_astro|assets)\//.test(imagePath);
        if (
          source.origin !== url.origin ||
          (!publicMedia && !staticAsset) ||
          (publicMedia && (source.search || source.hash))
        )
          return new Response('Not found', { status: 404 });
        const original = new Request(source, { method: request.method });
        return publicMedia
          ? deliverPublicCmsImage(
              request,
              source,
              this.env.PRODUCT_ENVIRONMENT,
              this.env.PUBLIC_IMAGE_TRANSFORM_ORIGIN,
              () => this.fetch(original),
            )
          : this.env.ASSETS.fetch(original);
      }
      const { pointer, snapshot } = await this.selected();
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
      const media = /^\/media\/content\/([a-f0-9]{64})\/([a-f0-9]{64})$/.exec(path);
      if (media) {
        const accepted =
          media[1] === pointer.snapshotSha256 ||
          (await this.env.MEDIA.head(`snapshots/${this.env.PRODUCT_ENVIRONMENT}/accepted/${media[1]}`));
        if (!accepted) return new Response('Not found', { status: 404 });
        const manifest =
          media[1] === pointer.snapshotSha256
            ? snapshot
            : await readPublishedSnapshot(this.env.MEDIA, this.env.PRODUCT_ENVIRONMENT, media[1]);
        const item = manifest.media.find((item) => item.sha256 === media[2]);
        if (!item) return new Response('Not found', { status: 404 });
        const object = await this.env.MEDIA.get(`snapshots/${this.env.PRODUCT_ENVIRONMENT}/media/${item.sha256}`);
        if (!object || object.size !== item.size || object.checksums.toJSON().sha256 !== item.sha256) {
          await object?.body.cancel();
          throw new Error('Published media unavailable.');
        }
        if (request.method === 'HEAD') await object.body.cancel();
        return new Response(request.method === 'HEAD' ? null : object.body, {
          headers: {
            'Content-Type': item.mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      const key = `${PUBLIC_RELEASE_IDENTITY.sha}/${pointer.snapshotSha256}/${url.pathname}`;
      const cached = this.pages.get(key);
      if (cached)
        return new Response(request.method === 'HEAD' ? null : cached.body, {
          status: cached.status,
          headers: cached.headers,
        });
      const response = await this.render(new Request(url, { method: 'GET' }), pointer, snapshot);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Content-SHA256', pointer.snapshotSha256);
      headers.set('X-Release-SHA', PUBLIC_RELEASE_IDENTITY.sha);
      const body = await readBoundedText(response.body, 4 * 1024 * 1024);
      // ponytail: bounded whole-page cache; use an edge cache if measured public traffic needs it.
      if (response.ok && body.length <= 2 * 1024 * 1024) {
        if (this.pages.size >= 64 || this.pageBytes + body.length * 2 > 8 * 1024 * 1024) {
          this.pages.clear();
          this.pageBytes = 0;
        }
        this.pages.set(key, { body, status: response.status, headers: [...headers] });
        this.pageBytes += body.length * 2;
      }
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
