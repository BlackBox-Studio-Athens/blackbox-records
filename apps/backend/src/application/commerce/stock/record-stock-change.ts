import type {
  StockChangeRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories';
import { InvalidStockOperationError, VariantNotFoundError } from './errors';
import type { RecordedStockChange } from './types';

export type RecordStockChangeCommand = {
  variantId: string;
  quantityDelta: number;
  reason: string;
  notes: string | null;
  actorEmail: string;
};

export async function recordStockChange(
  storeItemOptions: StoreItemOptionRepository,
  stock: StockRepository,
  stockChanges: StockChangeRepository,
  command: RecordStockChangeCommand,
): Promise<RecordedStockChange> {
  const storeItem = await storeItemOptions.findByVariantId(command.variantId);

  if (!storeItem) {
    throw new VariantNotFoundError(command.variantId);
  }

  const quantityDelta = command.quantityDelta;
  const reason = command.reason.trim();

  if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
    throw new InvalidStockOperationError('Stock change must use a non-zero whole-number quantity delta.');
  }

  if (!reason) {
    throw new InvalidStockOperationError('Stock change reason is required.');
  }

  const currentStock = await stock.findByVariantId(command.variantId);
  const nextQuantity = (currentStock?.quantity ?? 0) + quantityDelta;

  if (nextQuantity < 0) {
    throw new InvalidStockOperationError('Stock quantity cannot go below zero.');
  }

  const nextOnlineQuantity = clampOnlineQuantity((currentStock?.onlineQuantity ?? 0) + quantityDelta, nextQuantity);
  const savedStock = await stock.save(command.variantId, {
    onlineQuantity: nextOnlineQuantity,
    quantity: nextQuantity,
  });

  const entry = await stockChanges.record({
    actorEmail: command.actorEmail,
    notes: command.notes,
    quantityDelta,
    reason,
    variantId: command.variantId,
  });

  return {
    entry,
    stock: savedStock,
  };
}

function clampOnlineQuantity(onlineQuantity: number, quantity: number): number {
  if (onlineQuantity < 0) {
    return 0;
  }

  if (onlineQuantity > quantity) {
    return quantity;
  }

  return onlineQuantity;
}
