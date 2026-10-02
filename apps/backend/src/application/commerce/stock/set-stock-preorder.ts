import type {
  OperatorStockRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  athensToday,
  isPreorderOpen,
  parsePreorderShipEstimate,
  parseVariantId,
  samePreorderShipEstimate,
} from '../../../domain/commerce';
import { InvalidStockOperationError, StockConflictError, VariantNotFoundError } from './errors';

export async function setStockPreorder(
  storeItemOptions: Pick<StoreItemOptionRepository, 'findByVariantId'>,
  stock: Pick<StockRepository, 'findByVariantId'>,
  operatorStock: Pick<OperatorStockRepository, 'setStockPreorder'>,
  command: { expectedRevision: unknown; shipEstimate: unknown; variantId: unknown },
  now = new Date(),
) {
  const variantId = parseVariantId(command.variantId);
  if (!(await storeItemOptions.findByVariantId(variantId))) throw new VariantNotFoundError(variantId);
  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }
  const today = athensToday(now);
  let shipEstimate;
  try {
    shipEstimate = command.shipEstimate === null ? null : parsePreorderShipEstimate(command.shipEstimate);
  } catch {
    throw new InvalidStockOperationError('Choose a valid ship month or exact date.');
  }
  if (
    shipEstimate &&
    (shipEstimate.kind === 'month' ? shipEstimate.month < today.slice(0, 7) : shipEstimate.date <= today)
  ) {
    throw new InvalidStockOperationError('Choose a month that has not passed or a date after today.');
  }
  const current = await stock.findByVariantId(variantId);
  if ((current?.revision ?? null) !== expectedRevision)
    throw new StockConflictError('Stock changed. Refresh before updating the pre-order.');
  const previous = current?.preorder ?? null;
  if (
    (!shipEstimate && !previous) ||
    (shipEstimate && previous && samePreorderShipEstimate(previous.shipEstimate, shipEstimate))
  )
    return current;
  const preorder = shipEstimate
    ? {
        shipEstimate,
        startedAt: previous && isPreorderOpen(previous, today) ? previous.startedAt : now.toISOString(),
      }
    : null;
  const result = await operatorStock.setStockPreorder({ expectedRevision, preorder, variantId });
  if (!result) throw new StockConflictError('Stock changed. Refresh before updating the pre-order.');
  return result;
}
