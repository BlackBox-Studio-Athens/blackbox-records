import {
  CHECKOUT_CART_UPDATED_EVENT,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_ITEM_ADDED_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
  takePendingStoreCartAddItems,
} from '@/components/store/cart/store-cart-events';
import {
  addStoreCartItem,
  parseCartLineItemSnapshot,
  readStoreCartState,
  type StoreCartState,
  writeStoreCartState,
} from '@/components/store/cart/store-cart';

type StoreCartBrowserStorage = Parameters<typeof readStoreCartState>[0];
import { privatePreview } from '@/platform/lib/private-preview';
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

type ApplyStoreCartStateOptions = {
  readStorage: () => StoreCartBrowserStorage;
  setStoreCartState: (state: StoreCartState) => void;
  state: StoreCartState;
};

type StoreCartBridgeOptions = {
  eventTarget: Window;
  queryHeaderRoot: () => HTMLElement | null;
  readStorage: () => StoreCartBrowserStorage;
  setStoreCartDrawerOpen: (open: boolean) => void;
  setStoreCartHeaderContainer: (container: HTMLElement | null) => void;
  setStoreCartState: (state: StoreCartState) => void;
};

export function getStoreCartBrowserStorage(): StoreCartBrowserStorage {
  if (privatePreview()) return previewStorage;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function persistStoreCartState(storage: StoreCartBrowserStorage, state: StoreCartState) {
  writeStoreCartState(storage, state);
}

export function applyStoreCartStateAndPersist({ readStorage, setStoreCartState, state }: ApplyStoreCartStateOptions) {
  setStoreCartState(state);
  persistStoreCartState(readStorage(), state);
}

export function connectStoreCartBridge({
  eventTarget,
  queryHeaderRoot,
  readStorage,
  setStoreCartDrawerOpen,
  setStoreCartHeaderContainer,
  setStoreCartState,
}: StoreCartBridgeOptions) {
  const syncStoreCartHeaderContainer = () => {
    setStoreCartHeaderContainer(queryHeaderRoot());
  };

  function addItem(detail: unknown) {
    const item = parseCartLineItemSnapshot(detail);
    if (!item) return;

    const nextState = addStoreCartItem(item, readStoreCartState(readStorage()));
    persistStoreCartState(readStorage(), nextState);
    setStoreCartState(nextState);
    setStoreCartDrawerOpen(true);
    eventTarget.dispatchEvent(new CustomEvent(STORE_CART_ITEM_ADDED_EVENT, { detail: { variantId: item.variantId } }));
  }

  function handleStoreCartAddItem(event: Event) {
    // Cancelling acknowledges the request, so the purchase control does not queue it.
    event.preventDefault();
    addItem((event as CustomEvent<unknown>).detail);
  }

  function handleStoreCartOpenRequested() {
    setStoreCartDrawerOpen(true);
  }

  function handleCheckoutCartUpdated() {
    setStoreCartState(readStoreCartState(readStorage()));
  }

  setStoreCartState(readStoreCartState(readStorage()));
  syncStoreCartHeaderContainer();
  eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, handleStoreCartAddItem);
  eventTarget.addEventListener(CHECKOUT_CART_UPDATED_EVENT, handleCheckoutCartUpdated);
  eventTarget.addEventListener(STORE_CART_OPEN_REQUESTED_EVENT, handleStoreCartOpenRequested);
  eventTarget.addEventListener('pageshow', syncStoreCartHeaderContainer);
  for (const detail of takePendingStoreCartAddItems()) addItem(detail);

  return () => {
    eventTarget.removeEventListener(STORE_CART_ADD_ITEM_EVENT, handleStoreCartAddItem);
    eventTarget.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, handleCheckoutCartUpdated);
    eventTarget.removeEventListener(STORE_CART_OPEN_REQUESTED_EVENT, handleStoreCartOpenRequested);
    eventTarget.removeEventListener('pageshow', syncStoreCartHeaderContainer);
  };
}
