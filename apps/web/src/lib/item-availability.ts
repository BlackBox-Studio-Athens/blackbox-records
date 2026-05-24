import { getStoreItemBySlug, type StoreItem } from './catalog-data';

export type StoreItemSlug = StoreItem['slug'];
export type ItemAvailabilityStatus = 'available' | 'sold_out';

export type ItemPrice = {
  amountMinor: number;
  currencyCode: string;
  display: string;
};

export type PendingItemPrice = {
  amountMinor?: never;
  currencyCode?: never;
  display: string;
};

export type BuyableItemAvailability = {
  variantId: string;
  storeItemSlug: StoreItemSlug;
  optionLabel: string | null;
  price: PendingItemPrice;
  availability: {
    status: 'available';
    label: string;
  };
  canBuy: true;
};

export type UnbuyableItemAvailability = {
  variantId: string;
  storeItemSlug: StoreItemSlug;
  optionLabel: string | null;
  price: ItemPrice | PendingItemPrice;
  availability: {
    status: ItemAvailabilityStatus;
    label: string;
  };
  canBuy: false;
};

export type ItemAvailability = BuyableItemAvailability | UnbuyableItemAvailability;

function createStoreItemVariantId(storeItem: StoreItem): string {
  return storeItem.slug === 'disintegration-black-vinyl-lp'
    ? 'variant_barren-point_standard'
    : `variant_${storeItem.slug}_standard`;
}

function createStoreItemOptionLabel(storeItem: StoreItem): string | null {
  if (storeItem.slug === 'disintegration-black-vinyl-lp') {
    return 'Black Vinyl LP';
  }

  return storeItem.metadata.at(-1) ?? null;
}

function createStoreItemAvailability(storeItem: StoreItem): ItemAvailability {
  return {
    variantId: createStoreItemVariantId(storeItem),
    storeItemSlug: storeItem.slug,
    optionLabel: createStoreItemOptionLabel(storeItem),
    price: {
      display: 'Worker-confirmed at checkout',
    },
    availability: {
      status: 'available',
      label: 'Available',
    },
    canBuy: true,
  };
}

export function hasStructuredItemPrice(price: ItemAvailability['price'] | null | undefined): price is ItemPrice {
  return Boolean(
    price &&
    typeof price.amountMinor === 'number' &&
    Number.isInteger(price.amountMinor) &&
    price.amountMinor >= 0 &&
    typeof price.currencyCode === 'string' &&
    price.currencyCode.trim(),
  );
}

export function isPricedItemAvailability(
  availability: ItemAvailability | null | undefined,
): availability is BuyableItemAvailability {
  return Boolean(
    availability?.canBuy &&
    availability.availability.status === 'available' &&
    hasStructuredItemPrice(availability.price),
  );
}

export async function listAvailabilityForStoreItem(slug: StoreItemSlug): Promise<ItemAvailability[]> {
  const storeItem = await getStoreItemBySlug(slug);
  return storeItem ? [createStoreItemAvailability(storeItem)] : [];
}

export async function getPrimaryAvailabilityForStoreItem(slug: StoreItemSlug): Promise<ItemAvailability | null> {
  const availability = await listAvailabilityForStoreItem(slug);
  return availability[0] || null;
}
