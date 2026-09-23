import { astro, FetchState } from 'astro/fetch';
import { cf, finalize } from '@astrojs/cloudflare/fetch';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../env';
import { authenticate } from './auth';
import {
  contentMediaIds,
  isCmsCollection,
  validateCmsDraft,
  validateCmsRevisionContent,
} from '@blackbox/content-model';
import { readStaffWorkspace, type StaffSnapshotCache } from './staff-workspace';
import { staffAssetResponse } from './staff-assets';
import { readInventoryArtwork } from './inventory-artwork';
import { prepareCatalogSchema } from './catalog-schema';
import { createBindingLogger } from '../observability';
import { authenticatePreview, isPreviewHost, previewOrigin } from './preview-host';
import {
  ownedPreviewContext,
  pruneStoredPreviewContexts,
  releasePreviewContext,
  retainPreviewContext,
  type RetainedPreview,
} from './preview-contexts';
import { previewDestination, selectPreviewContent } from './preview-selection';
import { privatePreviewHeaders, renderPreviewPage } from './preview-response';
import { previewDiagnosticsPath, reportPreviewFailure } from './preview-diagnostics';
import { publicationReviewSchema } from '@blackbox/content-model';
import { reviewPublication, PublicationReviewConflict, publicationPublicUrl } from './publication-review';

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
import type { ValidatedUploadThumbnail } from './media-upload';
import {
  createStaffThumbnailCandidate,
  serveStaffThumbnail,
  staffThumbnailPutOptions,
  staffThumbnailRoutePrefix,
} from './staff-thumbnails';
import { reconcileItemPublications, guardItemLifecycle, readPublicationCatalog } from './item-publication-recovery';
import {
  cmsNestedProblemResponse,
  cmsStringProblemResponse,
  createCmsNestedProblemBody,
  problemResponse,
} from '../interfaces/http/responses';
import { previewInputSchema, previewPath, readBoundedText } from './preview-content';

declare const RELEASE_SOURCE_SHA: string;
const releaseSourceSha = typeof RELEASE_SOURCE_SHA === 'undefined' ? undefined : RELEASE_SOURCE_SHA;

export { CommerceRuntime };

