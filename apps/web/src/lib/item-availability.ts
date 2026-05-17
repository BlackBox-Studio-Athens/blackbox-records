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
  price: ItemPrice;
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

// Phase 6 keeps temporary offer-state fixtures in code so editorial collections remain presentation-only.
const availabilityByStoreItemSlug: Record<StoreItemSlug, ItemAvailability[]> = {
  'disintegration-black-vinyl-lp': [
    {
      variantId: 'variant_barren-point_standard',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      optionLabel: 'Black Vinyl LP',
      price: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        display: '€28.00',
      },
      availability: {
        status: 'available',
        label: 'Available',
      },
      canBuy: true,
    },
  ],
  'afterglow-tape': [
    {
      variantId: 'variant_afterglow-tape_standard',
      storeItemSlug: 'afterglow-tape',
      optionLabel: 'Cassette',
      price: {
        amountMinor: 1400,
        currencyCode: 'EUR',
        display: '€14.00',
      },
      availability: {
        status: 'sold_out',
        label: 'Sold Out',
      },
      canBuy: false,
    },
  ],
};

function createFallbackItemAvailability(storeItem: StoreItem): ItemAvailability {
  return {
    variantId: `variant_${storeItem.slug}_standard`,
    storeItemSlug: storeItem.slug,
    optionLabel: null,
    price: {
      display: 'Price soon',
    },
    availability: {
      status: 'sold_out',
      label: 'Unavailable',
    },
    canBuy: false,
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
  const explicitAvailability = availabilityByStoreItemSlug[slug];

  if (explicitAvailability) {
    return explicitAvailability;
  }

  const storeItem = await getStoreItemBySlug(slug);
  return storeItem ? [createFallbackItemAvailability(storeItem)] : [];
}

export async function getPrimaryAvailabilityForStoreItem(slug: StoreItemSlug): Promise<ItemAvailability | null> {
  const availability = await listAvailabilityForStoreItem(slug);
  return availability[0] || null;
}
