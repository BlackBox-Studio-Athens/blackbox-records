import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  createPublicCheckoutApi,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '@/lib/backend/public-checkout-api';
import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/lib/store-cart';

export type StoreItemCartSeed = Omit<
  CartLineItemSnapshot,
  'availabilityLabel' | 'priceAmountMinor' | 'priceCurrencyCode' | 'priceDisplay' | 'variantId'
> & {
  availabilityLabel: string;
  variantId: string | null;
};

type StoreItemPurchaseActionsProps = {
  api?: PublicCheckoutApi;
  cartItem: CartLineItemSnapshot | null;
  cartSeed: StoreItemCartSeed | null;
};

export const STORE_ITEM_PURCHASE_ACTION_COPY = {
  addToCart: 'Add To Cart',
  checking: 'Checking Checkout',
  unavailable: 'Currently Unavailable',
} as const;

export function requestStoreCartAddItem(item: CartLineItemSnapshot, eventTarget: EventTarget = window) {
  return eventTarget.dispatchEvent(
    new CustomEvent<CartLineItemSnapshot>(STORE_CART_ADD_ITEM_EVENT, {
      detail: item,
    }),
  );
}

export function createCartLineItemSnapshotFromWorkerOffer(
  cartSeed: StoreItemCartSeed | null,
  offer: PublicStoreOffer,
): CartLineItemSnapshot | null {
  if (!cartSeed || !offer.canCheckout || !offer.variantId.trim() || !offer.price) {
    return null;
  }

  return {
    ...cartSeed,
    availabilityLabel: offer.availability.label,
    priceAmountMinor: offer.price.amountMinor,
    priceCurrencyCode: offer.price.currencyCode,
    priceDisplay: offer.price.display,
    storeItemSlug: offer.storeItemSlug,
    variantId: offer.variantId,
  };
}

export default function StoreItemPurchaseActions({ api, cartItem, cartSeed }: StoreItemPurchaseActionsProps) {
  const [resolvedCartItem, setResolvedCartItem] = React.useState<CartLineItemSnapshot | null>(cartItem);
  const [isChecking, setIsChecking] = React.useState(!cartItem && Boolean(cartSeed));

  React.useEffect(() => {
    if (!cartSeed) {
      setResolvedCartItem(null);
      setIsChecking(false);
      return;
    }

    let isActive = true;
    const pricedCartSeed = cartSeed;
    const checkoutApi = api ?? createPublicCheckoutApi();

    async function loadWorkerOffer() {
      try {
        const offer = await checkoutApi.readStoreOffer(pricedCartSeed.storeItemSlug);
        const workerCartItem = createCartLineItemSnapshotFromWorkerOffer(pricedCartSeed, offer);

        if (isActive) {
          setResolvedCartItem(workerCartItem ?? cartItem);
          setIsChecking(false);
        }
      } catch {
        if (isActive) {
          setResolvedCartItem(cartItem);
          setIsChecking(false);
        }
      }
    }

    void loadWorkerOffer();

    return () => {
      isActive = false;
    };
  }, [api, cartItem, cartSeed]);

  if (!resolvedCartItem) {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="pointer-events-none rounded-none border-border/60 text-muted-foreground opacity-70 uppercase tracking-[0.12em]"
        disabled
      >
        {isChecking ? STORE_ITEM_PURCHASE_ACTION_COPY.checking : STORE_ITEM_PURCHASE_ACTION_COPY.unavailable}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      className="rounded-none uppercase tracking-[0.12em]"
      data-store-item-add-to-cart
      onClick={() => requestStoreCartAddItem(resolvedCartItem)}
    >
      {STORE_ITEM_PURCHASE_ACTION_COPY.addToCart}
    </Button>
  );
}
