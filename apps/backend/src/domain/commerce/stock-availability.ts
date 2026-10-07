import type { ItemAvailabilityRecord } from './repositories/item-availability-repository';
import type { StockRecord } from './repositories/stock-repository';
import { isMonthPassed } from './preorder';
import type { ZeroStockState } from './zero-stock-state';

export { ZERO_STOCK_STATES, type ZeroStockState } from './zero-stock-state';

export type StoreStockAvailability = 'stocked' | ZeroStockState | 'unavailable';

export const storeStockAvailabilityLabels = {
  stocked: 'Available',
  coming_soon: 'Coming Soon',
  repressing: 'Repressing',
  sold_out: 'Sold Out',
  unavailable: 'Unavailable',
} satisfies Record<StoreStockAvailability, string>;

export function classifyStoreStockAvailability(
  availability: Pick<ItemAvailabilityRecord, 'status' | 'canBuy'> | null,
  stock: Pick<StockRecord, 'onlineQuantity' | 'zeroStockState'> | null,
): StoreStockAvailability {
  if (!availability || (availability.status === 'available' && !availability.canBuy)) return 'unavailable';
  // No stock record yet means no copies: it reads as depleted with the default choice.
  if (!stock || stock.onlineQuantity <= 0) return stock?.zeroStockState ?? 'sold_out';
  return availability.status === 'available' && availability.canBuy ? 'stocked' : 'unavailable';
}

/** The expected month of a Coming Soon or Repressing item, until that month has passed in Europe/Athens. */
export function readExpectedMonth(
  state: StoreStockAvailability,
  stock: Pick<StockRecord, 'expectedMonth'> | null,
  today: string,
): string | undefined {
  if ((state !== 'coming_soon' && state !== 'repressing') || !stock?.expectedMonth) return undefined;
  return isMonthPassed(stock.expectedMonth, today) ? undefined : stock.expectedMonth;
}

export const LOW_STOCK_THRESHOLD = 5;

export function readLowStockQuantity(
  state: StoreStockAvailability,
  stock: Pick<StockRecord, 'onlineQuantity' | 'showLowStock'> | null,
): number | undefined {
  if (state !== 'stocked' || !stock?.showLowStock) return undefined;
  return stock.onlineQuantity >= 1 && stock.onlineQuantity <= LOW_STOCK_THRESHOLD ? stock.onlineQuantity : undefined;
}
