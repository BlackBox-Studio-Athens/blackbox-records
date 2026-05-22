import type { StockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { parseVariantId } from '../../../domain/commerce';
import { VariantNotFoundError } from './errors';
import type { VariantStockDetail } from './types';

export async function readVariantStock(
  storeItemOptions: StoreItemOptionRepository,
  stock: StockRepository,
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
    stock: {
      quantity: currentStock?.quantity ?? 0,
      onlineQuantity: currentStock?.onlineQuantity ?? 0,
      updatedAt: currentStock?.updatedAt ?? null,
    },
  };
}
