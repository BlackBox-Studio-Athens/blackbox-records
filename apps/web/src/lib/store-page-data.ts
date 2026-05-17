import { getStoreItemBySlug, listStoreItems, type StoreItem } from './catalog-data';
import {
  getPrimaryAvailabilityForStoreItem,
  hasStructuredItemPrice,
  isPricedItemAvailability,
  type ItemAvailability,
} from './item-availability';
import type { CartLineItemSnapshot } from './store-cart';

export type StorePageEntry = {
  storeItem: StoreItem;
  primaryAvailability: ItemAvailability | null;
};

export type StorePagePricedCartSeed = Omit<CartLineItemSnapshot, 'availabilityLabel' | 'variantId'> & {
  availabilityLabel: string;
  variantId: string | null;
};

export async function getStorePageEntryBySlug(slug: string): Promise<StorePageEntry | null> {
  const storeItem = await getStoreItemBySlug(slug);

  if (!storeItem) {
    return null;
  }

  return {
    storeItem,
    primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
  };
}

export function createCartLineItemSnapshotForStorePage(
  storeItem: StoreItem,
  primaryAvailability: ItemAvailability | null,
  image: string | null,
): CartLineItemSnapshot | null {
  if (!isPricedItemAvailability(primaryAvailability)) {
    return null;
  }

  return {
    availabilityLabel: primaryAvailability.availability.label,
    image,
    imageAlt: storeItem.imageAlt,
    optionLabel: primaryAvailability.optionLabel,
    priceAmountMinor: primaryAvailability.price.amountMinor,
    priceCurrencyCode: primaryAvailability.price.currencyCode,
    priceDisplay: primaryAvailability.price.display,
    storeItemSlug: storeItem.slug,
    subtitle: storeItem.subtitle,
    title: storeItem.title,
    variantId: primaryAvailability.variantId,
  };
}

export function createPricedCartSeedForStorePage(
  storeItem: StoreItem,
  primaryAvailability: ItemAvailability | null,
  image: string | null,
): StorePagePricedCartSeed | null {
  if (!primaryAvailability || !hasStructuredItemPrice(primaryAvailability.price)) {
    return null;
  }

  return {
    availabilityLabel: primaryAvailability.availability.label,
    image,
    imageAlt: storeItem.imageAlt,
    optionLabel: primaryAvailability.optionLabel,
    priceAmountMinor: primaryAvailability.price.amountMinor,
    priceCurrencyCode: primaryAvailability.price.currencyCode,
    priceDisplay: primaryAvailability.price.display,
    storeItemSlug: storeItem.slug,
    subtitle: storeItem.subtitle,
    title: storeItem.title,
    variantId: primaryAvailability.variantId,
  };
}

export async function createStorePageStaticPaths() {
  const storeItems = await listStoreItems();

  return Promise.all(
    storeItems.map(async (storeItem) => ({
      params: { slug: storeItem.slug },
      props: {
        entry: {
          storeItem,
          primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
        } satisfies StorePageEntry,
      },
    })),
  );
}
