import * as React from 'react';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  decrementCartLineQuantityByVariant,
  getCartLineTotalDisplay,
  getCartSubtotalDisplay,
  incrementCartLineQuantityByVariant,
  readStoreCartState,
  writeStoreCartState,
  type CartLine,
} from '@/lib/store-cart';
import { cn } from '@/lib/utils';

export type CheckoutOrderSummaryInput = {
  availabilityLabel: string;
  canBuy: boolean;
  image: string | null;
  imageAlt: string;
  itemHref: string;
  optionLabel: string | null;
  priceAmountMinor?: number | undefined;
  priceCurrencyCode?: string | undefined;
  priceDisplay: string;
  storeItemSlug?: string | undefined;
  subtitle: string;
  title: string;
  variantId?: string | undefined;
};

export type CheckoutOrderSummaryView = CheckoutOrderSummaryInput & {
  securePaymentCopy: string;
  subtotalDisplay: string;
};

export const CHECKOUT_ORDER_SUMMARY_COPY = {
  backToItem: 'Back To Item',
  securePayment: 'Payment opens on Stripe. BlackBox never sees card details.',
  subtotal: 'Subtotal',
  title: 'Order Summary',
} as const;
export const CHECKOUT_CART_UPDATED_EVENT = 'blackbox:checkout-cart-updated';

export function createCheckoutOrderSummaryView(
  input: CheckoutOrderSummaryInput,
  cartLines: CartLine[] = [],
): CheckoutOrderSummaryView {
  return {
    ...input,
    securePaymentCopy: CHECKOUT_ORDER_SUMMARY_COPY.securePayment,
    subtotalDisplay: getCartSubtotalDisplay(cartLines) ?? input.priceDisplay,
  };
}

export default function CheckoutOrderSummary(props: CheckoutOrderSummaryInput) {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const view = createCheckoutOrderSummaryView(props, cartLines);
  const fallbackLine: CartLine | null =
    typeof props.priceAmountMinor === 'number' && props.priceCurrencyCode
      ? {
          availabilityLabel: props.availabilityLabel,
          image: props.image,
          imageAlt: props.imageAlt,
          optionLabel: props.optionLabel,
          priceAmountMinor: props.priceAmountMinor,
          priceCurrencyCode: props.priceCurrencyCode,
          priceDisplay: props.priceDisplay,
          quantity: 1,
          storeItemSlug: props.storeItemSlug || props.itemHref,
          subtitle: props.subtitle,
          title: props.title,
          variantId: props.variantId || 'checkout-summary-static-line',
        }
      : null;
  const lines = cartLines.length > 0 ? cartLines : fallbackLine ? [fallbackLine] : [];

  useEffect(() => {
    setCartLines(readStoreCartState(window.localStorage).lines);
  }, []);

  function updateCartLineQuantity(variantId: string, direction: 'decrement' | 'increment') {
    const currentState = readStoreCartState(window.localStorage);
    const editableState = currentState.lines.some((line) => line.variantId === variantId)
      ? currentState
      : fallbackLine
        ? { primaryLineItem: fallbackLine, lines: [fallbackLine] }
        : currentState;
    const nextState =
      direction === 'increment'
        ? incrementCartLineQuantityByVariant(variantId, editableState)
        : decrementCartLineQuantityByVariant(variantId, editableState);

    writeStoreCartState(window.localStorage, nextState);
    setCartLines(nextState.lines);
    window.dispatchEvent(new CustomEvent(CHECKOUT_CART_UPDATED_EVENT, { detail: nextState }));
  }

  return (
    <Card className="rounded-none border-border/70 bg-[#101010] shadow-none" data-checkout-order-summary>
      <CardContent className="grid gap-5 p-5">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {CHECKOUT_ORDER_SUMMARY_COPY.title}
          </p>
          <Badge
            variant="outline"
            className={cn(
              'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
              view.canBuy
                ? 'border-foreground/25 bg-background/70 text-foreground'
                : 'border-border/70 bg-background/70 text-muted-foreground',
            )}
          >
            {view.availabilityLabel}
          </Badge>
        </div>

        <div className="space-y-4">
          {lines.map((line) => (
            <article className="grid grid-cols-[84px_1fr] gap-4" key={line.variantId}>
              <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                {line.image ? (
                  <img className="h-full w-full object-cover" src={line.image} alt={line.imageAlt || line.title} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <p className="brand-cart-line-title text-foreground">{line.title}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{line.subtitle}</p>
                {line.optionLabel && (
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{line.optionLabel}</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">
                      {getCartLineTotalDisplay(line)}
                    </p>
                    {line.quantity > 1 && (
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {line.priceDisplay} each
                      </p>
                    )}
                  </div>
                  <div className="inline-flex h-9 items-stretch border border-border/70">
                    <button
                      type="button"
                      className="w-9 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => updateCartLineQuantity(line.variantId, 'decrement')}
                      aria-label={`Decrease quantity for ${line.title}`}
                    >
                      -
                    </button>
                    <span className="inline-flex min-w-9 items-center justify-center border-x border-border/70 px-2 text-xs font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="w-9 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => updateCartLineQuantity(line.variantId, 'increment')}
                      aria-label={`Increase quantity for ${line.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {CHECKOUT_ORDER_SUMMARY_COPY.subtotal}
            </span>
            <span className="font-display text-3xl uppercase tracking-[0.08em] text-foreground">
              {view.subtotalDisplay}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{view.securePaymentCopy}</p>
        </div>

        <a
          href={view.itemHref}
          className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {CHECKOUT_ORDER_SUMMARY_COPY.backToItem}
        </a>
      </CardContent>
    </Card>
  );
}
