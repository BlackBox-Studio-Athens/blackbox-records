import { astro, FetchState } from 'astro/fetch';
import { cf, finalize } from '@astrojs/cloudflare/fetch';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../env';
import { authenticate } from './auth';
import { isCmsCollection, validateCmsDraft, validateCmsRevisionContent } from '@blackbox/content-model';
import { readStaffWorkspace } from './staff-workspace';
import { readInventoryArtwork } from './inventory-artwork';
import { prepareCatalogSchema } from './catalog-schema';
import { createBindingLogger } from '../observability';
import { previewPolicy } from './preview-policy';
import { previewDiagnosticsPath, reportPreviewFailure } from './preview-diagnostics';

import { handleLocalPublicationRequest, localPublicationRoot } from './local-publication-routes';
import { DurableObject } from 'cloudflare:workers';
import { CommerceRuntime } from '../index';
import { isSupportedCmsApiRequest, isCmsTokenExportRead } from '../middleware';
import {
  handlePublicationRequest,
  handlePublicationWorkflow,
  publicationWorkflowPaths,
  publicationCatalogPath,
} from './publication-routes';
import { dispatchPendingPublication, reconcilePendingPublication } from './publication-dispatch';
import {
  acceptSelectedPublication,
  InvalidPublication,
  processRuntimePublication,
  selectedPublicationSchema,
} from './runtime-publication';
import { handleItemArtwork, itemArtworkPath, publishedMediaPath, servePublishedMedia } from './item-artwork';
import { reconcileItemPublications, guardItemLifecycle, readPublicationCatalog } from './item-publication-recovery';
import {
  createPreviewContext,
  previewContext,
  previewInputSchema,
  previewPath,
  readBoundedText,
} from './preview-content';

export { CommerceRuntime };

declare const RELEASE_SOURCE_SHA: string;

type CmsBindings = Omit<AppBindings, 'CMS_RUNTIME'> & {
  CMS_DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  CMS_RUNTIME: DurableObjectNamespace<CmsRuntime>;
  COMMERCE_RUNTIME: DurableObjectNamespace<CommerceRuntime>;
  CMS_HOSTNAME?: string;
  CMS_PUBLICATION_EXPORT_TOKEN?: string;
  CMS_PUBLICATION_GITHUB_TOKEN?: string;
  CONTENT_PUBLICATION_MODE?: string;
  PUBLIC_SITE?: Fetcher;
};

export default {
  async scheduled(controller: ScheduledController, bindings: CmsBindings) {
    const results = await Promise.allSettled([
      import('../index').then(({ default: commerce }) => commerce.scheduled(controller, bindings)),
      Promise.resolve().then(() => bindings.CMS_RUNTIME.getByName('editorial').runMaintenance()),
      ...(bindings.CMS_PUBLICATION_GITHUB_TOKEN && bindings.CMS_PUBLICATION_EXPORT_TOKEN
        ? [
            Promise.resolve().then(async () => {
              await bindings.CMS_RUNTIME.getByName('editorial').dispatchPublication();
            }),
          ]
        : []),
    ]);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length)
      throw new AggregateError(
        failures.map((result) => result.reason),
        'Scheduled work failed',
      );
  },
  async fetch(request: Request, bindings: CmsBindings, _context: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(publishedMediaPath))
      return servePublishedMedia(request, bindings.MEDIA, productEnvironmentProfileFromBindings(bindings));
    if (request.headers.get('Authorization')?.startsWith('Bearer ec_pat_') && !isCmsTokenExportRead(request))
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/internal/')) {
      return bindings.COMMERCE_RUNTIME.getByName('store').fetch(request);
    }
    try {
      // Staff and workflow credentials are verified inside the CMS object before private responses.
      if (bindings.PRODUCT_ENVIRONMENT === 'LOCAL') {
        if (!publicationWorkflowPaths.has(url.pathname) && !isCmsTokenExportRead(request)) await authenticate(request);
      } else if (url.hostname !== bindings.CMS_HOSTNAME) throw new Error('Unauthorized hostname');
    } catch {
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (url.pathname.startsWith('/api/internal/')) {
      return bindings.COMMERCE_RUNTIME.getByName('store').fetch(request);
    }
    return bindings.CMS_RUNTIME.getByName('editorial').fetch(request);
  },
} satisfies ExportedHandler<CmsBindings>;

