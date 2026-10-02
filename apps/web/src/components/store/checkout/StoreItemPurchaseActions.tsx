import * as React from 'react';

import { Button } from '@/components/ui/button';
import { LoadingButtonContent } from '@/components/ui/loading-feedback';
import {
  createPublicCheckoutApi,
  formatStoreLowStockLabel,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '@/components/store/checkout/public-checkout-api';
import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import { queuePendingStoreCartAddItem, STORE_CART_ITEM_ADDED_EVENT } from '@/components/store/cart/store-cart-events';
import { cn } from '@/components/ui/utils';

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
  lowStockLabel?: string;
  statusTone: StoreItemPurchaseStatusTone;
};

type StoreItemPurchaseStatusTone = 'neutral' | 'sold-out';

const purchaseActionLayoutClasses = 'w-full sm:w-56 whitespace-normal';

export const STORE_ITEM_PURCHASE_ACTION_COPY = {
  added: 'Added',
  addedAnnouncement: 'Added to cart',
  addToCart: 'Add To Cart',
  checking: 'Checking availability',
  unavailable: 'Currently Unavailable',
} as const;

// The purchase control confirms in place: it reads Added for this long after a successful add.
export const STORE_ITEM_ADDED_CONFIRMATION_MS = 4000;

export function getStoreItemPurchaseStatusTone(label: string | null): StoreItemPurchaseStatusTone {
  return label === 'Sold Out' ? 'sold-out' : 'neutral';
}

// Returns true while no cart bridge acknowledged the add; the request then waits until the bridge connects.
export function requestStoreCartAddItem(item: CartLineItemSnapshot, eventTarget: EventTarget = window) {
  const isUnacknowledged = eventTarget.dispatchEvent(
    new CustomEvent<CartLineItemSnapshot>(STORE_CART_ADD_ITEM_EVENT, {
      cancelable: true,
      detail: item,
    }),
  );
  if (isUnacknowledged) queuePendingStoreCartAddItem(item);
  return isUnacknowledged;
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
    const lowStockLabel =
      resolvedCartItem && offer.catalogStatus === 'ready' ? formatStoreLowStockLabel(offer.lowStockQuantity) : null;
    const label = resolvedCartItem
      ? null
      : offer.catalogStatus === 'ready'
        ? STORE_ITEM_PURCHASE_ACTION_COPY.unavailable
        : offer.availability.label;

    return {
      cartItem: resolvedCartItem,
      label,
      ...(lowStockLabel ? { lowStockLabel } : {}),
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

// Store cards are not islands: their Buy reads the authoritative Store Offer only when pressed.
export async function requestStoreCartAddFromSeed(
  cartSeed: StoreItemCartSeed,
  api: PublicCheckoutApi = createPublicCheckoutApi(),
) {
  const state = await loadStoreItemPurchaseActionState(api, cartSeed);
  return { ...state, isQueued: state.cartItem ? requestStoreCartAddItem(state.cartItem) : false };
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
  const [addedCount, setAddedCount] = React.useState(0);
  const [isAddedVisible, setIsAddedVisible] = React.useState(false);

  React.useEffect(() => {
    if (addedCount === 0) return;
    const timer = window.setTimeout(() => setIsAddedVisible(false), STORE_ITEM_ADDED_CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [addedCount]);

  // Say Added only once the cart confirms this item arrived.
  const activeVariantId = purchaseState.cartItem?.variantId;
  React.useEffect(() => {
    if (!activeVariantId) return;
    function handleItemAdded(event: Event) {
      if ((event as CustomEvent<{ variantId?: string }>).detail?.variantId !== activeVariantId) return;
      setAddedCount((count) => count + 1);
      setIsAddedVisible(true);
    }
    window.addEventListener(STORE_CART_ITEM_ADDED_EVENT, handleItemAdded);
    return () => window.removeEventListener(STORE_CART_ITEM_ADDED_EVENT, handleItemAdded);
  }, [activeVariantId]);

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

  if (!activeCartItem && isChecking) {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={`${purchaseActionLayoutClasses} disabled:opacity-100`}
        disabled
        aria-busy="true"
        aria-live="polite"
        aria-atomic="true"
        data-store-item-purchase-status
        data-store-item-purchase-tone={purchaseState.statusTone}
      >
        <LoadingButtonContent label={STORE_ITEM_PURCHASE_ACTION_COPY.checking} />
      </Button>
    );
  }

  if (!activeCartItem) {
    // Not buyable is information, not a control: a status in the purchase slot, never a disabled button.
    return (
      <p
        role="status"
        aria-atomic="true"
        data-store-item-purchase-status
        data-store-item-purchase-tone={purchaseState.statusTone}
        className={cn(
          purchaseActionLayoutClasses,
          'inline-flex min-h-11 items-center justify-center border px-4 pt-px text-center font-display text-base leading-none tracking-[0.06em] text-foreground uppercase',
          purchaseState.statusTone === 'sold-out' ? 'border-[var(--store-accent)]' : 'border-[#767676]',
        )}
      >
        {purchaseState.label ?? STORE_ITEM_PURCHASE_ACTION_COPY.unavailable}
      </p>
    );
  }

  return (
    <>
      {purchaseState.lowStockLabel && (
        <p className="store-low-stock" data-store-item-low-stock>
          {purchaseState.lowStockLabel}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        variant={isAddedVisible ? 'outline' : 'default'}
        className={purchaseActionLayoutClasses}
        data-store-item-add-to-cart
        data-store-item-added={isAddedVisible ? '' : undefined}
        onClick={() => requestStoreCartAddItem(activeCartItem)}
      >
        {isAddedVisible ? STORE_ITEM_PURCHASE_ACTION_COPY.added : STORE_ITEM_PURCHASE_ACTION_COPY.addToCart}
        {isAddedVisible && (
          <span key={addedCount} className="site-feedback-hairline" data-duration="4s" aria-hidden="true" />
        )}
      </Button>
      <span className="sr-only" aria-live="polite">
        {isAddedVisible ? STORE_ITEM_PURCHASE_ACTION_COPY.addedAnnouncement : ''}
      </span>
      {purchaseHint && <p className="text-sm leading-relaxed text-muted-foreground">{purchaseHint}</p>}
    </>
  );
}
