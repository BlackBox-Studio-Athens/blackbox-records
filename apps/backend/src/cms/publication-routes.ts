import { z } from 'zod';
import { createHash, timingSafeEqual } from 'node:crypto';
import { completeSnapshot, storeSnapshotMedia } from './snapshot-storage';
import { isCmsCollection, parseContentSnapshot } from '@blackbox/content-model';
import { readPublicationCatalog } from './item-publication-recovery';
import {
  bindPublicationRun,
  bindPublicationSnapshot,
  completePublication,
  failPublicationRun,
  publicationSummary,
  publicationCompletionSchema,
  PublicationRequestConflictError,
  readPublication,
  readRecentPublications,
  recordPublicationDeployment,
  requestPublication,
} from './publication-journal';

const revisionId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const bodySchema = z.object({ id: z.uuid(), requestedRevision: revisionId }).strict();
const root = '/_emdash/api/blackbox/publications';
export const publicationRunPath = root + '/run';
export const publicationCatalogPath = root + '/catalog';
export const publicationWorkflowPaths = new Set([
  publicationRunPath,
  publicationCatalogPath,
  root + '/media',
  root + '/snapshot',
  root + '/complete',
  root + '/failed',
]);

export async function handlePublicationWorkflow(
  request: Request,
  context: {
    db: D1Database;
    commerce?: D1Database;
    bucket: R2Bucket;
    environment: string | undefined;
    hostname: string | undefined;
    token: string | undefined;
  },
  send: typeof fetch = fetch,
) {
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  };
  const url = new URL(request.url);
  const environment = z.enum(['local', 'uat', 'prd']).safeParse(context.environment);
  const credential = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (
    !environment.success ||
    (environment.data === 'local'
      ? !['127.0.0.1', 'localhost'].includes(url.hostname)
      : url.protocol !== 'https:' || url.hostname !== context.hostname) ||
    !/^[a-f0-9]{64}$/.test(context.token ?? '') ||
    !credential ||
    !timingSafeEqual(Buffer.from(credential), Buffer.from(context.token!))
  )
    return reply(403, { error: 'FORBIDDEN' });
  if (!publicationWorkflowPaths.has(url.pathname) || url.search) return reply(404, { error: 'NOT_FOUND' });
  if (url.pathname === root + '/failed') {
    if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    let input;
    try {
      if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
        throw new Error('JSON required');
      input = z
        .object({ id: z.uuid(), ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/) })
        .strict()
        .parse(await readJson(request.body, 4096));
    } catch {
      return reply(400, { error: 'INVALID_REQUEST' });
    }
    try {
      const item = await readPublication(context.db, environment.data, input.id);
      if (!item || item.ciRunId !== input.ciRunId) return reply(409, { error: 'PUBLICATION_CONFLICT' });
      // Deployment may have succeeded before verification failed. Reconcile its receipt instead of declaring failure.
      if (item.status === 'pending' && !item.deploymentId)
        await failPublicationRun(context.db, environment.data, input.id, input.ciRunId);
      const current = await readPublication(context.db, environment.data, input.id);
      return reply(200, publicationSummary(current!));
    } catch {
      return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
    }
  }
  if (url.pathname === publicationCatalogPath) {
    if (request.method !== 'GET') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    if (!context.commerce) return reply(503, { error: 'CATALOG_UNAVAILABLE' });
    return reply(200, { data: await readPublicationCatalog(context.commerce) });
  }
  if (request.method === 'GET' && [root + '/snapshot', root + '/media'].includes(url.pathname)) {
    const selected = z.object({ id: z.uuid(), ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/) }).safeParse({
      id: request.headers.get('X-Publication-ID'),
      ciRunId: request.headers.get('X-CI-Run-ID'),
    });
    if (!selected.success) return reply(400, { error: 'INVALID_REQUEST' });
    try {
      const item = await readPublication(context.db, environment.data, selected.data.id);
      if (!item || item.status !== 'live' || item.ciRunId !== selected.data.ciRunId || !item.snapshotSha256)
        return reply(409, { error: 'PUBLICATION_NOT_LIVE' });
      const object = await context.bucket.get(`snapshots/${environment.data}/manifest/${item.snapshotSha256}`);
      if (!object || object.size > 4 * 1024 * 1024 || object.checksums.toJSON().sha256 !== item.snapshotSha256) {
        await object?.body.cancel();
        throw new Error('Snapshot unavailable');
      }
      const json = await object.text();
      if (createHash('sha256').update(json).digest('hex') !== item.snapshotSha256) throw new Error('Invalid snapshot');
      const manifest = parseContentSnapshot(json, environment.data);
      if (url.pathname === root + '/snapshot')
        return new Response(json, {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
        });
      const sha256 = request.headers.get('X-Snapshot-Media-SHA256');
      const media = manifest.media.find((entry) => entry.sha256 === sha256);
      if (!media) return reply(404, { error: 'NOT_FOUND' });
      const bytes = await context.bucket.get(`snapshots/${environment.data}/media/${media.sha256}`);
      if (!bytes || bytes.size !== media.size || bytes.checksums.toJSON().sha256 !== media.sha256) {
        await bytes?.body.cancel();
        throw new Error('Snapshot media unavailable');
      }
      return new Response(bytes.body, {
        headers: { 'Content-Type': media.mimeType, 'Cache-Control': 'private, no-store' },
      });
    } catch {
      return reply(503, { error: 'SNAPSHOT_UNAVAILABLE' });
    }
  }
  if (url.pathname === root + '/complete') {
    if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    let input;
    try {
      if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
        throw new Error('JSON required');
      input = publicationCompletionSchema
        .omit({ environment: true })
        .strict()
        .parse(await readJson(request.body, 4096));
    } catch {
      return reply(400, { error: 'INVALID_REQUEST' });
    }
    try {
      const item = await readPublication(context.db, environment.data, input.id);
      if (
        !item ||
        item.ciRunId !== input.ciRunId ||
        item.codeSha !== input.codeSha ||
        item.snapshotSha256 !== input.snapshotSha256
      )
        return reply(409, { error: 'PUBLICATION_CONFLICT' });
      if (item.status === 'live')
        return item.deploymentId === input.deploymentId
          ? reply(200, { id: item.id, status: 'live' })
          : reply(409, { error: 'PUBLICATION_CONFLICT' });
      if (item.status !== 'pending') return reply(409, { error: 'PUBLICATION_CONFLICT' });
      if (!(await recordPublicationDeployment(context.db, { ...input, environment: environment.data })))
        return reply(409, { error: 'PUBLICATION_CONFLICT' });
      const site = {
        local: 'http://127.0.0.1:4321/blackbox-records',
        uat: 'https://blackbox-records-web-uat.pages.dev',
        prd: 'https://blackbox-records-web.pages.dev',
      }[environment.data];
      const response = await send(site + '/release.json', {
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new Error('Deployment unavailable');
      }
      const proof = z
        .object({
          sha: z.literal(input.codeSha),
          content: z.object({
            publicationId: z.literal(input.id),
            ciRunId: z.literal(input.ciRunId),
            snapshotSha256: z.literal(input.snapshotSha256),
          }),
        })
        .parse(await readJson(response.body, 4096));
      const manifest = await context.bucket.get(`snapshots/${environment.data}/manifest/${input.snapshotSha256}`);
      if (!manifest || manifest.size > 4 * 1024 * 1024) throw new Error('Missing publication snapshot');
      const json = await manifest.text();
      if (createHash('sha256').update(json).digest('hex') !== input.snapshotSha256)
        throw new Error('Invalid publication snapshot');
      const snapshot = parseContentSnapshot(json, environment.data, item.requestedRevision);
      const completed = await completePublication(
        context.db,
        {
          ...input,
          codeSha: proof.sha,
          environment: environment.data,
        },
        snapshot.records.map((record) => record.revisionId),
      );
      return completed ? reply(200, { id: input.id, status: 'live' }) : reply(409, { error: 'PUBLICATION_CONFLICT' });
    } catch {
      return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
    }
  }
  if (url.pathname !== publicationRunPath) {
    if (request.method !== 'PUT') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    const identity = z.object({ id: z.uuid(), ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/) }).safeParse({
      id: request.headers.get('X-Publication-ID'),
      ciRunId: request.headers.get('X-CI-Run-ID'),
    });
    if (!identity.success) return reply(400, { error: 'INVALID_REQUEST' });
    try {
      const item = await readPublication(context.db, environment.data, identity.data.id);
      if (!item || item.status !== 'pending' || !item.codeSha || item.ciRunId !== identity.data.ciRunId)
        return reply(409, { error: 'PUBLICATION_CONFLICT' });
      const media = url.pathname === root + '/media';
      let bytes;
      try {
        if (
          request.headers.get('Content-Type')?.split(';')[0].trim() !==
          (media ? 'application/octet-stream' : 'application/json')
        )
          throw new Error('Invalid content type');
        bytes = await readBytes(request.body, (media ? 20 : 4) * 1024 * 1024);
        if (!bytes.byteLength) throw new Error('Empty body');
      } catch {
        return reply(400, { error: 'INVALID_REQUEST' });
      }
      if (media) {
        if (item.snapshotSha256) return reply(409, { error: 'PUBLICATION_CONFLICT' });
        const stored = await storeSnapshotMedia(context.bucket, environment.data, bytes);
        return reply(200, { sha256: stored.sha256 });
      }
      if (item.snapshotSha256) {
        return createHash('sha256').update(bytes).digest('hex') === item.snapshotSha256
          ? reply(200, { id: item.id, snapshotSha256: item.snapshotSha256 })
          : reply(409, { error: 'PUBLICATION_CONFLICT' });
      }
      const stored = await completeSnapshot(
        context.bucket,
        environment.data,
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes),
        item.requestedRevision,
      );
      const bound = await bindPublicationSnapshot(context.db, {
        ...identity.data,
        environment: environment.data,
        snapshotSha256: stored.sha256,
      });
      return bound
        ? reply(200, { id: item.id, snapshotSha256: stored.sha256 })
        : reply(409, { error: 'PUBLICATION_CONFLICT' });
    } catch {
      return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
    }
  }
  if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  let input;
  try {
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
      throw new Error('JSON required');
    input = z
      .object({
        id: z.uuid(),
        dispatchToken: z.uuid(),
        ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/),
        codeSha: z
          .string()
          .regex(/^[a-f0-9]{40}$/)
          .optional(),
      })
      .strict()
      .parse(await readJson(request.body, 4096));
  } catch {
    return reply(400, { error: 'INVALID_REQUEST' });
  }
  try {
    const bound = await bindPublicationRun(context.db, { ...input, environment: environment.data });
    return bound ? reply(200, { id: input.id, status: 'pending' }) : reply(409, { error: 'PUBLICATION_CONFLICT' });
  } catch {
    return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
  }
}

