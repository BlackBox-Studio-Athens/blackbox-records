import type { StoreItemSlug, StripePriceId, VariantId } from '../ids';
import type { ItemAvailabilityRecord } from './item-availability-repository';
import type { StockRecord } from './stock-repository';

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
> & {
  availability: Pick<ItemAvailabilityRecord, 'status' | 'canBuy'> | null;
  stock: Pick<StockRecord, 'onlineQuantity' | 'zeroStockState' | 'expectedMonth' | 'showLowStock' | 'preorder'> | null;
};

export interface StoreOfferListingPriceSnapshotRepository {
  listForListingPricePresentation(scope?: 'preorders'): Promise<StoreOfferListingPriceSnapshotRecord[]>;
}

export interface StoreOfferSnapshotRepository {
  findByStoreItemSlug(storeItemSlug: StoreItemSlug): Promise<StoreOfferSnapshotRecord | null>;
  findByVariantId(variantId: VariantId): Promise<StoreOfferSnapshotRecord | null>;
  save(snapshot: StoreOfferSnapshotState): Promise<StoreOfferSnapshotRecord>;
}
