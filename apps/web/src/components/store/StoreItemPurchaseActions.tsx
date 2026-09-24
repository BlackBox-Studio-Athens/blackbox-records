import * as React from 'react';

import { Button } from '@/components/ui/button';
import { LoadingButtonContent } from '@/components/ui/loading-feedback';
import {
  createPublicCheckoutApi,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '@/lib/backend/public-checkout-api';
import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/lib/store-cart';

export type StoreItemCartSeed = Omit<
  CartLineItemSnapshot,
  'availabilityLabel' | 'priceAmountMinor' | 'priceCurrencyCode' | 'priceDisplay' | 'priceKind' | 'variantId'
> & {
  availabilityLabel: string;
  variantId: string | null;
};

type StoreItemPurchaseActionsProps = {
  api?: PublicCheckoutApi;
  cartItem: CartLineItemSnapshot | null;
  cartSeed: StoreItemCartSeed | null;
  purchaseHint?: string;
};

type StoreItemPurchaseActionState = {
  cartItem: CartLineItemSnapshot | null;
  label: string | null;
  statusTone: StoreItemPurchaseStatusTone;
};

type StoreItemPurchaseStatusTone = 'neutral' | 'sold-out';

const purchaseActionLayoutClasses =
  'h-[54px] min-h-[54px] w-full min-w-0 whitespace-normal rounded-none px-4 py-0 sm:w-56';

export const STORE_ITEM_PURCHASE_ACTION_COPY = {
  addToCart: 'Add To Cart',
  checking: 'Checking availability',
  unavailable: 'Currently Unavailable',
} as const;

export function getStoreItemPurchaseStatusTone(label: string | null): StoreItemPurchaseStatusTone {
  return label === 'Sold Out' ? 'sold-out' : 'neutral';
}

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
  if (!cartSeed || offer.catalogStatus !== 'ready' || !offer.variantId.trim()) {
    return null;
  }
  const price = offer.price;
  const priceKind = price.kind;

  return {
    ...cartSeed,
    availabilityLabel: offer.availability.label,
    priceAmountMinor: priceKind === 'fixed' && 'amountMinor' in price ? price.amountMinor : null,
    priceCurrencyCode: price.currencyCode,
    priceDisplay: price.display,
    priceKind,
    storeItemSlug: offer.storeItemSlug,
    variantId: offer.variantId,
  };
}

export async function loadStoreItemPurchaseActionState(
  api: PublicCheckoutApi,
  cartSeed: StoreItemCartSeed,
): Promise<StoreItemPurchaseActionState> {
  try {
    const offer = await api.readStoreOffer(cartSeed.storeItemSlug);
    const resolvedCartItem = createCartLineItemSnapshotFromWorkerOffer(cartSeed, offer);
    const label = resolvedCartItem
      ? null
      : offer.catalogStatus === 'ready'
        ? STORE_ITEM_PURCHASE_ACTION_COPY.unavailable
        : offer.availability.label;

    return {
      cartItem: resolvedCartItem,
      label,
      statusTone: getStoreItemPurchaseStatusTone(label),
    };
  } catch {
    return {
      cartItem: null,
      label: STORE_ITEM_PURCHASE_ACTION_COPY.unavailable,
      statusTone: 'neutral',
    };
  }
}

export default function StoreItemPurchaseActions({
  api,
  cartItem,
  cartSeed,
  purchaseHint,
}: StoreItemPurchaseActionsProps) {
  const [purchaseState, setPurchaseState] = React.useState<StoreItemPurchaseActionState>(() =>
    cartSeed
      ? { cartItem: null, label: null, statusTone: 'neutral' }
      : {
          cartItem,
          label: cartItem ? null : STORE_ITEM_PURCHASE_ACTION_COPY.unavailable,
          statusTone: 'neutral',
        },
  );
  const [isChecking, setIsChecking] = React.useState(Boolean(cartSeed));

  React.useEffect(() => {
    if (!cartSeed) {
      setPurchaseState({
        cartItem,
        label: cartItem ? null : STORE_ITEM_PURCHASE_ACTION_COPY.unavailable,
        statusTone: 'neutral',
      });
      setIsChecking(false);
      return;
    }

    let isActive = true;
    const pricedCartSeed = cartSeed;
    const checkoutApi = api ?? createPublicCheckoutApi();
    setPurchaseState({ cartItem: null, label: null, statusTone: 'neutral' });
    setIsChecking(true);

    async function loadWorkerOffer() {
      const nextState = await loadStoreItemPurchaseActionState(checkoutApi, pricedCartSeed);

      if (isActive) {
        setPurchaseState(nextState);
        setIsChecking(false);
      }
    }

    void loadWorkerOffer();

    return () => {
      isActive = false;
    };
  }, [api, cartItem, cartSeed]);

  const activeCartItem = purchaseState.cartItem;

  if (!activeCartItem) {
    const statusLabel = isChecking ? STORE_ITEM_PURCHASE_ACTION_COPY.checking : purchaseState.label;

    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={`${purchaseActionLayoutClasses} border text-xl font-semibold normal-case tracking-normal shadow-none disabled:opacity-100 ${
          !isChecking && purchaseState.statusTone === 'sold-out'
            ? 'border-[#922f3f]/60 bg-transparent text-[#b3b3b3]'
            : 'border-[#767676] bg-[#141414] text-[#b3b3b3]'
        }`}
        disabled
        aria-busy={isChecking ? 'true' : undefined}
        aria-live="polite"
        aria-atomic="true"
        data-store-item-purchase-status
        data-store-item-purchase-tone={purchaseState.statusTone}
      >
        {isChecking ? (
          <LoadingButtonContent label={STORE_ITEM_PURCHASE_ACTION_COPY.checking} />
        ) : (
          (statusLabel ?? STORE_ITEM_PURCHASE_ACTION_COPY.unavailable)
        )}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        className={`${purchaseActionLayoutClasses} uppercase tracking-[0.12em]`}
        data-store-item-add-to-cart
        onClick={() => requestStoreCartAddItem(activeCartItem)}
      >
        {STORE_ITEM_PURCHASE_ACTION_COPY.addToCart}
      </Button>
      {purchaseHint && <p className="text-sm leading-relaxed text-muted-foreground">{purchaseHint}</p>}
    </>
  );
}
