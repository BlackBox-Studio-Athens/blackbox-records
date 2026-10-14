import { getStoreItemBySlug, listStoreItems, type StoreItem } from '@/lib/catalog-data';
import { createStoreItemAvailability, type ItemAvailability } from '@/lib/item-availability';
import type { CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import type { StoreItemCartSeed } from '@/components/store/checkout/StoreItemPurchaseActions';
import { getImage } from 'astro:assets';
import { getEntry } from '@/lib/content-reader';
import type { ProductSafetyInformation } from '@/platform/components/ProductSafetyDisclosure';

export type StorePageEntry = {
  storeItem: StoreItem;
  primaryAvailability: ItemAvailability | null;
};

export type StorePagePricedCartSeed = StoreItemCartSeed;

export async function getStorePageEntryBySlug(slug: string): Promise<StorePageEntry | null> {
  const storeItem = await getStoreItemBySlug(slug);

  if (!storeItem) {
    return null;
  }

  return {
    storeItem,
    primaryAvailability: createStoreItemAvailability(storeItem),
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

const cartThumbnails = new WeakMap<StoreItem['image'], Promise<string>>();

export async function createPricedCartSeedForStorePage(
  storeItem: StoreItem,
  primaryAvailability: ItemAvailability | null,
  image: string | null,
): Promise<StorePagePricedCartSeed | null> {
  if (!primaryAvailability?.variantId) {
    return null;
  }

  let thumbnail: string | null = null;
  if (image) {
    let pending = cartThumbnails.get(storeItem.image);
    if (!pending) {
      pending = getImage({ src: storeItem.image, width: 176, format: 'webp' }).then(({ src }) => src);
      cartThumbnails.set(storeItem.image, pending);
    }
    thumbnail = await pending;
  }

  return {
    availabilityLabel: primaryAvailability.availability.label,
    image: thumbnail,
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

  return storeItems.map((storeItem) => ({
    params: { slug: storeItem.slug },
    props: {
      entry: {
        storeItem,
        primaryAvailability: createStoreItemAvailability(storeItem),
      } satisfies StorePageEntry,
    },
  }));
}

/** Verified public GPSR projection of the Store Item's Release or Distro source; absent when unverified. */
export async function getStoreItemProductSafety(storeItem: StoreItem): Promise<ProductSafetyInformation | undefined> {
  const source =
    storeItem.sourceKind === 'release'
      ? await getEntry('releases', storeItem.sourceId)
      : await getEntry('distro', storeItem.sourceId);
  return source?.data.product_safety;
}

/**
 * Store Item slug -> public product safety, for checkout lines added without visiting the item page. Read on every
 * render: hosted rendering selects the published snapshot per request, so a module-level cache would go stale.
 */
export async function listStoreProductSafety(): Promise<Record<string, ProductSafetyInformation>> {
  const entries = await Promise.all(
    (await listStoreItems()).map(
      async (storeItem) => [storeItem.slug, await getStoreItemProductSafety(storeItem)] as const,
    ),
  );
  return Object.fromEntries(entries.filter((entry): entry is [string, ProductSafetyInformation] => Boolean(entry[1])));
}
