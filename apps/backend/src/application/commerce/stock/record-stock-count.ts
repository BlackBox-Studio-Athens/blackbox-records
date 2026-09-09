import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, createStockState, parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, StockConflictError, VariantNotFoundError } from './errors';
import type { RecordedStockCount } from './types';

export type RecordStockCountCommand = {
  expectedRevision: unknown;
  variantId: unknown;
  countedQuantity: unknown;
  onlineQuantity: unknown;
  notes: string | null;
  actorEmail: string;
};

export async function recordStockCount(
  storeItemOptions: StoreItemOptionRepository,
  stock: OperatorStockRepository,
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

  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }

  const result = await stock.recordCount({
    expectedRevision,
    actorEmail: command.actorEmail,
    countedQuantity: nextStock.quantity,
    notes: command.notes,
    onlineQuantity: nextStock.onlineQuantity,
    variantId,
  });

  if (!result) throw new StockConflictError();
  return result;
}
