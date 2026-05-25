import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PackageCheck, ReceiptText, Truck, type LucideIcon } from 'lucide-react';

import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { LoadingStateBlock } from '@/components/ui/loading-feedback';
import { createEmptyStoreCartState, STORE_CART_OPEN_REQUESTED_EVENT, writeStoreCartState } from '@/lib/store-cart';
import { cn } from '@/lib/utils';
import { CHECKOUT_CART_UPDATED_EVENT } from './CheckoutOrderSummary';
import {
  createCheckoutReturnStatusView,
  loadCheckoutReturnState,
  readCheckoutSessionIdFromSearch,
  type CheckoutReturnLoadState,
  type CheckoutReturnStatusView,
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

export function clearStoreCartAfterPaidCheckout(
  eventTarget: EventTarget = window,
  storage: Parameters<typeof writeStoreCartState>[0] = window.localStorage,
) {
  const emptyCartState = createEmptyStoreCartState();
  writeStoreCartState(storage, emptyCartState);

  return eventTarget.dispatchEvent(new CustomEvent(CHECKOUT_CART_UPDATED_EVENT, { detail: emptyCartState }));
}

export default function CheckoutReturnStatus({ api, checkoutPath, itemPath, storePath }: CheckoutReturnStatusProps) {
  const [loadState, setLoadState] = useState<CheckoutReturnLoadState>({ kind: 'loading' });
  const clearedCheckoutSessionIds = useRef(new Set<string>());
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

  useEffect(() => {
    if (loadState.kind !== 'ready' || loadState.checkoutState.state !== 'paid') return;

    const { checkoutSessionId } = loadState.checkoutState;
    if (clearedCheckoutSessionIds.current.has(checkoutSessionId)) return;

    clearedCheckoutSessionIds.current.add(checkoutSessionId);
    clearStoreCartAfterPaidCheckout();
  }, [loadState]);

  if (loadState.kind === 'loading') {
    return <CheckoutReturnPendingStatus />;
  }

  if (view.isFinal) {
    return <CheckoutSuccessScreen storePath={storePath} view={view} />;
  }

  return (
    <CheckoutReturnStatusScreen checkoutPath={checkoutPath} itemPath={itemPath} storePath={storePath} view={view} />
  );
}

function CheckoutReturnPendingStatus() {
  const view = createCheckoutReturnStatusView({ kind: 'loading' });

  return (
    <section className="mx-auto max-w-4xl space-y-5" data-checkout-return-status data-checkout-return-pending>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{view.kicker}</p>
        <CheckoutReturnBadge view={view} />
      </div>
      <LoadingStateBlock
        className="min-h-[22rem] bg-background/45"
        title={view.title}
        description={`${view.detail} ${view.nextStep}`}
      />
    </section>
  );
}

export function CheckoutSuccessScreen({ storePath, view }: { storePath: string; view: CheckoutReturnStatusView }) {
  return (
    <section className="mx-auto max-w-5xl space-y-6" data-checkout-return-status data-checkout-success-screen>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{view.kicker}</p>
        <CheckoutReturnBadge view={view} />
      </div>

      <div className="grid overflow-hidden border border-border/70 bg-card/35 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.8fr)]">
        <div className="flex min-h-[25rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="space-y-7">
            <div
              className="flex size-16 items-center justify-center border border-emerald-300/45 bg-emerald-300/10 text-emerald-100 sm:size-20"
              aria-hidden="true"
            >
              <CheckCircle2 className="size-9 sm:size-11" strokeWidth={1.7} />
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="font-display text-6xl uppercase leading-none tracking-[0.08em] text-foreground sm:text-7xl lg:text-8xl">
                {view.title}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">{view.detail}</p>
            </div>
          </div>

          <div className="mt-10 border-t border-border/60 pt-5">
            <a
              className="inline-flex min-h-11 w-full items-center justify-center bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/88 sm:w-auto sm:min-w-64"
              href={storePath}
            >
              {CHECKOUT_RETURN_ACTION_COPY.continueShopping}
            </a>
          </div>
        </div>

        {view.nextSteps && <CheckoutSuccessNextSteps view={view} />}
      </div>
    </section>
  );
}

function CheckoutSuccessNextSteps({ view }: { view: CheckoutReturnStatusView }) {
  if (!view.nextSteps) return null;

  const { heading, items } = view.nextSteps;

  return (
    <aside
      className="border-t border-border/70 bg-[#101010] p-6 sm:p-8 lg:border-t-0 lg:border-l"
      data-checkout-next-steps
    >
      <h2 className="font-display text-3xl uppercase tracking-[0.08em] text-foreground">{heading}</h2>
      <ol className="mt-7 space-y-0">
        {items.map((item, index) => (
          <li className="grid grid-cols-[2.75rem_1fr] gap-4" key={item.label}>
            <div className="relative flex justify-center">
              <div className="z-10 flex size-11 items-center justify-center border border-border/80 bg-background text-foreground">
                <CheckoutNextStepIcon icon={item.icon} />
              </div>
              {index < items.length - 1 && (
                <div className="absolute top-11 bottom-0 w-px bg-border/80" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 border-b border-border/55 pb-6 last:border-b-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{item.value}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function CheckoutNextStepIcon({ icon }: { icon: 'receipt' | 'fulfillment' | 'delivery' }) {
  const Icon: LucideIcon = {
    delivery: Truck,
    fulfillment: PackageCheck,
    receipt: ReceiptText,
  }[icon];

  return <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />;
}

export function CheckoutReturnStatusScreen({
  checkoutPath,
  itemPath,
  storePath,
  view,
}: {
  checkoutPath: string;
  itemPath: string;
  storePath: string;
  view: CheckoutReturnStatusView;
}) {
  return (
    <section className="mx-auto max-w-4xl space-y-5" data-checkout-return-status>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{view.kicker}</p>
        <CheckoutReturnBadge view={view} />
      </div>

      <div className="space-y-4 border border-border/70 bg-background/45 p-5 sm:p-6">
        <div className="space-y-3">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-foreground">{view.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{view.detail}</p>
          {view.nextStep && <p className="text-sm leading-6 text-foreground">{view.nextStep}</p>}
        </div>

        {view.shippingLocker.kind === 'selected' && <CheckoutShippingLockerRecap view={view} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            href={storePath}
          >
            {CHECKOUT_RETURN_ACTION_COPY.continueShopping}
          </a>
          <a
            className="inline-flex min-h-11 items-center justify-center bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/88"
            href={checkoutPath}
          >
            {CHECKOUT_RETURN_ACTION_COPY.retryCheckout}
          </a>
          <a
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            href={itemPath}
          >
            {CHECKOUT_RETURN_ACTION_COPY.backToItem}
          </a>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => requestStoreCartOpen()}
          >
            {CHECKOUT_RETURN_ACTION_COPY.backToCart}
          </button>
        </div>
      </div>
    </section>
  );
}

function CheckoutReturnBadge({ view }: { view: CheckoutReturnStatusView }) {
  return (
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
  );
}

function CheckoutShippingLockerRecap({ view }: { view: CheckoutReturnStatusView }) {
  if (view.shippingLocker.kind !== 'selected') return null;

  return (
    <div className="mb-5 grid gap-2 border border-border/70 bg-background/55 p-4" data-checkout-return-locker-recap>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
      <p className="text-sm font-medium leading-6 text-foreground">{view.shippingLocker.label}</p>
      <p className="text-xs leading-5 text-muted-foreground">{view.shippingLocker.detail}</p>
    </div>
  );
}
