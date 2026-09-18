import { z } from 'zod';
import { DISTRO_GROUP_VALUES, isCmsCollection, sourceCollectionNames } from '@blackbox/content-model';
import type { EmDashRuntime } from 'emdash/middleware';
import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';
import { createCmsNestedProblemBody, problemResponse } from '../interfaces/http/responses';

const reviewPositionSchema = z
  .object({
    section: z.number().int().min(0).max(Object.keys(sourceCollectionNames).length),
    cursor: z.string().max(2048).optional(),
  })
  .strict();
const querySchema = z
  .object({
    view: z.literal('changes').optional(),
    scope: z.enum(['all', 'website', 'catalog']).default('all'),
    variantId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .optional(),
    collection: z.string().refine(isCmsCollection).optional(),
    id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .optional(),
    cursor: z.string().max(2048).optional(),
    q: z.string().max(200).optional(),
    area: z.enum(['all', 'distro', 'merch']).default('all'),
    format: z.enum(DISTRO_GROUP_VALUES).optional(),
    sort: z.enum(['title', 'updated']).default('title'),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

export async function readStaffWorkspace(
  request: Request,
  deps: {
    runtime: EmDashRuntime;
    db: D1Database;
    commerce: D1Database;
    bucket: R2Bucket;
    environment: PublicationEnvironment;
  },
) {
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  const headers = { 'Cache-Control': 'private, no-store' };
  const problem = (status: number, message: string, code = 'invalid_request') =>
    problemResponse(
      {
        success: false,
        ...createCmsNestedProblemBody({ status, code, error: { message } }),
      },
      { status, headers },
    );
  if (!query.success) return problem(400, 'Invalid search.');
  if (query.data.view === 'changes' && query.data.cursor) {
    try {
      reviewPositionSchema.parse(JSON.parse(query.data.cursor));
    } catch {
      return problem(400, 'Invalid review position.');
    }
  }
  let { collection, id } = query.data;
  const { cursor, q, variantId, area, format, sort } = query.data;
  const limit = query.data.view === 'changes' ? Math.min(query.data.limit, 25) : query.data.limit;
  if (variantId) {
    const linked = await deps.commerce
      .prepare('SELECT cmsSourceId, sourceId, sourceKind FROM StoreItemOption WHERE variantId = ?')
      .bind(variantId)
      .first<{ cmsSourceId: string | null; sourceId: string; sourceKind: string }>();
    if (!linked) return problem(404, 'This catalog entry is unavailable.', 'not_found');
    collection = linked.sourceKind === 'release' ? 'releases' : 'distro';
    id = linked.cmsSourceId ?? linked.sourceId;
  }
  const pointer = await readPublicationPointer(deps.bucket, deps.environment);
  const snapshot = pointer
    ? await readPublishedSnapshot(deps.bucket, deps.environment, pointer.pointer.snapshotSha256)
    : null;
  const review = query.data.view === 'changes';
  const sections = (collection ? [collection] : Object.keys(sourceCollectionNames)).filter(
    (section) =>
      !review ||
      query.data.scope === 'all' ||
      (query.data.scope === 'catalog') === ['artists', 'releases', 'distro'].includes(section),
  );
  // Each continuation scans at most 100 entries. Sparse pages retain the native cursor,
  // so published entries never conceal drafts later in a collection.
  let reviewCursor: string | undefined;
  async function reviewPages() {
    const position = cursor ? reviewPositionSchema.parse(JSON.parse(cursor)) : { section: 0, cursor: undefined };
    const pages = [];
    let found = 0;
    for (let reads = 0; position.section < sections.length && found < limit && reads < 4; reads++) {
      const section = sections[position.section];
      const result = await deps.runtime.handleContentList(section, {
        limit: limit - found,
        cursor: position.cursor,
        q,
        orderBy: 'createdAt',
        order: 'asc',
      });
      if (!result.success) throw new Error('Changes could not be loaded.');
      const items = result.data.items.filter((item) => {
        const accepted = snapshot?.records.find((entry) => entry.collection === section && entry.id === item.id);
        return !accepted || accepted.revisionId !== (item.draftRevisionId ?? item.liveRevisionId);
      });
      pages.push({ section, items, nextCursor: undefined });
      found += items.length;
      if (result.data.nextCursor) position.cursor = result.data.nextCursor;
      else {
        position.section++;
        position.cursor = undefined;
      }
    }
    if (position.section < sections.length) reviewCursor = JSON.stringify(position);
    return pages;
  }
  const pages = review
    ? await reviewPages()
    : await Promise.all(
        sections.map(async (section) => {
          if (id) {
            const result = await deps.runtime.handleContentGet(section, id);
            if (!result.success) throw new Error('Selected content is unavailable.');
            return { section, items: [result.data.item], nextCursor: undefined };
          }
          const groups = DISTRO_GROUP_VALUES.filter(
            (value) =>
              (!format || value === format) &&
              (area === 'all' || (area === 'merch' ? value === 'Clothes' : value !== 'Clothes')),
          );
          if (section === 'distro' && !groups.length) return { section, items: [], nextCursor: undefined };
          const result = await deps.runtime.handleContentList(section, {
            limit: collection ? limit : 5,
            cursor,
            q,
            orderBy:
              collection && ['artists', 'releases', 'distro', 'news'].includes(section) && sort === 'title'
                ? 'title'
                : 'updatedAt',
            order: sort === 'title' && collection ? 'asc' : 'desc',
            ...(section === 'distro' && (format || area !== 'all')
              ? {
                  fieldFilters: {
                    group: {
                      in: groups,
                    },
                  },
                }
              : {}),
          });
          if (!result.success) throw new Error('Content is unavailable.');
          return { section, ...result.data };
        }),
      );
  const artistNames = new Map(
    snapshot?.records
      .filter((entry) => entry.collection === 'artists')
      .map((entry) => [entry.id, String(entry.data.title ?? '')]),
  );
  if (!review && pages.some((page) => page.section === 'releases')) {
    const artists = await deps.runtime.handleContentList('artists', {
      limit: 100,
      orderBy: 'updatedAt',
      order: 'desc',
    });
    if (artists.success)
      for (const artist of artists.data.items) artistNames.set(artist.id, String(artist.data.title ?? ''));
  }
  const selectedEntries = pages.flatMap((page) =>
    page.items.map((item) => ({
      collection: page.section,
      id: item.id,
      revisionId: item.draftRevisionId ?? item.liveRevisionId,
    })),
  );
  const pending = await deps.db
    .prepare(
      `SELECT p.id, p.requested_revision AS requestedRevision, p.request_json AS requestJson FROM _blackbox_publications p
    WHERE p.environment = ? AND p.status = 'pending' AND (
      p.requested_revision IN (SELECT json_extract(value, '$.revisionId') FROM json_each(?)) OR
      EXISTS (SELECT 1 FROM json_each(CASE WHEN p.request_json IS NULL THEN '[]' WHEN json_type(p.request_json, '$.records') = 'array' THEN json_extract(p.request_json, '$.records') ELSE json_array(json(p.request_json)) END) r
      JOIN json_each(?) selected ON json_extract(selected.value, '$.collection') = json_extract(r.value, '$.collection') AND json_extract(selected.value, '$.id') = json_extract(r.value, '$.recordId'))
    ) LIMIT 100`,
    )
    .bind(deps.environment, JSON.stringify(selectedEntries), JSON.stringify(selectedEntries))
    .all<{ id: string; requestedRevision: string; requestJson: string | null }>();
  const identities = pages.flatMap((page) =>
    page.items.flatMap((item) => [item.id, item.slug]).filter((value): value is string => typeof value === 'string'),
  );
  const catalog = identities.length
    ? await deps.commerce
        .prepare(
          `SELECT c.cmsSourceId, c.sourceId, c.sourceKind, c.variantId, c.storeItemSlug, c.itemType, c.catalogAvailability, c.catalogRevision,
    s.quantity, s.onlineQuantity, s.revision AS stockRevision, p.amountMinor, p.currencyCode, p.freshUntil
    FROM StoreItemOption c LEFT JOIN Stock s ON s.variantId = c.variantId
    LEFT JOIN VariantStripeMapping m ON m.variantId = c.variantId
    LEFT JOIN StoreOfferSnapshot p ON p.variantId = c.variantId AND p.stripePriceId = m.stripePriceId
    WHERE c.cmsSourceId IN (SELECT value FROM json_each(?)) OR c.sourceId IN (SELECT value FROM json_each(?)) LIMIT 100`,
        )
        .bind(JSON.stringify(identities), JSON.stringify(identities))
        .all()
    : { results: [] };
  const items = pages.flatMap((page) =>
    page.items.map((item) => {
      const accepted = snapshot?.records.find((entry) => entry.collection === page.section && entry.id === item.id);
      const revisionId = item.draftRevisionId ?? item.liveRevisionId;
      const updating = pending.results.some((publication) => {
        if (revisionId && publication.requestedRevision === revisionId) return true;
        if (!publication.requestJson) return false;
        const input = JSON.parse(publication.requestJson);
        return (input.records ?? [input]).some(
          (record: { collection?: string; recordId?: string }) =>
            record.collection === page.section && record.recordId === item.id,
        );
      });
      const publicationState = updating
        ? 'pending'
        : !accepted
          ? 'draft'
          : accepted.revisionId === revisionId
            ? 'published'
            : 'changes';
      const kind = page.section === 'releases' ? 'release' : page.section === 'distro' ? 'distro' : '';
      return {
        ...item,
        collection: page.section,
        artistTitle: page.section === 'releases' ? (artistNames.get(String(item.data.artist)) ?? null) : null,
        publicationState,
        acceptedRevisionId: accepted?.revisionId ?? null,
        selling:
          catalog.results.find(
            (entry) => entry.sourceKind === kind && (entry.cmsSourceId === item.id || entry.sourceId === item.slug),
          ) ?? null,
      };
    }),
  );
  return Response.json(
    {
      success: true,
      data: {
        items:
          collection || review
            ? items
            : items
                .filter((item) => item.publicationState !== 'published')
                .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
                .slice(0, 20),
        nextCursor: review ? reviewCursor : pages[0]?.nextCursor,
      },
    },
    { headers },
  );
}
