import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import StoreCartButton from './StoreCartButton';
import { addStoreCartItem, createEmptyStoreCartState } from '../../lib/store-cart';

const cartItem = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceDisplay: '€20',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_barren-point_standard',
};

describe('StoreCartButton', () => {
  it('renders an accessible empty cart button without a count badge', () => {
    const html = renderToStaticMarkup(<StoreCartButton cartState={createEmptyStoreCartState()} />);

    expect(html).toContain('aria-label="Cart"');
    expect(html).toContain('data-store-cart-trigger="true"');
    expect(html).toContain('data-store-cart-count="0"');
    expect(html).not.toContain('>1</span>');
  });

  it('renders count 1 when the browser cart has one item', () => {
    const html = renderToStaticMarkup(<StoreCartButton cartState={addStoreCartItem(cartItem)} />);

    expect(html).toContain('aria-label="Cart, 1 item"');
    expect(html).toContain('data-store-cart-count="1"');
    expect(html).toContain('>1</span>');
  });
});
