import * as React from 'react';
import { ShoppingBag } from 'lucide-react';

import { getStoreCartCount, type StoreCartState } from '@/lib/store-cart';

type StoreCartButtonProps = {
  cartState: StoreCartState;
  onClick?: () => void;
};

export default function StoreCartButton({ cartState, onClick }: StoreCartButtonProps) {
  const cartCount = getStoreCartCount(cartState);
  const label = cartCount === 1 ? 'Cart, 1 item' : 'Cart';

  return (
    <button
      type="button"
      aria-label={label}
      data-store-cart-trigger
      data-store-cart-count={cartCount}
      className="relative inline-flex size-11 items-center justify-center rounded-none border-0 bg-transparent p-0 text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
      onClick={onClick}
    >
      <ShoppingBag className="size-4" aria-hidden="true" strokeWidth={1.8} />
      {cartCount > 0 && (
        <span
          className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full border border-background bg-foreground px-1 text-[9px] font-semibold leading-none text-background"
          aria-hidden="true"
        >
          {cartCount}
        </span>
      )}
    </button>
  );
}
