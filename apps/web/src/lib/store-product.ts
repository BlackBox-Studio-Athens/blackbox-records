import { getCatalogItemBySlug, listCatalogItems, type CatalogItem } from './catalog-data';
import {
  getPrimaryVariantSnapshotForCatalogItem,
  type VariantSnapshot,
} from './variant-snapshot';

export type StoreProductEntry = {
  catalogItem: CatalogItem;
  primaryVariantSnapshot: VariantSnapshot | null;
};

export async function getStoreProductEntryBySlug(slug: string): Promise<StoreProductEntry | null> {
  const catalogItem = await getCatalogItemBySlug(slug);

  if (!catalogItem) {
    return null;
  }

  return {
    catalogItem,
    primaryVariantSnapshot: await getPrimaryVariantSnapshotForCatalogItem(catalogItem.slug),
  };
}

export async function createStoreProductStaticPaths() {
  const catalogItems = await listCatalogItems();

  return Promise.all(
    catalogItems.map(async (catalogItem) => ({
      params: { slug: catalogItem.slug },
      props: {
        entry: {
          catalogItem,
          primaryVariantSnapshot: await getPrimaryVariantSnapshotForCatalogItem(catalogItem.slug),
        } satisfies StoreProductEntry,
      },
    })),
  );
}
