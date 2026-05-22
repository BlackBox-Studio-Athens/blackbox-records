import type {
  StockCountRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, createStockState, parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, VariantNotFoundError } from './errors';
import type { RecordedStockCount } from './types';

export type RecordStockCountCommand = {
  variantId: unknown;
  countedQuantity: unknown;
  onlineQuantity: unknown;
  notes: string | null;
  actorEmail: string;
};

export async function recordStockCount(
  storeItemOptions: StoreItemOptionRepository,
  stock: StockRepository,
  stockCounts: StockCountRepository,
  command: RecordStockCountCommand,
): Promise<RecordedStockCount> {
  const variantId = parseVariantId(command.variantId);
  const storeItem = await storeItemOptions.findByVariantId(variantId);

  if (!storeItem) {
    throw new VariantNotFoundError(variantId);
  }

  let nextStock;
  try {
    nextStock = createStockState({
      onlineQuantity: createStockQuantity(command.onlineQuantity),
      quantity: createStockQuantity(command.countedQuantity),
    });
  } catch {
    throw new InvalidStockOperationError('Online stock cannot exceed counted stock.');
  }

  const savedStock = await stock.save(variantId, nextStock);

  const entry = await stockCounts.record({
    actorEmail: command.actorEmail,
    countedQuantity: nextStock.quantity,
    notes: command.notes,
    onlineQuantity: nextStock.onlineQuantity,
    variantId,
  });

  return {
    entry,
    stock: savedStock,
  };
}
