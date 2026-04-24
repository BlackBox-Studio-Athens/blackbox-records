import type { StockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories';
import { VariantNotFoundError } from './errors';
import type { VariantStockDetail } from './types';

export async function readVariantStock(
    storeItemOptions: StoreItemOptionRepository,
    stock: StockRepository,
    variantId: string,
): Promise<VariantStockDetail> {
    const storeItem = await storeItemOptions.findByVariantId(variantId);

    if (!storeItem) {
        throw new VariantNotFoundError(variantId);
    }

    const currentStock = await stock.findByVariantId(variantId);

    return {
        ...storeItem,
        stock: {
            quantity: currentStock?.quantity ?? 0,
            onlineQuantity: currentStock?.onlineQuantity ?? 0,
            updatedAt: currentStock?.updatedAt ?? null,
        },
    };
}
