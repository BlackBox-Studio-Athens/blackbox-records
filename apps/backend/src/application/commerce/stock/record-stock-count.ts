import type {
    StockCountRepository,
    StockRepository,
    StoreItemOptionRepository,
} from '../../../domain/commerce/repositories';
import { InvalidStockOperationError, VariantNotFoundError } from './errors';
import type { RecordedStockCount } from './types';

export type RecordStockCountCommand = {
    variantId: string;
    countedQuantity: number;
    onlineQuantity: number;
    notes: string | null;
    actorEmail: string;
};

export async function recordStockCount(
    storeItemOptions: StoreItemOptionRepository,
    stock: StockRepository,
    stockCounts: StockCountRepository,
    command: RecordStockCountCommand,
): Promise<RecordedStockCount> {
    const storeItem = await storeItemOptions.findByVariantId(command.variantId);

    if (!storeItem) {
        throw new VariantNotFoundError(command.variantId);
    }

    if (!Number.isInteger(command.countedQuantity) || command.countedQuantity < 0) {
        throw new InvalidStockOperationError('Stock count must use a whole-number counted quantity of zero or more.');
    }

    if (!Number.isInteger(command.onlineQuantity) || command.onlineQuantity < 0) {
        throw new InvalidStockOperationError('Online stock must use a whole-number quantity of zero or more.');
    }

    if (command.onlineQuantity > command.countedQuantity) {
        throw new InvalidStockOperationError('Online stock cannot exceed counted stock.');
    }

    const savedStock = await stock.save(command.variantId, {
        onlineQuantity: command.onlineQuantity,
        quantity: command.countedQuantity,
    });

    const entry = await stockCounts.record({
        actorEmail: command.actorEmail,
        countedQuantity: command.countedQuantity,
        notes: command.notes,
        onlineQuantity: command.onlineQuantity,
        variantId: command.variantId,
    });

    return {
        entry,
        stock: savedStock,
    };
}
