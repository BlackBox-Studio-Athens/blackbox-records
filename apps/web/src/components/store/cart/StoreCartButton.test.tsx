import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import StoreCartButton from './StoreCartButton';
import { addStoreCartItem, createEmptyStoreCartState } from './store-cart';

const cartItem = {
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
} as const;

describe('StoreCartButton', () => {
  it.each([
    { state: createEmptyStoreCartState(), count: 0, label: 'Cart' },
    { state: addStoreCartItem(cartItem), count: 1, label: 'Cart, 1 item' },
    { state: addStoreCartItem(cartItem, addStoreCartItem(cartItem)), count: 2, label: 'Cart, 2 items' },
  ])('renders $label with a supplementary label and the correct badge', ({ state, count, label }) => {
    const html = renderToStaticMarkup(<StoreCartButton cartState={state} />);

    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('data-store-cart-trigger="true"');
    expect(html).toContain(`data-store-cart-count="${count}"`);
    expect(html.includes(`>${count}</span>`)).toBe(count > 0);
    expect(html).toMatch(/<span aria-hidden="true" data-store-cart-label="true"[^>]*>/);
    expect(html).toContain('>Cart</span>');
  });
});
