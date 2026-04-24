import type {
    StockChangeRepository,
    StockCountRepository,
    StoreItemOptionRepository,
} from '../../../domain/commerce/repositories';
import { VariantNotFoundError } from './errors';
import type { VariantStockHistoryEntry } from './types';

export async function readVariantStockHistory(
    storeItemOptions: StoreItemOptionRepository,
    stockChanges: StockChangeRepository,
    stockCounts: StockCountRepository,
    variantId: string,
    limit = 50,
): Promise<VariantStockHistoryEntry[]> {
    const storeItem = await storeItemOptions.findByVariantId(variantId);

    if (!storeItem) {
        throw new VariantNotFoundError(variantId);
    }

    const [changes, counts] = await Promise.all([
        stockChanges.listByVariantId(variantId, limit),
        stockCounts.listByVariantId(variantId, limit),
    ]);

    const entries: VariantStockHistoryEntry[] = [
        ...changes.map((entry) => ({
            actorEmail: entry.actorEmail,
            id: entry.id,
            notes: entry.notes,
            quantityDelta: entry.quantityDelta,
            reason: entry.reason,
            recordedAt: entry.recordedAt,
            type: 'change' as const,
            variantId: entry.variantId,
        })),
        ...counts.map((entry) => ({
            actorEmail: entry.actorEmail,
            countedQuantity: entry.countedQuantity,
            id: entry.id,
            notes: entry.notes,
            onlineQuantity: entry.onlineQuantity,
            recordedAt: entry.recordedAt,
            type: 'count' as const,
            variantId: entry.variantId,
        })),
    ];

    return entries
        .sort((left, right) => right.recordedAt.getTime() - left.recordedAt.getTime())
        .slice(0, limit);
}
