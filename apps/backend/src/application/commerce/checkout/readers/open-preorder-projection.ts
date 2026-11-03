import { athensToday, type PreorderShipEstimate } from '../../../../domain/commerce';
import type { StoreOfferListingPriceSnapshotRecord } from '../../../../domain/commerce/repositories/spi';
import { presentStoreListingPrice } from './store-listing-price-reader';

export type OpenPreorderItem = {
  storeItemSlug: string;
  displayPrice: string;
  shipEstimate: PreorderShipEstimate | null;
};
type HomeOffer = {
  storeItemSlug: string;
  availability: 'stocked' | 'sold_out';
  displayPrice: string | null;
};
export type OpenPreorderProjection = { items: OpenPreorderItem[]; homeOffers?: HomeOffer[] };

/** Reuse Store listing rules, while keeping source ownership and stock counts out of the public projection. */
export async function deriveOpenPreorderProjection(
  snapshots: StoreOfferListingPriceSnapshotRecord[],
  now?: Date,
): Promise<{ projection: OpenPreorderProjection; identity: string }> {
  const today = athensToday(now);
  const records = snapshots.map((snapshot) => ({
    record: presentStoreListingPrice(snapshot, today),
    sourceKind: snapshot.sourceKind,
  }));
  const items = records
    .flatMap(({ record }) =>
      record.presentationState === 'ready' && record.availabilityState === 'stocked' && record.preorder
        ? [
            {
              storeItemSlug: record.storeItemSlug as string,
              displayPrice: record.displayPrice,
              shipEstimate: canonicalEstimate(record.preorder.shipEstimate),
            },
          ]
        : [],
    )
    .sort((a, b) => (a.storeItemSlug < b.storeItemSlug ? -1 : a.storeItemSlug > b.storeItemSlug ? 1 : 0));
  const homeOffers: HomeOffer[] = records
    .flatMap(({ record, sourceKind }): HomeOffer[] =>
      sourceKind === 'release' &&
      record.presentationState === 'ready' &&
      !record.preorder &&
      (record.availabilityState === 'stocked' || record.availabilityState === 'sold_out')
        ? [
            {
              storeItemSlug: record.storeItemSlug,
              availability: record.availabilityState,
              displayPrice: record.displayPrice || null,
            },
          ]
        : [],
    )
    .sort((a, b) => (a.storeItemSlug < b.storeItemSlug ? -1 : a.storeItemSlug > b.storeItemSlug ? 1 : 0));
  const projection = { items, homeOffers };
  return { projection, identity: await openPreorderIdentity(projection) };
}

// Fixed key order keeps the identity stable however the estimate was parsed.
function canonicalEstimate(estimate: PreorderShipEstimate | null): PreorderShipEstimate | null {
  if (!estimate) return null;
  return estimate.kind === 'date'
    ? { kind: 'date', date: estimate.date }
    : { kind: 'month', month: estimate.month, part: estimate.part };
}

export async function openPreorderIdentity(projection: OpenPreorderProjection): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(projection)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
