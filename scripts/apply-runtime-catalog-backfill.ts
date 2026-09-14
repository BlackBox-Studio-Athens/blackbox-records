import { createHash } from 'node:crypto';
import type { planRuntimeCatalogBackfill } from './plan-runtime-catalog-backfill';

type BackfillPlan = ReturnType<typeof planRuntimeCatalogBackfill>;

// Materialize eligibility before updating any revision, so one stale row prevents the whole apply.
const updateCatalog = `WITH planned AS MATERIALIZED (
  SELECT value FROM json_each(?1)
), eligible AS MATERIALIZED (
  SELECT s.id FROM StoreItemOption s JOIN planned p ON s.id = json_extract(p.value, '$.before.id')
  WHERE s.storeItemSlug = json_extract(p.value, '$.before.storeItemSlug')
    AND s.sourceKind = json_extract(p.value, '$.before.sourceKind')
    AND s.sourceId = json_extract(p.value, '$.before.sourceId')
    AND s.variantId = json_extract(p.value, '$.before.variantId')
    AND s.catalogRevision = 0 AND s.catalogAvailability = 'withheld'
    AND s.cmsSourceId IS NULL AND s.itemType IS NULL AND s.priceKind IS NULL AND s.productProjection IS NULL
)
UPDATE StoreItemOption SET (cmsSourceId, itemType, priceKind, productProjection, catalogAvailability, catalogRevision) = (
  SELECT json_extract(value, '$.data.cmsSourceId'), json_extract(value, '$.data.itemType'),
    json_extract(value, '$.data.priceKind'), json_extract(value, '$.data.productProjection'),
    json_extract(value, '$.data.catalogAvailability'), 1
  FROM planned WHERE json_extract(value, '$.before.id') = StoreItemOption.id
)
WHERE id IN (SELECT id FROM eligible) AND (SELECT count(*) FROM eligible) = json_array_length(?1)
RETURNING id`;

/** Internal migration runner; the caller owns resource selection and fresh provider reconciliation. */
export async function applyRuntimeCatalogBackfill(
  db: D1Database,
  plan: BackfillPlan,
  options: { environment: BackfillPlan['environment']; apply?: boolean; confirmLiveCatalogChanges?: boolean },
) {
  if (plan.environment !== options.environment) throw new Error('Backfill target environment does not match its plan.');
  if (options.apply && options.environment === 'prd' && !options.confirmLiveCatalogChanges) {
    throw new Error('PRD backfill requires one-run live catalog confirmation.');
  }
  if (new Set(plan.updates.map(({ before }) => before.id)).size !== plan.updates.length) {
    throw new Error('Backfill plan contains duplicate runtime rows.');
  }
  for (const { before, data } of plan.updates) {
    if (
      before.catalogRevision !== 0 ||
      before.catalogAvailability !== 'withheld' ||
      data.catalogRevision !== 1 ||
      [before.cmsSourceId, before.itemType, before.priceKind, before.productProjection].some((value) => value !== null)
    )
      throw new Error('Backfill can only populate uninitialized catalog rows.');
  }
  if (!options.apply || plan.updates.length === 0) {
    return { dryRun: !options.apply, planned: plan.updates.length, applied: 0, preserved: [] };
  }
  const tables = (
    await db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all<{ name: string }>()
  ).results
    .map(({ name }) => name)
    .filter((name) => !name.startsWith('sqlite_') && !name.startsWith('_cf_'));
  if (!tables.includes('StoreItemOption')) throw new Error('Runtime catalog table is missing.');
  const reads = tables.map((table) => db.prepare(`SELECT * FROM "${table.replaceAll('"', '""')}"`));
  // D1 batches are transactions. These images cannot be interleaved with a concurrent sale or stock edit.
  const results = await db.batch<Record<string, unknown>>([
    ...reads,
    db.prepare(updateCatalog).bind(JSON.stringify(plan.updates)),
    ...reads,
  ]);
  const applied = results[tables.length].results.length;
  if (applied !== plan.updates.length) throw new Error('Stale backfill plan: no catalog rows were changed.');
  const updates = new Map(plan.updates.map((update) => [update.before.id, update.data]));
  const digest = (rows: Record<string, unknown>[]) =>
    createHash('sha256')
      .update(JSON.stringify(rows.map((row) => JSON.stringify(row)).sort()))
      .digest('hex');
  const preserved = tables.map((table, index) => {
    const before = results[index].results;
    const after = results[tables.length + 1 + index].results;
    const expected =
      table === 'StoreItemOption'
        ? before.map((row) => {
            const data = updates.get(String(row.id));
            return data ? { ...row, ...data, productProjection: JSON.stringify(data.productProjection) } : row;
          })
        : before;
    if (digest(expected) !== digest(after))
      throw new Error(`Backfill verification failed for ${table}; inspect committed state before retrying.`);
    return { table, rows: before.length, beforeSha256: digest(before), afterSha256: digest(after) };
  });
  return { dryRun: false, planned: plan.updates.length, applied, preserved };
}
