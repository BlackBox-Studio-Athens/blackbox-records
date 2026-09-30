import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingButtonContent, LoadingInline } from '@/components/ui/loading-feedback';
import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/components/store/checkout/public-checkout-api';
import { readStoreCartState, type CartLine, type CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import { CHECKOUT_CART_UPDATED_EVENT } from '@/components/store/cart/store-cart-events';
import { cn } from '@/components/ui/utils';
import {
  createCartCheckoutOfferView,
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startHostedCheckout,
  type CheckoutOfferInitialAvailability,
  type CheckoutOfferStatusView,
} from './checkout-offer-status-state';
import { DeliverySummary, useDeliveryQuote } from './DeliverySummary';
import { PrivacyLink } from '@/platform/components/PurchaseInformation';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';
import { createCartLineItemSnapshotFromWorkerOffer, type StoreItemCartSeed } from './StoreItemPurchaseActions';
import { clearCheckoutAttempt, getOrCreateCheckoutAttempt } from './checkout-attempt';

interface CheckoutOfferStatusProps {
  checkoutClientMode?: string;
  fallbackCartSeed?: StoreItemCartSeed | null;
  fallbackLineItem?: CartLineItemSnapshot | null;
  initialAvailability: CheckoutOfferInitialAvailability;
  showReviewSiteMarker?: boolean;
  storeItemSlug?: string;
  api?: PublicCheckoutApi;
}

export const STRIPE_CHECKOUT_CTA_COPY = 'Continue to Stripe Checkout';
export const STRIPE_CHECKOUT_BADGE_SRC = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/assets/vendor/stripe/powered-by-stripe.svg`;

export function createStripeCheckoutCtaView(isStartingCheckout: boolean) {
  return {
    badgeSrc: isStartingCheckout ? null : STRIPE_CHECKOUT_BADGE_SRC,
    label: isStartingCheckout ? 'Opening Stripe Checkout' : STRIPE_CHECKOUT_CTA_COPY,
  };
}

export const WAITING_FOR_SHIPPING_QUOTE_COPY = 'Waiting for shipping quote';

// Fill means ready: Pay stays charcoal and says what it waits for, then fills to ink with the amount.
export function createPayControlView({
  hasQuote,
  isStartingCheckout,
  quoteLoading,
  quoteTotalDisplay,
}: {
  hasQuote: boolean;
  isStartingCheckout: boolean;
  quoteLoading: boolean;
  quoteTotalDisplay: string | null;
}) {
  const cta = createStripeCheckoutCtaView(isStartingCheckout);
  const isReady = hasQuote && !quoteLoading;
  const isWaitingForQuote = quoteLoading && !isStartingCheckout;

  return {
    amountDisplay: isReady && !isStartingCheckout ? quoteTotalDisplay : null,
    badgeSrc: isReady ? cta.badgeSrc : null,
    isWaitingForQuote,
    label: isWaitingForQuote ? WAITING_FOR_SHIPPING_QUOTE_COPY : cta.label,
    variant: isReady ? ('default' as const) : ('outline' as const),
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
  const [checkoutAttemptTerminal, setCheckoutAttemptTerminal] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isNewsletterOptedIn, setIsNewsletterOptedIn] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [workerFallbackLineItem, setWorkerFallbackLineItem] = useState<CartLineItemSnapshot | null>(fallbackLineItem);
  const shippingGateView = createCheckoutShippingGateView(checkoutClientMode);
  const hasCheckoutLine = cartLines.length > 0 || Boolean(workerFallbackLineItem);
  const delivery = useDeliveryQuote(
    cartLines.length
      ? cartLines
      : workerFallbackLineItem
        ? [
            {
              storeItemSlug: workerFallbackLineItem.storeItemSlug,
              variantId: workerFallbackLineItem.variantId,
              quantity: 1,
            },
          ]
        : [],
  );

  const payView = createPayControlView({
    hasQuote: Boolean(delivery.quote),
    isStartingCheckout,
    quoteLoading: delivery.loading,
    quoteTotalDisplay: delivery.totalDisplay,
  });

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
    if (!delivery.quote || delivery.loading) return;
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
    setCheckoutAttemptTerminal(false);
    setIsStartingCheckout(true);

    const primaryVariantId = currentCartLines[0]?.variantId ?? view.variantId ?? fallbackStartLine.variantId;
    const idempotencyKey = getOrCreateCheckoutAttempt({
      lines: currentCartLines,
      newsletterOptIn: isNewsletterOptedIn,
      storeItemSlug: fallbackStartLine.storeItemSlug,
      variantId: primaryVariantId,
    });
    const checkoutState = await startHostedCheckout({
      api: checkoutApi,
      idempotencyKey,
      lines: currentCartLines,
      newsletterOptIn: isNewsletterOptedIn,
      storeItemSlug: fallbackStartLine.storeItemSlug,
      variantId: primaryVariantId,
    });

    if (checkoutState.kind === 'redirect') {
      window.location.assign(checkoutState.checkoutUrl);
      return;
    }

    setCheckoutError(checkoutState.message);
    setCheckoutAttemptTerminal(checkoutState.code === 'checkout_attempt_terminal');
    setIsStartingCheckout(false);
  }

  function clearCheckoutError() {
    setCheckoutError(null);
    setCheckoutAttemptTerminal(false);
  }

  return (
    <Card className="min-w-0 rounded-none border-border/70 bg-[#111111] shadow-none" data-checkout-offer-status>
      <CardContent className="grid min-w-0 grid-cols-1 gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">Review and Pay</h2>
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
            {view.canStartCheckout && (delivery.loading || !delivery.quote)
              ? delivery.loading
                ? 'Checking delivery'
                : 'Delivery unavailable'
              : view.badgeLabel}
          </Badge>
        </div>

        <DeliverySummary {...delivery} />

        <div className="grid gap-3 border-t border-border/60 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
          {view.tone === 'loading' && (
            <LoadingInline
              className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
              label="Confirming price and availability"
            />
          )}

          {view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4">
                <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
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
                <span className="text-xs text-muted-foreground">
                  <PrivacyLink />
                </span>
              </div>

              {showReviewSiteMarker && (
                <p className="text-xs font-semibold leading-relaxed text-foreground" data-review-site-checkout-warning>
                  Test checkout. No real payment will be taken.
                </p>
              )}

              <Button
                type="button"
                size="lg"
                variant={payView.variant}
                className={cn(
                  'w-full flex-wrap py-2 text-center whitespace-normal sm:flex-nowrap',
                  payView.isWaitingForQuote && 'text-muted-foreground disabled:opacity-100',
                )}
                disabled={isStartingCheckout || delivery.loading || !delivery.quote}
                aria-busy={isStartingCheckout || payView.isWaitingForQuote ? 'true' : undefined}
                data-checkout-pay-state={payView.variant === 'default' ? 'ready' : 'waiting'}
                onClick={() => {
                  void handleStartCheckout();
                }}
              >
                {isStartingCheckout || payView.isWaitingForQuote ? (
                  <LoadingButtonContent label={payView.label} />
                ) : (
                  <>
                    <span className="min-w-0 leading-tight">{payView.label}</span>
                    {payView.amountDisplay && (
                      <span className="tabular-nums" aria-hidden="true" data-checkout-pay-amount>
                        {payView.amountDisplay}
                      </span>
                    )}
                    {payView.badgeSrc && (
                      <img className="h-[18px] w-auto shrink-0" src={payView.badgeSrc} alt="" aria-hidden="true" />
                    )}
                  </>
                )}
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">BlackBox never sees card details.</p>
            </>
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
            <div className="space-y-3">
              <p
                className="border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100"
                role="alert"
              >
                {checkoutError}
              </p>
              {checkoutAttemptTerminal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearCheckoutAttempt();
                    setCheckoutAttemptTerminal(false);
                    setCheckoutError(null);
                  }}
                >
                  Start a new checkout
                </Button>
              )}
            </div>
          )}

          {isStartingCheckout && (
            <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
              Opening Stripe Checkout. Keep this tab open while the secure payment page loads.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
