export type InventoryAvailabilityStatus = 'available' | 'sold_out';

export type InventorySnapshotRecord = {
    variantId: string;
    status: InventoryAvailabilityStatus;
    canPurchase: boolean;
    updatedAt: Date;
};

export interface InventoryRepository {
    findByVariantId(variantId: string): Promise<InventorySnapshotRecord | null>;
}
