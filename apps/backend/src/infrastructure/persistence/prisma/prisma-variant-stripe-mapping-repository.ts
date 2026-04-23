import type { VariantStripeMappingRecord, VariantStripeMappingRepository } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapVariantStripeMapping(record: {
    stripePriceId: string;
    variantId: string;
}): VariantStripeMappingRecord {
    return {
        variantId: record.variantId,
        stripePriceId: record.stripePriceId,
    };
}

export class PrismaVariantStripeMappingRepository implements VariantStripeMappingRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async findByVariantId(variantId: string): Promise<VariantStripeMappingRecord | null> {
        const record = await this.prisma.variantStripeMapping.findUnique({
            where: { variantId },
        });

        return record ? mapVariantStripeMapping(record) : null;
    }
}
