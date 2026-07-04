import { getStoreItemBySlug, listStoreItems, type StoreItem } from './catalog-data';
import { getPrimaryAvailabilityForStoreItem, type ItemAvailability } from './item-availability';
import type { CartLineItemSnapshot } from './store-cart';

export type StorePageEntry = {
  storeItem: StoreItem;
  primaryAvailability: ItemAvailability | null;
};

export type StorePagePricedCartSeed = Omit<
  CartLineItemSnapshot,
  'availabilityLabel' | 'priceAmountMinor' | 'priceCurrencyCode' | 'priceDisplay' | 'priceKind' | 'variantId'
> & {
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
  void storeItem;
  void primaryAvailability;
  void image;

  return null;
}

export function createPricedCartSeedForStorePage(
  storeItem: StoreItem,
  primaryAvailability: ItemAvailability | null,
  image: string | null,
): StorePagePricedCartSeed | null {
  if (!primaryAvailability?.variantId) {
    return null;
  }

  return {
    availabilityLabel: primaryAvailability.availability.label,
    image,
    imageAlt: storeItem.imageAlt,
    optionLabel: primaryAvailability.optionLabel,
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
