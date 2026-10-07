import * as React from 'react';
import { Disc3, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingButtonContent } from '@/components/ui/loading-feedback';
import type { PublicCheckoutApi, PublicStoreOffer } from '@/components/store/checkout/public-checkout-api';
import { formatStoreLowStockLabel } from './public-checkout-presentation';
import type { CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import {
  queuePendingStoreCartAddItem,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_ITEM_ADDED_EVENT,
} from '@/components/store/cart/store-cart-events';
import { cn } from '@/components/ui/utils';
import { DIGITAL_RELEASE_BADGE, preorderBadges } from '@/platform/lib/preorder-estimate';
import {
  availabilityLabel,
  availabilityNote,
  availabilityTone,
  expectedMonthText,
  isNotifiable,
} from '@/platform/lib/availability-copy';
import AvailabilityAlertForm from './AvailabilityAlertForm';

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
  releaseDate?: Date | string | null | undefined;
  isVinyl?: boolean;
};

type StoreItemPurchaseActionState = {
  cartItem: CartLineItemSnapshot | null;
  /** null renders no status: an unavailable, unknown or unreadable offer shows the price only. */
  label: string | null;
  lowStockLabel?: string;
  statusTone: StoreItemPurchaseStatusTone;
  availabilityState?: string;
  expectedMonth?: string;
};

type StoreItemPurchaseStatusTone = 'neutral' | 'sold-out' | 'incoming';

const purchaseActionLayoutClasses = 'w-full sm:w-56 whitespace-normal';

export const STORE_ITEM_PURCHASE_ACTION_COPY = {
  added: 'Added',
  addedAnnouncement: 'Added to cart',
  addToCart: 'Add To Cart',
  preorder: 'Pre-order',
  preorderHint: 'We send it when the copies arrive. If the estimate changes we email you.',
  releasedVinylPreorderHint:
    'The album is out. We send the vinyl when the copies arrive. If the estimate changes we email you.',
  releasedPreorderHint: 'The music is out. We send your copy when it arrives. If the estimate changes we email you.',
  checking: 'Checking availability',
} as const;

// The purchase control confirms in place: it reads Added for this long after a successful add.
export const STORE_ITEM_ADDED_CONFIRMATION_MS = 4000;

// Label and tone follow the offer's typed state, never its label text.
export function readStoreItemPurchaseStatus(
  offer: PublicStoreOffer,
): Pick<StoreItemPurchaseActionState, 'label' | 'statusTone' | 'availabilityState' | 'expectedMonth'> {
  if (offer.catalogStatus === 'ready') return { label: null, statusTone: 'neutral' };
  if (offer.catalogStatus !== 'sold_out') return { label: offer.availability.label || null, statusTone: 'neutral' };
  const state = offer.availability.state;
  return {
    label: availabilityLabel(state),
    statusTone: availabilityTone(state) ?? 'neutral',
    availabilityState: state,
    ...(isNotifiable(state) && offer.expectedMonth ? { expectedMonth: offer.expectedMonth } : {}),
  };
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
    preorder: offer.preorder,
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

    return {
      cartItem: resolvedCartItem,
      ...(resolvedCartItem ? { label: null, statusTone: 'neutral' as const } : readStoreItemPurchaseStatus(offer)),
      ...(lowStockLabel ? { lowStockLabel } : {}),
    };
  } catch {
    return { cartItem: null, label: null, statusTone: 'neutral' };
  }
}

// Store cards are not islands: their Buy reads the authoritative Store Offer only when pressed.
export async function requestStoreCartAddFromSeed(cartSeed: StoreItemCartSeed, api?: PublicCheckoutApi) {
  const checkoutApi = api ?? (await import('./public-checkout-api')).createPublicCheckoutApi();
  const state = await loadStoreItemPurchaseActionState(checkoutApi, cartSeed);
  return { ...state, isQueued: state.cartItem ? requestStoreCartAddItem(state.cartItem) : false };
}

