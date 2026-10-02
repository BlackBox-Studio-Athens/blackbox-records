import type { StoreOfferListingPriceSnapshotRepository } from '../../../../domain/commerce/repositories/spi';
import {
  classifyStoreStockAvailability,
  athensToday,
  deriveShopperPreorder,
  readLowStockQuantity,
  type ShopperPreorder,
  type StoreItemSlug,
  type StoreStockAvailability,
} from '../../../../domain/commerce';
import { createStoreOfferPrice } from '../../catalog-sync';

export type StoreListingPricePresentation =
  | {
      displayPrice: string;
      availabilityState: StoreStockAvailability;
      lowStockQuantity?: number;
      preorder: ShopperPreorder | null;
      presentationState: 'ready';
      storeItemSlug: StoreItemSlug;
    }
  | {
      presentationState: 'unavailable';
      preorder: ShopperPreorder | null;
      availabilityState: StoreStockAvailability;
      storeItemSlug: StoreItemSlug;
    };

export async function readStoreListingPrices(
  snapshots: StoreOfferListingPriceSnapshotRepository,
  scope?: 'preorders',
  now?: Date,
): Promise<StoreListingPricePresentation[]> {
  const today = athensToday(now);
  const records = (await snapshots.listForListingPricePresentation(scope)).map((snapshot) => {
    const availabilityState = classifyStoreStockAvailability(snapshot.availability, snapshot.stock);
    const preorder = deriveShopperPreorder(snapshot.stock?.preorder ?? null, today);
    if (
      snapshot.currencyCode.trim().length !== 3 ||
      !snapshot.priceActive ||
      !snapshot.productActive ||
      (snapshot.amountMinor !== null && snapshot.amountMinor < 0)
    ) {
      return {
        availabilityState,
        preorder,
        presentationState: 'unavailable' as const,
        storeItemSlug: snapshot.storeItemSlug,
      };
    }

    const lowStockQuantity = readLowStockQuantity(availabilityState, snapshot.stock);
    return {
      availabilityState,
      preorder,
      ...(lowStockQuantity === undefined ? {} : { lowStockQuantity }),
      displayPrice:
        snapshot.amountMinor === null
          ? 'Pay what you want'
          : createStoreOfferPrice({
              amountMinor: snapshot.amountMinor,
              currencyCode: snapshot.currencyCode,
              kind: 'fixed',
            }).display,
      presentationState: 'ready' as const,
      storeItemSlug: snapshot.storeItemSlug,
    };
  });
  return scope === 'preorders' ? records.filter((record) => record.preorder !== null) : records;
}
