import { catalogManifest } from './catalog-manifest.generated';
import type { DesiredCatalogEntry, DesiredCatalogEnvironment, DesiredCatalogState, DesiredPrice } from './types';

export type { DesiredCatalogEntry, DesiredCatalogEnvironment, DesiredCatalogState, DesiredPrice };

export const currentDesiredCatalogEntries: DesiredCatalogEntry[] = catalogManifest.entries;
export const currentDesiredCatalogState: DesiredCatalogState = catalogManifest;

export function createCurrentDesiredCatalogEntriesForEnvironment(
  environment: DesiredCatalogEnvironment,
): DesiredCatalogEntry[] {
  return currentDesiredCatalogEntries.filter((entry) => entry.targetEnvironments.includes(environment));
}

export function createCurrentDesiredPriceMap(environment: DesiredCatalogEnvironment): Map<string, DesiredPrice> {
  return new Map(
    createCurrentDesiredCatalogEntriesForEnvironment(environment).flatMap((entry) =>
      entry.desiredPrice ? [[entry.variantId, entry.desiredPrice] as const] : [],
    ),
  );
}

export function findCurrentDesiredCatalogEntry(variantId: string): DesiredCatalogEntry | null {
  return currentDesiredCatalogEntries.find((entry) => entry.variantId === variantId) ?? null;
}
