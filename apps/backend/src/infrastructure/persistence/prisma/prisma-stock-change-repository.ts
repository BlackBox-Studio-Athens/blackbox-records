import type { RecordStockChangeInput, StockChangeRecord, StockChangeRepository } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStockChange(record: {
    actorEmail: string;
    id: string;
    notes: string | null;
    quantityDelta: number;
    reason: string;
    recordedAt: Date;
    variantId: string;
}): StockChangeRecord {
    return {
        actorEmail: record.actorEmail,
        id: record.id,
        notes: record.notes,
        quantityDelta: record.quantityDelta,
        reason: record.reason,
        recordedAt: record.recordedAt,
        variantId: record.variantId,
    };
}

export class PrismaStockChangeRepository implements StockChangeRepository {
    public constructor(private readonly prisma: PrismaClient) {}

    public async listByVariantId(variantId: string, limit: number): Promise<StockChangeRecord[]> {
        const records = await this.prisma.stockChange.findMany({
            orderBy: {
                recordedAt: 'desc',
            },
            take: limit,
            where: { variantId },
        });

        return records.map(mapStockChange);
    }

    public async record(input: RecordStockChangeInput): Promise<StockChangeRecord> {
        const record = await this.prisma.stockChange.create({
            data: {
                actorEmail: input.actorEmail,
                notes: input.notes,
                quantityDelta: input.quantityDelta,
                reason: input.reason,
                recordedAt: input.recordedAt,
                variantId: input.variantId,
            },
        });

        return mapStockChange(record);
    }
}