// ponytail: one editorial site per object; split by site only if we host more sites.
export class CmsRuntime extends DurableObject<CmsBindings> {
  private publicationTask: Promise<void> | undefined;

  async alarm() {
    await this.processPublications();
  }

  private async processPublications() {
    if (this.env.CONTENT_PUBLICATION_MODE !== 'runtime' || !this.env.PUBLIC_SITE) return;
    if (this.publicationTask) return this.publicationTask;
    this.publicationTask = (async () => {
      // Arm before processing: eviction or a lost response cannot discard pending work.
      await this.ctx.storage.setAlarm(Date.now() + 5000);
      const { withEmDashRuntime } = await import('emdash/middleware');
      const environment = productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget;
      const processed = await withEmDashRuntime((runtime) =>
        processRuntimePublication({
          db: this.env.CMS_DB,
          bucket: this.env.MEDIA,
          commerce: this.env.COMMERCE_DB,
          environment,
          renderer: this.env.PUBLIC_SITE!,
          runtime,
          publicOrigin:
            environment === 'local'
              ? 'http://127.0.0.1:4321/blackbox-records/'
              : `https://blackbox-records-web${environment === 'uat' ? '-uat' : ''}.pages.dev`,
        }),
      );
      if (typeof processed === 'boolean')
        await reconcileItemPublications(this.env.COMMERCE_DB, this.env.CMS_DB, environment);
      if (!processed) await this.ctx.storage.deleteAlarm();
      else if (typeof processed === 'number') await this.ctx.storage.setAlarm(Date.now() + processed);
    })().finally(() => {
      this.publicationTask = undefined;
    });
    return this.publicationTask;
  }
  // Published context only; unsaved drafts live exclusively in the request-scoped reader.
  private previewReads = new Map<string, { expires: number; value: unknown; size: number }>();
  private previewCacheBytes = 0;
  private diagnosticLimits = new Map<string, { count: number; expires: number }>();

