import { D1CatalogOperationRepository } from '../infrastructure/persistence/prisma';
import { readPublication } from './publication-journal';
import { z } from 'zod';
import { snapshotStoreItemSchema } from '@blackbox/content-model';

export async function readPublicationCatalog(db: D1Database) {
  const rows = await db
    .prepare('SELECT sourceKind, sourceId, storeItemSlug, variantId FROM StoreItemOption ORDER BY variantId LIMIT 1001')
    .all();
  return z.array(snapshotStoreItemSchema).max(1000).parse(rows.results);
}

export async function guardItemLifecycle(
  request: Request,
  db: D1Database,
  readSource: (path: string) => Promise<Response>,
) {
  const url = new URL(request.url);
  const match = /^\/_emdash\/api\/content\/(releases|distro)\/([^/]+)\/(publish|unpublish)$/.exec(
    url.pathname.replace(/\/+$/, ''),
  );
  if (request.method !== 'POST' || !match) return null;
  const [, collection, encodedId, action] = match;
  let id;
  try {
    id = z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .parse(decodeURIComponent(encodedId));
  } catch {
    return Response.json({ error: { code: 'INVALID_IDENTITY' } }, { status: 400 });
  }
  const item = await db
    .prepare(
      `SELECT variantId FROM StoreItemOption WHERE sourceKind = ? AND (cmsSourceId = ? OR sourceId = ?) AND catalogRevision > 0`,
    )
    .bind(collection === 'releases' ? 'release' : 'distro', id, id)
    .first<{ variantId: string }>();
  if (!item) return null;
  const body = z
    .object({ _rev: z.string().min(1), overrideLock: z.boolean().optional() })
    .strict()
    .safeParse(
      await request
        .clone()
        .json()
        .catch(() => null),
    );
  if (!body.success) return Response.json({ error: { code: 'REVISION_REQUIRED' } }, { status: 400 });
  if (action === 'publish') {
    const operation = await db
      .prepare(
        `SELECT id FROM CatalogOperation WHERE variantId = ? AND kind = 'item_publish'
      AND status = 'pending' AND step = 'product_projected' AND leaseUntil > ? AND json_extract(results, '$.cmsRevision') = ?`,
      )
      .bind(item.variantId, new Date().toISOString(), body.data._rev)
      .first();
    return operation ? null : Response.json({ error: { code: 'USE_ITEM_PUBLICATION' } }, { status: 409 });
  }
  const response = await readSource(`/_emdash/api/content/${collection}/${id}`);
  const current = response.ok
    ? z.object({ data: z.object({ _rev: z.literal(body.data._rev) }) }).safeParse(await response.json())
    : null;
  if (!current?.success) {
    if (!response.bodyUsed) await response.body?.cancel();
    return Response.json({ error: { code: 'REVISION_CHANGED' } }, { status: 409 });
  }
  // Pause before the native unpublish. An interrupted CMS response must never leave checkout enabled.
  await db.batch([
    db
      .prepare(
        `UPDATE StoreItemOption SET catalogAvailability = 'withheld', catalogRevision = catalogRevision + 1, updatedAt = ? WHERE variantId = ? AND catalogAvailability <> 'retired'`,
      )
      .bind(new Date().toISOString(), item.variantId),
    db
      .prepare(`UPDATE ItemAvailability SET canBuy = 0, updatedAt = ? WHERE variantId = ?`)
      .bind(new Date().toISOString(), item.variantId),
  ]);
  return null;
}

// Uses the existing CMS Live receipt; no CMS reads enter shopper requests.
export async function reconcileItemPublications(
  commerce: D1Database,
  cms: D1Database,
  environment: 'local' | 'uat' | 'prd',
) {
  const journal = new D1CatalogOperationRepository(commerce);
  const pending = await commerce
    .prepare(
      `SELECT id FROM CatalogOperation
    WHERE kind = 'item_publish' AND status = 'pending' AND step = 'publication_requested'
    ORDER BY updatedAt LIMIT 20`,
    )
    .all<{ id: string }>();
  for (const { id } of pending.results) {
    const retained = await journal.find(id);
    if (!retained?.results.publicationId) continue;
    const receipt = await readPublication(cms, environment, retained.results.publicationId);
    if (
      receipt?.status !== 'live' ||
      receipt.requestedRevision !== retained.results.publishedRevisionId ||
      receipt.actorEmail !== retained.actorEmail
    )
      continue;
    const operation = await journal.claim(id);
    if (!operation) continue;
    if (!(await journal.completeItemPublication(operation)))
      await journal.markNeedsReview(operation, 'revision_conflict');
  }
}
