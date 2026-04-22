import type { CatalogItemMappingRepository, InventoryRepository, InventorySnapshotRecord } from '../../../domain/commerce/repositories';

export type CatalogOfferSnapshot = {
    catalogItemSlug: string;
    variantId: string;
    availability: {
        status: InventorySnapshotRecord['status'];
        label: string;
    };
    canPurchase: boolean;
};

function createAvailabilityLabel(status: InventorySnapshotRecord['status']): string {
    return status === 'available' ? 'Available' : 'Unavailable';
}

export class CatalogOfferSnapshotReader {
    public constructor(
        private readonly catalogItemMappings: CatalogItemMappingRepository,
        private readonly inventory: InventoryRepository,
    ) {}

    public async findByCatalogItemSlug(catalogItemSlug: string): Promise<CatalogOfferSnapshot | null> {
        const mapping = await this.catalogItemMappings.findByCatalogItemSlug(catalogItemSlug);

        if (!mapping) {
            return null;
        }

        const inventorySnapshot = await this.inventory.findByVariantId(mapping.variantId);

        if (!inventorySnapshot) {
            return {
                catalogItemSlug: mapping.catalogItemSlug,
                variantId: mapping.variantId,
                availability: {
                    status: 'sold_out',
                    label: 'Unavailable',
                },
                canPurchase: false,
            };
        }

        return {
            catalogItemSlug: mapping.catalogItemSlug,
            variantId: mapping.variantId,
            availability: {
                status: inventorySnapshot.status,
                label: createAvailabilityLabel(inventorySnapshot.status),
            },
            canPurchase: inventorySnapshot.canPurchase,
        };
    }
}
