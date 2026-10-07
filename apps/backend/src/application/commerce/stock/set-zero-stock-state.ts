import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import {
  athensToday,
  isCalendarMonth,
  isMonthPassed,
  parseVariantId,
  ZERO_STOCK_STATES,
  type ZeroStockState,
} from '../../../domain/commerce';
import { InvalidStockOperationError, StockConflictError, VariantNotFoundError } from './errors';

export async function setZeroStockState(
  storeItemOptions: Pick<StoreItemOptionRepository, 'findByVariantId'>,
  stock: Pick<OperatorStockRepository, 'setZeroStockState'>,
  command: { expectedRevision: unknown; zeroStockState: unknown; expectedMonth: unknown; variantId: unknown },
  now = new Date(),
) {
  const variantId = parseVariantId(command.variantId);
  if (!(await storeItemOptions.findByVariantId(variantId))) throw new VariantNotFoundError(variantId);
  const zeroStock = parseZeroStockChoice(command, athensToday(now));

  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }

  const result = await stock.setZeroStockState({ expectedRevision, ...zeroStock, variantId });
  if (!result) throw new StockConflictError('Stock changed. Refresh before updating the zero-stock state.');
  return result;
}

/** Validates a zero-stock choice: Sold Out never keeps a month; a month must be a real one that has not passed. */
export function parseZeroStockChoice(
  input: { zeroStockState: unknown; expectedMonth?: unknown },
  today: string,
): { zeroStockState: ZeroStockState; expectedMonth: string | null } {
  const { zeroStockState, expectedMonth = null } = input;
  if (!ZERO_STOCK_STATES.includes(zeroStockState as ZeroStockState)) {
    throw new InvalidStockOperationError('Choose Coming Soon, Repressing or Sold Out.');
  }
  if (zeroStockState === 'sold_out' || expectedMonth === null) {
    return { zeroStockState: zeroStockState as ZeroStockState, expectedMonth: null };
  }
  if (!isCalendarMonth(expectedMonth) || isMonthPassed(expectedMonth, today)) {
    throw new InvalidStockOperationError('Choose an expected month that has not passed.');
  }
  return { zeroStockState: zeroStockState as ZeroStockState, expectedMonth };
}
