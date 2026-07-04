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
  priceKind: 'fixed',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const cartSeed: StoreItemCartSeed = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
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

  it('renders pending availability as disabled, busy, and non-actionable', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-spin');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
  });

  it('renders unavailable items as disabled without a pending spinner', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={null} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.unavailable);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain('animate-spin');
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
      catalogStatus: 'ready',
      price: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        display: '€28.00',
        kind: 'fixed',
      },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    expect(workerCartItem).toEqual({
      ...cartItem,
      availabilityLabel: 'Available',
    });
    expect(JSON.stringify(workerCartItem)).not.toContain('price_');
    expect(JSON.stringify(workerCartItem)).not.toContain('clientSecret');
  });

  it('creates a pay-what-you-want CartLineItemSnapshot without a fixed amount', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        catalogStatus: 'ready',
        price: {
          currencyCode: 'EUR',
          display: 'Pay what you want',
          kind: 'pay_what_you_want',
          maximumAmountMinor: 10000,
          minimumAmountMinor: 100,
          presetAmountMinor: 500,
        },
        storeItemSlug: 'band-in-the-pit-2016-cassette',
        variantId: 'variant_band-in-the-pit-2016-cassette_standard',
      }),
    ).toMatchObject({
      priceAmountMinor: null,
      priceCurrencyCode: 'EUR',
      priceDisplay: 'Pay what you want',
      priceKind: 'pay_what_you_want',
    });
  });

  it('does not create a CartLineItemSnapshot from unavailable Worker state', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
        availability: {
          label: 'Unavailable',
          status: 'sold_out',
        },
        canCheckout: false,
        catalogStatus: 'sold_out',
        price: null,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
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
        catalogStatus: 'ready',
        price: {
          amountMinor: 2800,
          currencyCode: 'EUR',
          display: '€28.00',
          kind: 'fixed',
        },
        storeItemSlug: 'aftermaths',
        variantId: 'variant_aftermaths_standard',
      }),
    ).toBeNull();
  });
});
