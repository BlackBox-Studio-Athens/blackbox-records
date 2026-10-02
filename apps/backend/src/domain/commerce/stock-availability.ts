import type { ItemAvailabilityRecord } from './repositories/item-availability-repository';
import type { StockRecord } from './repositories/stock-repository';

export type StoreStockAvailability = 'stocked' | 'sold_out' | 'out_of_stock' | 'unavailable';

export const storeStockAvailabilityLabels = {
  stocked: 'Available',
  sold_out: 'Sold Out',
  out_of_stock: 'Out of Stock',
  unavailable: 'Currently Unavailable',
} satisfies Record<StoreStockAvailability, string>;

export function classifyStoreStockAvailability(
  availability: Pick<ItemAvailabilityRecord, 'status' | 'canBuy'> | null,
  stock: Pick<StockRecord, 'onlineQuantity' | 'restockPlanned'> | null,
): StoreStockAvailability {
  if (!availability || (availability.status === 'available' && !availability.canBuy) || !stock) {
    return 'unavailable';
  }
  if (stock.onlineQuantity <= 0) return stock.restockPlanned ? 'out_of_stock' : 'sold_out';
  return availability.status === 'available' && availability.canBuy ? 'stocked' : 'unavailable';
}

export const LOW_STOCK_THRESHOLD = 5;

export function readLowStockQuantity(
  state: StoreStockAvailability,
  stock: Pick<StockRecord, 'onlineQuantity' | 'showLowStock'> | null,
): number | undefined {
  if (state !== 'stocked' || !stock?.showLowStock) return undefined;
  return stock.onlineQuantity >= 1 && stock.onlineQuantity <= LOW_STOCK_THRESHOLD ? stock.onlineQuantity : undefined;
}
