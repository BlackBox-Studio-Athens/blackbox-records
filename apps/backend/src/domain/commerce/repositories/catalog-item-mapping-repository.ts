export type CatalogSourceKind = 'release' | 'distro';

export type CatalogSourceRef = {
    sourceKind: CatalogSourceKind;
    sourceId: string;
};

export type CatalogItemMappingRecord = {
    catalogItemSlug: string;
    sourceKind: CatalogSourceKind;
    sourceId: string;
    variantId: string;
};

export interface CatalogItemMappingRepository {
    findByCatalogItemSlug(catalogItemSlug: string): Promise<CatalogItemMappingRecord | null>;
    findBySource(source: CatalogSourceRef): Promise<CatalogItemMappingRecord | null>;
}
