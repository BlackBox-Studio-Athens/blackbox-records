import * as React from 'react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createStoreCartCheckoutPath, type StoreCartState } from '@/lib/store-cart';

type StoreCartDrawerProps = {
  cartState: StoreCartState;
  open: boolean;
  onContinueShopping: () => void;
  onOpenChange: (open: boolean) => void;
  onRemoveItem: () => void;
  resolveHref: (path: string) => string;
};

export const STORE_CART_DRAWER_COPY = {
  checkout: 'Checkout',
  continueShopping: 'Continue Shopping',
  emptyDetail: 'Add one store item to review the line item before checkout.',
  emptyTitle: 'Your cart is empty',
  remove: 'Remove',
  subtotal: 'Subtotal',
} as const;

export function createStoreCartDrawerView(cartState: StoreCartState, resolveHref: (path: string) => string) {
  const item = cartState.item;

  return {
    checkoutHref: item ? resolveHref(createStoreCartCheckoutPath(item)) : null,
    item,
    itemCount: item ? 1 : 0,
    subtotalDisplay: item?.priceDisplay || null,
  };
}

export default function StoreCartDrawer({
  cartState,
  open,
  onContinueShopping,
  onOpenChange,
  onRemoveItem,
  resolveHref,
}: StoreCartDrawerProps) {
  const view = createStoreCartDrawerView(cartState, resolveHref);
  const item = view.item;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="top-[var(--header-height)] bottom-auto flex h-[calc(100dvh-var(--header-height))] w-[min(100vw,460px)] max-w-none flex-col border-l border-border/80 bg-background/98 p-0 text-foreground sm:max-w-none"
      >
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle className="font-display text-3xl tracking-[0.12em] uppercase">Cart</SheetTitle>
          <SheetDescription className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            One item at a time. Checkout stays secure through Stripe.
          </SheetDescription>
        </SheetHeader>

        {!item ? (
          <div className="flex flex-1 flex-col justify-between gap-8 px-6 py-8">
            <div className="space-y-3">
              <p className="font-display text-4xl uppercase tracking-[0.1em]">{STORE_CART_DRAWER_COPY.emptyTitle}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {STORE_CART_DRAWER_COPY.emptyDetail}
              </p>
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
              <article className="grid grid-cols-[88px_1fr] gap-4" data-store-cart-line-item>
                <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                  {item.image ? (
                    <img className="h-full w-full object-cover" src={item.image} alt={item.imageAlt || item.title} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="space-y-1">
                    <p className="font-display text-2xl uppercase tracking-[0.09em] text-foreground">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.subtitle}</p>
                    {item.optionLabel && (
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {item.optionLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-display text-2xl uppercase tracking-[0.08em]">{item.priceDisplay}</p>
                    <button
                      type="button"
                      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      onClick={onRemoveItem}
                    >
                      {STORE_CART_DRAWER_COPY.remove}
                    </button>
                  </div>
                  <p className="inline-flex border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {item.availabilityLabel}
                  </p>
                </div>
              </article>
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
              <p className="text-xs leading-5 text-muted-foreground">
                Shipping and taxes are handled at checkout where applicable.
              </p>
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
      </SheetContent>
    </Sheet>
  );
}
