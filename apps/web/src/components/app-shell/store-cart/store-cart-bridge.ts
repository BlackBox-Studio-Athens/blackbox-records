import {
  CHECKOUT_CART_UPDATED_EVENT,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_ITEM_ADDED_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
  takePendingStoreCartAddItems,
} from '@/components/store/cart/store-cart-events';
import type { StoreCartState, readStoreCartState } from '@/components/store/cart/store-cart';
import type * as StoreCartModule from '@/components/store/cart/store-cart';
import { privatePreview } from '@/platform/lib/private-preview';

type StoreCartBrowserStorage = Parameters<typeof readStoreCartState>[0];
type CartModule = typeof StoreCartModule;
let parserPromise: Promise<CartModule> | undefined;
export function warmStoreCartParser() {
  return (parserPromise ??= import('@/components/store/cart/store-cart').catch((error: unknown) => {
    parserPromise = undefined;
    throw error;
  }));
}
const previewCart = new Map<string, string>();
const previewStorage = {
  getItem: (key: string) => previewCart.get(key) ?? null,
  setItem: (key: string, value: string) => {
    previewCart.set(key, value);
  },
  removeItem: (key: string) => {
    previewCart.delete(key);
  },
};
export function getStoreCartBrowserStorage(): StoreCartBrowserStorage {
  if (privatePreview()) return previewStorage;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
export async function applyStoreCartStateAndPersist({
  readStorage,
  setStoreCartState,
  state,
}: {
  readStorage: () => StoreCartBrowserStorage;
  setStoreCartState: (state: StoreCartState) => void;
  state: StoreCartState;
}) {
  const cart = await warmStoreCartParser();
  cart.writeStoreCartState(readStorage(), state);
  setStoreCartState(state);
}
export function connectStoreCartBridge({
  eventTarget,
  queryHeaderRoot,
  readStorage,
  setStoreCartDrawerOpen,
  setStoreCartHeaderContainer,
  setStoreCartState,
  onError = () => {},
}: {
  eventTarget: Window;
  queryHeaderRoot: () => HTMLElement | null;
  readStorage: () => StoreCartBrowserStorage;
  setStoreCartDrawerOpen: (open: boolean) => void;
  setStoreCartHeaderContainer: (container: HTMLElement | null) => void;
  setStoreCartState: (state: StoreCartState) => void;
  onError?: () => void;
}) {
  let cancelled = false;
  let pending = Promise.resolve();
  function enqueue(work: (cart: CartModule) => void) {
    pending = pending
      .then(async () => {
        const cart = await warmStoreCartParser();
        if (!cancelled) work(cart);
      })
      .catch(() => {
        if (!cancelled) onError();
      });
  }
  const syncHeader = () => setStoreCartHeaderContainer(queryHeaderRoot());
  const refresh = () => enqueue((cart) => setStoreCartState(cart.readStoreCartState(readStorage())));
  const addItem = (detail: unknown) =>
    enqueue((cart) => {
      const item = cart.parseCartLineItemSnapshot(detail);
      if (!item) return;
      const state = cart.addStoreCartItem(item, cart.readStoreCartState(readStorage()));
      cart.writeStoreCartState(readStorage(), state);
      setStoreCartState(state);
      setStoreCartDrawerOpen(true);
      eventTarget.dispatchEvent(
        new CustomEvent(STORE_CART_ITEM_ADDED_EVENT, { detail: { variantId: item.variantId } }),
      );
    });
  const add = (event: Event) => {
    event.preventDefault();
    addItem((event as CustomEvent<unknown>).detail);
  };
  const open = () => {
    refresh();
    setStoreCartDrawerOpen(true);
  };
  const pageShow = () => {
    syncHeader();
    initialize();
  };
  function initialize() {
    try {
      const storage = readStorage();
      const path = eventTarget.location?.pathname ?? '';
      if (
        storage?.getItem('blackbox.storeCart.v2') ||
        storage?.getItem('blackbox.storeCart.v1') ||
        /\/(store|checkout)(\/|$)/.test(path)
      )
        refresh();
    } catch {
      onError();
    }
  }
  syncHeader();
  eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, add);
  eventTarget.addEventListener(CHECKOUT_CART_UPDATED_EVENT, refresh);
  eventTarget.addEventListener(STORE_CART_OPEN_REQUESTED_EVENT, open);
  eventTarget.addEventListener('pageshow', pageShow);
  initialize();
  for (const detail of takePendingStoreCartAddItems()) addItem(detail);
  return () => {
    cancelled = true;
    eventTarget.removeEventListener(STORE_CART_ADD_ITEM_EVENT, add);
    eventTarget.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, refresh);
    eventTarget.removeEventListener(STORE_CART_OPEN_REQUESTED_EVENT, open);
    eventTarget.removeEventListener('pageshow', pageShow);
  };
}
