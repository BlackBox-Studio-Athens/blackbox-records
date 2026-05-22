import type {
  ItemAvailabilityRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { parseStoreItemSlug, type StoreItemSlug, type VariantId } from '../../../domain/commerce';
import type { StoreOffer } from './types';

function unavailableOffer(storeItemSlug: StoreItemSlug, variantId: VariantId, label: string): StoreOffer {
  return {
    storeItemSlug,
    variantId,
    availability: {
      status: 'sold_out',
      label,
    },
    canCheckout: false,
  };
}

export async function readStoreOffer(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  storeItemSlug: unknown,
): Promise<StoreOffer | null> {
  const parsedStoreItemSlug = parseStoreItemSlug(storeItemSlug);
  const storeItem = await storeItems.findByStoreItemSlug(parsedStoreItemSlug);

  if (!storeItem) {
    return null;
  }

  const availability = await itemAvailability.findByVariantId(storeItem.variantId);

  if (!availability) {
    return unavailableOffer(storeItem.storeItemSlug, storeItem.variantId, 'Unavailable');
  }

  if (availability.status !== 'available' || !availability.canBuy) {
    return unavailableOffer(storeItem.storeItemSlug, storeItem.variantId, 'Sold Out');
  }

  const currentStock = await stock.findByVariantId(storeItem.variantId);

  if (!currentStock || currentStock.onlineQuantity <= 0) {
    return unavailableOffer(storeItem.storeItemSlug, storeItem.variantId, 'Sold Out');
  }

  return {
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
    availability: {
      status: 'available',
      label: 'Available',
    },
    canCheckout: true,
  };
}

export async function listVariantOffersForStoreItem(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  storeItemSlug: unknown,
): Promise<StoreOffer[] | null> {
  const offer = await readStoreOffer(storeItems, itemAvailability, stock, storeItemSlug);

  return offer ? [offer] : null;
}
