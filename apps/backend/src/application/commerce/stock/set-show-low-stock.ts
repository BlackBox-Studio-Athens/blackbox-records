import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, StockConflictError, VariantNotFoundError } from './errors';

export async function setShowLowStock(
  storeItemOptions: Pick<StoreItemOptionRepository, 'findByVariantId'>,
  stock: Pick<OperatorStockRepository, 'setShowLowStock'>,
  command: { expectedRevision: unknown; showLowStock: unknown; variantId: unknown },
) {
  const variantId = parseVariantId(command.variantId);
  if (!(await storeItemOptions.findByVariantId(variantId))) throw new VariantNotFoundError(variantId);
  if (typeof command.showLowStock !== 'boolean') {
    throw new InvalidStockOperationError('Show copies left must be true or false.');
  }

  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }

  const result = await stock.setShowLowStock({
    expectedRevision,
    showLowStock: command.showLowStock,
    variantId,
  });
  if (!result) throw new StockConflictError('Stock changed. Refresh before updating the copies-left notice.');
  return result;
}
