import type {
  StockChangeRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { createStockChangeDelta, createStockQuantity, parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, VariantNotFoundError } from './errors';
import type { RecordedStockChange } from './types';

export type RecordStockChangeCommand = {
  variantId: unknown;
  quantityDelta: unknown;
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
  const variantId = parseVariantId(command.variantId);
  const storeItem = await storeItemOptions.findByVariantId(variantId);

  if (!storeItem) {
    throw new VariantNotFoundError(variantId);
  }

  let quantityDelta;
  try {
    quantityDelta = createStockChangeDelta(command.quantityDelta);
  } catch {
    throw new InvalidStockOperationError('Stock change must use a non-zero whole-number quantity delta.');
  }
  const reason = command.reason.trim();

  if (!reason) {
    throw new InvalidStockOperationError('Stock change reason is required.');
  }

  const currentStock = await stock.findByVariantId(variantId);
  const nextQuantity = (currentStock?.quantity ?? 0) + quantityDelta;

  if (nextQuantity < 0) {
    throw new InvalidStockOperationError('Stock quantity cannot go below zero.');
  }

  const nextOnlineQuantity = clampOnlineQuantity((currentStock?.onlineQuantity ?? 0) + quantityDelta, nextQuantity);
  const savedStock = await stock.save(variantId, {
    onlineQuantity: createStockQuantity(nextOnlineQuantity),
    quantity: createStockQuantity(nextQuantity),
  });

  const entry = await stockChanges.record({
    actorEmail: command.actorEmail,
    notes: command.notes,
    quantityDelta,
    reason,
    variantId,
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
