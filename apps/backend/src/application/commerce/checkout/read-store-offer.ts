import type {
  ItemAvailabilityRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { parseStoreItemSlug, type StoreItemSlug, type VariantId } from '../../../domain/commerce';
import {
  createStoreOfferPrice,
  hasBlockingCatalogIssue,
  type CatalogProductProjectionReader,
  type CatalogReconciler,
} from '../catalog-sync';
import type { StoreOffer } from './types';

function unavailableOffer(
  storeItemSlug: StoreItemSlug,
  variantId: VariantId,
  label: string,
  catalogStatus: StoreOffer['catalogStatus'] = 'sold_out',
): StoreOffer {
  return {
    storeItemSlug,
    variantId,
    availability: {
      status: 'sold_out',
      label,
    },
    canCheckout: false,
    catalogStatus,
    price: null,
  };
}

export async function readStoreOffer(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
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

  const productProjection = productProjections.findByStoreItem(storeItem);

  if (!productProjection) {
    return unavailableOffer(storeItem.storeItemSlug, storeItem.variantId, 'Checkout Paused', 'catalog_drift');
  }

  const catalogResult = await catalogReconciler.reconcileVariant(storeItem, { apply: true, productProjection });
  const resolvedPrice = catalogResult.resolvedPrice;

  if (
    !resolvedPrice ||
    resolvedPrice.amountMinor === null ||
    !resolvedPrice.currencyCode ||
    hasBlockingCatalogIssue(catalogResult.issues)
  ) {
    return unavailableOffer(storeItem.storeItemSlug, storeItem.variantId, 'Checkout Paused', 'catalog_drift');
  }

  return {
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
    availability: {
      status: 'available',
      label: 'Available',
    },
    canCheckout: true,
    catalogStatus: 'ready',
    price: createStoreOfferPrice({
      amountMinor: resolvedPrice.amountMinor,
      currencyCode: resolvedPrice.currencyCode,
    }),
  };
}

export async function listVariantOffersForStoreItem(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  storeItemSlug: unknown,
): Promise<StoreOffer[] | null> {
  const offer = await readStoreOffer(
    storeItems,
    itemAvailability,
    stock,
    catalogReconciler,
    productProjections,
    storeItemSlug,
  );

  return offer ? [offer] : null;
}
