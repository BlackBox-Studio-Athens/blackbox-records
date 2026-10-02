import * as React from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { acquireLenisModalLock } from '@/platform/lib/lenis-scroll';
import {
  createCartCheckoutPath,
  getCartLineTotalDisplay,
  getCartSubtotalDisplay,
  getStoreCartCount,
  normalizeStoreCartState,
  type CartLine,
  type StoreCartState,
} from '@/components/store/cart/store-cart';

type StoreCartDrawerProps = {
  deliverySummary?: React.ReactNode;
  cartState: StoreCartState;
  checkoutAmountDisplay?: string | null | undefined;
  open: boolean;
  onContinueShopping: () => void;
  onDecrementItem: (variantId: string) => void;
  onIncrementItem: (variantId: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveItem: (variantId: string) => void;
  onRestoreItem?: ((line: CartLine, index: number) => void) | undefined;
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
  removed: 'Removed',
  shipping: 'Greece-only shipping details are collected during checkout.',
  subtotal: 'Subtotal',
  undo: 'Undo',
} as const;

// Remove acts at once; an Undo line holds the item's place this long (paused while it has focus).
export const STORE_CART_UNDO_MS = 6000;

type RemovedCartLine = { index: number; line: CartLine };

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
  checkoutAmountDisplay,
  open,
  onContinueShopping,
  onDecrementItem,
  onIncrementItem,
  onOpenChange,
  onRemoveItem,
  onRestoreItem,
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
        className="top-[var(--header-height)] bottom-auto z-[1100] flex h-[calc(100dvh-var(--header-height))] min-h-0 w-[min(100vw,460px)] max-w-none flex-col overflow-hidden border-l border-border/80 bg-background/98 p-0 text-foreground sm:max-w-none"
      >
        <StoreCartDrawerPanel
          deliverySummary={deliverySummary}
          cartState={cartState}
          checkoutAmountDisplay={checkoutAmountDisplay}
          onContinueShopping={onContinueShopping}
          onDecrementItem={onDecrementItem}
          onIncrementItem={onIncrementItem}
          onRemoveItem={onRemoveItem}
          onRestoreItem={onRestoreItem}
          resolveHref={resolveHref}
        />
      </SheetContent>
    </Sheet>
  );
}

