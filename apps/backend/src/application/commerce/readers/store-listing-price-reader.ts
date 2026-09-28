import type { StoreOfferListingPriceSnapshotRepository } from '../../../domain/commerce/repositories/spi';
import {
  classifyStoreStockAvailability,
  type StoreItemSlug,
  type StoreStockAvailability,
} from '../../../domain/commerce';
import { createStoreOfferPrice } from '../catalog-sync';

export type StoreListingPricePresentation =
  | {
      displayPrice: string;
      availabilityState: StoreStockAvailability;
      presentationState: 'ready';
      storeItemSlug: StoreItemSlug;
    }
  | {
      presentationState: 'unavailable';
      availabilityState: StoreStockAvailability;
      storeItemSlug: StoreItemSlug;
    };

export async function readStoreListingPrices(
  snapshots: StoreOfferListingPriceSnapshotRepository,
): Promise<StoreListingPricePresentation[]> {
  return (await snapshots.listForListingPricePresentation()).map((snapshot) => {
    const availabilityState = classifyStoreStockAvailability(snapshot.availability, snapshot.stock);
    if (
      snapshot.currencyCode.trim().length !== 3 ||
      !snapshot.priceActive ||
      !snapshot.productActive ||
      (snapshot.amountMinor !== null && snapshot.amountMinor < 0)
    ) {
      return {
        availabilityState,
        presentationState: 'unavailable',
        storeItemSlug: snapshot.storeItemSlug,
      };
    }

    return {
      availabilityState,
      displayPrice:
        snapshot.amountMinor === null
          ? 'Pay what you want'
          : createStoreOfferPrice({
              amountMinor: snapshot.amountMinor,
              currencyCode: snapshot.currencyCode,
              kind: 'fixed',
            }).display,
      presentationState: 'ready',
      storeItemSlug: snapshot.storeItemSlug,
    };
  });
}
