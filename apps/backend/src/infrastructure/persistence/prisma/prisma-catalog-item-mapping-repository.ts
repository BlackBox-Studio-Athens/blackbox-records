import type {
    CatalogItemMappingRecord,
    CatalogItemMappingRepository,
    CatalogSourceRef,
} from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapCatalogItemMapping(record: {
    catalogItemSlug: string;
    sourceKind: 'release' | 'distro';
    sourceId: string;
    variantId: string;
}): CatalogItemMappingRecord {
    return {
        catalogItemSlug: record.catalogItemSlug,
        sourceKind: record.sourceKind,
        sourceId: record.sourceId,
        variantId: record.variantId,
    };
}

export class PrismaCatalogItemMappingRepository implements CatalogItemMappingRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async findByCatalogItemSlug(catalogItemSlug: string): Promise<CatalogItemMappingRecord | null> {
        const record = await this.prisma.catalogItemMapping.findUnique({
            where: { catalogItemSlug },
        });

        return record ? mapCatalogItemMapping(record) : null;
    }

    public async findBySource(source: CatalogSourceRef): Promise<CatalogItemMappingRecord | null> {
        const record = await this.prisma.catalogItemMapping.findUnique({
            where: {
                sourceKind_sourceId: {
                    sourceId: source.sourceId,
                    sourceKind: source.sourceKind,
                },
            },
        });

        return record ? mapCatalogItemMapping(record) : null;
    }
}
