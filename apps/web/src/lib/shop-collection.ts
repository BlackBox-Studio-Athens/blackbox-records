import { listCatalogItems, type CatalogItem } from './catalog-data';
import {
  getPrimaryVariantSnapshotForCatalogItem,
  type VariantSnapshot,
} from './variant-snapshot';

export type ShopCollectionEntry = {
  catalogItem: CatalogItem;
  primaryVariantSnapshot: VariantSnapshot | null;
};

export async function listShopCollectionEntries(): Promise<ShopCollectionEntry[]> {
  const catalogItems = await listCatalogItems();

  return Promise.all(
    catalogItems.map(async (catalogItem) => ({
      catalogItem,
      primaryVariantSnapshot: await getPrimaryVariantSnapshotForCatalogItem(catalogItem.slug),
    })),
  );
}
