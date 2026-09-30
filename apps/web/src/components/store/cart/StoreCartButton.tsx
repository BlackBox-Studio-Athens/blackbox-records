import * as React from 'react';
import { ShoppingBag } from 'lucide-react';

import { getStoreCartCount, type StoreCartState } from '@/components/store/cart/store-cart';
import { buttonVariants } from '@/components/ui/button';

type StoreCartButtonProps = {
  cartState: StoreCartState;
  onClick?: () => void;
};

export default function StoreCartButton({ cartState, onClick }: StoreCartButtonProps) {
  const cartCount = getStoreCartCount(cartState);
  const label = cartCount === 0 ? 'Cart' : `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`;
  const [labelDismissed, setLabelDismissed] = React.useState(false);
  const labelRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (labelDismissed) return;

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !labelRef.current || getComputedStyle(labelRef.current).visibility !== 'visible') {
        return;
      }

      event.stopPropagation();
      setLabelDismissed(true);
    };

    document.addEventListener('keydown', dismissOnEscape, true);
    return () => document.removeEventListener('keydown', dismissOnEscape, true);
  }, [labelDismissed]);

  return (
    <div
      className="group/cart relative inline-flex"
      onPointerEnter={() => setLabelDismissed(false)}
      onFocus={() => setLabelDismissed(false)}
    >
      <button
        type="button"
        aria-label={label}
        data-store-cart-trigger
        data-store-cart-count={cartCount}
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
        onClick={() => {
          setLabelDismissed(true);
          onClick?.();
        }}
      >
        <ShoppingBag className="size-[18px]" aria-hidden="true" strokeWidth={1.75} />
        {cartCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-foreground px-1 font-sans text-[9px] font-semibold leading-none tracking-normal text-background tabular-nums"
            aria-hidden="true"
          >
            {cartCount}
          </span>
        )}
      </button>
      {!labelDismissed && (
        <span
          ref={labelRef}
          aria-hidden="true"
          data-store-cart-label
          className="invisible absolute right-0 top-full z-10 pt-[6px] opacity-0 transition-[opacity,visibility] duration-[120ms] group-hover/cart:visible group-hover/cart:opacity-100 group-hover/cart:delay-200 group-has-[:focus-visible]/cart:visible group-has-[:focus-visible]/cart:opacity-100 group-has-[:focus-visible]/cart:delay-0 group-has-[:focus-visible]/cart:duration-0 motion-reduce:duration-0"
        >
          <span className="block whitespace-nowrap border border-border bg-background px-2 py-1 font-sans text-xs font-normal normal-case leading-none tracking-normal text-foreground">
            Cart
          </span>
        </span>
      )}
    </div>
  );
}
