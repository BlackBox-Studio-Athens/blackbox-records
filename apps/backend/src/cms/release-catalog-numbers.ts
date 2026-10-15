import type { EmDashRuntime } from 'emdash/middleware';
import { nextFreeCatalogNumber, parseCatalogNumber, type ReleaseCatalogNumbers } from '@blackbox/content-model';
import { createCmsNestedProblemBody, problemResponse } from '../platform/interfaces/http/responses';

export async function releaseCatalogNumbersResponse(
  request: Request,
  identity: { role: number } | undefined,
  read: () => Promise<ReleaseCatalogNumbers>,
): Promise<Response> {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!identity || identity.role < 30 || request.method !== 'GET')
    return new Response('Forbidden', { status: 403, headers });
  try {
    return Response.json({ success: true, data: await read() }, { headers });
  } catch {
    return problemResponse(
      {
        success: false,
        ...createCmsNestedProblemBody({
          status: 503,
          code: 'service_unavailable',
          error: { message: 'Release catalog numbers could not be loaded. Retry.' },
        }),
      },
      { status: 503, headers },
    );
  }
}

/** Both the current private draft and live revision reserve their numbers until changed or removed. */
export async function readReleaseCatalogNumbers(runtime: EmDashRuntime): Promise<ReleaseCatalogNumbers> {
  const items: ReleaseCatalogNumbers['items'] = [];
  let cursor: string | undefined;
  do {
    const page = await runtime.handleContentList('releases', { limit: 100, ...(cursor ? { cursor } : {}) });
    if (!page.success) throw new Error('Release catalog numbers are unavailable.');
    for (const item of page.data.items) {
      for (const status of ['published', 'draft'] as const) {
        const revisionId = status === 'published' ? item.liveRevisionId : item.draftRevisionId;
        if (!revisionId && (status === 'published' || item.liveRevisionId)) continue;
        let data = item.data;
        if (revisionId) {
          const revision = await runtime.handleRevisionGet(revisionId);
          if (
            !revision.success ||
            revision.data.item.entryId !== item.id ||
            revision.data.item.collection !== 'releases'
          )
            throw new Error('A saved Release revision is unavailable.');
          data = revision.data.item.data;
        }
        const catalogNumber = parseCatalogNumber(data.catalog_number);
        if (
          !catalogNumber ||
          items.some((entry) => entry.releaseId === item.id && entry.catalogNumber === catalogNumber)
        )
          continue;
        items.push({
          catalogNumber,
          releaseId: item.id,
          slug: String(data._slug ?? item.slug),
          title: String(data.title || item.slug),
          status,
        });
      }
    }
    cursor = page.data.nextCursor;
  } while (cursor);
  return { items, nextFreeNumber: nextFreeCatalogNumber(items.map((item) => item.catalogNumber)) };
}

export async function releaseCatalogNumberSaveError(
  runtime: EmDashRuntime,
  data: Record<string, unknown>,
  identity?: string,
): Promise<Response | null> {
  const number = parseCatalogNumber(data.catalog_number);
  if (!number) return null;
  // Native updates accept either id or slug; resolve once so a release never clashes with itself.
  const current = identity ? await runtime.handleContentGet('releases', identity) : null;
  if (current && !current.success) throw new Error('The Release could not be checked.');
  const id = current?.success ? current.data.item.id : undefined;
  const used = await readReleaseCatalogNumbers(runtime);
  const other = used.items.find((entry) => entry.catalogNumber === number && entry.releaseId !== id);
  if (!other) return null;
  const message = `${number} is already used by ${other.title}.`;
  return problemResponse(
    {
      success: false,
      ...createCmsNestedProblemBody({
        status: 422,
        code: 'invalid_editorial_save',
        detail: message,
        error: { message: `catalog_number: ${message}` },
      }),
      fieldErrors: { catalog_number: message },
    },
    { status: 422, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
