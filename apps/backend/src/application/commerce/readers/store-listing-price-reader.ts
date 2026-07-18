import type { StoreOfferListingPriceSnapshotRepository } from '../../../domain/commerce/repositories/spi';
import type { StoreItemSlug } from '../../../domain/commerce';
import { createStoreOfferPrice } from '../catalog-sync';

export type StoreListingPricePresentation =
  | {
      displayPrice: string;
      presentationState: 'ready';
      storeItemSlug: StoreItemSlug;
    }
  | {
      presentationState: 'unavailable';
      storeItemSlug: StoreItemSlug;
    };

export async function readStoreListingPrices(
  snapshots: StoreOfferListingPriceSnapshotRepository,
): Promise<StoreListingPricePresentation[]> {
  return (await snapshots.listForListingPricePresentation()).map((snapshot) => {
    if (
      snapshot.currencyCode.trim().length !== 3 ||
      !snapshot.priceActive ||
      !snapshot.productActive ||
      (snapshot.amountMinor !== null && snapshot.amountMinor < 0)
    ) {
      return {
        presentationState: 'unavailable',
        storeItemSlug: snapshot.storeItemSlug,
      };
    }

    return {
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
