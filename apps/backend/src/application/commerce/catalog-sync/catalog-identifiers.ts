import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { StripeCatalogEnvironment, StripeCatalogIdentityMetadata } from './types';

export function createStripeCatalogLookupKey(
  environment: StripeCatalogEnvironment,
  storeItem: Pick<StoreItemOptionRecord, 'storeItemSlug' | 'variantId'>,
): string {
  return `blackbox:${environment}:${storeItem.storeItemSlug}:${storeItem.variantId}`;
}

export function createStripeCatalogMetadata(
  environment: StripeCatalogEnvironment,
  storeItem: StoreItemOptionRecord,
): StripeCatalogIdentityMetadata {
  return {
    appEnv: environment,
    sourceId: storeItem.sourceId,
    sourceKind: storeItem.sourceKind,
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
  };
}

export function redactStripeObjectId(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.includes('_')) {
    return '[redacted]';
  }

  const prefix = trimmed.slice(0, trimmed.indexOf('_') + 1);
  const suffix = trimmed.slice(-4);

  return `${prefix}...${suffix}`;
}
