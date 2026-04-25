import * as React from 'react';

import { Button } from '@/components/ui/button';
import { STORE_CART_ADD_ITEM_EVENT, type StoreCartItem } from '@/lib/store-cart';

type StoreItemPurchaseActionsProps = {
  cartItem: StoreCartItem | null;
};

export const STORE_ITEM_PURCHASE_ACTION_COPY = {
  addToCart: 'Add To Cart',
  unavailable: 'Currently Unavailable',
} as const;

export function requestStoreCartAddItem(item: StoreCartItem, eventTarget: EventTarget = window) {
  return eventTarget.dispatchEvent(
    new CustomEvent<StoreCartItem>(STORE_CART_ADD_ITEM_EVENT, {
      detail: item,
    }),
  );
}

export default function StoreItemPurchaseActions({ cartItem }: StoreItemPurchaseActionsProps) {
  if (!cartItem) {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="pointer-events-none rounded-none border-border/60 text-muted-foreground opacity-70 uppercase tracking-[0.12em]"
        disabled
      >
        {STORE_ITEM_PURCHASE_ACTION_COPY.unavailable}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      className="rounded-none uppercase tracking-[0.12em]"
      data-store-item-add-to-cart
      onClick={() => requestStoreCartAddItem(cartItem)}
    >
      {STORE_ITEM_PURCHASE_ACTION_COPY.addToCart}
    </Button>
  );
}
