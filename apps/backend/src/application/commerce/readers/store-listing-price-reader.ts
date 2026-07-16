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
  now = new Date(),
): Promise<StoreListingPricePresentation[]> {
  return (await snapshots.listForListingPricePresentation()).map((snapshot) => {
    if (
      snapshot.amountMinor === null ||
      snapshot.amountMinor < 0 ||
      snapshot.currencyCode.trim().length !== 3 ||
      snapshot.freshUntil <= now ||
      !snapshot.priceActive ||
      !snapshot.productActive
    ) {
      return {
        presentationState: 'unavailable',
        storeItemSlug: snapshot.storeItemSlug,
      };
    }

    return {
      displayPrice: createStoreOfferPrice({
        amountMinor: snapshot.amountMinor,
        currencyCode: snapshot.currencyCode,
        kind: 'fixed',
      }).display,
      presentationState: 'ready',
      storeItemSlug: snapshot.storeItemSlug,
    };
  });
}