export async function readBytes(body: ReadableStream<Uint8Array> | null, limit: number) {
  if (!body) throw new Error('Missing body');
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) chunks.length = 0;
      else chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size > limit) throw new Error('Body too large');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJson(body: ReadableStream<Uint8Array> | null, limit: number) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readBytes(body, limit))) as unknown;
}

export async function handlePublicationRequest(
  request: Request,
  context: {
    db: D1Database;
    environment: 'local' | 'uat' | 'prd';
    identity: { email: string; role: number };
    fetchCms: (path: string) => Promise<Response>;
    onAccepted?: () => void;
  },
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  };
  const summary = publicationSummary;
  if (context.identity.role < 30) return reply(403, { error: 'FORBIDDEN' });
  if (url.search) return reply(400, { error: 'INVALID_REQUEST' });
  try {
    if (request.method === 'GET' && path === root) {
      const items = await readRecentPublications(context.db, context.environment);
      return reply(200, { items });
    }
    if (request.method === 'GET' && path.startsWith(root + '/')) {
      const parsed = z.uuid().safeParse(path.slice(root.length + 1));
      if (!parsed.success) return reply(404, { error: 'NOT_FOUND' });
      const item = await readPublication(context.db, context.environment, parsed.data);
      return item ? reply(200, summary(item)) : reply(404, { error: 'NOT_FOUND' });
    }
    if (path !== root) return reply(404, { error: 'NOT_FOUND' });
    if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    if (request.headers.get('Origin') !== url.origin || request.headers.get('X-EmDash-Request') !== '1')
      return reply(403, { error: 'FORBIDDEN' });
    let input: z.infer<typeof bodySchema>;
    try {
      if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
        throw new Error('JSON required');
      input = bodySchema.parse(await readJson(request.body, 4096));
    } catch {
      return reply(400, { error: 'INVALID_REQUEST' });
    }
    const existing = await readPublication(context.db, context.environment, input.id);
    if (existing) {
      if (existing.actorEmail !== context.identity.email || existing.requestedRevision !== input.requestedRevision)
        throw new PublicationRequestConflictError();
      if (existing.status === 'pending') context.onAccepted?.();
      return reply(202, summary(existing));
    }
    const revisionResponse = await context.fetchCms('/_emdash/api/revisions/' + input.requestedRevision);
    if (!revisionResponse.ok) {
      await revisionResponse.body?.cancel();
      if (revisionResponse.status !== 404) throw new Error('CMS unavailable');
      return reply(409, { error: 'REVISION_NOT_PUBLISHED' });
    }
    const revision = z
      .object({
        data: z.object({
          item: z.object({
            id: revisionId,
            collection: z.string().refine(isCmsCollection),
            entryId: revisionId,
          }),
        }),
      })
      .parse(await readJson(revisionResponse.body, 4 * 1024 * 1024)).data.item;
    if (revision.id !== input.requestedRevision) return reply(409, { error: 'REVISION_NOT_PUBLISHED' });
    const contentResponse = await context.fetchCms(`/_emdash/api/content/${revision.collection}/${revision.entryId}`);
    if (!contentResponse.ok) {
      await contentResponse.body?.cancel();
      if (contentResponse.status !== 404) throw new Error('CMS unavailable');
      return reply(409, { error: 'REVISION_NOT_PUBLISHED' });
    }
    const content = z
      .object({
        data: z.object({
          item: z.object({
            id: revisionId,
            status: z.string(),
            liveRevisionId: revisionId.nullable(),
          }),
        }),
      })
      .parse(await readJson(contentResponse.body, 4 * 1024 * 1024)).data.item;
    if (content.id !== revision.entryId || content.status !== 'published' || content.liveRevisionId !== revision.id)
      return reply(409, { error: 'REVISION_NOT_PUBLISHED' });
    const item = await requestPublication(context.db, {
      ...input,
      environment: context.environment,
      actorEmail: context.identity.email,
    });
    context.onAccepted?.();
    return reply(202, summary(item));
  } catch (error) {
    return error instanceof PublicationRequestConflictError
      ? reply(409, { error: 'PUBLICATION_CONFLICT' })
      : reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
  }
}
