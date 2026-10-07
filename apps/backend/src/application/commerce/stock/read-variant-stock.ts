import type {
  AvailabilityAlertRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { parseVariantId } from '../../../domain/commerce';
import { VariantNotFoundError } from './errors';
import type { VariantStockDetail } from './types';

export async function readVariantStock(
  storeItemOptions: StoreItemOptionRepository,
  stock: StockRepository,
  alerts: Pick<AvailabilityAlertRepository, 'countWaiting'>,
  variantId: unknown,
): Promise<VariantStockDetail> {
  const parsedVariantId = parseVariantId(variantId);
  const storeItem = await storeItemOptions.findByVariantId(parsedVariantId);

  if (!storeItem) {
    throw new VariantNotFoundError(parsedVariantId);
  }

  const currentStock = await stock.findByVariantId(parsedVariantId);

  return {
    ...storeItem,
    availabilityAlertCount: await alerts.countWaiting(parsedVariantId),
    stock: {
      revision: currentStock?.revision ?? null,
      quantity: currentStock?.quantity ?? 0,
      onlineQuantity: currentStock?.onlineQuantity ?? 0,
      zeroStockState: currentStock?.zeroStockState ?? 'sold_out',
      expectedMonth: currentStock?.expectedMonth ?? null,
      showLowStock: currentStock?.showLowStock ?? false,
      preorder: currentStock?.preorder ?? null,
      updatedAt: currentStock?.updatedAt ?? null,
    },
  };
}
