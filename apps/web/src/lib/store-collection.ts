import { listStoreItems, type StoreItem } from './catalog-data';
import {
  getPrimaryAvailabilityForStoreItem,
  type ItemAvailability,
} from './item-availability';

export type StoreCollectionEntry = {
  storeItem: StoreItem;
  primaryAvailability: ItemAvailability | null;
};

export async function listStoreCollectionEntries(): Promise<StoreCollectionEntry[]> {
  const storeItems = await listStoreItems();

  return Promise.all(
    storeItems.map(async (storeItem) => ({
      storeItem,
      primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
    })),
  );
}
