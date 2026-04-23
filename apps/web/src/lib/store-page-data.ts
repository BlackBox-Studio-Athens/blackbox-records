import { getStoreItemBySlug, listStoreItems, type StoreItem } from './catalog-data';
import {
  getPrimaryAvailabilityForStoreItem,
  type ItemAvailability,
} from './item-availability';

export type StorePageEntry = {
  storeItem: StoreItem;
  primaryAvailability: ItemAvailability | null;
};

export async function getStorePageEntryBySlug(slug: string): Promise<StorePageEntry | null> {
  const storeItem = await getStoreItemBySlug(slug);

  if (!storeItem) {
    return null;
  }

  return {
    storeItem,
    primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
  };
}

export async function createStorePageStaticPaths() {
  const storeItems = await listStoreItems();

  return Promise.all(
    storeItems.map(async (storeItem) => ({
      params: { slug: storeItem.slug },
      props: {
        entry: {
          storeItem,
          primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
        } satisfies StorePageEntry,
      },
    })),
  );
}
