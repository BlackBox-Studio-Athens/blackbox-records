import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { createStockChangeDelta, parseVariantId } from '../../../domain/commerce';
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
  stock: OperatorStockRepository,
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

  const result = await stock.recordChange({
    actorEmail: command.actorEmail,
    notes: command.notes,
    quantityDelta,
    reason,
    variantId,
  });

  if (!result) {
    throw new InvalidStockOperationError('Stock quantity cannot go below zero.');
  }
  return result;
}
