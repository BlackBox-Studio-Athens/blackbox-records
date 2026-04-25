import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          id: 'barren-point',
          data: {
            artist: { id: 'afterwise' },
            cover_image: { src: '/disintegration.jpg' },
            cover_image_alt: 'Disintegration by Afterwise',
            formats: ['Vinyl LP'],
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
            fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
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
import { createMockEmbeddedCheckoutAdapter } from '@/lib/backend/stripe-embedded-checkout';
import { listStoreCollectionEntries } from '@/lib/store-collection';
import {
  addStoreCartItem,
  getStoreCartCount,
  readStoreCartState,
  STORE_CART_ADD_ITEM_EVENT,
  STORE_CART_STORAGE_KEY,
  type StoreCartItem,
  writeStoreCartState,
} from '@/lib/store-cart';
import { createStoreCartDrawerView } from './StoreCartDrawer';
import { requestStoreCartAddItem } from './StoreItemPurchaseActions';
import { createCheckoutOfferView, loadCheckoutOfferState, startEmbeddedCheckout } from './checkout-offer-status-state';
import { createStoreCartItemForStorePage, getStorePageEntryBySlug } from '../../lib/store-page-data';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('store purchase happy path', () => {
  it('lets a customer discover an item, add it to cart, and reach the embedded checkout handoff', async () => {
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
          amountMinor: 2800,
          currencyCode: 'EUR',
          display: '€28.00',
        },
        variantId: 'variant_barren-point_standard',
      },
    });
    expect(pageEntry).not.toBeNull();

    const cartItem = createStoreCartItemForStorePage(
      pageEntry!.storeItem,
      pageEntry!.primaryAvailability,
      readImageSrc(pageEntry!.storeItem.image),
    );

    expect(cartItem).toEqual({
      availabilityLabel: 'Available',
      image: '/disintegration.jpg',
      imageAlt: 'Disintegration by Afterwise',
      optionLabel: 'Black Vinyl LP',
      priceDisplay: '€28.00',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      subtitle: 'Afterwise',
      title: 'Disintegration',
      variantId: 'variant_barren-point_standard',
    });

    // Act: Add To Cart emits the real cart event, then the app stores the resulting single-item cart.
    const eventTarget = new EventTarget();
    let emittedCartItem: StoreCartItem | null = null;
    eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => {
      emittedCartItem = (event as CustomEvent<StoreCartItem>).detail;
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
      item: {
        optionLabel: 'Black Vinyl LP',
        priceDisplay: '€28.00',
        subtitle: 'Afterwise',
        title: 'Disintegration',
      },
      itemCount: 1,
      subtotalDisplay: '€28.00',
    });

    // Act: the checkout shell uses the real public API client and checkout state helpers.
    const fetchStub = createCheckoutFetchStub();
    vi.stubGlobal('fetch', fetchStub);
    const api = createPublicCheckoutApi('');

    const loadState = await loadCheckoutOfferState(api, persistedCartState.item!.storeItemSlug);
    const checkoutView = createCheckoutOfferView(loadState);

    expect(checkoutView).toMatchObject({
      canStartCheckout: true,
      statusLabel: 'Available',
      variantId: 'variant_barren-point_standard',
    });

    const mountTarget = createMountTargetStub();
    const handoffState = await startEmbeddedCheckout({
      api,
      checkoutAdapter: createMockEmbeddedCheckoutAdapter(),
      mountTarget,
      storeItemSlug: persistedCartState.item!.storeItemSlug,
      variantId: checkoutView.variantId!,
    });

    // Assert: checkout starts with app identities only, and the mock embedded handoff does not render secrets.
    expect(handoffState.kind).toBe('mounted');
    expect(mountTarget.textContent).toContain('Mock Checkout Started');
    expect(mountTarget.textContent).not.toContain('cs_mock_secret_variant_barren-point_standard');
    expect(fetchStub).toHaveBeenCalledWith(
      '/api/checkout/sessions',
      expect.objectContaining({
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        }),
        method: 'POST',
      }),
    );

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
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/store/items/disintegration-black-vinyl-lp') {
      return jsonResponse({
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      });
    }

    if (url === '/api/store/items/disintegration-black-vinyl-lp/variants') {
      return jsonResponse([
        {
          availability: {
            label: 'Available',
            status: 'available',
          },
          canCheckout: true,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        },
      ]);
    }

    if (url === '/api/checkout/sessions' && init?.method === 'POST') {
      return jsonResponse({
        clientSecret: 'cs_mock_secret_variant_barren-point_standard',
      });
    }

    return jsonResponse({ error: `Unhandled request: ${url}` }, 404);
  });
}

function createMountTargetStub(): HTMLElement {
  return {
    className: '',
    removeAttribute: vi.fn(),
    setAttribute: vi.fn(),
    textContent: '',
  } as unknown as HTMLElement;
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
