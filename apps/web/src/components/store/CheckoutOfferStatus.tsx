import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingButtonContent, LoadingInline } from '@/components/ui/loading-feedback';
import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { getStoreCartCount, readStoreCartState, type CartLine, type CartLineItemSnapshot } from '@/lib/store-cart';
import { cn } from '@/lib/utils';
import {
  createCartCheckoutOfferView,
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startHostedCheckout,
  type CheckoutOfferInitialAvailability,
  type CheckoutOfferStatusView,
} from './checkout-offer-status-state';
import CheckoutShippingStep from './CheckoutShippingStep';
import { CHECKOUT_CART_UPDATED_EVENT } from './CheckoutOrderSummary';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';
import { createCartLineItemSnapshotFromWorkerOffer, type StoreItemCartSeed } from './StoreItemPurchaseActions';

interface CheckoutOfferStatusProps {
  checkoutClientMode?: string;
  fallbackCartSeed?: StoreItemCartSeed | null;
  fallbackLineItem?: CartLineItemSnapshot | null;
  initialAvailability: CheckoutOfferInitialAvailability;
  showReviewSiteMarker?: boolean;
  storeItemSlug?: string;
  api?: PublicCheckoutApi;
}

export type CheckoutCartItemSummary = {
  label: 'Cart' | 'Item';
  value: string;
};

