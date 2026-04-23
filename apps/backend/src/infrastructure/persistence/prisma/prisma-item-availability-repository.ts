import type { ItemAvailabilityRecord, ItemAvailabilityRepository } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapItemAvailability(record: {
    canBuy: boolean;
    status: 'available' | 'sold_out';
    updatedAt: Date;
    variantId: string;
}): ItemAvailabilityRecord {
    return {
        canBuy: record.canBuy,
        status: record.status,
        updatedAt: record.updatedAt,
        variantId: record.variantId,
    };
}

export class PrismaItemAvailabilityRepository implements ItemAvailabilityRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async findByVariantId(variantId: string): Promise<ItemAvailabilityRecord | null> {
        const record = await this.prisma.itemAvailability.findUnique({
            where: { variantId },
        });

        return record ? mapItemAvailability(record) : null;
    }
}
