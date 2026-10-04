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
  const hasPreorder = lines.some((line) => line.preorder);

  useEffect(() => {
    const syncCart = () => setCartLines(readStoreCartState(window.localStorage).lines);
    syncCart();
    window.addEventListener(CHECKOUT_CART_UPDATED_EVENT, syncCart);
    return () => window.removeEventListener(CHECKOUT_CART_UPDATED_EVENT, syncCart);
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
    <Card className="checkout-review__panel rounded-none shadow-none" data-checkout-order-summary>
      <CardContent className="checkout-summary__content">
        <div className="checkout-review__panel-heading">
          <h2 className="checkout-summary__heading">{CHECKOUT_ORDER_SUMMARY_COPY.title}</h2>
          <details className="checkout-summary__editor">
            <summary
              className={cn('checkout-review__badge', !props.canBuy && 'text-muted-foreground')}
              aria-label="Edit cart quantities"
            >
              {props.availabilityLabel}
            </summary>
            <div className="checkout-summary__quantities">
              {lines.length ? (
                lines.map((line) => (
                  <div key={line.variantId}>
                    <p>{line.title}</p>
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
                          line.priceKind === 'pay_what_you_want'
                            ? `checkout-price-guidance-${line.variantId}`
                            : undefined
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Your cart is empty. Continue shopping to add a record.</p>
              )}
            </div>
          </details>
        </div>

        <div className="checkout-summary__items">
          {!lines.length && (
            <p className="checkout-review__note">Your cart is empty. Continue shopping to add a record.</p>
          )}
          {lines.map((line) => (
            <article className="checkout-summary__item" key={line.variantId}>
              <div className="checkout-summary__artwork">
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
                  <div className="checkout-summary__fallback">Cover</div>
                )}
              </div>

              <div className="checkout-summary__identity">
                <h3 className="brand-cart-line-title text-foreground">{line.title}</h3>
                <p className="checkout-summary__metadata">
                  {line.subtitle}
                  {line.optionLabel && ` · ${line.optionLabel}`}
                </p>
                <p className="checkout-summary__price">{getCartLineTotalDisplay(line)}</p>
                {line.quantity > 1 && (
                  <p className="checkout-review__note">
                    {line.quantity} × <span className="font-display">{line.priceDisplay}</span> each
                  </p>
                )}
                {line.preorder ? (
                  <p className="preorder-badge">{preorderChipText(line.preorder.shipEstimate)}</p>
                ) : (
                  <Badge variant="outline" className="checkout-summary__availability rounded-none">
                    {hasPreorder ? `${line.availabilityLabel} · sent with the pre-order` : line.availabilityLabel}
                  </Badge>
                )}
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