  private async preview(request: Request, role: number): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const release = typeof RELEASE_SOURCE_SHA === 'undefined' ? 'local' : RELEASE_SOURCE_SHA;
    const started = performance.now();
    const rawGeneration = request.headers.get('X-Preview-Generation');
    const generation = rawGeneration && /^(0|[1-9][0-9]{0,8})$/.test(rawGeneration) ? Number(rawGeneration) : undefined;
    const logger = createBindingLogger(this.env, {
      requestId,
      release,
      ...(generation !== undefined ? { generation } : {}),
    });
    const headers = {
      'X-Preview-Request-Id': requestId,
      'X-Release-SHA': release,
      ...(generation !== undefined ? { 'X-Preview-Generation': String(generation) } : {}),
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      Vary: 'Cookie, Cf-Access-Jwt-Assertion',
    };
    if (
      request.method !== 'POST' ||
      role < 30 ||
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('X-EmDash-Request') !== '1' ||
      [...url.searchParams.keys()].some((key) => key !== 'view') ||
      !['detail', 'listing'].includes(url.searchParams.get('view') ?? 'detail')
    ) {
      if (request.body) await readBoundedText(request.body, 256 * 1024).catch(() => {});
      return new Response('Forbidden', { status: 403, headers });
    }
    let reads = 0;
    let cacheMisses = 0;
    let stage = 'validation';
    try {
      const input = previewInputSchema.parse(JSON.parse(await readBoundedText(request.body, 256 * 1024)));
      stage = 'content';
      const context = await createPreviewContext(
        input,
        this.env.PRODUCT_ENVIRONMENT?.toLowerCase() ?? 'local',
        async (path) => {
          if (++reads > 512) throw new Error('Preview context exceeds its read budget.');
          // Current record identity is always checked afresh; only surrounding published reads are reused.
          const cached = this.previewReads.get(path);
          if (cached && cached.expires > Date.now() && path !== `content/${input.collection}/${input.id}`)
            return cached.value;
          cacheMisses++;
          const readHeaders = new Headers(request.headers);
          readHeaders.delete('Content-Type');
          readHeaders.delete('Content-Length');
          const response = await this.fetch(
            new Request(new URL(`/_emdash/api/${path}`, url), { headers: readHeaders }),
          );
          if (!response.ok)
            throw new Error(
              [401, 403].includes(response.status)
                ? 'Sign in again to preview.'
                : 'Content or image could not be loaded. Check linked content and refresh preview.',
            );
          const serialized = await readBoundedText(response.body, 2 * 1024 * 1024);
          const result = JSON.parse(serialized) as {
            success: boolean;
            data: unknown;
          };
          if (!result.success) throw new Error('Published content is unavailable.');
          const size = serialized.length * 2;
          this.previewCacheBytes -= this.previewReads.get(path)?.size ?? 0;
          if (this.previewReads.size >= 512 || this.previewCacheBytes + size > 8 * 1024 * 1024) {
            this.previewReads.clear();
            this.previewCacheBytes = 0;
          }
          this.previewReads.set(path, { expires: Date.now() + 30_000, value: result.data, size });
          this.previewCacheBytes += size;
          return result.data;
        },
      );
      stage = 'render';
      const html = await previewContext.run(context, async () => {
        const state = new FetchState(request);
        const asset = await cf(state, this.env, this.ctx as unknown as ExecutionContext);
        const rendered = asset ?? finalize(state, await astro(state));
        if (!rendered.ok) {
          await rendered.body?.cancel();
          throw new Error(`Preview could not render (${rendered.status}). Check required fields and linked content.`);
        }
        return readBoundedText(rendered.body, 4 * 1024 * 1024);
      });
      stage = 'assets';
      const policy = previewPolicy(url.origin);
      const output = new HTMLRewriter()
        .on('html', {
          element(element) {
            // Public catalog markup already contains the initial coverflow positions.
            element.setAttribute('data-store-coverflow-capable', '');
          },
        })
        .on('img', {
          element(element) {
            element.setAttribute('loading', 'eager');
            const src = new URL(element.getAttribute('src') ?? '', url);
            // Preview keeps the public dimensions/crop and serves the original through protected media access.
            if (src.origin === url.origin && src.pathname === '/_image') {
              const original = src.searchParams.get('href') ?? '';
              if (/^\/(?:_astro\/|_emdash\/api\/media\/file\/)/.test(original)) {
                element.setAttribute('src', original);
                element.removeAttribute('srcset');
              }
            }
          },
        })
        .on(
          'script, iframe, object, embed, template, noscript, link[rel="modulepreload"], link[rel="prefetch"], meta[http-equiv="refresh"]',
          {
            element(element) {
              element.remove();
            },
          },
        )
        .on('link[rel="preload"][as="style"]', {
          element(element) {
            element.setAttribute('rel', 'stylesheet');
            element.removeAttribute('onload');
          },
        })
        .on('a, button, input, select, textarea, summary, [role="button"]', {
          element(element) {
            element.setAttribute('inert', '');
            element.setAttribute('tabindex', '-1');
            if (element.tagName === 'a') {
              element.removeAttribute('href');
              element.removeAttribute('target');
            }
          },
        })
        .on('head', {
          element(element) {
            element.prepend(
              `<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="robots" content="noindex,nofollow">`,
              { html: true },
            );
          },
        })
        .transform(
          new Response(html, {
            headers: {
              ...headers,
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Security-Policy': `${policy}; sandbox allow-same-origin; frame-ancestors 'self'`,
              'X-Preview-Environment': context.environment,
              'X-Preview-Reads': String(reads),
              'X-Preview-Cache-Misses': String(cacheMisses),
            },
          }),
        );
      // Consume the rewrite before logging success so streaming failures are included.
      const body = await readBoundedText(output.body, 4 * 1024 * 1024);
      logger.info({
        event: 'preview_render',
        outcome: 'success',
        durationMs: Math.round(performance.now() - started),
        view: url.searchParams.get('view') ?? 'detail',
        reads,
        cacheMisses,
      });
      return new Response(body, { headers: output.headers });
    } catch (error) {
      logger.warn({
        event: 'preview_render',
        outcome: 'failure',
        stage,
        durationMs: Math.round(performance.now() - started),
        view: url.searchParams.get('view') ?? 'detail',
        reads,
        cacheMisses,
        safeReason: error instanceof Error ? error.name : 'unknown',
      });
      const message = error instanceof Error ? error.message : 'Preview could not update.';
      return Response.json({ error: message.slice(0, 1000) }, { status: 422, headers });
    }
  }

  async dispatchPublication() {
    if (this.env.CONTENT_PUBLICATION_MODE === 'runtime') {
      await this.processPublications();
      return { status: 'runtime' as const };
    }
    if (!/^[a-f0-9]{64}$/.test(this.env.CMS_PUBLICATION_EXPORT_TOKEN ?? '')) return { status: 'disabled' as const };
    await reconcilePendingPublication({
      db: this.env.CMS_DB,
      bucket: this.env.MEDIA,
      environment: this.env.PRODUCT_ENVIRONMENT?.toLowerCase(),
      hostname: this.env.CMS_HOSTNAME,
      token: this.env.CMS_PUBLICATION_EXPORT_TOKEN,
      githubToken: this.env.CMS_PUBLICATION_GITHUB_TOKEN,
    });
    return dispatchPendingPublication(
      this.env.CMS_DB,
      this.env.PRODUCT_ENVIRONMENT?.toLowerCase(),
      this.env.CMS_PUBLICATION_GITHUB_TOKEN,
    );
  }

  async runMaintenance() {
    if (!(await this.isInitialized())) throw new Error('CMS requires explicit initialization');
    const { runScheduledTasks } = await import('emdash/middleware');
    await runScheduledTasks();
    if (this.env.CONTENT_PUBLICATION_MODE === 'runtime') await this.processPublications();
    await reconcileItemPublications(
      this.env.COMMERCE_DB,
      this.env.CMS_DB,
      productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget,
    );
  }

  async fetch(request: Request): Promise<Response> {
    const bindings = this.env;
    const url = new URL(request.url);
    if (
      publicationWorkflowPaths.has(url.pathname) &&
      !(url.pathname === publicationCatalogPath && bindings.PRODUCT_ENVIRONMENT === 'LOCAL')
    )
      return handlePublicationWorkflow(request, {
        db: bindings.CMS_DB,
        commerce: bindings.COMMERCE_DB,
        bucket: bindings.MEDIA,
        environment: bindings.PRODUCT_ENVIRONMENT?.toLowerCase(),
        hostname: bindings.CMS_HOSTNAME,
        token: bindings.CMS_PUBLICATION_EXPORT_TOKEN,
      });
    const exportRead = isCmsTokenExportRead(request);
    if (
      exportRead &&
      (bindings.PRODUCT_ENVIRONMENT === 'LOCAL'
        ? !['127.0.0.1', 'localhost'].includes(url.hostname)
        : url.protocol !== 'https:' || url.hostname !== bindings.CMS_HOSTNAME)
    )
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    if (request.headers.get('Authorization')?.startsWith('Bearer ec_pat_') && !exportRead)
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    let identity: Awaited<ReturnType<typeof authenticate>> | undefined;
    try {
      if (!exportRead) identity = await authenticate(request);
    } catch {
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (url.pathname === previewPath) return this.preview(request, identity?.role ?? 0);
    if (url.pathname === '/_emdash/api/blackbox/catalog-schema') {
      if (
        identity?.role !== 50 ||
        request.method !== 'POST' ||
        request.headers.get('Origin') !== url.origin ||
        request.headers.get('X-EmDash-Request') !== '1'
      )
        return new Response('Forbidden', { status: 403 });
      const { withEmDashRuntime } = await import('emdash/middleware');
      return withEmDashRuntime(prepareCatalogSchema);
    }
    if (['/_emdash/api/blackbox/workspace', '/_emdash/api/blackbox/inventory-artwork'].includes(url.pathname)) {
      if (!identity || identity.role < 30 || request.method !== 'GET')
        return new Response('Forbidden', { status: 403 });
      try {
        const { withEmDashRuntime } = await import('emdash/middleware');
        if (url.pathname.endsWith('/inventory-artwork'))
          return await withEmDashRuntime((runtime) => readInventoryArtwork(request, runtime));
        return await withEmDashRuntime((runtime) =>
          readStaffWorkspace(request, {
            runtime,
            db: bindings.CMS_DB,
            commerce: bindings.COMMERCE_DB,
            bucket: bindings.MEDIA,
            environment: productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
          }),
        );
      } catch {
        return Response.json(
          { success: false, error: { message: 'The workspace could not be loaded. Retry.' } },
          { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
        );
      }
    }
    if (url.pathname === '/_emdash/api/blackbox/content-publications') {
      if (
        !identity ||
        identity.role < 30 ||
        request.method !== 'POST' ||
        url.search ||
        request.headers.get('Origin') !== url.origin ||
        request.headers.get('X-EmDash-Request') !== '1'
      )
        return new Response('Forbidden', { status: 403 });
      if (bindings.CONTENT_PUBLICATION_MODE !== 'runtime' || !bindings.PUBLIC_SITE)
        return Response.json({ error: 'PUBLICATION_UNAVAILABLE' }, { status: 503 });
      try {
        const input = selectedPublicationSchema.parse(JSON.parse(await readBoundedText(request.body, 16384)));
        // This path publishes editorial revisions only. Commerce availability and its
        // native lifecycle guard remain owned by the separate Selling operation.
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        const { withEmDashRuntime } = await import('emdash/middleware');
        const accepted = await withEmDashRuntime((runtime) =>
          acceptSelectedPublication(input, identity.email, {
            runtime,
            db: bindings.CMS_DB,
            environment: productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
          }),
        );
        this.ctx.waitUntil(this.processPublications().finally(() => this.ctx.storage.setAlarm(Date.now() + 1000)));
        return Response.json(accepted, { status: 202, headers: { 'Cache-Control': 'private, no-store' } });
      } catch (error) {
        return Response.json(
          { error: 'PUBLICATION_UNAVAILABLE' },
          {
            status: error instanceof InvalidPublication ? 409 : 503,
            headers: { 'Cache-Control': 'private, no-store' },
          },
        );
      }
    }
    const mutation = /^\/_emdash\/api\/content\/([a-z_]+)\/([A-Za-z0-9_-]+)(?:\/|$)/.exec(url.pathname);
    if (bindings.CONTENT_PUBLICATION_MODE === 'runtime' && mutation && !['GET', 'HEAD'].includes(request.method)) {
      let pending;
      try {
        pending = await bindings.CMS_DB.prepare(
          "SELECT id FROM _blackbox_publications WHERE status = 'pending' AND EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(request_json, '$.records') = 'array' THEN json_extract(request_json, '$.records') ELSE json_array(json(request_json)) END) WHERE json_extract(value, '$.collection') = ? AND json_extract(value, '$.recordId') = ?) LIMIT 1",
        )
          .bind(mutation[1], mutation[2])
          .first();
      } catch {
        return Response.json(
          { error: 'PUBLICATION_STATUS_UNAVAILABLE' },
          { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
        );
      }
      if (pending)
        return Response.json(
          { error: 'PUBLICATION_IN_PROGRESS' },
          { status: 409, headers: { 'Cache-Control': 'private, no-store' } },
        );
    }
    if (url.pathname === previewDiagnosticsPath && identity)
      return reportPreviewFailure(request, identity, this.diagnosticLimits, createBindingLogger(this.env));
    if (url.pathname.startsWith(localPublicationRoot)) {
      if (!identity) return new Response('Forbidden', { status: 403 });
      return handleLocalPublicationRequest(request, {
        db: bindings.CMS_DB,
        environment: bindings.PRODUCT_ENVIRONMENT?.toLowerCase(),
        identity,
      });
    }
    if (url.pathname === publicationCatalogPath) {
      if (!identity || identity.role < 30 || request.method !== 'GET' || url.search)
        return new Response('Forbidden', { status: 403 });
      return Response.json(
        { data: await readPublicationCatalog(bindings.COMMERCE_DB) },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    if (url.pathname === '/_emdash/api/blackbox/item-publications/reconcile') {
      if (
        !identity ||
        identity.role < 30 ||
        request.method !== 'POST' ||
        url.search ||
        request.headers.get('Origin') !== url.origin ||
        request.headers.get('X-EmDash-Request') !== '1'
      )
        return new Response('Forbidden', { status: 403 });
      await reconcileItemPublications(
        bindings.COMMERCE_DB,
        bindings.CMS_DB,
        productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
      );
      return Response.json({ status: 'checked' }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (url.pathname.startsWith('/_emdash/api/blackbox/publications') || url.pathname === itemArtworkPath) {
      if (!identity) return new Response('Forbidden', { status: 403 });
      const environment = bindings.PRODUCT_ENVIRONMENT?.toLowerCase();
      if (environment !== 'local' && environment !== 'uat' && environment !== 'prd')
        return new Response('Unavailable', { status: 503 });
      const context: Parameters<typeof handlePublicationRequest>[1] = {
        db: bindings.CMS_DB,
        environment,
        identity,
        onAccepted: () => {
          if (bindings.CONTENT_PUBLICATION_MODE === 'runtime') {
            this.ctx.waitUntil(this.processPublications().finally(() => this.ctx.storage.setAlarm(Date.now() + 1000)));
            return;
          }
          if (environment === 'local' || !bindings.CMS_PUBLICATION_EXPORT_TOKEN) return;
          this.ctx.waitUntil(
            dispatchPendingPublication(bindings.CMS_DB, environment, bindings.CMS_PUBLICATION_GITHUB_TOKEN)
              .then((result) => {
                createBindingLogger(bindings).info({ event: 'publication_dispatch', ...result });
              })
              .catch(() => {
                createBindingLogger(bindings).warn({ event: 'publication_dispatch_failed' });
              }),
          );
        },
        fetchCms: (path: string): Promise<Response> => {
          const headers = new Headers(request.headers);
          headers.delete('Content-Length');
          headers.delete('Content-Type');
          return this.fetch(new Request(new URL(path, url), { headers }));
        },
      };
      if (bindings.CONTENT_PUBLICATION_MODE === 'runtime' && request.method === 'POST')
        await this.ctx.storage.setAlarm(Date.now() + 1000);
      return url.pathname === itemArtworkPath
        ? handleItemArtwork(request, {
            ...context,
            bucket: bindings.MEDIA,
            profile: productEnvironmentProfileFromBindings(bindings),
          })
        : handlePublicationRequest(request, context);
    }
    if (!url.pathname.startsWith('/_emdash/') && ['GET', 'HEAD'].includes(request.method)) {
      const response = await bindings.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      return new Response(response.body, { status: response.status, headers });
    }
    // Staff uses the supported REST contract; alternate writers and setup remain unavailable.
    if (!isSupportedCmsApiRequest(request)) {
      await request.body?.pipeTo(new WritableStream());
      return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (url.pathname.startsWith('/_emdash/api/admin/api-tokens')) {
      if (identity?.role !== 50) return new Response('Forbidden', { status: 403 });
      if (request.method === 'POST') {
        const body = (await request
          .clone()
          .json()
          .catch(() => null)) as { scopes?: unknown } | null;
        if (
          !body ||
          !Array.isArray(body.scopes) ||
          body.scopes.length !== 2 ||
          !body.scopes.includes('content:read') ||
          !body.scopes.includes('media:read')
        )
          return Response.json({ error: { code: 'EXPORT_READ_SCOPES_REQUIRED' } }, { status: 400 });
      }
    }
    if (!(await this.isInitialized())) {
      return Response.json({ error: { code: 'CMS_NOT_INITIALIZED' } }, { status: 503 });
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      const origin = request.headers.get('Origin');
      if ((origin && origin !== url.origin) || request.headers.get('X-EmDash-Request') !== '1') {
        return new Response('Forbidden', { status: 403 });
      }
      const editorialWrite = /^\/_emdash\/api\/content\/([a-z_]+)(?:\/([A-Za-z0-9_-]+))?$/.exec(url.pathname);
      if (editorialWrite && ['POST', 'PUT'].includes(request.method)) {
        try {
          const raw = await readBoundedText(request.body, 272 * 1024);
          request = new Request(request, { body: raw });
          const payload = JSON.parse(raw) as { data?: unknown };
          if (
            !isCmsCollection(editorialWrite[1]) ||
            !payload.data ||
            typeof payload.data !== 'object' ||
            Array.isArray(payload.data)
          )
            throw new Error('Invalid draft.');
          const issues = validateCmsDraft(editorialWrite[1], payload.data as Record<string, unknown>);
          if (issues.length)
            return Response.json(
              { success: false, error: { message: issues.join('\n') } },
              { status: 422, headers: { 'Cache-Control': 'private, no-store' } },
            );
        } catch {
          return Response.json(
            { success: false, error: { message: 'Invalid or oversized draft.' } },
            { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
          );
        }
      }
      if (identity && identity.role >= 30) {
        const publishing = /^\/_emdash\/api\/content\/([a-z_]+)\/([A-Za-z0-9_-]+)\/publish$/.exec(url.pathname);
        if (publishing && request.method === 'POST') {
          const raw = await readBoundedText(request.body, 16384);
          request = new Request(request, { body: raw });
          const { withEmDashRuntime } = await import('emdash/middleware');
          const valid = await withEmDashRuntime(async (runtime) => {
            const current = await runtime.handleContentGet(publishing[1], publishing[2]);
            if (!current.success || !isCmsCollection(publishing[1])) return false;
            return validateCmsRevisionContent(publishing[1], current.data.item.data).length === 0;
          });
          if (!valid)
            return Response.json(
              { success: false, error: { message: 'Complete the highlighted fields before publishing.' } },
              { status: 422 },
            );
        }
        const lifecycle = await guardItemLifecycle(request, bindings.COMMERCE_DB, (path) => {
          const headers = new Headers(request.headers);
          headers.delete('Content-Length');
          headers.delete('Content-Type');
          return this.fetch(new Request(new URL(path, url), { headers }));
        });
        if (lifecycle) return lifecycle;
      }
      if (url.pathname.startsWith('/_emdash/api/media')) {
        if (url.pathname.replace(/\/+$/, '') !== '/_emdash/api/media' || request.method !== 'POST') {
          await request.body?.pipeTo(new WritableStream());
          return Response.json({ error: { code: 'UNSUPPORTED_MEDIA_ACTION' } }, { status: 405 });
        }
        const { validateImageUpload } = await import('./media-upload');
        const upload = await validateImageUpload(request);
        if (upload) return upload;
      }
      if (request.method === 'PUT' && /^\/_emdash\/api\/content\/[^/]+\/[^/]+$/.test(url.pathname)) {
        const body = (await request
          .clone()
          .json()
          .catch(() => null)) as Record<string, unknown> | null;
        // Metadata uses another upstream write path; only revision-backed saves are proven here.
        if (
          !body ||
          typeof body._rev !== 'string' ||
          !body._rev.trim() ||
          !body.data ||
          typeof body.data !== 'object' ||
          Array.isArray(body.data) ||
          Object.keys(body).some((key) => !['_rev', 'data', 'slug', 'skipRevision'].includes(key))
        ) {
          return Response.json({ error: { code: 'INVALID_EDITORIAL_SAVE' } }, { status: 400 });
        }
      }
    }
    const state = new FetchState(request);
    // Astro only consumes waitUntil here; DurableObjectState provides that lifecycle hook.
    const asset = await cf(state, bindings, this.ctx as unknown as ExecutionContext);
    const response = asset ?? finalize(state, await astro(state));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  private async isInitialized() {
    if (this.env.PRODUCT_ENVIRONMENT === 'LOCAL') return true;
    try {
      // Hosted requests never bootstrap or reseed an empty CMS. Deployment owns initialization.
      const row = await this.env.CMS_DB.prepare('SELECT 1 AS initialized FROM _emdash_collections LIMIT 1').first<{
        initialized: number;
      }>();
      return row?.initialized === 1;
    } catch {
      return false;
    }
  }
}
