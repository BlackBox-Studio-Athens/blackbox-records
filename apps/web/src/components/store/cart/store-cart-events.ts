export const CHECKOUT_CART_UPDATED_EVENT = 'blackbox:checkout-cart-updated';
export const STORE_CART_ADD_ITEM_EVENT = 'blackbox:store-cart:add-item';
export const STORE_CART_OPEN_REQUESTED_EVENT = 'blackbox:store-cart:open-requested';
// Confirms that an item reached the cart, so the purchase control can say Added truthfully.
export const STORE_CART_ITEM_ADDED_EVENT = 'blackbox:store-cart:item-added';

// The shell's cart bridge loads after hydration and acknowledges adds by cancelling the event. An add requested
// before it listens waits here and is applied when the bridge connects, instead of being lost.
const pendingStoreCartAddItems: unknown[] = [];

export function queuePendingStoreCartAddItem(detail: unknown) {
  pendingStoreCartAddItems.push(detail);
}

export function takePendingStoreCartAddItems() {
  return pendingStoreCartAddItems.splice(0);
}
