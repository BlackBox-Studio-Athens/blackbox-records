import type { RecordStockCountInput, StockCountRecord, StockCountRepository } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStockCount(record: {
    actorEmail: string;
    countedQuantity: number;
    id: string;
    notes: string | null;
    onlineQuantity: number;
    recordedAt: Date;
    variantId: string;
}): StockCountRecord {
    return {
        actorEmail: record.actorEmail,
        countedQuantity: record.countedQuantity,
        id: record.id,
        notes: record.notes,
        onlineQuantity: record.onlineQuantity,
        recordedAt: record.recordedAt,
        variantId: record.variantId,
    };
}

export class PrismaStockCountRepository implements StockCountRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async listByVariantId(variantId: string, limit: number): Promise<StockCountRecord[]> {
        const records = await this.prisma.stockCount.findMany({
            orderBy: {
                recordedAt: 'desc',
            },
            take: limit,
            where: { variantId },
        });

        return records.map(mapStockCount);
    }

    public async record(input: RecordStockCountInput): Promise<StockCountRecord> {
        const record = await this.prisma.stockCount.create({
            data: {
                actorEmail: input.actorEmail,
                countedQuantity: input.countedQuantity,
                notes: input.notes,
                onlineQuantity: input.onlineQuantity,
                recordedAt: input.recordedAt,
                variantId: input.variantId,
            },
        });

        return mapStockCount(record);
    }
}
