import * as React from 'react';
import { useEffect, useState } from 'react';

import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { STORE_CART_OPEN_REQUESTED_EVENT } from '@/lib/store-cart';
import { cn } from '@/lib/utils';
import {
  createCheckoutReturnStatusView,
  loadCheckoutReturnState,
  readCheckoutSessionIdFromSearch,
  type CheckoutReturnLoadState,
} from './checkout-return-status-state';

type CheckoutReturnStatusProps = {
  checkoutPath: string;
  itemPath: string;
  storePath: string;
  api?: Pick<PublicCheckoutApi, 'readCheckoutState'>;
};

export const CHECKOUT_RETURN_ACTION_COPY = {
  backToCart: 'Back To Cart',
  backToItem: 'Back To Item',
  continueShopping: 'Continue Shopping',
  retryCheckout: 'Retry Checkout',
} as const;

export function requestStoreCartOpen(eventTarget: EventTarget = window) {
  return eventTarget.dispatchEvent(new Event(STORE_CART_OPEN_REQUESTED_EVENT));
}

export default function CheckoutReturnStatus({ api, checkoutPath, itemPath, storePath }: CheckoutReturnStatusProps) {
  const [loadState, setLoadState] = useState<CheckoutReturnLoadState>({ kind: 'loading' });
  const view = createCheckoutReturnStatusView(loadState);

  useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();
    const checkoutSessionId = readCheckoutSessionIdFromSearch(window.location.search);

    async function loadStateFromWorker() {
      const nextState = await loadCheckoutReturnState(checkoutApi, checkoutSessionId);

      if (isActive) {
        setLoadState(nextState);
      }
    }

    void loadStateFromWorker();

    return () => {
      isActive = false;
    };
  }, [api]);

  return (
    <section className="space-y-5" data-checkout-return-status>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Checkout Return</p>
        <span
          className={cn(
            'inline-flex border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
            view.tone === 'success' && 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100',
            view.tone === 'attention' && 'border-foreground/25 bg-background/70 text-foreground',
            view.tone === 'error' && 'border-amber-300/45 bg-amber-300/10 text-amber-100',
            view.tone === 'loading' && 'border-border/70 bg-background/60 text-muted-foreground',
          )}
        >
          {view.badgeLabel}
        </span>
      </div>

      <div className="space-y-4 border border-border/70 bg-background/45 p-5">
        <div className="space-y-3">
          <h2 className="font-display text-4xl uppercase tracking-[0.08em] text-foreground">{view.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{view.detail}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {!view.isFinal && (
            <a
              className="inline-flex min-h-11 items-center justify-center bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/88"
              href={checkoutPath}
            >
              {CHECKOUT_RETURN_ACTION_COPY.retryCheckout}
            </a>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => requestStoreCartOpen()}
          >
            {CHECKOUT_RETURN_ACTION_COPY.backToCart}
          </button>
          <a
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            href={itemPath}
          >
            {CHECKOUT_RETURN_ACTION_COPY.backToItem}
          </a>
          <a
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            href={storePath}
          >
            {CHECKOUT_RETURN_ACTION_COPY.continueShopping}
          </a>
        </div>
      </div>
    </section>
  );
}
