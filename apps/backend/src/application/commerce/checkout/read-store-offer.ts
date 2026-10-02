import type {
  ItemAvailabilityRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  athensToday,
  classifyStoreStockAvailability,
  deriveShopperPreorder,
  parseStoreItemSlug,
  readLowStockQuantity,
  storeStockAvailabilityLabels,
  type StoreItemSlug,
  type VariantId,
} from '../../../domain/commerce';
import {
  createStoreOfferPriceFromCatalogPrice,
  hasBlockingCatalogIssue,
  type CatalogProductProjectionReader,
  type CatalogReconciler,
} from '../catalog-sync';
import type { StoreOffer } from './types';

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
  lowStockQuantity: number | undefined,
  preorder: Extract<StoreOffer, { catalogStatus: 'ready' }>['preorder'],
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
    ...(lowStockQuantity === undefined ? {} : { lowStockQuantity }),
    preorder,
    price,
  };
}

export async function readStoreOffer(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: Pick<StockRepository, 'findByVariantId'>,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  storeItemSlug: unknown,
  now?: Date,
): Promise<StoreOffer | null> {
  const parsedStoreItemSlug = parseStoreItemSlug(storeItemSlug);
  const storeItem = await storeItems.findByStoreItemSlug(parsedStoreItemSlug);

  if (!storeItem) {
    return null;
  }

  const availability = await itemAvailability.findByVariantId(storeItem.variantId);

  const currentStock =
    availability && !(availability.status === 'available' && !availability.canBuy)
      ? await stock.findByVariantId(storeItem.variantId)
      : null;
  const stockAvailability = classifyStoreStockAvailability(availability, currentStock);
  if (stockAvailability !== 'stocked') {
    return soldOutOffer(storeItem.storeItemSlug, storeItem.variantId, storeStockAvailabilityLabels[stockAvailability]);
  }

  const productProjection = await productProjections.findByStoreItem(storeItem);

  if (!productProjection) {
    return catalogDriftOffer(storeItem.storeItemSlug, storeItem.variantId);
  }

  const catalogResult = await catalogReconciler.reconcileVariant(storeItem, {
    apply: false,
    applyProductProjection: false,
    productProjection,
  });
  const resolvedPrice = catalogResult.resolvedPrice;
  const price = resolvedPrice ? createStoreOfferPriceFromCatalogPrice(resolvedPrice) : null;

  if (!price || hasBlockingCatalogIssue(catalogResult.issues)) {
    return catalogDriftOffer(storeItem.storeItemSlug, storeItem.variantId);
  }

  return readyOffer(
    storeItem.storeItemSlug,
    storeItem.variantId,
    price,
    readLowStockQuantity(stockAvailability, currentStock),
    deriveShopperPreorder(currentStock?.preorder ?? null, athensToday(now)),
  );
}

export async function listVariantOffersForStoreItem(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: Pick<StockRepository, 'findByVariantId'>,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  storeItemSlug: unknown,
  now?: Date,
): Promise<StoreOffer[] | null> {
  const offer = await readStoreOffer(
    storeItems,
    itemAvailability,
    stock,
    catalogReconciler,
    productProjections,
    storeItemSlug,
    now,
  );

  return offer ? [offer] : null;
}
