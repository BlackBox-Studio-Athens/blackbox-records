import { describe, expect, it, vi } from 'vitest';

import {
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startEmbeddedCheckout,
  type CheckoutOfferInitialAvailability,
} from './checkout-offer-status-state';
import { PublicCheckoutApiError, type PublicCheckoutApi } from '../../lib/backend/public-checkout-api';
import type { EmbeddedCheckoutAdapter } from '../../lib/backend/stripe-embedded-checkout';

const initialAvailability: CheckoutOfferInitialAvailability = {
  canBuy: true,
  label: 'Available',
  optionLabel: 'Standard',
  priceDisplay: '€20',
};

describe('CheckoutOfferStatus helpers', () => {
  it('calls public Worker offer and variant reads for the current store item', async () => {
    const api: PublicCheckoutApi = {
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(async () => ({
        availability: {
          label: 'Available',
          status: 'available' as const,
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      })),
      readStoreOfferVariants: vi.fn(async () => [
        {
          availability: {
            label: 'Available',
            status: 'available' as const,
          },
          canCheckout: true,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        },
      ]),
      startCheckout: vi.fn(),
    };

    const state = await loadCheckoutOfferState(api, 'disintegration-black-vinyl-lp');

    expect(api.readStoreOffer).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
    expect(api.readStoreOfferVariants).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
    expect(api.startCheckout).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      kind: 'ready',
      offer: {
        canCheckout: true,
        variantId: 'variant_barren-point_standard',
      },
    });
  });

  it('creates a ready view from Worker checkout eligibility', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        offer: {
          availability: {
            label: 'Available',
            status: 'available',
          },
          canCheckout: true,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        },
        variants: [
          {
            availability: {
              label: 'Available',
              status: 'available',
            },
            canCheckout: true,
            storeItemSlug: 'disintegration-black-vinyl-lp',
            variantId: 'variant_barren-point_standard',
          },
        ],
      }),
    ).toEqual({
      badgeLabel: 'Checkout ready',
      canStartCheckout: true,
      detail: 'Checkout is ready for 1 item option.',
      isReady: true,
      statusLabel: 'Available',
      tone: 'ready',
      variantId: 'variant_barren-point_standard',
    });
  });

  it('renders unavailable Worker state without a payment action', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        offer: {
          availability: {
            label: 'Sold Out',
            status: 'sold_out',
          },
          canCheckout: false,
          storeItemSlug: 'afterglow-tape',
          variantId: 'variant_afterglow-tape_standard',
        },
        variants: [],
      }),
    ).toMatchObject({
      badgeLabel: 'Not available',
      canStartCheckout: false,
      isReady: false,
      statusLabel: 'Sold Out',
      tone: 'unavailable',
      variantId: 'variant_afterglow-tape_standard',
    });
  });

  it('renders visible backend error state', async () => {
    const api: PublicCheckoutApi = {
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(async () => {
        throw new PublicCheckoutApiError(404, 'Store item not found.');
      }),
      readStoreOfferVariants: vi.fn(),
      startCheckout: vi.fn(),
    };

    const state = await loadCheckoutOfferState(api, 'missing');

    expect(createCheckoutOfferView(state)).toMatchObject({
      badgeLabel: 'Checkout unavailable',
      canStartCheckout: false,
      detail: 'Store item not found.',
      isReady: false,
      tone: 'error',
    });
    expect(api.startCheckout).not.toHaveBeenCalled();
  });

  it('uses static availability as initial fallback while Worker state loads', () => {
    expect(createInitialCheckoutOfferView(initialAvailability)).toEqual({
      badgeLabel: 'Checking checkout',
      canStartCheckout: false,
      detail: 'Confirming checkout eligibility before payment opens.',
      isReady: false,
      statusLabel: 'Available',
      tone: 'loading',
      variantId: null,
    });
  });

  it('starts checkout with only the store item slug and variant id, then mounts Stripe with the returned client secret', async () => {
    const mountTarget = {} as HTMLElement;
    const mount = {
      destroy: vi.fn(),
    };
    const api: PublicCheckoutApi = {
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      startCheckout: vi.fn(async () => ({
        clientSecret: 'cs_test_client_secret',
      })),
    };
    const checkoutAdapter: EmbeddedCheckoutAdapter = {
      getConfigurationError: vi.fn(() => null),
      mountEmbeddedCheckout: vi.fn(async () => mount),
    };

    const state = await startEmbeddedCheckout({
      api,
      checkoutAdapter,
      mountTarget,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });

    expect(api.startCheckout).toHaveBeenCalledExactlyOnceWith({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });
    expect(checkoutAdapter.mountEmbeddedCheckout).toHaveBeenCalledExactlyOnceWith({
      clientSecret: 'cs_test_client_secret',
      mountTarget,
    });
    expect(state).toEqual({
      kind: 'mounted',
      mount,
    });
  });

  it('keeps shopper-facing checkout status copy free of implementation terms', () => {
    const readyView = createCheckoutOfferView({
      kind: 'ready',
      offer: {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      },
      variants: [
        {
          availability: {
            label: 'Available',
            status: 'available',
          },
          canCheckout: true,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        },
      ],
    });
    const copy = [readyView.badgeLabel, readyView.detail, readyView.statusLabel].join(' ');

    expect(copy).not.toContain('Worker');
    expect(copy).not.toContain('Variant');
    expect(copy).not.toContain('StoreItem');
    expect(copy).not.toContain('StartCheckout');
  });

  it('does not start checkout when the Stripe publishable key is missing', async () => {
    const api: PublicCheckoutApi = {
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      startCheckout: vi.fn(),
    };
    const checkoutAdapter: EmbeddedCheckoutAdapter = {
      getConfigurationError: vi.fn(() => 'Stripe publishable key is not configured.'),
      mountEmbeddedCheckout: vi.fn(),
    };

    await expect(
      startEmbeddedCheckout({
        api,
        checkoutAdapter,
        mountTarget: {} as HTMLElement,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Stripe publishable key is not configured.',
    });
    expect(api.startCheckout).not.toHaveBeenCalled();
    expect(checkoutAdapter.mountEmbeddedCheckout).not.toHaveBeenCalled();
  });

  it('keeps checkout start API errors visible without mounting Stripe', async () => {
    const api: PublicCheckoutApi = {
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      startCheckout: vi.fn(async () => {
        throw new PublicCheckoutApiError(409, 'Checkout is not available.');
      }),
    };
    const checkoutAdapter: EmbeddedCheckoutAdapter = {
      getConfigurationError: vi.fn(() => null),
      mountEmbeddedCheckout: vi.fn(),
    };

    await expect(
      startEmbeddedCheckout({
        api,
        checkoutAdapter,
        mountTarget: {} as HTMLElement,
        storeItemSlug: 'afterglow-tape',
        variantId: 'variant_afterglow-tape_standard',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Checkout is not available.',
    });
    expect(checkoutAdapter.mountEmbeddedCheckout).not.toHaveBeenCalled();
  });
});
