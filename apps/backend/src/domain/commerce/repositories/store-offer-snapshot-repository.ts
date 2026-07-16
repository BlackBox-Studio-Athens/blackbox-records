import type { StoreItemSlug, StripePriceId, VariantId } from '../ids';

export type StoreOfferSnapshotRecord = {
  amountMinor: number | null;
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

export type StoreOfferListingPriceSnapshotRecord = Pick<
  StoreOfferSnapshotRecord,
  'amountMinor' | 'currencyCode' | 'freshUntil' | 'priceActive' | 'productActive' | 'storeItemSlug'
>;

export interface StoreOfferListingPriceSnapshotRepository {
  listForListingPricePresentation(): Promise<StoreOfferListingPriceSnapshotRecord[]>;
}

export interface StoreOfferSnapshotRepository {
  findByStoreItemSlug(storeItemSlug: StoreItemSlug): Promise<StoreOfferSnapshotRecord | null>;
  findByVariantId(variantId: VariantId): Promise<StoreOfferSnapshotRecord | null>;
  save(snapshot: StoreOfferSnapshotState): Promise<StoreOfferSnapshotRecord>;
}
