import { z } from 'zod';
import { acknowledgeLocalPublication, readNextLocalPublication, readPublication } from './publication-journal';
import { readJson } from './publication-routes';
import { cmsStringProblemResponse } from '../interfaces/http/responses';

export const localPublicationRoot = '/_emdash/api/blackbox/publications/local/';

export async function handleLocalPublicationRequest(
  request: Request,
  context: { db: D1Database; environment: string | undefined; identity: { role: number } },
  send: typeof fetch = fetch,
) {
  const url = new URL(request.url);
  const reply = async (status: number, value: unknown) => {
    await request.body?.pipeTo(new WritableStream());
    if (value && typeof value === 'object' && 'error' in value && typeof value.error === 'string')
      return cmsStringProblemResponse(status, value.error);
    return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  };
  if (
    context.environment !== 'local' ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    context.identity.role < 30
  )
    return reply(403, { error: 'FORBIDDEN' });
  const action = url.pathname.slice(localPublicationRoot.length);
  if (!url.pathname.startsWith(localPublicationRoot) || !['next', 'complete', 'fail'].includes(action))
    return reply(404, { error: 'NOT_FOUND' });
  if (url.search) return reply(400, { error: 'INVALID_REQUEST' });
  if (request.method !== (action === 'next' ? 'GET' : 'POST')) return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  if (
    action !== 'next' &&
    (request.headers.get('Origin') !== url.origin || request.headers.get('X-EmDash-Request') !== '1')
  )
    return reply(403, { error: 'FORBIDDEN' });
  try {
    if (action === 'next') return reply(200, { request: await readNextLocalPublication(context.db) });
    let input;
    try {
      if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
        throw new Error('JSON required');
      const schema = z.object({ id: z.uuid() });
      input = (action === 'complete' ? schema.extend({ snapshotSha256: z.string().regex(/^[a-f0-9]{64}$/) }) : schema)
        .strict()
        .parse(await readJson(request.body, 4096));
    } catch {
      return reply(400, { error: 'INVALID_REQUEST' });
    }
    const hash = 'snapshotSha256' in input ? input.snapshotSha256 : undefined;
    const item = await readPublication(context.db, 'local', input.id);
    if (!item) return reply(409, { error: 'PUBLICATION_CONFLICT' });
    if (item.status !== 'pending') {
      const matches =
        hash === undefined ? item.status === 'failed' : item.status === 'live' && item.snapshotSha256 === hash;
      return matches ? reply(200, { id: item.id, status: item.status }) : reply(409, { error: 'PUBLICATION_CONFLICT' });
    }
    if (hash !== undefined) {
      const response = await send('http://127.0.0.1:4321/blackbox-records/local-publication.json', {
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new Error('Local receipt unavailable');
      }
      const receipt = z
        .object({ publicationId: z.uuid(), sha256: z.string().regex(/^[a-f0-9]{64}$/) })
        .parse(await readJson(response.body, 4096));
      if (receipt.publicationId !== input.id || receipt.sha256 !== hash)
        return reply(409, { error: 'PUBLICATION_CONFLICT' });
    }
    return (await acknowledgeLocalPublication(context.db, input.id, hash))
      ? reply(200, { id: input.id, status: hash === undefined ? 'failed' : 'live' })
      : reply(409, { error: 'PUBLICATION_CONFLICT' });
  } catch {
    return reply(503, { error: 'PUBLICATION_UNAVAILABLE' });
  }
}
