import type { PreorderShipEstimate } from '../../../../domain/commerce';
import type { StoreListingPricePresentation } from './store-listing-price-reader';

export type OpenPreorderItem = {
  storeItemSlug: string;
  displayPrice: string;
  shipEstimate: PreorderShipEstimate | null;
};
export type OpenPreorderProjection = { items: OpenPreorderItem[] };

/** Buyable pre-orders from the listing read, in the canonical form the public renderer stores and compares. */
export async function deriveOpenPreorderProjection(
  records: readonly StoreListingPricePresentation[],
): Promise<{ projection: OpenPreorderProjection; identity: string }> {
  const items = records
    .flatMap((record) =>
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
  const projection = { items };
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
