import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { createStoreCartDrawerView, STORE_CART_DRAWER_COPY, StoreCartDrawerPanel } from './StoreCartDrawer';
import {
  addStoreCartItem,
  createCartQuantity,
  createEmptyStoreCartState,
  type CartLineItemSnapshot,
} from './store-cart';

const cartItem: CartLineItemSnapshot = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2000,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€20',
  priceKind: 'fixed',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const resolveHref = (path: string) => `/blackbox-records${path}`;

describe('StoreCartDrawer', () => {
  it('marks only pre-order lines and places one latest-estimate notice before delivery', () => {
    const earlier: CartLineItemSnapshot = {
      ...cartItem,
      variantId: 'variant_earlier',
      preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: 'early' } },
    };
    const later: CartLineItemSnapshot = {
      ...cartItem,
      variantId: 'variant_later',
      preorder: { shipEstimate: { kind: 'date', date: '2026-11-20' } },
    };
    const markup = renderToStaticMarkup(
      <StoreCartDrawerPanel
        cartState={addStoreCartItem(later, addStoreCartItem(earlier, addStoreCartItem(cartItem)))}
        renderHeader={false}
        deliverySummary={<p>Delivery summary fixture</p>}
        onContinueShopping={() => undefined}
        onDecrementItem={() => undefined}
        onIncrementItem={() => undefined}
        onRemoveItem={() => undefined}
        resolveHref={resolveHref}
      />,
    );
    expect(markup.match(/class="preorder-badge"/g)).toHaveLength(2);
    expect(markup).toContain('Pre-order · ships around early October 2026');
    expect(markup).toContain('Pre-order · ships 20 Nov 2026');
    expect(markup).toContain('>Available</p>');
    expect(markup.match(/Ships together/g)).toHaveLength(1);
    expect(markup).toContain('On 20 November 2026');
    expect(markup.indexOf('Ships together')).toBeLessThan(markup.indexOf('Delivery summary fixture'));
    expect(markup).toContain('href="/blackbox-records/store/checkout/"');
    expect(markup).toContain('Decrease quantity for Disintegration');
  });

  it('marks a withheld line without claiming a parcel date', () => {
    const markup = renderToStaticMarkup(
      <StoreCartDrawerPanel
        cartState={addStoreCartItem({ ...cartItem, preorder: { shipEstimate: null } })}
        renderHeader={false}
        onContinueShopping={() => undefined}
        onDecrementItem={() => undefined}
        onIncrementItem={() => undefined}
        onRemoveItem={() => undefined}
        resolveHref={resolveHref}
      />,
    );
    expect(markup).toContain('class="preorder-badge">Pre-order</p>');
    expect(markup).toContain('When it arrives');
    expect(markup).not.toContain(' · ships');
  });

  it('keeps ordinary, legacy and empty carts free of pre-order copy', () => {
    const carts = [
      createEmptyStoreCartState(),
      addStoreCartItem(cartItem),
      addStoreCartItem({ ...cartItem, preorder: null }),
    ];
    for (const cartState of carts) {
      const markup = renderToStaticMarkup(
        <StoreCartDrawerPanel
          cartState={cartState}
          renderHeader={false}
          onContinueShopping={() => undefined}
          onDecrementItem={() => undefined}
          onIncrementItem={() => undefined}
          onRemoveItem={() => undefined}
          resolveHref={resolveHref}
        />,
      );
      expect(markup).not.toContain('preorder-badge');
      expect(markup).not.toContain('preorder-notice');
      expect(markup).not.toContain('Charged in full');
    }
  });

  it('explains custom-Price restrictions and disables only quantity increases', () => {
    const markup = renderToStaticMarkup(
      <StoreCartDrawerPanel
        cartState={addStoreCartItem({
          ...cartItem,
          priceKind: 'pay_what_you_want',
          priceAmountMinor: null,
          priceDisplay: 'Pay what you want',
        })}
        onContinueShopping={() => undefined}
        onDecrementItem={() => undefined}
        onIncrementItem={() => undefined}
        onRemoveItem={() => undefined}
        renderHeader={false}
        resolveHref={resolveHref}
      />,
    );
    expect(markup).toContain('purchase this item alone, with quantity one');
    expect(markup).toMatch(/aria-label="Increase quantity for Disintegration" disabled=""/);
    expect(markup).not.toMatch(/aria-label="Decrease quantity for Disintegration" disabled/);
    expect(markup).toContain('aria-describedby="cart-price-guidance-');
  });
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
      checkoutHref: '/blackbox-records/store/checkout/',
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
    expect(view.checkoutHref).toBe('/blackbox-records/store/checkout/');
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

  it('shows the quoted total on Checkout without changing its accessible name', () => {
    const markup = renderToStaticMarkup(
      <StoreCartDrawerPanel
        cartState={addStoreCartItem(cartItem)}
        checkoutAmountDisplay="€24.50"
        onContinueShopping={() => undefined}
        onDecrementItem={() => undefined}
        onIncrementItem={() => undefined}
        onRemoveItem={() => undefined}
        onRestoreItem={() => undefined}
        renderHeader={false}
        resolveHref={resolveHref}
      />,
    );

    expect(markup).toMatch(/<a[^>]*data-store-cart-checkout="true"[^>]*><span>Checkout<\/span>/);
    expect(markup).toContain(
      '<span class="sr-only" aria-hidden="true" data-store-cart-checkout-amount="true">€24.50</span>',
    );
  });

  it('leaves Checkout as a plain label until the quote is known and draws icon steppers', () => {
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

    expect(markup).not.toContain('data-store-cart-checkout-amount');
    expect(markup).toContain('lucide-minus');
    expect(markup).toContain('lucide-plus');
    expect(markup).toContain('data-store-cart-remove="variant_disintegration-black-vinyl-lp_standard"');
    expect(markup).toContain('aria-live="polite"');
  });

  it('uses CartQuantity when calculating the drawer subtotal', () => {
    const view = createStoreCartDrawerView(addStoreCartItem(cartItem, addStoreCartItem(cartItem)), resolveHref);

    expect(view.itemCount).toBe(2);
    expect(view.subtotalDisplay).toBe('€40.00');
    expect(view.checkoutHref).toBe('/blackbox-records/store/checkout/');
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
            quantity: createCartQuantity(1),
            stripePriceId: 'price_secret',
            d1Id: 'store_item_option_1',
            stockCount: 99,
          } as CartLineItemSnapshot & { quantity: ReturnType<typeof createCartQuantity> } & Record<string, unknown>,
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
