import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { createStoreCartDrawerView, STORE_CART_DRAWER_COPY, StoreCartDrawerPanel } from './StoreCartDrawer';
import { addStoreCartItem, createEmptyStoreCartState, type CartLineItemSnapshot } from '../../lib/store-cart';

const cartItem: CartLineItemSnapshot = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2000,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€20',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_barren-point_standard',
};

const resolveHref = (path: string) => `/blackbox-records${path}`;

describe('StoreCartDrawer', () => {
  it('creates an empty drawer view without checkout route', () => {
    expect(createStoreCartDrawerView(createEmptyStoreCartState(), resolveHref)).toEqual({
      checkoutHref: null,
      primaryLineItem: null,
      itemCount: 0,
      subtotalDisplay: null,
    });
  });

  it('creates a filled drawer view with canonical checkout route and subtotal', () => {
    expect(createStoreCartDrawerView(addStoreCartItem(cartItem), resolveHref)).toMatchObject({
      checkoutHref: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      itemCount: 1,
      subtotalDisplay: '€20.00',
    });
  });

  it('locks the empty cart copy without checkout action language', () => {
    expect(STORE_CART_DRAWER_COPY.emptyTitle).toBe('Your cart is empty');
    expect(STORE_CART_DRAWER_COPY.continueShopping).toBe('Continue Shopping');
    expect(STORE_CART_DRAWER_COPY.checkout).toBe('Checkout');
    expect(STORE_CART_DRAWER_COPY.shipping).toBe('Greece-only shipping details are collected during checkout.');
  });

  it('represents exactly one filled CartLine with subtotal and checkout action data', () => {
    const view = createStoreCartDrawerView(addStoreCartItem(cartItem), resolveHref);

    expect(view.itemCount).toBe(1);
    expect(view.primaryLineItem).toMatchObject({
      availabilityLabel: 'Available',
      optionLabel: 'Black Vinyl LP',
      priceDisplay: '€20',
      subtitle: 'Afterwise',
      title: 'Disintegration',
    });
    expect(view.subtotalDisplay).toBe('€20.00');
    expect(view.checkoutHref).toBe('/blackbox-records/store/disintegration-black-vinyl-lp/checkout/');
    expect(STORE_CART_DRAWER_COPY.remove).toBe('Remove');
  });

  it('uses Veneer only for cart line item names', () => {
    const markup = renderToStaticMarkup(
      <StoreCartDrawerPanel
        cartState={addStoreCartItem(cartItem)}
        onContinueShopping={() => undefined}
        onDecrementItem={() => undefined}
        onIncrementItem={() => undefined}
        onRemoveItem={() => undefined}
        renderHeader={false}
        resolveHref={resolveHref}
      />,
    );

    expect(markup).toContain('brand-cart-line-title text-foreground');
    expect(markup.match(/brand-cart-line-title/g)).toHaveLength(1);
    expect(markup).toContain('€20.00');
    expect(markup).toContain(STORE_CART_DRAWER_COPY.checkout);
  });

  it('uses CartQuantity when calculating the drawer subtotal', () => {
    const view = createStoreCartDrawerView(addStoreCartItem(cartItem, addStoreCartItem(cartItem)), resolveHref);

    expect(view.itemCount).toBe(2);
    expect(view.subtotalDisplay).toBe('€40.00');
  });

  it('does not render forbidden checkout, Stripe, D1, stock, or order fields', () => {
    const view = createStoreCartDrawerView(
      {
        primaryLineItem: {
          ...cartItem,
          stripePriceId: 'price_secret',
          d1Id: 'store_item_option_1',
          stockCount: 99,
          checkoutSessionId: 'cs_secret',
          clientSecret: 'cs_secret_client',
          orderState: 'paid',
          actorEmail: 'operator@example.com',
        } as CartLineItemSnapshot & Record<string, unknown>,
        lines: [
          {
            ...cartItem,
            quantity: 1,
            stripePriceId: 'price_secret',
            d1Id: 'store_item_option_1',
            stockCount: 99,
          } as CartLineItemSnapshot & { quantity: number } & Record<string, unknown>,
        ],
      },
      resolveHref,
    );
    const serializedView = JSON.stringify(view);

    expect(serializedView).not.toContain('price_secret');
    expect(serializedView).not.toContain('store_item_option_1');
    expect(serializedView).not.toContain('stockCount');
    expect(serializedView).not.toContain('cs_secret');
    expect(serializedView).not.toContain('paid');
    expect(serializedView).not.toContain('operator@example.com');
  });
});
