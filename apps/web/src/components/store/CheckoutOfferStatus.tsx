import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import {
  createConfiguredEmbeddedCheckoutAdapter,
  type EmbeddedCheckoutAdapter,
  type EmbeddedCheckoutMount,
} from '@/lib/backend/stripe-embedded-checkout';
import { readStoreCartState } from '@/lib/store-cart';
import { cn } from '@/lib/utils';
import {
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startEmbeddedCheckout,
  type CheckoutOfferInitialAvailability,
  type CheckoutOfferStatusView,
} from './checkout-offer-status-state';
import CheckoutShippingStep from './CheckoutShippingStep';
import { CHECKOUT_CART_UPDATED_EVENT } from './CheckoutOrderSummary';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';

interface CheckoutOfferStatusProps {
  checkoutClientMode?: string;
  initialAvailability: CheckoutOfferInitialAvailability;
  storeItemSlug: string;
  api?: PublicCheckoutApi;
  checkoutAdapter?: EmbeddedCheckoutAdapter;
}

export default function CheckoutOfferStatus({
  api,
  checkoutAdapter,
  checkoutClientMode = import.meta.env.PUBLIC_CHECKOUT_CLIENT_MODE,
  initialAvailability,
  storeItemSlug,
}: CheckoutOfferStatusProps) {
  const [view, setView] = useState<CheckoutOfferStatusView>(() => createInitialCheckoutOfferView(initialAvailability));
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutMounted, setCheckoutMounted] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const checkoutMountRef = useRef<HTMLDivElement | null>(null);
  const checkoutSessionRef = useRef<EmbeddedCheckoutMount | null>(null);
  const itemOptionLabel =
    initialAvailability.optionLabel || (view.variantId ? 'Selected option' : 'Checking item option');
  const shippingGateView = createCheckoutShippingGateView(checkoutClientMode);

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
    return () => {
      checkoutSessionRef.current?.destroy();
      checkoutSessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.addEventListener(CHECKOUT_CART_UPDATED_EVENT, resetMountedCheckout);

    return () => {
      window.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, resetMountedCheckout);
    };
  }, []);

  async function handleStartCheckout() {
    const checkoutApi = api ?? createPublicCheckoutApi();
    const embeddedCheckoutAdapter = checkoutAdapter ?? createConfiguredEmbeddedCheckoutAdapter();
    const mountTarget = checkoutMountRef.current;

    if (!shippingGateView.canContinueToPayment) {
      setCheckoutError('Shipping details are collected during Stripe Checkout.');
      return;
    }

    if (!view.variantId || !mountTarget) {
      setCheckoutError('Checkout is not ready for this item yet.');
      return;
    }

    setCheckoutError(null);
    setIsStartingCheckout(true);

    checkoutSessionRef.current?.destroy();
    checkoutSessionRef.current = null;
    setCheckoutMounted(false);

    const checkoutState = await startEmbeddedCheckout({
      api: checkoutApi,
      checkoutAdapter: embeddedCheckoutAdapter,
      lines: readStoreCartState(window.localStorage).lines,
      mountTarget,
      storeItemSlug,
      variantId: view.variantId,
    });

    if (checkoutState.kind === 'mounted') {
      checkoutSessionRef.current = checkoutState.mount;
      setCheckoutMounted(true);
      setIsStartingCheckout(false);
      return;
    }

    setCheckoutError(checkoutState.message);
    setIsStartingCheckout(false);
  }

  function resetMountedCheckout() {
    checkoutSessionRef.current?.destroy();
    checkoutSessionRef.current = null;
    setCheckoutMounted(false);
    setCheckoutError(null);
  }

  return (
    <div className="space-y-4" data-checkout-offer-status>
      <CheckoutShippingStep checkoutClientMode={checkoutClientMode} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Payment status</p>
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

      <Card className="rounded-none border-border/70 bg-background/45 shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
              <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">{view.statusLabel}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Item option</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{itemOptionLabel}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>

          <div className="space-y-3 border-t border-border/50 pt-4">
            {view.canStartCheckout && shippingGateView.canContinueToPayment ? (
              <Button
                type="button"
                size="lg"
                className="w-full rounded-none uppercase tracking-[0.16em]"
                disabled={isStartingCheckout}
                onClick={() => {
                  void handleStartCheckout();
                }}
              >
                {isStartingCheckout ? 'Opening Payment' : checkoutMounted ? 'Reload Payment' : 'Continue To Payment'}
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {view.canStartCheckout
                  ? 'Payment opens after the checkout session is ready.'
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

            {checkoutMounted && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Stripe Checkout is mounted below. Payment state is confirmed after return.
              </p>
            )}
          </div>

          <div
            ref={checkoutMountRef}
            data-embedded-checkout-mount
            className={cn(
              'min-h-0 border border-border/60 bg-background/70',
              checkoutMounted ? 'min-h-[560px] p-2' : 'h-px overflow-hidden border-transparent p-0',
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
