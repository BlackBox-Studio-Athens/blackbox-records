import type { StoreItemSlug, VariantId } from '../ids';

export type StoreItemSourceKind = 'release' | 'distro';

export type StoreItemSourceRef = {
  sourceKind: StoreItemSourceKind;
  sourceId: string;
};

export type StoreItemOptionRecord = {
  storeItemSlug: StoreItemSlug;
  sourceKind: StoreItemSourceKind;
  sourceId: string;
  variantId: VariantId;
};

export interface StoreItemOptionRepository {
  findByStoreItemSlug(storeItemSlug: StoreItemSlug): Promise<StoreItemOptionRecord | null>;
  findByVariantId(variantId: VariantId): Promise<StoreItemOptionRecord | null>;
  findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null>;
  search(query: string | null, limit: number): Promise<StoreItemOptionRecord[]>;
}

export type RuntimeCatalogRecord = StoreItemOptionRecord & {
  cmsSourceId: string | null;
  itemType: string | null;
  priceKind: string | null;
  productProjection: unknown;
  catalogAvailability: string;
  catalogRevision: number;
};

export interface RuntimeCatalogRepository {
  findByStoreItem(storeItem: StoreItemOptionRecord): Promise<RuntimeCatalogRecord | null>;
}

export type InventoryQuery = {
  q: string;
  area: 'all' | 'release' | 'distro' | 'merch';
  format?: string | undefined;
  cursor?: string | undefined;
  limit: number;
  before?: string | undefined;
};
export type InventoryItem = {
  variantId: string;
  storeItemSlug: string;
  sourceId: string;
  sourceKind: StoreItemSourceKind;
  cmsSourceId: string | null;
  displayName: string;
  itemType: string | null;
  quantity: number | null;
  onlineQuantity: number | null;
};
export type InventoryPage = { items: InventoryItem[]; nextCursor?: string; before: string };
