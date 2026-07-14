import type {
  ItemAvailabilityRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { parseStoreItemSlug, type StoreItemSlug, type VariantId } from '../../../domain/commerce';
import {
  createStoreOfferPriceFromCatalogPrice,
  hasBlockingCatalogIssue,
  type CatalogProductProjectionReader,
  type CatalogReconciler,
} from '../catalog-sync';
import type { StoreOffer } from './types';

type CatalogMutationPolicy = {
  applyCatalogMutations?: boolean;
};

function soldOutOffer(
  storeItemSlug: StoreItemSlug,
  variantId: VariantId,
  label: string,
): Extract<StoreOffer, { catalogStatus: 'sold_out' }> {
  return {
    storeItemSlug,
    variantId,
    availability: {
      status: 'sold_out',
      label,
    },
    canCheckout: false,
    catalogStatus: 'sold_out',
    price: null,
  };
}

function catalogDriftOffer(
  storeItemSlug: StoreItemSlug,
  variantId: VariantId,
): Extract<StoreOffer, { catalogStatus: 'catalog_drift' }> {
  return {
    storeItemSlug,
    variantId,
    availability: {
      status: 'unavailable',
      label: 'Checkout Paused',
    },
    canCheckout: false,
    catalogStatus: 'catalog_drift',
    price: null,
  };
}

function readyOffer(
  storeItemSlug: StoreItemSlug,
  variantId: VariantId,
  price: Extract<StoreOffer, { catalogStatus: 'ready' }>['price'],
): Extract<StoreOffer, { catalogStatus: 'ready' }> {
  return {
    storeItemSlug,
    variantId,
    availability: {
      status: 'available',
      label: 'Available',
    },
    canCheckout: true,
    catalogStatus: 'ready',
    price,
  };
}

export async function readStoreOffer(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  storeItemSlug: unknown,
  options: CatalogMutationPolicy = {},
): Promise<StoreOffer | null> {
  const parsedStoreItemSlug = parseStoreItemSlug(storeItemSlug);
  const storeItem = await storeItems.findByStoreItemSlug(parsedStoreItemSlug);

  if (!storeItem) {
    return null;
  }

  const availability = await itemAvailability.findByVariantId(storeItem.variantId);

  if (!availability) {
    return soldOutOffer(storeItem.storeItemSlug, storeItem.variantId, 'Unavailable');
  }

  if (availability.status !== 'available' || !availability.canBuy) {
    return soldOutOffer(storeItem.storeItemSlug, storeItem.variantId, 'Sold Out');
  }

  const currentStock = await stock.findByVariantId(storeItem.variantId);

  if (!currentStock || currentStock.onlineQuantity <= 0) {
    return soldOutOffer(storeItem.storeItemSlug, storeItem.variantId, 'Sold Out');
  }

  const productProjection = productProjections.findByStoreItem(storeItem);

  if (!productProjection) {
    return catalogDriftOffer(storeItem.storeItemSlug, storeItem.variantId);
  }

  const catalogResult = await catalogReconciler.reconcileVariant(storeItem, {
    apply: options.applyCatalogMutations ?? true,
    applyProductProjection: false,
    productProjection,
  });
  const resolvedPrice = catalogResult.resolvedPrice;
  const price = resolvedPrice ? createStoreOfferPriceFromCatalogPrice(resolvedPrice) : null;

  if (!price || hasBlockingCatalogIssue(catalogResult.issues)) {
    return catalogDriftOffer(storeItem.storeItemSlug, storeItem.variantId);
  }

  return readyOffer(storeItem.storeItemSlug, storeItem.variantId, price);
}

export async function listVariantOffersForStoreItem(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  storeItemSlug: unknown,
  options: CatalogMutationPolicy = {},
): Promise<StoreOffer[] | null> {
  const offer = await readStoreOffer(
    storeItems,
    itemAvailability,
    stock,
    catalogReconciler,
    productProjections,
    storeItemSlug,
    options,
  );

  return offer ? [offer] : null;
}
