import * as React from 'react';
import { Minus, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { acquireLenisModalLock } from '@/platform/lib/lenis-scroll';
import { preorderChipText } from '@/platform/lib/preorder-estimate';
import InternationalOrderNotice from './InternationalOrderNotice';
import { PreorderCartNotice } from './PreorderCartNotice';
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
  // Radix portals the content after its first commit, so the lock waits for the mounted node, not a ref read on mount.
  const [modalRoot, setModalRoot] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open || !modalRoot) return;
    return acquireLenisModalLock(modalRoot);
  }, [open, modalRoot]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={setModalRoot}
        side="right"
        data-tone="store"
        className="store-cart-drawer top-[var(--header-height)] bottom-auto z-[1100] flex h-[calc(100dvh-var(--header-height))] min-h-0 w-[min(100vw,440px)] max-w-none flex-col overflow-hidden border-l border-border bg-card p-0 text-foreground sm:max-w-none"
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
    <div ref={panelRef} className="store-cart-drawer__panel">
      <p className="sr-only" aria-live="polite">
        {removed ? `${STORE_CART_DRAWER_COPY.removed} ${removed.line.title}` : ''}
      </p>
      {renderHeader && (
        <SheetHeader className="store-cart-drawer__header">
          <SheetTitle className="store-cart-drawer__title">Cart</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="store-cart-drawer__close"
            aria-label="Close cart"
            onClick={onContinueShopping}
          >
            <X aria-hidden="true" strokeWidth={1.5} />
          </Button>
          <SheetDescription className="store-cart-drawer__description">
            Cart state stays browser-only. Checkout stays secure through Stripe.
          </SheetDescription>
        </SheetHeader>
      )}
      <div className="store-cart-drawer__scroll" data-lenis-scroll-root>
        {!hasLines ? (
          <div className="px-6 py-8">
            <div className="space-y-3">
              {undoLine}
              <p className="font-display text-4xl uppercase tracking-[0.1em]">{STORE_CART_DRAWER_COPY.emptyTitle}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">{STORE_CART_DRAWER_COPY.emptyDetail}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="store-cart-drawer__items">
              <div className="space-y-6">
                {visibleLines.map((line, index) => (
                  <React.Fragment key={line.variantId}>
                    {index === undoIndex && undoLine}
                    <article className="store-cart-drawer__item" data-store-cart-line-item>
                      <div className="store-cart-drawer__art">
                        {/* Runtime Image Snapshot: cart state stores a browser-safe string URL here. */}
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
                          <div className="store-cart-drawer__fallback">Cover</div>
                        )}
                      </div>
                      <div className="store-cart-drawer__identity">
                        <p className="brand-cart-line-title text-foreground">{line.title}</p>
                        <p className="store-cart-drawer__metadata">{line.subtitle}</p>
                        {line.optionLabel && <p className="store-cart-drawer__metadata">{line.optionLabel}</p>}
                        <div className="store-cart-drawer__price-row">
                          <div>
                            <p className="store-cart-drawer__price">{getCartLineTotalDisplay(line)}</p>
                            {line.quantity > 1 && (
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                <span className="font-display">{line.priceDisplay}</span> each
                              </p>
                            )}
                          </div>
                          <div className="store-cart-drawer__quantity" aria-label={`Quantity for ${line.title}`}>
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
                            <span className="store-cart-drawer__quantity-value">{line.quantity}</span>
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
                        <div className="store-cart-drawer__status-row">
                          <p className={line.preorder ? 'preorder-badge' : 'store-cart-drawer__availability'}>
                            {line.preorder ? preorderChipText(line.preorder.shipEstimate) : line.availabilityLabel}
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            className="store-cart-drawer__remove"
                            data-store-cart-remove={line.variantId}
                            onClick={() => removeLine(line, index)}
                          >
                            {STORE_CART_DRAWER_COPY.remove}
                          </Button>
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

            <div className="store-cart-drawer__summary">
              <PreorderCartNotice lines={visibleLines} presentation="drawer" />
              {deliverySummary}
              <InternationalOrderNotice variant="card" itemTitles={visibleLines.map((line) => line.title)} />
            </div>
          </>
        )}
      </div>
      <div className="store-cart-drawer__actions">
        {hasLines && (
          <Button
            asChild
            size="lg"
            className={`store-cart-drawer__checkout${visibleLines.some((line) => line.preorder) ? ' preorder-action' : ''}`}
          >
            <a href={view.checkoutHref || undefined} data-store-cart-checkout>
              <span>{STORE_CART_DRAWER_COPY.checkout}</span>
              {checkoutAmountDisplay && (
                <span className="sr-only" aria-hidden="true" data-store-cart-checkout-amount>
                  {checkoutAmountDisplay}
                </span>
              )}
            </a>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="store-cart-drawer__continue"
          onClick={onContinueShopping}
        >
          {STORE_CART_DRAWER_COPY.continueShopping}
        </Button>
      </div>
    </div>
  );
}
