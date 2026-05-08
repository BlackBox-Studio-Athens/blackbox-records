import { describe, expect, it } from 'vitest';

import {
  addStoreCartItem,
  createEmptyStoreCartState,
  createStoreCartCheckoutPath,
  getStoreCartCount,
  parseStoreCartState,
  readStoreCartState,
  removeStoreCartItem,
  STORE_CART_MAX_QUANTITY,
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

    expect(state).toEqual({ item: null, lines: [] });
    expect(getStoreCartCount(state)).toBe(0);
  });

  it('adds the canonical item option as a CartLine', () => {
    const state = addStoreCartItem(canonicalItem);

    expect(getStoreCartCount(state)).toBe(1);
    expect(state.item).toMatchObject({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
      optionLabel: 'Black Vinyl LP',
    });
    expect(state.lines).toEqual([{ ...canonicalItem, quantity: 1 }]);
  });

  it('adds a second store item as a second CartLine', () => {
    const firstState = addStoreCartItem(canonicalItem);
    const secondState = addStoreCartItem(
      {
        ...canonicalItem,
        storeItemSlug: 'afterglow-tape',
        title: 'Afterglow Tape',
        variantId: 'variant_afterglow-tape_standard',
      },
      firstState,
    );

    expect(getStoreCartCount(firstState)).toBe(1);
    expect(getStoreCartCount(secondState)).toBe(2);
    expect(secondState.lines.map((line) => line.storeItemSlug)).toEqual([
      'disintegration-black-vinyl-lp',
      'afterglow-tape',
    ]);
  });

  it('merges duplicate variants by increasing CartQuantity', () => {
    const firstState = addStoreCartItem(canonicalItem);
    const secondState = addStoreCartItem(canonicalItem, firstState);

    expect(getStoreCartCount(secondState)).toBe(2);
    expect(secondState.lines).toHaveLength(1);
    expect(secondState.lines[0]?.quantity).toBe(2);
  });

  it('caps CartQuantity at the maximum browser quantity', () => {
    let state = addStoreCartItem(canonicalItem);
    for (let index = 0; index < STORE_CART_MAX_QUANTITY + 2; index += 1) {
      state = addStoreCartItem(canonicalItem, state);
    }

    expect(state.lines[0]?.quantity).toBe(STORE_CART_MAX_QUANTITY);
    expect(getStoreCartCount(state)).toBe(STORE_CART_MAX_QUANTITY);
  });

  it('removes one CartLine without clearing the whole draft', () => {
    const firstState = addStoreCartItem(canonicalItem);
    const secondState = addStoreCartItem(
      {
        ...canonicalItem,
        storeItemSlug: 'afterglow-tape',
        title: 'Afterglow Tape',
        variantId: 'variant_afterglow-tape_standard',
      },
      firstState,
    );
    const finalState = removeStoreCartItem('variant_barren-point_standard', secondState);

    expect(getStoreCartCount(finalState)).toBe(1);
    expect(finalState.item?.storeItemSlug).toBe('afterglow-tape');
  });

  it('removes the whole draft when no variant id is provided', () => {
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
    expect(readStoreCartState(storage)).toEqual({
      item: canonicalItem,
      lines: [{ ...canonicalItem, quantity: 1 }],
    });
  });

  it('migrates the legacy single-item storage shape to a CartDraft', () => {
    const state = parseStoreCartState(JSON.stringify({ item: canonicalItem }));

    expect(state).toEqual({
      item: canonicalItem,
      lines: [{ ...canonicalItem, quantity: 1 }],
    });
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

  it('generates the canonical checkout route from the item option slug', () => {
    expect(createStoreCartCheckoutPath(canonicalItem)).toBe('/store/disintegration-black-vinyl-lp/checkout/');
  });
});