// Not buyable is information, not a control: a status in the purchase slot, never a disabled button. Coming Soon and
// Repressing add their explanatory line and Notify me; an unlabelled state renders nothing.
export function StoreItemPurchaseStatus({
  api,
  state,
  storeItemSlug,
}: {
  api?: PublicCheckoutApi | undefined;
  state: Pick<StoreItemPurchaseActionState, 'label' | 'statusTone' | 'availabilityState' | 'expectedMonth'>;
  storeItemSlug: string | null;
}) {
  if (!state.label) return null;
  const { availabilityState, expectedMonth } = state;
  const status = (
    <p
      role="status"
      aria-atomic="true"
      data-store-item-purchase-status
      data-store-item-purchase-tone={state.statusTone}
      className={cn(
        purchaseActionLayoutClasses,
        'inline-flex min-h-11 items-center justify-center gap-2 border px-4 pt-px text-center font-display text-base leading-none tracking-[0.06em] text-foreground uppercase',
        state.statusTone === 'sold-out' && 'border-[var(--store-accent)]',
        state.statusTone === 'incoming' && 'border-dashed border-[#8c8c8c]',
        state.statusTone === 'neutral' && 'border-[#767676]',
      )}
    >
      {availabilityState === 'coming_soon' && <Disc3 aria-hidden="true" size={14} strokeWidth={1.75} />}
      {availabilityState === 'repressing' && <RotateCw aria-hidden="true" size={14} strokeWidth={1.75} />}
      {state.label}
    </p>
  );
  if (!isNotifiable(availabilityState)) return status;
  const month = expectedMonthText(expectedMonth);
  return (
    <div className="store-availability-status" data-store-item-availability={availabilityState}>
      {status}
      <p className="store-availability-note" data-store-item-availability-note>
        {availabilityNote(availabilityState)}
        {month && ` · ${month}`}
      </p>
      {storeItemSlug && <AvailabilityAlertForm api={api} storeItemSlug={storeItemSlug} />}
    </div>
  );
}

export default function StoreItemPurchaseActions({
  api,
  cartItem,
  cartSeed,
  purchaseHint,
  releaseDate,
  isVinyl = false,
}: StoreItemPurchaseActionsProps) {
  const [purchaseState, setPurchaseState] = React.useState<StoreItemPurchaseActionState>(() =>
    cartSeed
      ? { cartItem: null, label: null, statusTone: 'neutral' }
      : {
          cartItem,
          label: null,
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
        label: null,
        statusTone: 'neutral',
      });
      setIsChecking(false);
      return;
    }

    let isActive = true;
    const pricedCartSeed = cartSeed;
    setPurchaseState({ cartItem: null, label: null, statusTone: 'neutral' });
    setIsChecking(true);

    async function loadWorkerOffer() {
      try {
        const checkoutApi = api ?? (await import('./public-checkout-api')).createPublicCheckoutApi();
        const nextState = await loadStoreItemPurchaseActionState(checkoutApi, pricedCartSeed);
        if (isActive) setPurchaseState(nextState);
      } catch {
        if (isActive) {
          setPurchaseState({ cartItem: null, label: null, statusTone: 'neutral' });
        }
      } finally {
        if (isActive) setIsChecking(false);
      }
    }

    void loadWorkerOffer();

    return () => {
      isActive = false;
    };
  }, [api, cartItem, cartSeed]);

  const activeCartItem = purchaseState.cartItem;
  const released = preorderBadges({ releaseDate, shipEstimate: null, today: new Date() })[0] === DIGITAL_RELEASE_BADGE;
  const preorderHint = released
    ? isVinyl
      ? STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint
      : STORE_ITEM_PURCHASE_ACTION_COPY.releasedPreorderHint
    : STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint;

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
    return <StoreItemPurchaseStatus api={api} state={purchaseState} storeItemSlug={cartSeed?.storeItemSlug ?? null} />;
  }

  const addToCartButton = (
    <Button
      type="button"
      size="lg"
      variant={isAddedVisible ? 'outline' : 'default'}
      className={cn(
        purchaseState.lowStockLabel ? 'w-full whitespace-normal' : purchaseActionLayoutClasses,
        activeCartItem.preorder && 'preorder-action',
      )}
      data-store-item-add-to-cart
      data-store-item-added={isAddedVisible ? '' : undefined}
      onClick={() => requestStoreCartAddItem(activeCartItem)}
    >
      {isAddedVisible
        ? STORE_ITEM_PURCHASE_ACTION_COPY.added
        : activeCartItem.preorder
          ? STORE_ITEM_PURCHASE_ACTION_COPY.preorder
          : STORE_ITEM_PURCHASE_ACTION_COPY.addToCart}
      {isAddedVisible && (
        <span key={addedCount} className="site-feedback-hairline" data-duration="4s" aria-hidden="true" />
      )}
    </Button>
  );

  return (
    <>
      {purchaseState.lowStockLabel ? (
        // The notice and Add To Cart read as one unit: the tab shares the button's width and top edge.
        <div className={cn(purchaseActionLayoutClasses, 'store-low-stock-purchase')}>
          <p className="store-low-stock" data-store-item-low-stock>
            {purchaseState.lowStockLabel}
          </p>
          {addToCartButton}
        </div>
      ) : (
        addToCartButton
      )}
      <span className="sr-only" aria-live="polite">
        {isAddedVisible ? STORE_ITEM_PURCHASE_ACTION_COPY.addedAnnouncement : ''}
      </span>
      {(activeCartItem.preorder || purchaseHint) && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {activeCartItem.preorder ? preorderHint : purchaseHint}
        </p>
      )}
    </>
  );
}
