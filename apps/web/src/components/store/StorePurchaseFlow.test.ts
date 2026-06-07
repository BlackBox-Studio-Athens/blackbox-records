import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          id: 'disintegration',
          data: {
            artist: { id: 'afterwise' },
            cover_image: { src: '/disintegration.jpg' },
            cover_image_alt: 'Disintegration by Afterwise',
            formats: ['Black Vinyl LP'],
            merch_url: '/store/',
            release_date: new Date('2026-09-01T00:00:00.000Z'),
            summary: 'Native-shop release.',
            title: 'Disintegration',
          },
        },
      ];
    }

    if (collectionName === 'distro') {
      return [
        {
          id: 'afterglow-tape',
          data: {
            artist_or_label: 'Afterglow',
            eyebrow: 'Tape',
            format: 'Cassette',
            group: 'Tapes',
            image: { src: '/afterglow.jpg' },
            image_alt: 'Afterglow tape',
            order: 1,
            summary: 'Small-run cassette.',
            title: 'Afterglow Tape',
          },
        },
      ];
    }

    return [];
  }),
  getEntry: vi.fn(async (reference: { id: string }) => ({
    data: {
      slug: reference.id,
      title: reference.id === 'afterwise' ? 'Afterwise' : 'Artist',
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { createPublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { listStoreCollectionEntries } from '@/lib/store-collection';
import {
  addStoreCartItem,
  getStoreCartCount,
  readStoreCartState,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_STORAGE_KEY,
  type CartLineItemSnapshot,
  writeStoreCartState,
} from '@/lib/store-cart';
import { createStoreCartDrawerView } from './StoreCartDrawer';
import { createCartLineItemSnapshotFromWorkerOffer, requestStoreCartAddItem } from './StoreItemPurchaseActions';
import { createCheckoutOfferView, loadCheckoutOfferState, startHostedCheckout } from './checkout-offer-status-state';
import {
  createCartLineItemSnapshotForStorePage,
  createPricedCartSeedForStorePage,
  getStorePageEntryBySlug,
} from '../../lib/store-page-data';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('store purchase happy path', () => {
  it('lets a customer discover an item, add it to cart, and reach the hosted checkout handoff', async () => {
    // Arrange: the customer starts from real store collection/page data.
    const storeEntries = await listStoreCollectionEntries();
    const selectedEntry = storeEntries.find((entry) => entry.storeItem.slug === 'disintegration-black-vinyl-lp');
    const pageEntry = await getStorePageEntryBySlug('disintegration-black-vinyl-lp');

    expect(selectedEntry).toMatchObject({
      storeItem: {
        slug: 'disintegration-black-vinyl-lp',
        subtitle: 'Afterwise',
        title: 'Disintegration',
      },
      primaryAvailability: {
        canBuy: true,
        optionLabel: 'Black Vinyl LP',
        price: {
          display: 'Worker-confirmed at checkout',
        },
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    });
    expect(pageEntry).not.toBeNull();

    const staticCartItem = createCartLineItemSnapshotForStorePage(
      pageEntry!.storeItem,
      pageEntry!.primaryAvailability,
      readImageSrc(pageEntry!.storeItem.image),
    );
    const cartSeed = createPricedCartSeedForStorePage(
      pageEntry!.storeItem,
      pageEntry!.primaryAvailability,
      readImageSrc(pageEntry!.storeItem.image),
    );
    const workerOffer = createWorkerStoreOffer();
    const cartItem = createCartLineItemSnapshotFromWorkerOffer(cartSeed, workerOffer);

    expect(staticCartItem).toBeNull();
    expect(cartItem).toEqual({
      availabilityLabel: 'Available',
      image: '/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
      imageAlt: 'Disintegration by Afterwise',
      optionLabel: 'Black Vinyl LP',
      priceAmountMinor: 2800,
      priceCurrencyCode: 'EUR',
      priceDisplay: '€28.00',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      subtitle: 'Afterwise',
      title: 'Disintegration',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    // Act: Add To Cart emits the real cart event, then the app stores the resulting single-item cart.
    const eventTarget = new EventTarget();
    let emittedCartItem: CartLineItemSnapshot | null = null;
    eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => {
      emittedCartItem = (event as CustomEvent<CartLineItemSnapshot>).detail;
    });

    expect(requestStoreCartAddItem(cartItem!, eventTarget)).toBe(true);
    expect(emittedCartItem).toEqual(cartItem);

    const storage = createMemoryStorage();
    const cartState = addStoreCartItem(emittedCartItem!);
    writeStoreCartState(storage, cartState);
    const persistedCartState = readStoreCartState(storage);
    const drawerView = createStoreCartDrawerView(persistedCartState, (path) => `/blackbox-records${path}`);

    expect(getStoreCartCount(persistedCartState)).toBe(1);
    expect(drawerView).toMatchObject({
      checkoutHref: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      primaryLineItem: {
        optionLabel: 'Black Vinyl LP',
        priceAmountMinor: 2800,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€28.00',
        subtitle: 'Afterwise',
        title: 'Disintegration',
      },
      itemCount: 1,
      subtotalDisplay: '€28.00',
    });

    // Act: the checkout shell uses the real public API client and ReadCheckoutState helpers.
    const fetchStub = createCheckoutFetchStub();
    vi.stubGlobal('fetch', fetchStub);
    const api = createPublicCheckoutApi('');

    const loadState = await loadCheckoutOfferState(api, persistedCartState.primaryLineItem!.storeItemSlug);
    const checkoutView = createCheckoutOfferView(loadState);

    expect(checkoutView).toMatchObject({
      canStartCheckout: true,
      statusLabel: 'Available',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    const handoffState = await startHostedCheckout({
      api,
      storeItemSlug: persistedCartState.primaryLineItem!.storeItemSlug,
      variantId: checkoutView.variantId!,
    });

    // Assert: checkout starts with app identity only, and the handoff does not render secrets.
    expect(handoffState).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_mock_variant_disintegration-black-vinyl-lp_standard',
      kind: 'redirect',
    });
    expect(fetchStub).toHaveBeenCalledWith(
      '/api/checkout/sessions',
      expect.objectContaining({
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        method: 'POST',
      }),
    );
    expect(readJsonBody(fetchStub, '/api/checkout/sessions')).not.toHaveProperty('locker_id');
    expect(readJsonBody(fetchStub, '/api/checkout/sessions')).not.toHaveProperty('shippingLocker');

    const browserOwnedPayload = JSON.stringify({
      cart: persistedCartState,
      checkoutBody: readJsonBody(fetchStub, '/api/checkout/sessions'),
      drawer: drawerView,
    });

    expect(browserOwnedPayload).not.toContain('price_mock_');
    expect(browserOwnedPayload).not.toContain('price_');
    expect(browserOwnedPayload).not.toContain('sk_');
    expect(browserOwnedPayload).not.toContain('store_item_option_');
    expect(browserOwnedPayload).not.toContain('stockCount');
    expect(browserOwnedPayload).not.toContain('orderState');
    expect(browserOwnedPayload).not.toContain('actorEmail');
    expect(browserOwnedPayload).not.toContain('clientSecret');
    expect(browserOwnedPayload).not.toContain('BOX_NOW_API');
    expect(browserOwnedPayload).not.toContain('whsec_');
    expect(browserOwnedPayload).not.toContain('sk_');
    expect(storage.getItem(STORE_CART_STORAGE_KEY)).toContain('disintegration-black-vinyl-lp');
  });
});

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

function createCheckoutFetchStub() {
  const workerOffer = createWorkerStoreOffer();

  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/store/capabilities') {
      return jsonResponse({
        nativeCheckout: {
          enabled: true,
          unavailableReason: null,
        },
      });
    }

    if (url === '/api/store/items/disintegration-black-vinyl-lp') {
      return jsonResponse(workerOffer);
    }

    if (url === '/api/store/items/disintegration-black-vinyl-lp/variants') {
      return jsonResponse([workerOffer]);
    }

    if (url === '/api/checkout/sessions' && init?.method === 'POST') {
      return jsonResponse({
        checkoutUrl: 'https://checkout.stripe.test/session/cs_mock_variant_disintegration-black-vinyl-lp_standard',
      });
    }

    return jsonResponse({ error: `Unhandled request: ${url}` }, 404);
  });
}

function createWorkerStoreOffer() {
  return {
    availability: {
      label: 'Available',
      status: 'available' as const,
    },
    canCheckout: true,
    catalogStatus: 'ready' as const,
    price: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      display: '€28.00',
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function readImageSrc(image: unknown): string | null {
  if (image && typeof image === 'object' && 'src' in image && typeof image.src === 'string') {
    return image.src;
  }

  return null;
}

function readJsonBody(fetchStub: ReturnType<typeof createCheckoutFetchStub>, expectedUrl: string) {
  const request = fetchStub.mock.calls.find(([url]) => url === expectedUrl);
  const body = request?.[1]?.body;

  return typeof body === 'string' ? JSON.parse(body) : null;
}
