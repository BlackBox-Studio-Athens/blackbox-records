import { describe, expect, it } from 'vitest';

import {
  addStoreCartItem,
  createCartCheckoutPath,
  createCartQuantity,
  createEmptyStoreCartState,
  incrementCartLineQuantityByVariant,
  decrementCartLineQuantityByVariant,
  getStoreCartCount,
  parseCartLineItemSnapshot,
  parseSerializedStoreCartState,
  readStoreCartState,
  removeCartLineByVariant,
  restoreCartLine,
  STORE_CART_MAX_QUANTITY,
  STORE_CART_STORAGE_KEY,
  type CartLineItemSnapshot,
  writeStoreCartState,
} from './store-cart';

const canonicalItem: CartLineItemSnapshot = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2000,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€20',
  priceKind: 'fixed',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
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
  it('parses saved carts without a pre-order field', () => {
    const state = parseSerializedStoreCartState(JSON.stringify({ lines: [{ ...canonicalItem, quantity: 2 }] }));
    expect(state.lines).toEqual([{ ...canonicalItem, quantity: 2 }]);
    expect(state.primaryLineItem).toEqual(canonicalItem);
  });

  it.each([
    null,
    { shipEstimate: null },
    { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
    ...(['early', 'mid', 'late'] as const).map((part) => ({
      shipEstimate: { kind: 'month' as const, month: '2026-10', part },
    })),
    { shipEstimate: { kind: 'date', date: '2028-02-29' } },
  ])('round-trips a valid pre-order snapshot: %j', (preorder) => {
    const item = parseCartLineItemSnapshot({ ...canonicalItem, preorder });
    expect(item).toEqual({ ...canonicalItem, preorder });
    const storage = createMemoryStorage();
    writeStoreCartState(storage, addStoreCartItem(item!));
    expect(readStoreCartState(storage)).toEqual({
      lines: [{ ...canonicalItem, preorder, quantity: 1 }],
      primaryLineItem: { ...canonicalItem, preorder },
    });
  });

  it.each([
    true,
    {},
    { shipEstimate: {} },
    { shipEstimate: { kind: 'week', month: '2026-10', part: null } },
    { shipEstimate: { kind: 'month', month: '2026-13', part: null } },
    { shipEstimate: { kind: 'month', month: '2026-1', part: null } },
    { shipEstimate: { kind: 'month', month: '2026-10', part: 'middle' } },
    { shipEstimate: { kind: 'month', month: '2026-10' } },
    { shipEstimate: { kind: 'date', date: '2026-02-29' } },
    { shipEstimate: { kind: 'date', date: '2026-04-31' } },
    { shipEstimate: { kind: 'date', date: '2026-10-20T00:00:00Z' } },
  ])('rejects malformed pre-order data without dropping other saved lines: %j', (preorder) => {
    expect(parseCartLineItemSnapshot({ ...canonicalItem, preorder })).toBeNull();
    expect(
      parseSerializedStoreCartState(
        JSON.stringify({
          lines: [
            { ...canonicalItem, preorder, quantity: 1 },
            { ...canonicalItem, quantity: 2 },
          ],
        }),
      ).lines,
    ).toEqual([{ ...canonicalItem, quantity: 2 }]);
  });

  it('guards custom-Price increments without removing mixed cart contents', () => {
    const custom = {
      ...canonicalItem,
      priceKind: 'pay_what_you_want' as const,
      priceAmountMinor: null,
      priceDisplay: 'Pay what you want',
    };
    const state = addStoreCartItem(custom);
    expect(incrementCartLineQuantityByVariant(custom.variantId, state)).toEqual(state);
    expect(addStoreCartItem(custom, state)).toEqual(state);
    const mixed = addStoreCartItem({ ...canonicalItem, variantId: 'variant_second', storeItemSlug: 'second' }, state);
    expect(incrementCartLineQuantityByVariant(custom.variantId, mixed)).toEqual(mixed);
    expect(incrementCartLineQuantityByVariant('variant_second', mixed).lines[1]?.quantity).toBe(2);
    expect(decrementCartLineQuantityByVariant('variant_second', mixed).lines[0]).toEqual(state.lines[0]);
  });

  it('preserves stale custom-Price quantity for explicit shopper correction', () => {
    const state = addStoreCartItem(canonicalItem, addStoreCartItem(canonicalItem));
    state.lines[0]!.priceKind = 'pay_what_you_want';
    const guarded = incrementCartLineQuantityByVariant(canonicalItem.variantId, state);
    expect(guarded.lines[0]?.quantity).toBe(2);
    expect(decrementCartLineQuantityByVariant(canonicalItem.variantId, guarded).lines[0]?.quantity).toBe(1);
  });
  it('starts empty with count 0', () => {
    const state = createEmptyStoreCartState();

    expect(state).toEqual({ primaryLineItem: null, lines: [] });
    expect(getStoreCartCount(state)).toBe(0);
  });

  it('adds the canonical item option as a CartLine', () => {
    const state = addStoreCartItem(canonicalItem);

    expect(getStoreCartCount(state)).toBe(1);
    expect(state.primaryLineItem).toMatchObject({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
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

  it('calculates display totals from browser-safe price fields', async () => {
    const { getCartLineTotalDisplay, getCartSubtotalDisplay } = await import('./store-cart');
    const state = addStoreCartItem(canonicalItem, addStoreCartItem(canonicalItem));

    expect(getCartLineTotalDisplay(state.lines[0]!)).toBe('€40.00');
    expect(getCartSubtotalDisplay(state.lines)).toBe('€40.00');
  });

  it('keeps pay-what-you-want cart lines out of browser subtotal math', async () => {
    const { getCartLineTotalDisplay, getCartSubtotalDisplay } = await import('./store-cart');
    const state = addStoreCartItem({
      ...canonicalItem,
      priceAmountMinor: null,
      priceDisplay: 'Pay what you want',
      priceKind: 'pay_what_you_want',
    });

    expect(getCartLineTotalDisplay(state.lines[0]!)).toBe('Pay what you want');
    expect(getCartSubtotalDisplay(state.lines)).toBe('Set in Checkout');
  });

  it('drops legacy cart lines without structured price fields', () => {
    const { priceAmountMinor: _priceAmountMinor, priceCurrencyCode: _priceCurrencyCode, ...legacyItem } = canonicalItem;
    const state = addStoreCartItem(legacyItem as CartLineItemSnapshot);

    expect(state).toEqual(createEmptyStoreCartState());
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
    const finalState = removeCartLineByVariant('variant_disintegration-black-vinyl-lp_standard', secondState);

    expect(getStoreCartCount(finalState)).toBe(1);
    expect(finalState.primaryLineItem?.storeItemSlug).toBe('afterglow-tape');
  });

  it('restores a removed line at its position with its quantity', () => {
    const afterglow = {
      ...canonicalItem,
      storeItemSlug: 'afterglow-tape',
      title: 'Afterglow Tape',
      variantId: 'variant_afterglow-tape_standard',
    };
    const withBoth = incrementCartLineQuantityByVariant(
      canonicalItem.variantId,
      addStoreCartItem(afterglow, addStoreCartItem(canonicalItem)),
    );
    const [removedLine] = withBoth.lines;
    if (!removedLine) throw new Error('Expected a cart line to remove.');
    const removed = removeCartLineByVariant(canonicalItem.variantId, withBoth);
    const restored = restoreCartLine(removedLine, 0, removed);

    expect(restored.lines.map((line) => [line.variantId, line.quantity])).toEqual([
      [canonicalItem.variantId, 2],
      [afterglow.variantId, 1],
    ]);
    expect(restored.primaryLineItem?.variantId).toBe(canonicalItem.variantId);
  });

  it('keeps a line that was added again before Undo', () => {
    const state = addStoreCartItem(canonicalItem);
    const [line] = state.lines;
    if (!line) throw new Error('Expected a cart line.');
    const removedLine = { ...line, quantity: createCartQuantity(3) };

    expect(restoreCartLine(removedLine, 0, state)).toEqual(state);
  });

  it('removes the whole draft when no variant id is provided', () => {
    expect(removeCartLineByVariant()).toEqual(createEmptyStoreCartState());
    expect(getStoreCartCount(removeCartLineByVariant())).toBe(0);
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
    } as CartLineItemSnapshot & Record<string, unknown>);

    writeStoreCartState(storage, state);

    const rawValue = storage.getItem(STORE_CART_STORAGE_KEY);
    expect(rawValue).toContain('disintegration-black-vinyl-lp');
    expect(rawValue).toContain('priceAmountMinor');
    expect(rawValue).toContain('priceCurrencyCode');
    expect(rawValue).not.toContain('price_secret');
    expect(rawValue).not.toContain('store_item_option_1');
    expect(rawValue).not.toContain('stockCount');
    expect(rawValue).not.toContain('cs_secret');
    expect(rawValue).not.toContain('paid');
    expect(rawValue).not.toContain('operator@example.com');
    expect(readStoreCartState(storage)).toEqual({
      lines: [{ ...canonicalItem, quantity: 1 }],
      primaryLineItem: canonicalItem,
    });
  });

  it('migrates the legacy single-item storage shape to a CartDraft', () => {
    const state = parseSerializedStoreCartState(JSON.stringify({ item: canonicalItem }));

    expect(state).toEqual({
      lines: [{ ...canonicalItem, quantity: 1 }],
      primaryLineItem: canonicalItem,
    });
  });

  it('normalizes legacy currency casing while preserving the storage shape', () => {
    const state = parseSerializedStoreCartState(
      JSON.stringify({ lines: [{ ...canonicalItem, priceCurrencyCode: 'eur', quantity: 2 }] }),
    );

    expect(state.lines[0]).toMatchObject({
      priceAmountMinor: 2000,
      priceCurrencyCode: 'EUR',
      quantity: 2,
    });
  });

  it('rejects invalid price states instead of storing float money', () => {
    const state = parseSerializedStoreCartState(
      JSON.stringify({ lines: [{ ...canonicalItem, priceAmountMinor: 20.5, quantity: 1 }] }),
    );

    expect(state).toEqual(createEmptyStoreCartState());
  });

  it('falls back to empty cart for malformed storage', () => {
    expect(parseSerializedStoreCartState('{not json')).toEqual(createEmptyStoreCartState());
    expect(
      parseSerializedStoreCartState(JSON.stringify({ item: { storeItemSlug: 'missing-required-fields' } })),
    ).toEqual(createEmptyStoreCartState());
  });

  it('removes browser storage when writing an empty cart', () => {
    const storage = createMemoryStorage();
    writeStoreCartState(storage, addStoreCartItem(canonicalItem));
    writeStoreCartState(storage, createEmptyStoreCartState());

    expect(storage.getItem(STORE_CART_STORAGE_KEY)).toBeNull();
  });

  it('never promotes the legacy release id to the cart item slug', () => {
    const state = addStoreCartItem(canonicalItem);

    expect(state.primaryLineItem?.storeItemSlug).toBe('disintegration-black-vinyl-lp');
    expect(state.primaryLineItem?.storeItemSlug).not.toBe('barren-point');
  });

  it('generates the canonical cart checkout route', () => {
    expect(createCartCheckoutPath()).toBe('/store/checkout/');
  });
});
