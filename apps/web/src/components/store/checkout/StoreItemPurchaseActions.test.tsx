import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicCheckoutApi, PublicStoreOffer } from '@/components/store/checkout/public-checkout-api';
import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import StoreItemPurchaseActions, {
  createCartLineItemSnapshotFromWorkerOffer,
  getStoreItemPurchaseStatusTone,
  loadStoreItemPurchaseActionState,
  requestStoreCartAddItem,
  STORE_ITEM_PURCHASE_ACTION_COPY,
  type StoreItemCartSeed,
} from './StoreItemPurchaseActions';
import { takePendingStoreCartAddItems } from '@/components/store/cart/store-cart-events';

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

const readyOffer: PublicStoreOffer = {
  availability: { label: 'Available', status: 'available' },
  canCheckout: true,
  catalogStatus: 'ready',
  preorder: null,
  price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const soldOutOffer: PublicStoreOffer = {
  availability: { label: 'Sold Out', status: 'sold_out' },
  canCheckout: false,
  catalogStatus: 'sold_out',
  price: null,
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const outOfStockOffer: PublicStoreOffer = {
  ...soldOutOffer,
  availability: { label: 'Out of Stock', status: 'sold_out' },
};

const checkoutPausedOffer: PublicStoreOffer = {
  availability: { label: 'Checkout Paused', status: 'unavailable' },
  canCheckout: false,
  catalogStatus: 'catalog_drift',
  price: null,
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('StoreItemPurchaseActions', () => {
  afterEach(() => vi.useRealTimers());

  it('renders Add To Cart for eligible items without direct checkout copy', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} cartSeed={null} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).toContain('min-h-11');
    expect(html).toContain('sm:w-56');
    expect(html).toContain('w-full');
    expect(html).not.toContain('Buy Now');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('data-store-item-added');
    expect(html).not.toContain('preorder-action');
    expect(html).toContain('aria-live="polite"');
  });

  it.each([
    { shipEstimate: null },
    { shipEstimate: { kind: 'month' as const, month: '2026-10', part: 'mid' as const } },
    { shipEstimate: { kind: 'date' as const, date: '2026-10-20' } },
  ])('renders the pre-order action and exact hint for an active snapshot: %j', (preorder) => {
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions cartItem={{ ...cartItem, preorder }} cartSeed={null} purchaseHint="Ordinary hint" />,
    );
    expect(html).toContain('>Pre-order</button>');
    expect(html).toContain('preorder-action');
    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint);
    expect(html).not.toContain('Ordinary hint');
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).toContain('sm:w-56');
    expect(html).toContain('min-h-11');
  });

  it('keeps a stale pre-order hidden while a fresh Worker offer is pending', () => {
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions cartItem={{ ...cartItem, preorder: { shipEstimate: null } }} cartSeed={cartSeed} />,
    );
    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('preorder-action');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint);
  });

  it.each([
    ['2026-10-16', true, STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint],
    ['2026-06-09', true, STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint],
    ['2026-10-03T23:30:00Z', true, STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint],
    [null, true, STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint],
    ['2026-06-09', false, STORE_ITEM_PURCHASE_ACTION_COPY.releasedPreorderHint],
  ] as const)('distinguishes released music from pending copies for %s, vinyl=%s', (releaseDate, isVinyl, hint) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-03T00:15:00Z'));
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions
        cartItem={{ ...cartItem, optionLabel: isVinyl ? 'Black Vinyl LP' : 'CD', preorder: { shipEstimate: null } }}
        cartSeed={null}
        releaseDate={releaseDate}
        isVinyl={isVinyl}
      />,
    );

    expect(html).toContain(hint);
    expect(html).toContain('>Pre-order</button>');
    if (!isVinyl) expect(html).not.toContain('vinyl');
    if (hint === STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint) expect(html).not.toContain('album is out');
  });

  it('does not keep release-aware pre-order hints after a fresh ordinary or unavailable offer', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(readyOffer)
      .mockResolvedValueOnce(soldOutOffer);
    const api = createApi({ readStoreOffer });
    const staleSeed = { ...cartSeed, preorder: { shipEstimate: null } };

    for (let index = 0; index < 2; index++) {
      const state = await loadStoreItemPurchaseActionState(api, staleSeed);
      const html = renderToStaticMarkup(
        <StoreItemPurchaseActions cartItem={state.cartItem} cartSeed={null} releaseDate="2026-06-09" isVinyl />,
      );
      expect(html).not.toContain('preorder-action');
      expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint);
    }
  });

  it('keeps an older cart snapshot disabled while a fresh Worker offer is pending', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
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

  it('renders unavailable items as a status, not a disabled button', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={null} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.unavailable);
    expect(html).toMatch(/^<p role="status"/);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('border-[#767676]');
    expect(html).toContain('min-h-11');
    expect(html).toContain('sm:w-56');
    expect(html).toContain('data-store-item-purchase-tone="neutral"');
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

  it('keeps an add until a cart bridge acknowledges it', () => {
    takePendingStoreCartAddItems();
    const acknowledging = new EventTarget();
    acknowledging.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => event.preventDefault());

    expect(requestStoreCartAddItem(cartItem, acknowledging)).toBe(false);
    expect(takePendingStoreCartAddItems()).toEqual([]);

    expect(requestStoreCartAddItem(cartItem, new EventTarget())).toBe(true);
    expect(takePendingStoreCartAddItems()).toEqual([cartItem]);
  });

  it('creates a browser-safe CartLineItemSnapshot from Worker checkout readiness', () => {
    const workerCartItem = createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      catalogStatus: 'ready',
      preorder: null,
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
      preorder: null,
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
        preorder: null,
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
          label: 'Sold Out',
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

  it('uses the resolved Worker label, then accepts a later ready offer without restoring the stale snapshot', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(soldOutOffer)
      .mockResolvedValueOnce(readyOffer);
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Sold Out',
      statusTone: 'sold-out',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      cartItem: { priceDisplay: '€28.00', variantId: readyOffer.variantId },
      label: null,
      statusTone: 'neutral',
    });
  });

  it('carries the Worker copies-left count only with a buyable offer', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce({ ...readyOffer, lowStockQuantity: 3 })
      .mockResolvedValueOnce({ ...readyOffer, lowStockQuantity: 1 })
      .mockResolvedValueOnce(readyOffer);
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      cartItem: { variantId: readyOffer.variantId },
      lowStockLabel: 'Only 3 left',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      lowStockLabel: 'Only 1 left',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.not.toHaveProperty('lowStockLabel');
  });

  it('takes the live pre-order from the Worker and preserves its copies-left label', async () => {
    const preorder = { shipEstimate: { kind: 'month' as const, month: '2026-10', part: null } };
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce({ ...readyOffer, preorder, lowStockQuantity: 3 })
      .mockResolvedValueOnce(readyOffer)
      .mockResolvedValueOnce(soldOutOffer);
    const api = createApi({ readStoreOffer });
    const staleSeed = { ...cartSeed, preorder: { shipEstimate: null } };
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toMatchObject({
      cartItem: { preorder },
      lowStockLabel: 'Only 3 left',
      label: null,
    });
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toMatchObject({
      cartItem: { preorder: null },
    });
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Sold Out',
      statusTone: 'sold-out',
    });
  });

  it('uses neutral tone for planned restock and checkout pauses', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(outOfStockOffer)
      .mockResolvedValueOnce(checkoutPausedOffer);
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      label: 'Out of Stock',
      statusTone: 'neutral',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      label: 'Checkout Paused',
      statusTone: 'neutral',
    });
  });

  it('maps only Sold Out copy to the brand red status tone', () => {
    expect(getStoreItemPurchaseStatusTone('Sold Out')).toBe('sold-out');
    expect(getStoreItemPurchaseStatusTone('Out of Stock')).toBe('neutral');
    expect(getStoreItemPurchaseStatusTone('Checkout Paused')).toBe('neutral');
    expect(getStoreItemPurchaseStatusTone(STORE_ITEM_PURCHASE_ACTION_COPY.unavailable)).toBe('neutral');
  });

  it('uses neutral unavailable copy after a failed Worker read', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => {
        throw new Error('Worker unavailable');
      }),
    });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: STORE_ITEM_PURCHASE_ACTION_COPY.unavailable,
      statusTone: 'neutral',
    });
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
        preorder: null,
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

function createApi(overrides: Partial<PublicCheckoutApi>): PublicCheckoutApi {
  return {
    readCheckoutState: vi.fn(),
    readStoreCapabilities: vi.fn(),
    readStoreOffer: vi.fn(),
    readStoreOfferVariants: vi.fn(),
    registerNewsletterSignup: vi.fn(),
    startCheckout: vi.fn(),
    ...overrides,
  };
}
