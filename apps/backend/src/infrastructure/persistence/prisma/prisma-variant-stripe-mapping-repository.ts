import type {
  VariantStripeMappingRecord,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import { parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapVariantStripeMapping(record: { stripePriceId: string; variantId: string }): VariantStripeMappingRecord {
  return {
    variantId: parseVariantId(record.variantId),
    stripePriceId: parseStripePriceId(record.stripePriceId),
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

  public async save(record: VariantStripeMappingRecord): Promise<VariantStripeMappingRecord> {
    const savedRecord = await this.prisma.variantStripeMapping.upsert({
      create: {
        stripePriceId: record.stripePriceId,
        variantId: record.variantId,
      },
      update: {
        stripePriceId: record.stripePriceId,
      },
      where: {
        variantId: record.variantId,
      },
    });

    return mapVariantStripeMapping(savedRecord);
  }
}
