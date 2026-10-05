import { publicationPointerSchema, type PublicationEnvironment, type PublicationPointer } from './published-storage';
import { readBoundedText } from './preview-content';

export const publicInvalidationPath = '/__publication/invalidate';
const publicationTag = 'blackbox-publication';
export const publicPublicationTags = (release: string, snapshot: string) => [
  publicationTag,
  `release-${release}`,
  `publication-${snapshot}`,
];

/** Called only by the default service entrypoint, whose Workers Cache owns published HTML and showcase JSON. */
export async function invalidatePublicPublication(
  request: Request,
  invalidate: (pointer: PublicationPointer) => Promise<void>,
  cache: ExecutionContext['cache'],
  environment?: PublicationEnvironment,
) {
  const reply = (status: number, value: unknown) =>
    Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
  if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  if (new URL(request.url).search || request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
    return reply(400, { error: 'INVALID_REQUEST' });
  let pointer;
  try {
    pointer = publicationPointerSchema.parse(JSON.parse(await readBoundedText(request.body, 4096)));
  } catch {
    return reply(400, { error: 'INVALID_REQUEST' });
  }
  try {
    // Refresh public-v2 before purging; a subsequent edge miss must select accepted content.
    await invalidate(pointer);
    // Local has no edge cache. Its accepted pointer still needs immediate refresh.
    if (!cache && environment === 'local') return reply(200, pointer);
    if (!cache || !(await cache.purge({ tags: [publicationTag] })).success)
      throw new Error('Workers Cache purge unavailable.');
    return reply(200, pointer);
  } catch {
    // Accepted content stays active. Confirmation retries this idempotent operation.
    return reply(503, { error: 'PUBLICATION_INVALIDATION_UNAVAILABLE' });
  }
}
