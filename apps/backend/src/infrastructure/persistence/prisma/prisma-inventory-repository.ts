import type { InventoryRepository, InventorySnapshotRecord } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapInventorySnapshot(record: {
    canPurchase: boolean;
    status: 'available' | 'sold_out';
    updatedAt: Date;
    variantId: string;
}): InventorySnapshotRecord {
    return {
        canPurchase: record.canPurchase,
        status: record.status,
        updatedAt: record.updatedAt,
        variantId: record.variantId,
    };
}

export class PrismaInventoryRepository implements InventoryRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async findByVariantId(variantId: string): Promise<InventorySnapshotRecord | null> {
        const record = await this.prisma.variantInventorySnapshot.findUnique({
            where: { variantId },
        });

        return record ? mapInventorySnapshot(record) : null;
    }
}
