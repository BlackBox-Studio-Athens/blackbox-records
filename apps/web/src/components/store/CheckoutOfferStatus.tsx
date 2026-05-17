import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { getStoreCartCount, readStoreCartState, type CartLine, type CartLineItemSnapshot } from '@/lib/store-cart';
import { cn } from '@/lib/utils';
import {
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

interface CheckoutOfferStatusProps {
  checkoutClientMode?: string;
  fallbackLineItem?: CartLineItemSnapshot | null;
  initialAvailability: CheckoutOfferInitialAvailability;
  storeItemSlug: string;
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
    label: isStartingCheckout ? 'Opening Stripe' : STRIPE_CHECKOUT_CTA_COPY,
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
  fallbackLineItem = null,
  initialAvailability,
  storeItemSlug,
}: CheckoutOfferStatusProps) {
  const [view, setView] = useState<CheckoutOfferStatusView>(() => createInitialCheckoutOfferView(initialAvailability));
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const itemSummary = createCheckoutCartItemSummary(cartLines, fallbackLineItem);
  const ctaView = createStripeCheckoutCtaView(isStartingCheckout);
  const shippingGateView = createCheckoutShippingGateView(checkoutClientMode);
  const hasCheckoutLine = cartLines.length > 0 || Boolean(fallbackLineItem);

  useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    async function loadOffer() {
      const loadState = await loadCheckoutOfferState(checkoutApi, storeItemSlug);

      if (isActive) {
        setView(createCheckoutOfferView(loadState));
      }
    }

    void loadOffer();

    return () => {
      isActive = false;
    };
  }, [api, storeItemSlug]);

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

    if (!view.variantId) {
      setCheckoutError('Checkout is not ready for this item yet.');
      return;
    }

    const currentCartLines = readStoreCartState(window.localStorage).lines;
    if (currentCartLines.length === 0 && !fallbackLineItem) {
      setCheckoutError('Add a priced item to the cart before checkout.');
      return;
    }

    setCheckoutError(null);
    setIsStartingCheckout(true);

    const checkoutState = await startHostedCheckout({
      api: checkoutApi,
      lines: currentCartLines,
      storeItemSlug,
      variantId: view.variantId,
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
    <div className="space-y-5" data-checkout-offer-status>
      <CheckoutShippingStep checkoutClientMode={checkoutClientMode} />

      <Card className="rounded-none border-border/70 bg-[#111111] shadow-none">
        <CardContent className="grid gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
            <div className="max-w-xl space-y-2">
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

          <div className="grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2">
            <div className="bg-background/85 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{itemSummary.label}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground">{itemSummary.value}</p>
            </div>
            <div className="bg-background/85 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground">Greece only</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>

            {view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine ? (
              <Button
                type="button"
                size="lg"
                className="inline-flex w-full gap-3 rounded-none uppercase tracking-[0.16em] sm:w-auto sm:min-w-72"
                disabled={isStartingCheckout}
                onClick={() => {
                  void handleStartCheckout();
                }}
              >
                {ctaView.badgeSrc ? (
                  <>
                    <span>{ctaView.label}</span>
                    <img className="h-[18px] w-auto" src={ctaView.badgeSrc} alt="" aria-hidden="true" />
                  </>
                ) : (
                  ctaView.label
                )}
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {!hasCheckoutLine
                  ? 'Add a priced item to the cart before checkout.'
                  : view.canStartCheckout
                    ? 'Stripe opens after checkout is ready.'
                    : 'Payment opens only after this item is confirmed as buyable.'}
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
                Opening Stripe Checkout.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
