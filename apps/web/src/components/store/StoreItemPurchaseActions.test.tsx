import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { STORE_CART_ADD_ITEM_EVENT, type StoreCartItem } from '@/lib/store-cart';
import StoreItemPurchaseActions, {
  requestStoreCartAddItem,
  STORE_ITEM_PURCHASE_ACTION_COPY,
} from './StoreItemPurchaseActions';

const cartItem: StoreCartItem = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceDisplay: '€28.00',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_barren-point_standard',
};

describe('StoreItemPurchaseActions', () => {
  it('renders Add To Cart for eligible items without direct checkout copy', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).not.toContain('Buy Now');
    expect(html).not.toContain('href=');
  });

  it('renders unavailable items as disabled and non-actionable', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.unavailable);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
  });

  it('dispatches the browser-safe cart item through the existing cart event', () => {
    const eventTarget = new EventTarget();
    let receivedDetail: StoreCartItem | null = null;

    eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => {
      receivedDetail = (event as CustomEvent<StoreCartItem>).detail;
    });

    expect(requestStoreCartAddItem(cartItem, eventTarget)).toBe(true);
    expect(receivedDetail).toEqual(cartItem);
    expect(JSON.stringify(receivedDetail)).toContain('disintegration-black-vinyl-lp');
    expect(JSON.stringify(receivedDetail)).not.toContain('price_');
    expect(JSON.stringify(receivedDetail)).not.toContain('clientSecret');
    expect(JSON.stringify(receivedDetail)).not.toContain('stockCount');
  });
});
