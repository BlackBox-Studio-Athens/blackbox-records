import * as React from 'react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  createCheckoutPathForCartLineItem,
  getCartLineTotalDisplay,
  getCartSubtotalDisplay,
  getStoreCartCount,
  normalizeStoreCartState,
  type StoreCartState,
} from '@/lib/store-cart';

type StoreCartDrawerProps = {
  cartState: StoreCartState;
  open: boolean;
  onContinueShopping: () => void;
  onDecrementItem: (variantId: string) => void;
  onIncrementItem: (variantId: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveItem: (variantId: string) => void;
  resolveHref: (path: string) => string;
};

type StoreCartDrawerPanelProps = Omit<StoreCartDrawerProps, 'onOpenChange' | 'open'> & {
  renderHeader?: boolean;
};

export const STORE_CART_DRAWER_COPY = {
  checkout: 'Checkout',
  continueShopping: 'Continue Shopping',
  emptyDetail: 'Add store items to review the cart draft before checkout.',
  emptyTitle: 'Your cart is empty',
  remove: 'Remove',
  shipping: 'Greece-only shipping details are collected during checkout.',
  subtotal: 'Subtotal',
} as const;

export function createStoreCartDrawerView(cartState: StoreCartState, resolveHref: (path: string) => string) {
  const state = normalizeStoreCartState(cartState);
  const primaryLineItem = state.primaryLineItem;
  const view = {
    checkoutHref: primaryLineItem ? resolveHref(createCheckoutPathForCartLineItem(primaryLineItem)) : null,
    itemCount: getStoreCartCount(state),
    primaryLineItem,
    subtotalDisplay: getCartSubtotalDisplay(state.lines),
  };

  Object.defineProperty(view, 'lines', {
    enumerable: false,
    value: state.lines,
  });

  return view as typeof view & { lines: StoreCartState['lines'] };
}

export default function StoreCartDrawer({
  cartState,
  open,
  onContinueShopping,
  onDecrementItem,
  onIncrementItem,
  onOpenChange,
  onRemoveItem,
  resolveHref,
}: StoreCartDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="top-[var(--header-height)] bottom-auto flex h-[calc(100dvh-var(--header-height))] w-[min(100vw,460px)] max-w-none flex-col border-l border-border/80 bg-background/98 p-0 text-foreground sm:max-w-none"
      >
        <StoreCartDrawerPanel
          cartState={cartState}
          onContinueShopping={onContinueShopping}
          onDecrementItem={onDecrementItem}
          onIncrementItem={onIncrementItem}
          onRemoveItem={onRemoveItem}
          resolveHref={resolveHref}
        />
      </SheetContent>
    </Sheet>
  );
}

export function StoreCartDrawerPanel({
  cartState,
  onContinueShopping,
  onDecrementItem,
  onIncrementItem,
  onRemoveItem,
  renderHeader = true,
  resolveHref,
}: StoreCartDrawerPanelProps) {
  const view = createStoreCartDrawerView(cartState, resolveHref);
  const hasLines = view.lines.length > 0;

  return (
    <>
      {renderHeader && (
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle className="font-display text-3xl tracking-[0.12em] uppercase">Cart</SheetTitle>
          <SheetDescription className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Cart state stays browser-only. Checkout stays secure through Stripe.
          </SheetDescription>
        </SheetHeader>
      )}

      {!hasLines ? (
        <div className="flex flex-1 flex-col justify-between gap-8 px-6 py-8">
          <div className="space-y-3">
            <p className="font-display text-4xl uppercase tracking-[0.1em]">{STORE_CART_DRAWER_COPY.emptyTitle}</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">{STORE_CART_DRAWER_COPY.emptyDetail}</p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onContinueShopping}
          >
            {STORE_CART_DRAWER_COPY.continueShopping}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {view.lines.map((line) => (
                <article className="grid grid-cols-[88px_1fr] gap-4" data-store-cart-line-item key={line.variantId}>
                  <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                    {line.image ? (
                      <img className="h-full w-full object-cover" src={line.image} alt={line.imageAlt || line.title} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <p className="brand-cart-line-title text-foreground">{line.title}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{line.subtitle}</p>
                      {line.optionLabel && (
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {line.optionLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 text-right">
                        <p className="font-display text-2xl uppercase tracking-[0.08em]">
                          {getCartLineTotalDisplay(line)}
                        </p>
                        {line.quantity > 1 && (
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {line.priceDisplay} each
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        onClick={() => onRemoveItem(line.variantId)}
                      >
                        {STORE_CART_DRAWER_COPY.remove}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {line.availabilityLabel}
                      </p>
                      <div
                        className="inline-flex h-9 items-stretch border border-border/70"
                        aria-label={`Quantity for ${line.title}`}
                      >
                        <button
                          type="button"
                          className="w-9 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          onClick={() => onDecrementItem(line.variantId)}
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
                          onClick={() => onIncrementItem(line.variantId)}
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
          </div>

          <div className="space-y-4 border-t border-border/70 px-6 py-6">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {STORE_CART_DRAWER_COPY.subtotal}
              </span>
              <span className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">
                {view.subtotalDisplay}
              </span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{STORE_CART_DRAWER_COPY.shipping}</p>
            <a
              className="inline-flex min-h-11 w-full items-center justify-center bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/88"
              href={view.checkoutHref || undefined}
            >
              {STORE_CART_DRAWER_COPY.checkout}
            </a>
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={onContinueShopping}
            >
              {STORE_CART_DRAWER_COPY.continueShopping}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