type CmsBindings = Omit<AppBindings, 'CMS_RUNTIME'> & {
  CMS_DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  CMS_RUNTIME: DurableObjectNamespace<CmsRuntime>;
  COMMERCE_RUNTIME: DurableObjectNamespace<CommerceRuntime>;
  CMS_HOSTNAME?: string;
  CMS_PREVIEW_HOSTNAME?: string;
  CMS_PREVIEW_POLICY_AUD?: string;
  CMS_PUBLICATION_EXPORT_TOKEN?: string;
  CMS_PUBLICATION_GITHUB_TOKEN?: string;
  CONTENT_PUBLICATION_MODE?: string;
  PUBLIC_SITE?: Fetcher;
  LOCAL_PUBLIC_ORIGIN?: string;
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
    if (isPreviewHost(request, bindings)) return bindings.CMS_RUNTIME.getByName('editorial').fetch(request);
    if (url.pathname.startsWith(publishedMediaPath))
      return servePublishedMedia(request, bindings.MEDIA, productEnvironmentProfileFromBindings(bindings));
    if (request.headers.get('Authorization')?.startsWith('Bearer ec_pat_') && !isCmsTokenExportRead(request))
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/internal/')) {
      return bindings.COMMERCE_RUNTIME.getByName('store').fetch(request);
    }
    if (url.pathname.startsWith(staffThumbnailRoutePrefix)) {
      try {
        const identity = await authenticate(request);
        if (identity.role < 30) throw new Error('Unauthorized');
      } catch {
        return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
      }
      return serveStaffThumbnail(request, bindings.MEDIA);
    }
    const staffStaticRequest =
      ['GET', 'HEAD'].includes(request.method) &&
      !url.pathname.startsWith('/_emdash/') &&
      !url.pathname.startsWith('/api/') &&
      !publicationWorkflowPaths.has(url.pathname) &&
      !isCmsTokenExportRead(request);
    if (staffStaticRequest) {
      try {
        await authenticate(request);
      } catch {
        return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
      }
      const response = await bindings.ASSETS.fetch(request);
      return staffAssetResponse(request, response);
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
  private staffSnapshotCache: StaffSnapshotCache = {};

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
      const localPublicOrigin = this.env.LOCAL_PUBLIC_ORIGIN ?? 'http://127.0.0.1:4321/blackbox-records/';
      if (
        environment === 'local' &&
        !/^http:\/\/127\.0\.0\.1:(?:4321|4339)\/blackbox-records\/$/.test(localPublicOrigin)
      )
        throw new Error('Invalid Local public origin.');
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
              ? localPublicOrigin
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

  private previewContexts = new Map<string, RetainedPreview>();
  private diagnosticLimits = new Map<string, { count: number; expires: number }>();

  private async preview(request: Request, identity: { email: string; role: number }): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const generation = Number(request.headers.get('X-Preview-Generation') ?? 0);
    const headers = {
      ...privatePreviewHeaders,
      'X-Preview-Request-Id': requestId,
      'X-Preview-Generation': String(generation),
      'X-Preview-Environment': this.env.PRODUCT_ENVIRONMENT.toLowerCase(),
      ...(releaseSourceSha ? { 'X-Release-SHA': releaseSourceSha } : {}),
    };
    if (
      request.method !== 'POST' ||
      identity.role < 30 ||
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('X-EmDash-Request') !== '1' ||
      !Number.isSafeInteger(generation) ||
      generation < 0 ||
      [...url.searchParams.keys()].some((key) => key !== 'view') ||
      !['detail', 'listing'].includes(url.searchParams.get('view') ?? 'detail')
    ) {
      if (request.body) await readBoundedText(request.body, 256 * 1024).catch(() => {});
      return new Response('Forbidden', { status: 403, headers });
    }
    let retainedId: string | undefined;
    try {
      const body = JSON.parse(await readBoundedText(request.body, 256 * 1024));
      if (url.pathname === '/_emdash/preview-release') {
        ownedPreviewContext(this.previewContexts, body.context, identity.email, Date.now(), this.ctx.storage.kv);
        releasePreviewContext(this.previewContexts, body.context, this.ctx.storage.kv);
        return new Response(null, { status: 204, headers });
      }
      if (!this.env.PUBLIC_SITE) throw new Error('The public renderer is unavailable. Retry preview.');
      const origin = previewOrigin(this.env, url);
      const environment = productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget;
      const { withEmDashRuntime } = await import('emdash/middleware');
      const input =
        body && typeof body === 'object' && 'publication' in body
          ? { collection: body.collection, id: body.id, publication: publicationReviewSchema.parse(body.publication) }
          : previewInputSchema.parse(body);
      const selection = await withEmDashRuntime((runtime) =>
        selectPreviewContent(input, {
          runtime,
          bucket: this.env.MEDIA,
          commerce: this.env.COMMERCE_DB,
          environment,
        }),
      );
      retainedId = retainPreviewContext(
        this.previewContexts,
        {
          owner: identity.email,
          parentOrigin: url.origin,
          generation,
          requestId,
          selection,
        },
        Date.now(),
        this.ctx.storage.kv,
      );
      const base = environment === 'local' ? '/blackbox-records/' : '/';
      const frame = new URL(previewDestination(selection, url.searchParams.get('view') ?? 'detail', base), origin);
      frame.searchParams.set('__preview', retainedId);
      return Response.json({ context: retainedId, url: frame.href }, { headers });
    } catch (error) {
      if (retainedId) releasePreviewContext(this.previewContexts, retainedId, this.ctx.storage.kv);
      return Response.json(
        { error: error instanceof Error ? error.message : 'Preview could not update. Retry.' },
        { status: 422, headers },
      );
    }
  }

  private async previewRead(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const started = performance.now();
    let requestId: string | undefined;
    let failurePhase = 'authentication';
    let resourceType = 'frame';
    const directContext =
      /^\/_preview\/(?:media|api)\/([a-f0-9-]{36})(?:\/|$)/.exec(url.pathname)?.[1] ??
      url.searchParams.get('__preview');
    if (directContext && /^[a-f0-9-]{36}$/.test(directContext)) requestId = directContext;
    try {
      const identity = await authenticatePreview(request, this.env);
      failurePhase = 'routing';
      if (!['GET', 'HEAD'].includes(request.method) || !this.env.PUBLIC_SITE) {
        if (request.body) await readBoundedText(request.body, 256 * 1024).catch(() => {});
        return new Response('Forbidden', { status: 403, headers: privatePreviewHeaders });
      }
      let path = url.pathname.replace(/^\/blackbox-records(?=\/)/, '');
      let resourcePath = url.pathname;
      if (path === '/_image') {
        const source = new URL(url.searchParams.get('href') ?? '', url);
        const sourcePath = source.pathname.replace(/^\/blackbox-records(?=\/)/, '');
        if (
          source.origin !== url.origin ||
          source.search ||
          source.hash ||
          !/^(?:\/_preview\/media\/[a-f0-9-]{36}\/[A-Za-z0-9_-]{1,128}|\/_astro\/[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|svg))$/.test(
            sourcePath,
          )
        )
          return new Response('Forbidden', { status: 403, headers: privatePreviewHeaders });
        // The public runtime's passthrough image service also returns the original bytes.
        path = sourcePath;
        resourcePath = source.pathname;
        const sourceContext = /^\/_preview\/media\/([a-f0-9-]{36})\//.exec(sourcePath)?.[1];
        if (sourceContext) requestId = sourceContext;
      }
      // Only compiled public code and fixed branding can be read without a selection.
      if (
        /^\/_astro\/[A-Za-z0-9_.-]+\.(?:m?js|css|woff2?|png|jpe?g|webp|svg)$/.test(path) ||
        /^\/assets\/images\/brand\/[A-Za-z0-9_.-]+$/.test(path) ||
        /^\/assets\/fonts\/brand\/[A-Za-z0-9_.-]+\.(?:woff2|css)$/.test(path) ||
        /^\/favicon(?:-96x96)?\.(?:svg|png|ico)$/.test(path)
      ) {
        resourceType = 'static_asset';
        failurePhase = 'static_asset';
        const asset = await this.env.PUBLIC_SITE.fetch(
          new Request(
            new URL(
              resourcePath,
              publicationPublicUrl(productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget),
            ),
            { method: request.method },
          ),
        );
        const headers = new Headers(asset.headers);
        for (const [key, value] of Object.entries(privatePreviewHeaders)) headers.set(key, value);
        return new Response(asset.body, { status: asset.status, headers });
      }
      const media = /^\/_preview\/media\/([a-f0-9-]{36})\/([A-Za-z0-9_-]{1,128})$/.exec(path);
      const api =
        /^\/_preview\/api\/([a-f0-9-]{36})(\/api\/store\/(?:capabilities|listing-prices|items\/[a-z0-9-]+(?:\/variants)?))$/.exec(
          path,
        );
      const id = media?.[1] ?? api?.[1] ?? url.searchParams.get('__preview') ?? '';
      if (id && /^[a-f0-9-]{36}$/.test(id)) requestId = id;
      resourceType = media ? 'media' : api ? 'store_api' : 'frame';
      failurePhase = 'context';
      const context = ownedPreviewContext(this.previewContexts, id, identity.email, Date.now(), this.ctx.storage.kv);
      requestId = context.requestId ?? requestId;
      const alias = /^\/assets\/catalog\/(artists|releases|news|distro)\/([^/]+)$/.exec(path);
      const aliasId =
        alias &&
        context.selection.content.records
          .filter((record) => record.collection === alias[1])
          .flatMap((record) => contentMediaIds(record.data))
          .find((id) => context.selection.media[id]?.filename === decodeURIComponent(alias[2]));
      if (media || alias) {
        resourceType = 'media';
        failurePhase = 'media';
        const item = context.selection.media[media?.[2] ?? aliasId ?? ''];
        if (!item) throw new Error('Selected image is unavailable.');
        const object = await this.env.MEDIA.get(item.key);
        if (!object || object.size !== item.size || (item.sha256 && object.checksums.toJSON().sha256 !== item.sha256)) {
          await object?.body.cancel();
          throw new Error('Selected image is unavailable.');
        }
        if (request.method === 'HEAD') await object.body.cancel();
        return new Response(request.method === 'HEAD' ? null : object.body, {
          headers: { ...privatePreviewHeaders, 'Content-Type': item.mimeType },
        });
      }
      if (api) {
        resourceType = 'store_api';
        failurePhase = 'store_api';
        const response = await this.env.COMMERCE_RUNTIME.getByName('store').fetch(
          new Request(
            new URL(
              api[2],
              publicationPublicUrl(productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget),
            ),
            { method: 'GET', headers: { accept: 'application/json' } },
          ),
        );
        if (request.method === 'HEAD') await response.body?.cancel();
        return new Response(request.method === 'HEAD' ? null : response.body, {
          status: response.status,
          headers: { ...privatePreviewHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (
        /^\/(?:api|_emdash|_preview|__publication|content|stock|_image|media|assets)(?:\/|$)/.test(path) ||
        /\/checkout(?:\/|$)/.test(path)
      )
        return new Response('Forbidden', { status: 403, headers: privatePreviewHeaders });
      failurePhase = 'render';
      const response = await renderPreviewPage(
        request,
        id,
        context,
        this.env.PUBLIC_SITE,
        productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget,
      );
      const logger = createBindingLogger(this.env);
      const renderLog = {
        event: 'preview_render',
        requestId,
        status: response.status,
        ms: Math.round(performance.now() - started),
        generation: context.generation,
        release: response.headers.get('X-Release-SHA') ?? releaseSourceSha,
        resourceType: 'frame',
      };
      if (response.status >= 400) logger.warn({ ...renderLog, failurePhase: 'render' });
      else logger.info(renderLog);
      if (request.method === 'HEAD') {
        await response.body?.cancel();
        return new Response(null, { status: response.status, headers: response.headers });
      }
      return response;
    } catch {
      createBindingLogger(this.env).warn({
        event: 'preview_render',
        requestId,
        status: 410,
        ms: Math.round(performance.now() - started),
        release: releaseSourceSha,
        failurePhase,
        resourceType,
      });
      return new Response('Preview is unavailable. Sign in or refresh preview.', {
        status: 410,
        headers: privatePreviewHeaders,
      });
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
    pruneStoredPreviewContexts(this.ctx.storage.kv);
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
    if (isPreviewHost(request, bindings)) return this.previewRead(request);
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
    if (url.pathname === previewPath || url.pathname === '/_emdash/preview-release')
      return identity
        ? this.preview(request, identity)
        : new Response('Forbidden', { status: 403, headers: privatePreviewHeaders });
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
            snapshotCache: this.staffSnapshotCache,
          }),
        );
      } catch {
        return problemResponse(
          {
            success: false,
            ...createCmsNestedProblemBody({
              status: 503,
              code: 'service_unavailable',
              error: { message: 'The workspace could not be loaded. Retry.' },
            }),
          },
          { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
        );
      }
    }
    if (url.pathname.startsWith('/_emdash/api/blackbox/review-media/')) {
      const path = /^\/_emdash\/api\/blackbox\/review-media\/([a-f0-9]{64})\/([a-f0-9]{64})$/.exec(url.pathname);
      if (
        !identity ||
        identity.role < 30 ||
        !path ||
        url.search ||
        !['GET', 'HEAD'].includes(request.method) ||
        !bindings.PUBLIC_SITE
      )
        return new Response('Not found', { status: 404 });
      const publicUrl = publicationPublicUrl(productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget);
      const response = await bindings.PUBLIC_SITE.fetch(
        new Request(new URL(`media/content/${path[1]}/${path[2]}`, publicUrl), { method: request.method }),
      );
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      return new Response(response.body, { status: response.status, headers });
    }
    if (url.pathname === '/_emdash/api/blackbox/publication-review') {
      if (
        !identity ||
        identity.role < 30 ||
        request.method !== 'POST' ||
        url.search ||
        request.headers.get('Origin') !== url.origin ||
        request.headers.get('X-EmDash-Request') !== '1'
      )
        return new Response('Forbidden', { status: 403 });
      try {
        const input = publicationReviewSchema.parse(JSON.parse(await readBoundedText(request.body, 16384)));
        const { withEmDashRuntime } = await import('emdash/middleware');
        const result = await withEmDashRuntime((runtime) =>
          reviewPublication(input, {
            runtime,
            commerce: bindings.COMMERCE_DB,
            bucket: bindings.MEDIA,
            environment: productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
          }),
        );
        return Response.json(result.review, {
          headers: { 'Cache-Control': 'private, no-store', 'X-Publication-Review-Reads': String(result.reads) },
        });
      } catch (error) {
        return Response.json(
          { error: error instanceof PublicationReviewConflict ? error.message : 'Review could not load. Retry.' },
          {
            status: error instanceof PublicationReviewConflict ? 409 : 400,
            headers: { 'Cache-Control': 'private, no-store' },
          },
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
        return cmsStringProblemResponse(503, 'PUBLICATION_UNAVAILABLE');
      try {
        const input = selectedPublicationSchema.parse(JSON.parse(await readBoundedText(request.body, 16384)));
        // This path publishes editorial revisions only. Commerce availability and its
        // native lifecycle guard remain owned by the separate Selling operation.
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        const { withEmDashRuntime } = await import('emdash/middleware');
        const accepted = await withEmDashRuntime((runtime) =>
          acceptSelectedPublication(input, identity.email, {
            runtime,
            commerce: bindings.COMMERCE_DB,
            db: bindings.CMS_DB,
            bucket: bindings.MEDIA,
            environment: productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
          }),
        );
        this.ctx.waitUntil(this.processPublications().finally(() => this.ctx.storage.setAlarm(Date.now() + 1000)));
        return Response.json(accepted, { status: 202, headers: { 'Cache-Control': 'private, no-store' } });
      } catch (error) {
        const status = error instanceof InvalidPublication ? 409 : 503;
        return cmsStringProblemResponse(status, 'PUBLICATION_UNAVAILABLE', {
          code: error instanceof InvalidPublication ? 'publication_conflict' : 'publication_unavailable',
        });
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
        return cmsStringProblemResponse(503, 'PUBLICATION_STATUS_UNAVAILABLE');
      }
      if (pending) return cmsStringProblemResponse(409, 'PUBLICATION_IN_PROGRESS');
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
          return cmsNestedProblemResponse(400, { code: 'EXPORT_READ_SCOPES_REQUIRED' });
      }
    }
    if (!(await this.isInitialized())) {
      return cmsNestedProblemResponse(503, { code: 'CMS_NOT_INITIALIZED' });
    }
    let validatedThumbnail: ValidatedUploadThumbnail | undefined;
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
            return problemResponse(
              {
                success: false,
                ...createCmsNestedProblemBody({
                  status: 422,
                  code: 'invalid_editorial_save',
                  detail: 'The editorial save is invalid.',
                  error: { message: issues.join('\n') },
                }),
              },
              { status: 422, headers: { 'Cache-Control': 'private, no-store' } },
            );
        } catch {
          return problemResponse(
            {
              success: false,
              ...createCmsNestedProblemBody({
                status: 400,
                code: 'invalid_editorial_save',
                error: { message: 'Invalid or oversized draft.' },
              }),
            },
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
            const content = { ...current.data.item.data };
            if (publishing[1] === 'navigation')
              for (const key of ['show_in_header', 'show_in_footer'])
                if (content[key] === 0 || content[key] === 1) content[key] = content[key] === 1;
            return validateCmsRevisionContent(publishing[1], content).length === 0;
          });
          if (!valid)
            return problemResponse(
              {
                success: false,
                ...createCmsNestedProblemBody({
                  status: 422,
                  code: 'invalid_editorial_save',
                  error: { message: 'Complete the highlighted fields before publishing.' },
                }),
              },
              { status: 422, headers: { 'Cache-Control': 'private, no-store' } },
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
          return cmsNestedProblemResponse(405, { code: 'UNSUPPORTED_MEDIA_ACTION' });
        }
        const { validateImageUpload } = await import('./media-upload');
        const upload = await validateImageUpload(request);
        if (upload instanceof Response) return upload;
        validatedThumbnail = upload.thumbnail;
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
          return cmsNestedProblemResponse(400, { code: 'INVALID_EDITORIAL_SAVE' });
        }
      }
    }
    const state = new FetchState(request);
    // Astro only consumes waitUntil here; DurableObjectState provides that lifecycle hook.
    const asset = await cf(state, bindings, this.ctx as unknown as ExecutionContext);
    const response = asset ?? finalize(state, await astro(state));
    if (validatedThumbnail && [200, 201].includes(response.status)) {
      try {
        const payload = (await response
          .clone()
          .json()
          .catch(() => null)) as {
          data?: { item?: { storageKey?: unknown } };
        } | null;
        const storageKey = payload?.data?.item?.storageKey;
        const candidate =
          typeof storageKey === 'string' ? createStaffThumbnailCandidate(storageKey, validatedThumbnail.bytes) : null;
        if (candidate) await bindings.MEDIA.put(candidate.key, candidate.bytes, staffThumbnailPutOptions(candidate));
      } catch {
        createBindingLogger(bindings).warn({ event: 'staff_thumbnail_store_failed', status: response.status });
      }
    }
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