export function StoreCartDrawerPanel({
  deliverySummary,
  cartState,
  checkoutAmountDisplay,
  onContinueShopping,
  onDecrementItem,
  onIncrementItem,
  onRemoveItem,
  onRestoreItem,
  renderHeader = true,
  resolveHref,
}: StoreCartDrawerPanelProps) {
  const view = createStoreCartDrawerView(cartState, resolveHref);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const undoButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const [removed, setRemoved] = React.useState<RemovedCartLine | null>(null);
  const [undoCycle, setUndoCycle] = React.useState(0);
  const [isUndoFocused, setIsUndoFocused] = React.useState(false);
  const [focusVariantId, setFocusVariantId] = React.useState<string | null>(null);
  // Removal reaches cart state asynchronously; hide the line at once so Undo alone holds its place.
  const visibleLines = removed ? view.lines.filter((line) => line.variantId !== removed.line.variantId) : view.lines;
  const hasLines = visibleLines.length > 0;

  React.useEffect(() => {
    if (!removed || isUndoFocused) return;
    const timer = window.setTimeout(() => setRemoved(null), STORE_CART_UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [removed, undoCycle, isUndoFocused]);

  React.useEffect(() => {
    if (removed) undoButtonRef.current?.focus();
  }, [removed]);

  React.useEffect(() => {
    if (!focusVariantId || !view.lines.some((line) => line.variantId === focusVariantId)) return;
    panelRef.current?.querySelector<HTMLElement>(`[data-store-cart-remove="${CSS.escape(focusVariantId)}"]`)?.focus();
    setFocusVariantId(null);
  }, [focusVariantId, view.lines]);

  function removeLine(line: CartLine, index: number) {
    setRemoved({ index, line });
    setUndoCycle((cycle) => cycle + 1);
    onRemoveItem(line.variantId);
  }

  function undoRemoval() {
    if (!removed) return;
    onRestoreItem?.(removed.line, removed.index);
    setFocusVariantId(removed.line.variantId);
    setRemoved(null);
  }

  const undoLine =
    removed && onRestoreItem ? (
      <div
        className="relative flex min-h-9 items-center justify-between gap-3 border border-control-edge bg-secondary px-3 text-[13px] leading-5 text-muted-foreground"
        data-store-cart-undo
        onFocus={() => setIsUndoFocused(true)}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setIsUndoFocused(false);
          setUndoCycle((cycle) => cycle + 1);
        }}
      >
        <span className="min-w-0 truncate">
          {STORE_CART_DRAWER_COPY.removed} {removed.line.title}
        </span>
        <Button ref={undoButtonRef} type="button" variant="link" className="text-foreground" onClick={undoRemoval}>
          {STORE_CART_DRAWER_COPY.undo}
        </Button>
        {!isUndoFocused && (
          <span key={undoCycle} className="site-feedback-hairline" data-duration="6s" aria-hidden="true" />
        )}
      </div>
    ) : null;
  const undoIndex = removed ? Math.min(removed.index, visibleLines.length) : -1;

  return (
    <div ref={panelRef} className="contents">
      <p className="sr-only" aria-live="polite">
        {removed ? `${STORE_CART_DRAWER_COPY.removed} ${removed.line.title}` : ''}
      </p>
      {renderHeader && (
        <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="font-display text-3xl tracking-[0.12em] uppercase">Cart</SheetTitle>
            <Button type="button" variant="outline" size="lg" aria-label="Close cart" onClick={onContinueShopping}>
              Close
            </Button>
          </div>
          <SheetDescription className="sr-only">Review your items before checkout.</SheetDescription>
        </SheetHeader>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-scroll-root>
        {!hasLines ? (
          <div className="px-6 py-8">
            <div className="space-y-3">
              {undoLine}
              <p className="font-display text-4xl uppercase tracking-[0.1em]">{STORE_CART_DRAWER_COPY.emptyTitle}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">{STORE_CART_DRAWER_COPY.emptyDetail}</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-6 py-6">
              <div className="space-y-6">
                {visibleLines.map((line, index) => (
                  <React.Fragment key={line.variantId}>
                    {index === undoIndex && undoLine}
                    <article className="group grid grid-cols-[88px_1fr] gap-4" data-store-cart-line-item>
                      <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
                        {/* Runtime Image Snapshot: cart state stores a browser-safe string URL here. */}
                        {line.image ? (
                          <img
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
                          <Button
                            type="button"
                            variant="link"
                            className="[@media(hover:hover)]:text-control-muted-pressed group-focus-within:text-foreground group-hover:text-foreground"
                            data-store-cart-remove={line.variantId}
                            onClick={() => removeLine(line, index)}
                          >
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
                              onClick={() =>
                                line.quantity <= 1 ? removeLine(line, index) : onDecrementItem(line.variantId)
                              }
                              aria-label={`Decrease quantity for ${line.title}`}
                            >
                              <Minus aria-hidden="true" strokeWidth={1.75} />
                            </Button>
                            <span className="inline-flex min-w-9 items-center justify-center px-1 pt-px font-display text-lg leading-none tabular-nums">
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
                                line.priceKind === 'pay_what_you_want'
                                  ? `cart-price-guidance-${line.variantId}`
                                  : undefined
                              }
                            >
                              <Plus aria-hidden="true" strokeWidth={1.75} />
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
                  </React.Fragment>
                ))}
                {undoIndex === visibleLines.length && visibleLines.length > 0 && undoLine}
              </div>
            </div>

            <div className="space-y-4 border-t border-border/70 px-6 py-6">{deliverySummary}</div>
          </div>
        )}
      </div>
      <div className="shrink-0 space-y-4 border-t border-border/70 px-6 py-6">
        {hasLines && (
          <Button asChild size="lg" className="w-full justify-between">
            <a href={view.checkoutHref || undefined} data-store-cart-checkout>
              <span>{STORE_CART_DRAWER_COPY.checkout}</span>
              {checkoutAmountDisplay && (
                <span className="tabular-nums" aria-hidden="true" data-store-cart-checkout-amount>
                  {checkoutAmountDisplay}
                </span>
              )}
            </a>
          </Button>
        )}
        <Button type="button" variant="outline" className="w-full" onClick={onContinueShopping}>
          {STORE_CART_DRAWER_COPY.continueShopping}
        </Button>
      </div>
    </div>
  );
}
