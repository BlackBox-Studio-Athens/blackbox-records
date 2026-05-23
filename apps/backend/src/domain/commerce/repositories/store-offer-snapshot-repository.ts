import type { StoreItemSlug, StripePriceId, VariantId } from '../ids';

export type StoreOfferSnapshotRecord = {
  amountMinor: number;
  currencyCode: string;
  freshUntil: Date;
  priceActive: boolean;
  productActive: boolean;
  storeItemSlug: StoreItemSlug;
  stripeLookupKey: string;
  stripePriceId: StripePriceId;
  syncedAt: Date;
  variantId: VariantId;
};

export type StoreOfferSnapshotState = StoreOfferSnapshotRecord;

export interface StoreOfferSnapshotRepository {
  findByStoreItemSlug(storeItemSlug: StoreItemSlug): Promise<StoreOfferSnapshotRecord | null>;
  findByVariantId(variantId: VariantId): Promise<StoreOfferSnapshotRecord | null>;
  save(snapshot: StoreOfferSnapshotState): Promise<StoreOfferSnapshotRecord>;
}
