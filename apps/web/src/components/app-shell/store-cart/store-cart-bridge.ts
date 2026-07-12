import {
  CHECKOUT_CART_UPDATED_EVENT,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
} from '@/lib/store-cart-events';
import {
  addStoreCartItem,
  parseCartLineItemSnapshot,
  readStoreCartState,
  type StoreCartState,
  writeStoreCartState,
} from '@/lib/store-cart';

type StoreCartBrowserStorage = Parameters<typeof readStoreCartState>[0];

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

export function getStoreCartBrowserStorage(): Storage | undefined {
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

  function handleStoreCartAddItem(event: Event) {
    const item = parseCartLineItemSnapshot((event as CustomEvent<unknown>).detail);
    if (!item) return;

    const nextState = addStoreCartItem(item, readStoreCartState(readStorage()));
    persistStoreCartState(readStorage(), nextState);
    setStoreCartState(nextState);
    setStoreCartDrawerOpen(true);
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

  return () => {
    eventTarget.removeEventListener(STORE_CART_ADD_ITEM_EVENT, handleStoreCartAddItem);
    eventTarget.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, handleCheckoutCartUpdated);
    eventTarget.removeEventListener(STORE_CART_OPEN_REQUESTED_EVENT, handleStoreCartOpenRequested);
    eventTarget.removeEventListener('pageshow', syncStoreCartHeaderContainer);
  };
}
