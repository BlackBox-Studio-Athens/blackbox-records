import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { PublicCheckoutApi, PublicStoreOffer } from '@/lib/backend/public-checkout-api';
import StoreOfferPriceDisplay, {
  createStoreOfferPriceDisplayView,
  loadStoreOfferPriceDisplayView,
  STORE_OFFER_PRICE_DISPLAY_COPY,
} from './StoreOfferPriceDisplay';

const workerOffer: PublicStoreOffer = {
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
  },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('StoreOfferPriceDisplay', () => {
  it('renders a loading placeholder during server render', () => {
    const html = renderToStaticMarkup(<StoreOfferPriceDisplay storeItemSlug="disintegration-black-vinyl-lp" />);

    expect(html).toContain(STORE_OFFER_PRICE_DISPLAY_COPY.loading);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('Worker-confirmed');
    expect(html).not.toContain('€28.00');
  });

  it('loads the browser-safe Worker Store Offer price', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => workerOffer),
    });

    await expect(loadStoreOfferPriceDisplayView(api, 'disintegration-black-vinyl-lp')).resolves.toEqual({
      isLoading: false,
      label: '€28.00',
      tone: 'ready',
    });
    expect(api.readStoreOffer).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
  });

  it('does not show a fake price when Worker cannot confirm checkout', () => {
    expect(
      createStoreOfferPriceDisplayView({
        ...workerOffer,
        canCheckout: false,
        catalogStatus: 'catalog_drift',
        price: null,
      }),
    ).toEqual({
      isLoading: false,
      label: STORE_OFFER_PRICE_DISPLAY_COPY.unavailable,
      tone: 'unavailable',
    });
  });

  it('falls back closed when the Worker request fails', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => {
        throw new Error('Worker unavailable');
      }),
    });

    await expect(loadStoreOfferPriceDisplayView(api, 'disintegration-black-vinyl-lp')).resolves.toEqual({
      isLoading: false,
      label: STORE_OFFER_PRICE_DISPLAY_COPY.unavailable,
      tone: 'unavailable',
    });
  });
});

function createApi(overrides: Partial<PublicCheckoutApi>): PublicCheckoutApi {
  return {
    readCheckoutState: vi.fn(),
    readStoreCapabilities: vi.fn(),
    readStoreOffer: vi.fn(),
    readStoreOfferVariants: vi.fn(),
    startCheckout: vi.fn(),
    ...overrides,
  };
}
