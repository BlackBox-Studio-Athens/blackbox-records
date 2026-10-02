import * as React from 'react';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  decrementCartLineQuantityByVariant,
  createCartQuantity,
  getCartLineTotalDisplay,
  incrementCartLineQuantityByVariant,
  readStoreCartState,
  writeStoreCartState,
  type CartLine,
} from '@/components/store/cart/store-cart';
import { CHECKOUT_CART_UPDATED_EVENT } from '@/components/store/cart/store-cart-events';
import { cn } from '@/components/ui/utils';
import { preorderChipText } from '@/platform/lib/preorder-estimate';

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

export const CHECKOUT_ORDER_SUMMARY_COPY = { title: 'Order Summary' } as const;

export default function CheckoutOrderSummary(props: CheckoutOrderSummaryInput) {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
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
          priceKind: 'fixed',
          quantity: createCartQuantity(1),
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
    <Card className="min-w-0 rounded-none border-border/70 bg-[#101010] shadow-none" data-checkout-order-summary>
      <CardContent className="grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 sm:gap-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {CHECKOUT_ORDER_SUMMARY_COPY.title}
          </p>
          <Badge
            variant="outline"
            className={cn(
              'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
              props.canBuy
                ? 'border-foreground/25 bg-background/70 text-foreground'
                : 'border-border/70 bg-background/70 text-muted-foreground',
            )}
          >
            {props.availabilityLabel}
          </Badge>
        </div>

        <div className="space-y-4">
          {lines.map((line) => (
            <article
              className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[84px_minmax(0,1fr)] sm:gap-4"
              key={line.variantId}
            >
              <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                {/* Runtime Image Snapshot: checkout summary renders the stored string URL only. */}
                {line.image ? (
                  <img
                    width={88}
                    height={88}
                    decoding="async"
                    className="h-full w-full object-cover"
                    src={line.image}
                    alt={line.imageAlt || line.title}
                  />
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
                {line.preorder && <p className="preorder-badge">{preorderChipText(line.preorder.shipEstimate)}</p>}
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">
                      {getCartLineTotalDisplay(line)}
                    </p>
                    {line.quantity > 1 && (
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span className="font-display">{line.priceDisplay}</span> each
                      </p>
                    )}
                  </div>
                  <div className="inline-flex h-11 items-stretch border border-border/70">
                    <button
                      type="button"
                      className="w-11 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => updateCartLineQuantity(line.variantId, 'decrement')}
                      aria-label={`Decrease quantity for ${line.title}`}
                    >
                      -
                    </button>
                    <span className="inline-flex min-w-11 items-center justify-center border-x border-border/70 px-2 text-xs font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="w-11 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                      onClick={() => updateCartLineQuantity(line.variantId, 'increment')}
                      aria-label={`Increase quantity for ${line.title}`}
                      disabled={line.priceKind === 'pay_what_you_want'}
                      aria-describedby={
                        line.priceKind === 'pay_what_you_want' ? `checkout-price-guidance-${line.variantId}` : undefined
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                {line.priceKind === 'pay_what_you_want' && (
                  <p
                    id={`checkout-price-guidance-${line.variantId}`}
                    className="text-xs leading-5 text-muted-foreground"
                  >
                    Pay what you want: purchase this item alone, with quantity one.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
