import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/lib/store-cart';
import StoreItemPurchaseActions, {
  createCartLineItemSnapshotFromWorkerOffer,
  requestStoreCartAddItem,
  STORE_ITEM_PURCHASE_ACTION_COPY,
  type StoreItemCartSeed,
} from './StoreItemPurchaseActions';

const cartItem: CartLineItemSnapshot = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2800,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€28.00',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_barren-point_standard',
};

const cartSeed: StoreItemCartSeed = {
  ...cartItem,
  variantId: null,
};

describe('StoreItemPurchaseActions', () => {
  it('renders Add To Cart for eligible items without direct checkout copy', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).not.toContain('Buy Now');
    expect(html).not.toContain('href=');
  });

  it('renders unavailable items as disabled and non-actionable', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
  });

  it('dispatches the browser-safe cart item through the existing cart event', () => {
    const eventTarget = new EventTarget();
    let receivedDetail: CartLineItemSnapshot | null = null;

    eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => {
      receivedDetail = (event as CustomEvent<CartLineItemSnapshot>).detail;
    });

    expect(requestStoreCartAddItem(cartItem, eventTarget)).toBe(true);
    expect(receivedDetail).toEqual(cartItem);
    expect(JSON.stringify(receivedDetail)).toContain('disintegration-black-vinyl-lp');
    expect(JSON.stringify(receivedDetail)).not.toContain('price_');
    expect(JSON.stringify(receivedDetail)).not.toContain('clientSecret');
    expect(JSON.stringify(receivedDetail)).not.toContain('stockCount');
  });

  it('creates a browser-safe CartLineItemSnapshot from Worker checkout readiness', () => {
    const workerCartItem = createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });

    expect(workerCartItem).toEqual({
      ...cartItem,
      availabilityLabel: 'Available',
    });
    expect(JSON.stringify(workerCartItem)).not.toContain('price_');
    expect(JSON.stringify(workerCartItem)).not.toContain('clientSecret');
  });

  it('does not create a CartLineItemSnapshot from unavailable Worker state', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
        availability: {
          label: 'Unavailable',
          status: 'sold_out',
        },
        canCheckout: false,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      }),
    ).toBeNull();
  });

  it('does not create a CartLineItemSnapshot when the static page has no priced seed', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(null, {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'aftermaths',
        variantId: 'variant_aftermaths_standard',
      }),
    ).toBeNull();
  });
});
