import { z } from 'zod';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isCmsCollection, parseContentSnapshot } from '@blackbox/content-model';
import { readPublicationCatalog } from './item-publication-recovery';
import {
  publicationHistoryQuery,
  publicationSummary,
  PublicationRequestConflictError,
  readPublication,
  readPublicationHistory,
  readRecentPublications,
  requestPublication,
} from './publication-journal';
import { cmsStringProblemResponse } from '../platform/interfaces/http/responses';
import { publicationCalendarQuery, readPublicationCalendar, readPublicationDetails } from './publication-history';

const revisionId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const bodySchema = z.object({ id: z.uuid(), requestedRevision: revisionId }).strict();
const root = '/_emdash/api/blackbox/publications';
export const publicationCatalogPath = root + '/catalog';
export const publicationWorkflowPaths = new Set([publicationCatalogPath, root + '/media', root + '/snapshot']);

// Read-only export routes for release preparation; publication writes happen in the runtime processor.
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
) {
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    if (value && typeof value === 'object' && 'error' in value && typeof value.error === 'string')
      return cmsStringProblemResponse(status, value.error);
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
  if (request.method !== 'GET') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  if (url.pathname === publicationCatalogPath) {
    if (!context.commerce) return reply(503, { error: 'CATALOG_UNAVAILABLE' });
    return reply(200, { data: await readPublicationCatalog(context.commerce) });
  }
  const selected = z.object({ id: z.uuid(), ciRunId: z.string().regex(/^(?:[1-9][0-9]{0,19}|runtime)$/) }).safeParse({
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
    bucket?: R2Bucket;
    fetchCms: (path: string) => Promise<Response>;
    onAccepted?: () => void;
  },
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    if (value && typeof value === 'object' && 'error' in value && typeof value.error === 'string')
      return cmsStringProblemResponse(status, value.error);
    return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  };
  const summary = publicationSummary;
  if (context.identity.role < 30) return reply(403, { error: 'FORBIDDEN' });
  if (url.search && ![root + '/history', root + '/calendar'].includes(path))
    return reply(400, { error: 'INVALID_REQUEST' });
  try {
    if (request.method === 'GET' && path === root + '/calendar') {
      const query = publicationCalendarQuery.safeParse(Object.fromEntries(url.searchParams));
      if (!query.success) return reply(400, { error: 'INVALID_REQUEST' });
      return reply(200, await readPublicationCalendar(context.db, context.environment, query.data));
    }
    const details = /^\/_emdash\/api\/blackbox\/publications\/([^/]+)\/details$/.exec(path);
    if (request.method === 'GET' && details) {
      const id = z.uuid().safeParse(details[1]);
      if (!id.success) return reply(404, { error: 'NOT_FOUND' });
      if (!context.bucket) return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
      const result = await readPublicationDetails(context.db, context.bucket, context.environment, id.data);
      if (!result) return reply(404, { error: 'NOT_FOUND' });
      const entries = await Promise.all(
        result.publication.entries.map(async (entry) => {
          const response = await context.fetchCms(
            `/_emdash/api/content/${encodeURIComponent(entry.collection)}/${encodeURIComponent(entry.recordId)}`,
          );
          const content = response.ok
            ? ((await response.json()) as { data?: { item?: { deletedAt?: string | null } } })
            : null;
          return { ...entry, editorAvailable: !!content?.data?.item && !content.data.item.deletedAt };
        }),
      );
      return reply(200, { ...result, publication: { ...result.publication, entries } });
    }
    if (request.method === 'GET' && path === root + '/history') {
      const query = publicationHistoryQuery.safeParse(Object.fromEntries(url.searchParams));
      if (!query.success) return reply(400, { error: 'INVALID_REQUEST' });
      return reply(200, await readPublicationHistory(context.db, context.environment, query.data));
    }
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
