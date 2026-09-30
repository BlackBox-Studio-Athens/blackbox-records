import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import type { StoreCartState } from '@/components/store/cart/store-cart';

import { shouldShowStoreCartControl } from './ShellPortalOutlets';

const emptyCart: StoreCartState = { lines: [], primaryLineItem: null };
const cartWithItem = { lines: [{ quantity: 1 }], primaryLineItem: null } as unknown as StoreCartState;

describe('shouldShowStoreCartControl', () => {
  it.each([
    '/store/',
    '/store/distro/',
    '/store/disintegration-black-vinyl-lp/',
    '/store/checkout/',
    '/store/x/checkout/return/',
  ])('shows the control with an empty cart on store route %s', (pathname) => {
    expect(shouldShowStoreCartControl(emptyCart, pathname)).toBe(true);
  });

  it.each(['/', '/releases/', '/artists/afterwise/', '/services/'])(
    'hides the control with an empty cart away from the store (%s)',
    (pathname) => {
      expect(shouldShowStoreCartControl(emptyCart, pathname)).toBe(false);
    },
  );

  it('reads the store route with or without the base path', () => {
    expect(shouldShowStoreCartControl(emptyCart, '/blackbox-records/store/')).toBe(true);
    expect(shouldShowStoreCartControl(emptyCart, '/blackbox-records/')).toBe(false);
  });

  it('keeps the control on every route once the cart has an item', () => {
    expect(shouldShowStoreCartControl(cartWithItem, '/')).toBe(true);
    expect(shouldShowStoreCartControl(cartWithItem, '/releases/disintegration/')).toBe(true);
  });
});
