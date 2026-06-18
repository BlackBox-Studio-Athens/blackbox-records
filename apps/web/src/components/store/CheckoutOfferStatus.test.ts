import { describe, expect, it, vi } from 'vitest';

import {
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startHostedCheckout,
  type CheckoutOfferInitialAvailability,
} from './checkout-offer-status-state';
import {
  createCheckoutCartItemSummary,
  createStripeCheckoutCtaView,
  STRIPE_CHECKOUT_BADGE_SRC,
  STRIPE_CHECKOUT_CTA_COPY,
} from './CheckoutOfferStatus';
import {
  PublicCheckoutApiError,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '../../lib/backend/public-checkout-api';
import { createCartQuantity, type CartLineItemSnapshot } from '../../lib/store-cart';

const initialAvailability: CheckoutOfferInitialAvailability = {
  canBuy: true,
  label: 'Available',
  optionLabel: 'Standard',
  priceDisplay: '€20',
};

const enabledStoreCapabilities = {
  nativeCheckout: {
    enabled: true,
    unavailableReason: null,
  },
};

const workerOfferPrice = {
  amountMinor: 2800,
  currencyCode: 'EUR',
  display: '€28.00',
};

function createReadyStoreOffer(overrides: Partial<PublicStoreOffer> = {}): PublicStoreOffer {
  const offer: PublicStoreOffer = {
    availability: {
      label: 'Available',
      status: 'available',
    },
    canCheckout: true,
    catalogStatus: 'ready',
    price: workerOfferPrice,
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  };

  return {
    ...offer,
    ...overrides,
  };
}

function createUnavailableStoreOffer(overrides: Partial<PublicStoreOffer> = {}): PublicStoreOffer {
  const offer: PublicStoreOffer = {
    availability: {
      label: 'Sold Out',
      status: 'sold_out',
    },
    canCheckout: false,
    catalogStatus: 'sold_out',
    price: null,
    storeItemSlug: 'afterglow-tape',
    variantId: 'variant_afterglow-tape_standard',
  };

  return {
    ...offer,
    ...overrides,
  };
}

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
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('CheckoutOfferStatus helpers', () => {
  it('uses Stripe-aware CTA copy and the self-hosted official badge asset', () => {
    expect(createStripeCheckoutCtaView(false)).toEqual({
      badgeSrc: STRIPE_CHECKOUT_BADGE_SRC,
      label: STRIPE_CHECKOUT_CTA_COPY,
    });
    expect(createStripeCheckoutCtaView(false).label).toBe('Continue to Stripe Checkout');
    expect(createStripeCheckoutCtaView(false).label).not.toBe('Pay Securely With Stripe');
    expect(createStripeCheckoutCtaView(true)).toEqual({
      badgeSrc: null,
      label: 'Opening Stripe Checkout',
    });
  });

  it('summarizes checkout item text from the current StoreCart lines', () => {
    expect(createCheckoutCartItemSummary([{ ...cartItem, quantity: createCartQuantity(1) }])).toEqual({
      label: 'Item',
      value: 'Disintegration / Black Vinyl LP',
    });
    expect(
      createCheckoutCartItemSummary([
        { ...cartItem, quantity: createCartQuantity(1) },
        {
          ...cartItem,
          optionLabel: 'Cassette',
          quantity: createCartQuantity(1),
          storeItemSlug: 'afterglow-tape',
          title: 'Afterglow',
          variantId: 'variant_afterglow-tape_standard',
        },
      ]),
    ).toEqual({
      label: 'Cart',
      value: '2 items in cart',
    });
    expect(createCheckoutCartItemSummary([], cartItem)).toEqual({
      label: 'Item',
      value: 'Disintegration / Black Vinyl LP',
    });
    expect(createCheckoutCartItemSummary([])).toEqual({
      label: 'Cart',
      value: 'Cart is empty',
    });
  });

  it('calls public Worker offer and variant reads for the current store item', async () => {
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(async () => createReadyStoreOffer()),
      readStoreOfferVariants: vi.fn(async () => [createReadyStoreOffer()]),
      registerNewsletterSignup: vi.fn(),
      startCheckout: vi.fn(),
    };

    const state = await loadCheckoutOfferState(api, 'disintegration-black-vinyl-lp');

    expect(api.readStoreCapabilities).toHaveBeenCalledOnce();
    expect(api.readStoreOffer).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
    expect(api.readStoreOfferVariants).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
    expect(api.startCheckout).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      kind: 'ready',
      offer: {
        canCheckout: true,
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    });
  });

  it('creates a ready view from Worker checkout eligibility', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        capabilities: enabledStoreCapabilities,
        offer: createReadyStoreOffer(),
        variants: [createReadyStoreOffer()],
      }),
    ).toEqual({
      badgeLabel: 'Checkout ready',
      canStartCheckout: true,
      detail: 'You will finish payment on Stripe.',
      isReady: true,
      statusLabel: 'Available',
      tone: 'ready',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('blocks payment when Worker capabilities disable native checkout', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        capabilities: {
          nativeCheckout: {
            enabled: false,
            unavailableReason: 'Native checkout is temporarily unavailable.',
          },
        },
        offer: createReadyStoreOffer(),
        variants: [createReadyStoreOffer()],
      }),
    ).toEqual({
      badgeLabel: 'Checkout paused',
      canStartCheckout: false,
      detail: 'Native checkout is temporarily unavailable.',
      isReady: false,
      statusLabel: 'Available',
      tone: 'unavailable',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('renders unavailable Worker state without a payment action', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        capabilities: enabledStoreCapabilities,
        offer: createUnavailableStoreOffer(),
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
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(async () => {
        throw new PublicCheckoutApiError(404, 'Store item not found.');
      }),
      readStoreOfferVariants: vi.fn(),
      registerNewsletterSignup: vi.fn(),
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
      badgeLabel: 'Checking availability',
      canStartCheckout: false,
      detail: 'Confirming price and availability before payment opens.',
      isReady: false,
      statusLabel: 'Available',
      tone: 'loading',
      variantId: null,
    });
  });

  it('starts checkout with app identity, then returns a hosted Stripe redirect URL', async () => {
    const startCheckout = vi.fn(async () => ({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    }));
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      registerNewsletterSignup: vi.fn(),
      startCheckout,
    };

    const state = await startHostedCheckout({
      api,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    expect(api.startCheckout).toHaveBeenCalledExactlyOnceWith({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(state).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
      kind: 'redirect',
    });
  });

  it('includes checkout newsletter opt-in only when selected', async () => {
    const startCheckout = vi.fn(async () => ({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    }));
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      registerNewsletterSignup: vi.fn(),
      startCheckout,
    };

    await startHostedCheckout({
      api,
      newsletterOptIn: true,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    expect(api.startCheckout).toHaveBeenCalledExactlyOnceWith({
      newsletterOptIn: true,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('does not start checkout when Worker eligibility is missing the variant id', () => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        capabilities: enabledStoreCapabilities,
        offer: createReadyStoreOffer({ variantId: '' }),
        variants: [],
      }),
    ).toMatchObject({
      badgeLabel: 'Checkout unavailable',
      canStartCheckout: false,
      detail: 'Checkout is not ready for this item yet.',
      isReady: false,
      tone: 'error',
      variantId: null,
    });
  });

  it('keeps shopper-facing checkout status copy free of implementation terms', () => {
    const readyView = createCheckoutOfferView({
      kind: 'ready',
      capabilities: enabledStoreCapabilities,
      offer: createReadyStoreOffer(),
      variants: [createReadyStoreOffer()],
    });
    const copy = [readyView.badgeLabel, readyView.detail, readyView.statusLabel].join(' ');

    expect(copy).not.toContain('Worker');
    expect(copy).not.toContain('Variant');
    expect(copy).not.toContain('StoreItem');
    expect(copy).not.toContain('StartCheckout');
  });

  it('does not redirect when the Worker returns no checkout URL', async () => {
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      registerNewsletterSignup: vi.fn(),
      startCheckout: vi.fn(async () => ({
        checkoutUrl: '',
      })),
    };

    await expect(
      startHostedCheckout({
        api,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Stripe checkout could not be opened. Please retry shortly.',
    });
  });

  it('keeps checkout start API errors visible without redirecting', async () => {
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(),
      readStoreOfferVariants: vi.fn(),
      registerNewsletterSignup: vi.fn(),
      startCheckout: vi.fn(async () => {
        throw new PublicCheckoutApiError(409, 'Checkout is not available.');
      }),
    };

    await expect(
      startHostedCheckout({
        api,
        storeItemSlug: 'afterglow-tape',
        variantId: 'variant_afterglow-tape_standard',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Checkout is not available.',
    });
  });
});
