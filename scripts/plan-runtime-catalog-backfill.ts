import { isDeepStrictEqual } from 'node:util';
import {
  createStoreOfferPriceFromCatalogPrice,
  hasBlockingCatalogIssue,
  type CatalogSyncRunResult,
  type DesiredCatalogEntry,
  type StripeCatalogEnvironment,
} from '../apps/backend/src/application/commerce/catalog-sync';
import type { StoreItemOption } from '../apps/backend/src/generated/prisma/client';

type CatalogFields = Pick<
  StoreItemOption,
  'cmsSourceId' | 'itemType' | 'priceKind' | 'productProjection' | 'catalogAvailability'
>;
export type CatalogBackfillSource = {
  catalog: DesiredCatalogEntry;
  cmsSourceId: string;
  itemType: string;
};

/** Migration-only planner. It has no database or provider write capability. */
export function planRuntimeCatalogBackfill(input: {
  environment: StripeCatalogEnvironment;
  sources: CatalogBackfillSource[];
  rows: StoreItemOption[];
  reconciliation: CatalogSyncRunResult;
}) {
  const { environment, sources, rows, reconciliation } = input;
  if (!reconciliation.dryRun || reconciliation.environment !== environment) {
    throw new Error('Backfill requires read-only reconciliation from the same environment.');
  }
  if (hasBlockingCatalogIssue(reconciliation.issues)) throw new Error('Catalog reconciliation needs review.');
  const identities = (item: Pick<DesiredCatalogEntry, 'storeItemSlug' | 'sourceKind' | 'sourceId' | 'variantId'>) => [
    item.storeItemSlug,
    `${item.sourceKind}/${item.sourceId}`,
    item.variantId,
  ];
  const assertUnique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} in catalog backfill.`);
  };
  for (const index of [0, 1, 2]) {
    assertUnique(
      sources.map(({ catalog }) => identities(catalog)[index]),
      'source identity',
    );
    assertUnique(
      rows.map((row) => identities(row)[index]),
      'runtime identity',
    );
  }
  assertUnique(
    rows.map((row) => row.id),
    'runtime row',
  );
  assertUnique(
    sources.map(({ catalog, cmsSourceId }) => `${catalog.sourceKind}/${cmsSourceId}`),
    'CMS linkage',
  );
  assertUnique(
    reconciliation.results.map(({ storeItem }) => storeItem.variantId),
    'reconciliation result',
  );
  const byVariant = new Map(rows.map((row) => [row.variantId, row]));
  const results = new Map(reconciliation.results.map((result) => [String(result.storeItem.variantId), result]));
  const updates: { before: StoreItemOption; data: CatalogFields & { catalogRevision: number } }[] = [];
  const unchanged: string[] = [];
  for (const { catalog, cmsSourceId, itemType } of sources) {
    const fail = (reason: string): never => {
      throw new Error(`${catalog.storeItemSlug}: ${reason}`);
    };
    for (const value of [cmsSourceId, itemType]) {
      if (!value.trim() || value !== value.trim() || value.length > 128) fail('Invalid CMS linkage or item type.');
    }
    if (!catalog.targetEnvironments.includes(environment === 'local' ? 'uat' : environment)) {
      fail('Source belongs to another environment.');
    }
    const row = byVariant.get(catalog.variantId);
    if (!row || !isDeepStrictEqual(identities(row), identities(catalog)))
      fail('Runtime identity is missing or conflicts.');
    const existing = row!;
    if (
      rows.some(
        (other) =>
          other.id !== existing.id && other.sourceKind === catalog.sourceKind && other.cmsSourceId === cmsSourceId,
      )
    ) {
      fail('CMS source is already linked to another runtime item.');
    }
    const result = results.get(catalog.variantId);
    if (!result || !isDeepStrictEqual(identities(result.storeItem), identities(catalog))) {
      fail('Read-only reconciliation identity is missing or conflicts.');
    }
    const verified = result!;
    const price = verified.resolvedPrice;
    if (
      hasBlockingCatalogIssue(verified.issues) ||
      !verified.mapping ||
      verified.mapping.variantId !== catalog.variantId ||
      !price ||
      !price.active ||
      !price.productActive ||
      !createStoreOfferPriceFromCatalogPrice(price) ||
      (verified.mapping.stripeProductId && verified.mapping.stripeProductId !== price.productId)
    )
      fail('Bound default Price needs review.');

    // Amounts and opening quantities in the old manifest are deliberately not imported.
    const data: CatalogFields = {
      cmsSourceId,
      itemType,
      priceKind: price!.priceKind,
      productProjection: catalog.productProjection,
      catalogAvailability: catalog.availability,
    };
    const current: CatalogFields = {
      cmsSourceId: existing.cmsSourceId,
      itemType: existing.itemType,
      priceKind: existing.priceKind,
      productProjection: existing.productProjection,
      catalogAvailability: existing.catalogAvailability,
    };
    if (isDeepStrictEqual(current, data) && existing.catalogRevision > 0) {
      unchanged.push(existing.storeItemSlug);
    } else if (
      existing.catalogRevision === 0 &&
      existing.catalogAvailability === 'withheld' &&
      [existing.cmsSourceId, existing.itemType, existing.priceKind, existing.productProjection].every(
        (value) => value === null,
      )
    ) {
      updates.push({ before: structuredClone(existing), data: { ...data, catalogRevision: 1 } });
    } else fail('Existing catalog data differs; backfill cannot overwrite staff changes.');
  }
  return { environment, updates, unchanged };
}
