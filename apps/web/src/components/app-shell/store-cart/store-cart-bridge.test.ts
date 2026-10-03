import { describe, expect, it, vi } from 'vitest';

import {
  addStoreCartItem,
  createEmptyStoreCartState,
  readStoreCartState,
  type CartLineItemSnapshot,
  type StoreCartState,
} from '@/components/store/cart/store-cart';
import {
  CHECKOUT_CART_UPDATED_EVENT,
  queuePendingStoreCartAddItem,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_ITEM_ADDED_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
  takePendingStoreCartAddItems,
} from '@/components/store/cart/store-cart-events';

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

describe('store cart bridge', async () => {
  it('applies StoreCart state and persists it through the configured storage', async () => {
    const storage = createMemoryStorage();
    const nextState = addStoreCartItem(cartItem, addStoreCartItem(cartItem));
    const seenStates: StoreCartState[] = [];

    await applyStoreCartStateAndPersist({
      readStorage: () => storage,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
      state: nextState,
    });

    expect(seenStates).toEqual([nextState]);
    expect(readStoreCartState(storage).lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 2 }]);
  });

  it('still applies StoreCart state when browser storage is unavailable', async () => {
    const nextState = addStoreCartItem(cartItem, addStoreCartItem(cartItem));
    const seenStates: StoreCartState[] = [];

    await applyStoreCartStateAndPersist({
      readStorage: () => undefined,
      setStoreCartState: (state) => {
        seenStates.push(state);
      },
      state: nextState,
    });

    expect(seenStates).toEqual([nextState]);
  });

  it('persists add-item events and opens the cart drawer', async () => {
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
    eventTarget.dispatchEvent(new CustomEvent(STORE_CART_ADD_ITEM_EVENT, { detail: cartItem }));
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    disconnect();

    expect(drawerOpen).toBe(true);
    expect(readStoreCartState(storage).lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 2 }]);
    expect(seenStates.at(-1)?.lines).toHaveLength(1);
  });

  it('acknowledges add requests and confirms each added item', async () => {
    const eventTarget = new EventTarget() as Window;
    const storage = createMemoryStorage();
    const confirmed: unknown[] = [];
    eventTarget.addEventListener(STORE_CART_ITEM_ADDED_EVENT, (event) => {
      confirmed.push((event as CustomEvent<unknown>).detail);
    });

    const disconnect = connectStoreCartBridge({
      eventTarget,
      queryHeaderRoot: () => null,
      readStorage: () => storage,
      setStoreCartDrawerOpen: () => undefined,
      setStoreCartHeaderContainer: () => undefined,
      setStoreCartState: () => undefined,
    });

    const request = new CustomEvent(STORE_CART_ADD_ITEM_EVENT, { cancelable: true, detail: cartItem });
    expect(eventTarget.dispatchEvent(request)).toBe(false);
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    disconnect();

    expect(request.defaultPrevented).toBe(true);
    expect(confirmed).toEqual([{ variantId: cartItem.variantId }]);
  });

  it('applies adds requested before it connected', async () => {
    takePendingStoreCartAddItems();
    queuePendingStoreCartAddItem(cartItem);
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
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    disconnect();

    expect(drawerOpen).toBe(true);
    expect(readStoreCartState(storage).lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 1 }]);
    expect(takePendingStoreCartAddItems()).toEqual([]);
  });

  it('opens the drawer on checkout return requests without changing state', async () => {
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
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    disconnect();

    expect(drawerOpen).toBe(true);
    expect(readStoreCartState(storage)).toEqual(createEmptyStoreCartState());
  });

  it('refreshes state after checkout-web updates persisted cart data', async () => {
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
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    disconnect();

    expect(seenStates.at(-1)?.lines).toMatchObject([{ variantId: cartItem.variantId, quantity: 3 }]);
  });
});
