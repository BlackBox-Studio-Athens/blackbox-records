import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { acquireLenisModalLock } from '@/platform/lib/lenis-scroll';
import {
  createCartCheckoutPath,
  getCartLineTotalDisplay,
  getCartSubtotalDisplay,
  getStoreCartCount,
  normalizeStoreCartState,
  type StoreCartState,
} from '@/components/store/cart/store-cart';

type StoreCartDrawerProps = {
  deliverySummary?: React.ReactNode;
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
    checkoutHref: state.lines.length > 0 ? resolveHref(createCartCheckoutPath()) : null,
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
  deliverySummary,
  cartState,
  open,
  onContinueShopping,
  onDecrementItem,
  onIncrementItem,
  onOpenChange,
  onRemoveItem,
  resolveHref,
}: StoreCartDrawerProps) {
  const modalRootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const modalRoot = modalRootRef.current;
    if (!open || !modalRoot) return;
    return acquireLenisModalLock(modalRoot);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={modalRootRef}
        side="right"
        data-tone="store"
        className="top-[var(--header-height)] bottom-auto flex h-[calc(100dvh-var(--header-height))] w-[min(100vw,460px)] max-w-none flex-col border-l border-border/80 bg-background/98 p-0 text-foreground sm:max-w-none"
      >
        <StoreCartDrawerPanel
          deliverySummary={deliverySummary}
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
  deliverySummary,
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
          <Button type="button" variant="outline" onClick={onContinueShopping}>
            {STORE_CART_DRAWER_COPY.continueShopping}
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6" data-lenis-scroll-root>
            <div className="space-y-6">
              {view.lines.map((line) => (
                <article className="grid grid-cols-[88px_1fr] gap-4" data-store-cart-line-item key={line.variantId}>
                  <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                    {/* Runtime Image Snapshot: cart state stores a browser-safe string URL here. */}
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
                            <span className="font-display">{line.priceDisplay}</span> each
                          </p>
                        )}
                      </div>
                      <Button type="button" variant="link" onClick={() => onRemoveItem(line.variantId)}>
                        {STORE_CART_DRAWER_COPY.remove}
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {line.availabilityLabel}
                      </p>
                      <div className="inline-flex items-center" aria-label={`Quantity for ${line.title}`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => onDecrementItem(line.variantId)}
                          aria-label={`Decrease quantity for ${line.title}`}
                        >
                          -
                        </Button>
                        <span className="inline-flex min-w-9 items-center justify-center px-2 text-xs font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => onIncrementItem(line.variantId)}
                          aria-label={`Increase quantity for ${line.title}`}
                          disabled={line.priceKind === 'pay_what_you_want'}
                          aria-describedby={
                            line.priceKind === 'pay_what_you_want' ? `cart-price-guidance-${line.variantId}` : undefined
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    {line.priceKind === 'pay_what_you_want' && (
                      <p
                        id={`cart-price-guidance-${line.variantId}`}
                        className="text-xs leading-5 text-muted-foreground"
                      >
                        Pay what you want: purchase this item alone, with quantity one.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-border/70 px-6 py-6">
            {deliverySummary}
            <Button asChild size="lg" className="w-full">
              <a href={view.checkoutHref || undefined}>{STORE_CART_DRAWER_COPY.checkout}</a>
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onContinueShopping}>
              {STORE_CART_DRAWER_COPY.continueShopping}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
