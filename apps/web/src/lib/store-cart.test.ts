import { describe, expect, it } from 'vitest';

import {
  addStoreCartItem,
  createEmptyStoreCartState,
  getStoreCartCount,
  parseStoreCartState,
  readStoreCartState,
  removeStoreCartItem,
  STORE_CART_STORAGE_KEY,
  type StoreCartItem,
  writeStoreCartState,
} from './store-cart';

const canonicalItem: StoreCartItem = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceDisplay: '€20',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_barren-point_standard',
};

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('store cart state', () => {
  it('starts empty with count 0', () => {
    const state = createEmptyStoreCartState();

    expect(state).toEqual({ item: null });
    expect(getStoreCartCount(state)).toBe(0);
  });

  it('adds the canonical item option as a single cart item', () => {
    const state = addStoreCartItem(canonicalItem);

    expect(getStoreCartCount(state)).toBe(1);
    expect(state.item).toMatchObject({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
      optionLabel: 'Black Vinyl LP',
    });
  });

  it('replaces the previous item instead of adding another line', () => {
    const firstState = addStoreCartItem(canonicalItem);
    const secondState = addStoreCartItem({
      ...canonicalItem,
      storeItemSlug: 'afterglow-tape',
      title: 'Afterglow Tape',
      variantId: 'variant_afterglow-tape_standard',
    });

    expect(getStoreCartCount(firstState)).toBe(1);
    expect(getStoreCartCount(secondState)).toBe(1);
    expect(secondState.item?.storeItemSlug).toBe('afterglow-tape');
  });

  it('removes the item and returns to empty', () => {
    expect(removeStoreCartItem()).toEqual(createEmptyStoreCartState());
    expect(getStoreCartCount(removeStoreCartItem())).toBe(0);
  });

  it('round-trips browser storage with only approved fields', () => {
    const storage = createMemoryStorage();
    const state = addStoreCartItem({
      ...canonicalItem,
      stripePriceId: 'price_secret',
      d1Id: 'store_item_option_1',
      stockCount: 999,
      checkoutSessionId: 'cs_secret',
      clientSecret: 'cs_secret_client',
      orderState: 'paid',
      actorEmail: 'operator@example.com',
    } as StoreCartItem & Record<string, unknown>);

    writeStoreCartState(storage, state);

    const rawValue = storage.getItem(STORE_CART_STORAGE_KEY);
    expect(rawValue).toContain('disintegration-black-vinyl-lp');
    expect(rawValue).not.toContain('price_secret');
    expect(rawValue).not.toContain('store_item_option_1');
    expect(rawValue).not.toContain('stockCount');
    expect(rawValue).not.toContain('cs_secret');
    expect(rawValue).not.toContain('paid');
    expect(rawValue).not.toContain('operator@example.com');
    expect(readStoreCartState(storage)).toEqual({ item: canonicalItem });
  });

  it('falls back to empty cart for malformed storage', () => {
    expect(parseStoreCartState('{not json')).toEqual(createEmptyStoreCartState());
    expect(parseStoreCartState(JSON.stringify({ item: { storeItemSlug: 'missing-required-fields' } }))).toEqual(
      createEmptyStoreCartState(),
    );
  });

  it('removes browser storage when writing an empty cart', () => {
    const storage = createMemoryStorage();
    writeStoreCartState(storage, addStoreCartItem(canonicalItem));
    writeStoreCartState(storage, createEmptyStoreCartState());

    expect(storage.getItem(STORE_CART_STORAGE_KEY)).toBeNull();
  });

  it('never promotes the legacy release id to the cart item slug', () => {
    const state = addStoreCartItem(canonicalItem);

    expect(state.item?.storeItemSlug).toBe('disintegration-black-vinyl-lp');
    expect(state.item?.storeItemSlug).not.toBe('barren-point');
  });
});
