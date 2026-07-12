import { describe, expect, it } from 'vitest';

import {
  addStoreCartItem,
  createEmptyStoreCartState,
  readStoreCartState,
  type CartLineItemSnapshot,
  type StoreCartState,
} from '@/lib/store-cart';
import {
  CHECKOUT_CART_UPDATED_EVENT,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
} from '@/lib/store-cart-events';

import { applyStoreCartStateAndPersist, connectStoreCartBridge } from './store-cart-bridge';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const cartItem: CartLineItemSnapshot = {
  availabilityLabel: 'In stock',
  image: null,
  imageAlt: null,
  optionLabel: 'Black vinyl LP',
  priceAmountMinor: 2500,
  priceCurrencyCode: 'EUR',
  priceDisplay: '25 EUR',
  priceKind: 'fixed',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Black Vinyl LP',
  title: 'Disintegration',
  variantId: 'variant_dsn_black_lp',
};

describe('store cart bridge', () => {
  it('applies StoreCart state and persists it through the configured storage', () => {
    const storage = createMemoryStorage();
    const nextState = addStoreCartItem(cartItem, addStoreCartItem(cartItem));
    const seenStates: StoreCartState[] = [];

    applyStoreCartStateAndPersist({
      readStorage: () => storage,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
      state: nextState,
    });

    expect(seenStates).toEqual([nextState]);
    expect(readStoreCartState(storage).lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 2 }]);
  });

  it('still applies StoreCart state when browser storage is unavailable', () => {
    const nextState = addStoreCartItem(cartItem, addStoreCartItem(cartItem));
    const seenStates: StoreCartState[] = [];

    applyStoreCartStateAndPersist({
      readStorage: () => undefined,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
      state: nextState,
    });

    expect(seenStates).toEqual([nextState]);
  });

  it('persists add-item events and opens the cart drawer', () => {
    const eventTarget = new EventTarget() as Window;
    const storage = createMemoryStorage();
    const seenStates: StoreCartState[] = [];
    let drawerOpen = false;

    const disconnect = connectStoreCartBridge({
      eventTarget,
      queryHeaderRoot: () => null,
      readStorage: () => storage,
      setStoreCartDrawerOpen: (open) => {
        drawerOpen = open;
      },
      setStoreCartHeaderContainer: () => undefined,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
    });

    eventTarget.dispatchEvent(new CustomEvent(STORE_CART_ADD_ITEM_EVENT, { detail: cartItem }));
    disconnect();

    expect(drawerOpen).toBe(true);
    expect(readStoreCartState(storage).lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 1 }]);
    expect(seenStates.at(-1)?.lines).toHaveLength(1);
  });

  it('opens the drawer on checkout return requests without changing state', () => {
    const eventTarget = new EventTarget() as Window;
    const storage = createMemoryStorage();
    let drawerOpen = false;

    const disconnect = connectStoreCartBridge({
      eventTarget,
      queryHeaderRoot: () => null,
      readStorage: () => storage,
      setStoreCartDrawerOpen: (open) => {
        drawerOpen = open;
      },
      setStoreCartHeaderContainer: () => undefined,
      setStoreCartState: () => undefined,
    });

    eventTarget.dispatchEvent(new Event(STORE_CART_OPEN_REQUESTED_EVENT));
    disconnect();

    expect(drawerOpen).toBe(true);
    expect(readStoreCartState(storage)).toEqual(createEmptyStoreCartState());
  });

  it('refreshes state after checkout-web updates persisted cart data', () => {
    const eventTarget = new EventTarget() as Window;
    const storage = createMemoryStorage();
    const seenStates: StoreCartState[] = [];

    const disconnect = connectStoreCartBridge({
      eventTarget,
      queryHeaderRoot: () => null,
      readStorage: () => storage,
      setStoreCartDrawerOpen: () => undefined,
      setStoreCartHeaderContainer: () => undefined,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
    });

    storage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines: [{ ...cartItem, quantity: 3 }] }));
    eventTarget.dispatchEvent(new CustomEvent(CHECKOUT_CART_UPDATED_EVENT));
    disconnect();

    expect(seenStates.at(-1)?.lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 3 }]);
  });
});
