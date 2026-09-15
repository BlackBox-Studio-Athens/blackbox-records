import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { StripeCatalogProductProjection } from './types';

export type CatalogProductProjectionReader = {
  findByStoreItem(
    storeItem: StoreItemOptionRecord,
  ): StripeCatalogProductProjection | null | Promise<StripeCatalogProductProjection | null>;
};
