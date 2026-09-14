import { z } from 'zod';
import { createHash, timingSafeEqual } from 'node:crypto';
import { completeSnapshot, storeSnapshotMedia } from './snapshot-storage';
import { isCmsCollection } from '@blackbox/content-model';
import {
  bindPublicationRun,
  bindPublicationSnapshot,
  PublicationRequestConflictError,
  readPublication,
  requestPublication,
} from './publication-journal';

const revisionId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const bodySchema = z.object({ id: z.uuid(), requestedRevision: revisionId }).strict();
const root = '/_emdash/api/blackbox/publications';
export const publicationRunPath = root + '/run';
export const publicationWorkflowPaths = new Set([publicationRunPath, root + '/media', root + '/snapshot']);

export async function handlePublicationWorkflow(
  request: Request,
  context: {
    db: D1Database;
    bucket: R2Bucket;
    environment: string | undefined;
    hostname: string | undefined;
    token: string | undefined;
  },
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
  if (url.pathname !== publicationRunPath) {
    if (request.method !== 'PUT') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    const identity = z.object({ id: z.uuid(), ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/) }).safeParse({
      id: request.headers.get('X-Publication-ID'),
      ciRunId: request.headers.get('X-CI-Run-ID'),
    });
    if (!identity.success) return reply(400, { error: 'INVALID_REQUEST' });
    try {
      const item = await readPublication(context.db, environment.data, identity.data.id);
      if (!item || item.status !== 'pending' || item.ciRunId !== identity.data.ciRunId)
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
      .object({ id: z.uuid(), dispatchToken: z.uuid(), ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/) })
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

async function readBytes(body: ReadableStream<Uint8Array> | null, limit: number) {
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

async function readJson(body: ReadableStream<Uint8Array> | null, limit: number) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readBytes(body, limit))) as unknown;
}

export async function handlePublicationRequest(
  request: Request,
  context: {
    db: D1Database;
    environment: 'local' | 'uat' | 'prd';
    identity: { email: string; role: number };
    fetchCms: (path: string) => Promise<Response>;
  },
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  };
  const summary = (item: NonNullable<Awaited<ReturnType<typeof readPublication>>>) => ({
    id: item.id,
    status: item.status,
    requestedAt: item.requestedAt,
  });
  if (context.identity.role < 30) return reply(403, { error: 'FORBIDDEN' });
  if (url.search) return reply(400, { error: 'INVALID_REQUEST' });
  try {
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
    return reply(202, summary(item));
  } catch (error) {
    return error instanceof PublicationRequestConflictError
      ? reply(409, { error: 'PUBLICATION_CONFLICT' })
      : reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
  }
}
