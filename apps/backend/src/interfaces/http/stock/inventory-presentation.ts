import { classifyStoreStockAvailability, createStockQuantity } from '../../../domain/commerce';
import type { InventoryPage } from '../../../domain/commerce/repositories/spi';

export function presentInventory(page: InventoryPage, listed: Set<string> | null) {
  return {
    ...page,
    items: page.items.map(({ zeroStockState, availabilityStatus, availabilityCanBuy, ...item }) => ({
      ...item,
      websiteListing:
        listed === null
          ? ('unknown' as const)
          : listed.has(item.storeItemSlug)
            ? ('listed' as const)
            : ('not_listed' as const),
      availabilityState: classifyStoreStockAvailability(
        availabilityStatus === null ? null : { status: availabilityStatus, canBuy: Boolean(availabilityCanBuy) },
        item.onlineQuantity === null
          ? null
          : { onlineQuantity: createStockQuantity(item.onlineQuantity), zeroStockState: zeroStockState ?? 'sold_out' },
      ),
    })),
  };
}
