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
}
