import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
} from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStoreItemOption(record: {
  storeItemSlug: string;
  sourceKind: 'release' | 'distro';
  sourceId: string;
  variantId: string;
}): StoreItemOptionRecord {
  return {
    storeItemSlug: record.storeItemSlug,
    sourceKind: record.sourceKind,
    sourceId: record.sourceId,
    variantId: record.variantId,
  };
}

export class PrismaStoreItemOptionRepository implements StoreItemOptionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByStoreItemSlug(storeItemSlug: string): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: { storeItemSlug },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async findByVariantId(variantId: string): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: { variantId },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: {
        sourceKind_sourceId: {
          sourceId: source.sourceId,
          sourceKind: source.sourceKind,
        },
      },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async search(query: string | null, limit: number): Promise<StoreItemOptionRecord[]> {
    const trimmedQuery = query?.trim() ?? '';

    const records = await this.prisma.storeItemOption.findMany({
      orderBy: {
        storeItemSlug: 'asc',
      },
      take: limit,
      where:
        trimmedQuery.length === 0
          ? undefined
          : {
              OR: [
                { sourceId: { contains: trimmedQuery } },
                { storeItemSlug: { contains: trimmedQuery } },
                { variantId: { contains: trimmedQuery } },
              ],
            },
    });

    return records.map(mapStoreItemOption);
  }
}
