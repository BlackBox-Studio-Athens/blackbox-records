import { catalogManifest } from './catalog-manifest.generated';
import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { StripeCatalogEnvironment, StripeCatalogExpectedPrice, StripeCatalogProductProjection } from './types';

export type CatalogProductProjectionAlignmentStatus = 'checkout_eligible' | 'future_buyable' | 'unavailable';

export type CatalogProductProjectionEntry = {
  alignmentStatus: CatalogProductProjectionAlignmentStatus;
  expectedSandboxPrice: StripeCatalogExpectedPrice | null;
  productProjection: StripeCatalogProductProjection;
  sourceId: string;
  sourceKind: StoreItemOptionRecord['sourceKind'];
  storeItemSlug: string;
  variantId: string;
};

export type CatalogProductProjectionReader = {
  findByStoreItem(storeItem: StoreItemOptionRecord): StripeCatalogProductProjection | null;
};

export const currentCatalogProductProjectionEntries: CatalogProductProjectionEntry[] = catalogManifest.entries.map(
  (entry) => ({
    alignmentStatus: entry.alignmentStatus,
    expectedSandboxPrice: entry.desiredPrice,
    productProjection: entry.productProjection,
    sourceId: entry.sourceId,
    sourceKind: entry.sourceKind,
    storeItemSlug: entry.storeItemSlug,
    variantId: entry.variantId,
  }),
);

export function createCurrentCatalogProductProjectionReader(): CatalogProductProjectionReader {
  return {
    findByStoreItem: findCurrentCatalogProductProjection,
  };
}

export function findCurrentCatalogProductProjection(
  storeItem: StoreItemOptionRecord,
): StripeCatalogProductProjection | null {
  return findCurrentCatalogProductProjectionEntry(storeItem)?.productProjection ?? null;
}

export function findCurrentCatalogProductProjectionEntry(
  storeItem: StoreItemOptionRecord,
): CatalogProductProjectionEntry | null {
  return (
    currentCatalogProductProjectionEntries.find(
      (entry) =>
        entry.storeItemSlug === storeItem.storeItemSlug &&
        entry.variantId === storeItem.variantId &&
        entry.sourceKind === storeItem.sourceKind &&
        entry.sourceId === storeItem.sourceId,
    ) ?? null
  );
}

export function createCurrentCatalogExpectedProductProjectionMap(): Map<string, StripeCatalogProductProjection> {
  return new Map(currentCatalogProductProjectionEntries.map((entry) => [entry.variantId, entry.productProjection]));
}

export function createCurrentCatalogExpectedSandboxPriceMap(
  environment: StripeCatalogEnvironment,
): Map<string, StripeCatalogExpectedPrice> {
  if (environment !== 'uat') {
    return new Map();
  }

  return new Map(
    currentCatalogProductProjectionEntries.flatMap((entry) =>
      entry.expectedSandboxPrice ? [[entry.variantId, entry.expectedSandboxPrice] as const] : [],
    ),
  );
}
