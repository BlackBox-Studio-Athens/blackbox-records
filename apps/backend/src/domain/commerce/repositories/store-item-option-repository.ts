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
