import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, StockConflictError, VariantNotFoundError } from './errors';

export async function setRestockPlanned(
  storeItemOptions: Pick<StoreItemOptionRepository, 'findByVariantId'>,
  stock: Pick<OperatorStockRepository, 'setRestockPlanned'>,
  command: { expectedRevision: unknown; restockPlanned: unknown; variantId: unknown },
) {
  const variantId = parseVariantId(command.variantId);
  if (!(await storeItemOptions.findByVariantId(variantId))) throw new VariantNotFoundError(variantId);
  if (typeof command.restockPlanned !== 'boolean') {
    throw new InvalidStockOperationError('Restock planned must be true or false.');
  }

  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }

  const result = await stock.setRestockPlanned({
    expectedRevision,
    restockPlanned: command.restockPlanned,
    variantId,
  });
  if (!result) throw new StockConflictError('Stock changed. Refresh before updating the restock plan.');
  return result;
}