export const STRIPE_CHECKOUT_CTA_COPY = 'Continue to Stripe Checkout';
export const STRIPE_CHECKOUT_BADGE_SRC = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/assets/vendor/stripe/powered-by-stripe.svg`;

export function createStripeCheckoutCtaView(isStartingCheckout: boolean) {
  return {
    badgeSrc: isStartingCheckout ? null : STRIPE_CHECKOUT_BADGE_SRC,
    label: isStartingCheckout ? 'Opening Stripe Checkout' : STRIPE_CHECKOUT_CTA_COPY,
  };
}

export function createCheckoutCartItemSummary(
  cartLines: CartLine[],
  fallbackLineItem: CartLineItemSnapshot | null = null,
): CheckoutCartItemSummary {
  if (cartLines.length > 1) {
    return {
      label: 'Cart',
      value: `${getStoreCartCount({ lines: cartLines, primaryLineItem: cartLines[0] ?? null })} items in cart`,
    };
  }

  const line = cartLines[0] ?? fallbackLineItem;
  if (line) {
    return {
      label: 'Item',
      value: [line.title, line.optionLabel].filter(Boolean).join(' / '),
    };
  }

  return {
    label: 'Cart',
    value: 'Cart is empty',
  };
}

export default function CheckoutOfferStatus({
  api,
  checkoutClientMode = import.meta.env.PUBLIC_CHECKOUT_CLIENT_MODE,
  fallbackCartSeed = null,
  fallbackLineItem = null,
  initialAvailability,
  showReviewSiteMarker = false,
  storeItemSlug,
}: CheckoutOfferStatusProps) {
  const [view, setView] = useState<CheckoutOfferStatusView>(() => createInitialCheckoutOfferView(initialAvailability));
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isNewsletterOptedIn, setIsNewsletterOptedIn] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [workerFallbackLineItem, setWorkerFallbackLineItem] = useState<CartLineItemSnapshot | null>(fallbackLineItem);
  const itemSummary = createCheckoutCartItemSummary(cartLines, workerFallbackLineItem);
  const ctaView = createStripeCheckoutCtaView(isStartingCheckout);
  const shippingGateView = createCheckoutShippingGateView(checkoutClientMode);
  const hasCheckoutLine = cartLines.length > 0 || Boolean(workerFallbackLineItem);

  useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    async function loadOffer() {
      if (!storeItemSlug) {
        try {
          const capabilities = await checkoutApi.readStoreCapabilities();
          if (isActive) setView(createCartCheckoutOfferView(capabilities));
        } catch {
          if (isActive) {
            setView({
              badgeLabel: 'Checkout unavailable',
              canStartCheckout: false,
              detail: 'Could not load checkout status.',
              isReady: false,
              statusLabel: 'Checkout unavailable',
              tone: 'error',
              variantId: null,
            });
          }
        }
        return;
      }

      const loadState = await loadCheckoutOfferState(checkoutApi, storeItemSlug);

      if (isActive) {
        setView(createCheckoutOfferView(loadState));
        setWorkerFallbackLineItem(
          loadState.kind === 'ready'
            ? (createCartLineItemSnapshotFromWorkerOffer(fallbackCartSeed, loadState.offer) ?? fallbackLineItem)
            : fallbackLineItem,
        );
      }
    }

    void loadOffer();

    return () => {
      isActive = false;
    };
  }, [api, fallbackCartSeed, fallbackLineItem, storeItemSlug]);

  useEffect(() => {
    function syncCartState() {
      setCartLines(readStoreCartState(window.localStorage).lines);
      clearCheckoutError();
    }

    syncCartState();
    window.addEventListener(CHECKOUT_CART_UPDATED_EVENT, syncCartState);

    return () => {
      window.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, syncCartState);
    };
  }, []);

  async function handleStartCheckout() {
    const checkoutApi = api ?? createPublicCheckoutApi();

    if (!shippingGateView.canContinueToPayment) {
      setCheckoutError('Stripe will collect the shipping details.');
      return;
    }

    const currentCartLines = readStoreCartState(window.localStorage).lines;
    if (currentCartLines.length === 0 && !workerFallbackLineItem) {
      setCheckoutError('Add a priced item to the cart before checkout.');
      return;
    }

    const fallbackStartLine = currentCartLines[0] ?? workerFallbackLineItem;
    if (!fallbackStartLine || (currentCartLines.length === 0 && !view.variantId)) {
      setCheckoutError('Checkout is not ready for this item yet.');
      return;
    }

    setCheckoutError(null);
    setIsStartingCheckout(true);

    const checkoutState = await startHostedCheckout({
      api: checkoutApi,
      lines: currentCartLines,
      newsletterOptIn: isNewsletterOptedIn,
      storeItemSlug: fallbackStartLine.storeItemSlug,
      variantId: currentCartLines[0]?.variantId ?? view.variantId ?? fallbackStartLine.variantId,
    });

    if (checkoutState.kind === 'redirect') {
      window.location.assign(checkoutState.checkoutUrl);
      return;
    }

    setCheckoutError(checkoutState.message);
    setIsStartingCheckout(false);
  }

  function clearCheckoutError() {
    setCheckoutError(null);
  }

  return (
    <div className="min-w-0 space-y-5" data-checkout-offer-status>
      <CheckoutShippingStep checkoutClientMode={checkoutClientMode} />

      <Card className="min-w-0 rounded-none border-border/70 bg-[#111111] shadow-none">
        <CardContent className="grid min-w-0 grid-cols-1 gap-5 p-5 sm:p-6">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
            <div className="min-w-0 max-w-full space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
              <h3 className="font-display text-3xl uppercase tracking-[0.08em] text-foreground sm:text-4xl">
                Review and Pay
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Stripe handles the secure payment page. BlackBox never sees card details.
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
                view.tone === 'ready' && 'border-foreground/30 bg-background/70 text-foreground',
                view.tone === 'unavailable' && 'border-border/70 bg-background/70 text-muted-foreground',
                view.tone === 'error' && 'border-amber-300/45 bg-amber-300/10 text-amber-100',
                view.tone === 'loading' && 'border-border/70 bg-background/50 text-muted-foreground',
              )}
            >
              {view.badgeLabel}
            </Badge>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-px border border-border/70 bg-border/70 sm:grid-cols-2">
            <div className="min-w-0 bg-background/85 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{itemSummary.label}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground">{itemSummary.value}</p>
            </div>
            <div className="min-w-0 bg-background/85 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground">Greece only</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
            {view.tone === 'loading' && (
              <LoadingInline
                className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
                label="Confirming price and availability"
              />
            )}

            {view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine ? (
              <div className="grid gap-4">
                <label className="flex max-w-2xl items-start gap-3 border border-border/70 bg-background/55 p-3 text-sm leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-foreground"
                    checked={isNewsletterOptedIn}
                    disabled={isStartingCheckout}
                    onChange={(event) => {
                      setIsNewsletterOptedIn(event.currentTarget.checked);
                    }}
                  />
                  <span>
                    Email me BlackBox Records release, distro, and event updates. You can unsubscribe anytime.
                  </span>
                </label>

                {showReviewSiteMarker && (
                  <p
                    className="text-xs font-semibold leading-relaxed text-foreground"
                    data-review-site-checkout-warning
                  >
                    Test checkout. No real payment will be taken.
                  </p>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="inline-flex h-auto min-h-11 w-full flex-wrap gap-2 rounded-none px-4 py-3 text-center uppercase tracking-[0.16em] whitespace-normal sm:w-auto sm:min-w-72 sm:flex-nowrap sm:gap-3 sm:px-6"
                  disabled={isStartingCheckout}
                  aria-busy={isStartingCheckout ? 'true' : undefined}
                  onClick={() => {
                    void handleStartCheckout();
                  }}
                >
                  {isStartingCheckout ? (
                    <LoadingButtonContent label={ctaView.label} />
                  ) : ctaView.badgeSrc ? (
                    <>
                      <span className="min-w-0 leading-tight">{ctaView.label}</span>
                      <img className="h-[18px] w-auto shrink-0" src={ctaView.badgeSrc} alt="" aria-hidden="true" />
                    </>
                  ) : (
                    ctaView.label
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {!hasCheckoutLine
                  ? 'Add a priced item to the cart before checkout.'
                  : view.canStartCheckout
                    ? 'Stripe opens after checkout is ready.'
                    : 'Payment opens after price and availability are confirmed.'}
              </p>
            )}

            {checkoutError && (
              <p
                className="border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100"
                role="alert"
              >
                {checkoutError}
              </p>
            )}

            {isStartingCheckout && (
              <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
                Opening Stripe Checkout. Keep this tab open while the secure payment page loads.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
