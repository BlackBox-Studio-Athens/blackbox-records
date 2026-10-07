import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCartQuantity, type CartLine } from '@/components/store/cart/store-cart';
import InternationalOrderNotice from '@/components/store/cart/InternationalOrderNotice';

import {
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  startHostedCheckout,
  type CheckoutOfferInitialAvailability,
} from './checkout-offer-status-state';
import {
  createPayControlView,
  createStripeCheckoutCtaView,
  STRIPE_CHECKOUT_BADGE_SRC,
  STRIPE_CHECKOUT_CTA_COPY,
  WAITING_FOR_SHIPPING_QUOTE_COPY,
} from './CheckoutOfferStatus';
import CheckoutOfferStatus from './CheckoutOfferStatus';
import { PublicCheckoutApiError, type PublicCheckoutApi, type PublicStoreOffer } from './public-checkout-api';

const cartState = vi.hoisted(() => {
  const state: { lines: CartLine[] } = { lines: [] };
  return state;
});
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useState: (initialValue: unknown) =>
      actual.useState<unknown>(Array.isArray(initialValue) ? cartState.lines : initialValue),
  };
});
vi.mock('@/components/store/cart/InternationalOrderNotice', () => ({
  default: vi.fn(() => React.createElement('aside', { 'data-checkout-international-notice': true })),
}));

const ordinaryLine: CartLine = {
  availabilityLabel: 'Available',
  image: null,
  imageAlt: null,
  optionLabel: 'Standard',
  priceAmountMinor: 2800,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€28.00',
  priceKind: 'fixed',
  quantity: createCartQuantity(1),
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

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
  kind: 'fixed' as const,
};

type ReadyStoreOffer = Extract<PublicStoreOffer, { catalogStatus: 'ready' }>;
type SoldOutStoreOffer = Extract<PublicStoreOffer, { catalogStatus: 'sold_out' }>;

function createReadyStoreOffer(overrides: Partial<ReadyStoreOffer> = {}): ReadyStoreOffer {
  const offer: ReadyStoreOffer = {
    availability: {
      label: 'Available',
      status: 'available',
    },
    canCheckout: true,
    catalogStatus: 'ready',
    preorder: null,
    price: workerOfferPrice,
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  };

  return {
    ...offer,
    ...overrides,
  };
}

function createUnavailableStoreOffer(overrides: Partial<SoldOutStoreOffer> = {}): SoldOutStoreOffer {
  const offer: SoldOutStoreOffer = {
    availability: {
      label: 'Sold Out',
      state: 'sold_out',
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

describe('CheckoutOfferStatus helpers', () => {
  beforeEach(() => {
    cartState.lines = [];
    vi.mocked(InternationalOrderNotice).mockClear();
  });
  it('uses Stripe-aware CTA copy and the self-hosted official badge asset', () => {
    expect(createStripeCheckoutCtaView(false)).toEqual({
      badgeSrc: STRIPE_CHECKOUT_BADGE_SRC,
      label: STRIPE_CHECKOUT_CTA_COPY,
    });
    expect(createStripeCheckoutCtaView(false).label).toBe('Continue to Payment');
    expect(createStripeCheckoutCtaView(false).label).not.toBe('Pay Securely With Stripe');
    expect(createStripeCheckoutCtaView(true)).toEqual({
      badgeSrc: null,
      label: 'Opening Stripe Checkout',
    });
  });

  it('keeps Pay charcoal while the shipping quote loads and fills it with the amount when ready', () => {
    expect(
      createPayControlView({ hasQuote: false, isStartingCheckout: false, quoteLoading: true, quoteTotalDisplay: null }),
    ).toEqual({
      amountDisplay: null,
      badgeSrc: null,
      isWaitingForQuote: true,
      label: WAITING_FOR_SHIPPING_QUOTE_COPY,
      variant: 'outline',
    });
    expect(
      createPayControlView({
        hasQuote: true,
        isStartingCheckout: false,
        quoteLoading: false,
        quoteTotalDisplay: '€24.50',
      }),
    ).toEqual({
      amountDisplay: '€24.50',
      badgeSrc: STRIPE_CHECKOUT_BADGE_SRC,
      isWaitingForQuote: false,
      label: STRIPE_CHECKOUT_CTA_COPY,
      variant: 'default',
    });
    expect(
      createPayControlView({
        hasQuote: false,
        isStartingCheckout: false,
        quoteLoading: false,
        quoteTotalDisplay: null,
      }),
    ).toMatchObject({ isWaitingForQuote: false, label: STRIPE_CHECKOUT_CTA_COPY, variant: 'outline' });
    expect(
      createPayControlView({
        hasQuote: true,
        isStartingCheckout: true,
        quoteLoading: false,
        quoteTotalDisplay: '€24.50',
      }),
    ).toMatchObject({ amountDisplay: null, label: 'Opening Stripe Checkout', variant: 'default' });
  });

  it('calls public Worker offer and variant reads for the current store item', async () => {
    const api: PublicCheckoutApi = {
      readStoreCapabilities: vi.fn(async () => enabledStoreCapabilities),
      readCheckoutState: vi.fn(),
      readStoreOffer: vi.fn(async () => createReadyStoreOffer()),
      readStoreOfferVariants: vi.fn(async () => [createReadyStoreOffer()]),
      registerNewsletterSignup: vi.fn(),
      requestAvailabilityAlert: vi.fn(),
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

  it.each([
    ['sold_out', 'Sold Out', 'Sold Out'],
    ['coming_soon', 'Coming Soon', 'Coming Soon'],
    ['repressing', 'Repressing', 'Repressing'],
    ['unavailable', '', 'Not available'],
  ] as const)('renders %s Worker state from its typed state without a payment action', (state, statusLabel, badge) => {
    expect(
      createCheckoutOfferView({
        kind: 'ready',
        capabilities: enabledStoreCapabilities,
        offer: createUnavailableStoreOffer({ availability: { label: 'Sold Out', state, status: 'sold_out' } }),
        variants: [],
      }),
    ).toMatchObject({
      badgeLabel: badge,
      canStartCheckout: false,
      isReady: false,
      statusLabel,
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
      requestAvailabilityAlert: vi.fn(),
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
      requestAvailabilityAlert: vi.fn(),
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
      requestAvailabilityAlert: vi.fn(),
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
      requestAvailabilityAlert: vi.fn(),
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
      requestAvailabilityAlert: vi.fn(),
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

  it.each([
    {
      lines: [
        ordinaryLine,
        {
          ...ordinaryLine,
          variantId: 'variant_month',
          preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
        },
      ],
      expected: 'Around October 2026',
    },
    {
      lines: [
        ordinaryLine,
        {
          ...ordinaryLine,
          variantId: 'variant_date',
          preorder: { shipEstimate: { kind: 'date', date: '2026-10-20' } },
        },
      ],
      expected: 'On 20 October 2026',
    },
    {
      lines: [{ ...ordinaryLine, preorder: { shipEstimate: null } }],
      expected: 'When it arrives',
    },
    {
      lines: [
        { ...ordinaryLine, preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } } },
        {
          ...ordinaryLine,
          variantId: 'variant_later',
          preorder: { shipEstimate: { kind: 'date', date: '2026-11-05' } },
        },
      ],
      expected: 'On 5 November 2026',
    },
    {
      lines: [
        { ...ordinaryLine, preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } } },
        { ...ordinaryLine, variantId: 'variant_withheld', preorder: { shipEstimate: null } },
      ],
      expected: 'When it arrives',
    },
  ] satisfies { lines: CartLine[]; expected: string }[])(
    'shows one shared notice before delivery, using $expected',
    ({ lines, expected }) => {
      cartState.lines = lines;
      const markup = renderToStaticMarkup(React.createElement(CheckoutOfferStatus, { initialAvailability }));

      expect(markup).toContain('Review and Pay');
      expect(markup.match(/Pre-order in this order/g)).toHaveLength(1);
      expect(markup.match(/class="preorder-notice"/g)).toHaveLength(1);
      expect(markup).toContain('class="preorder-rail"');
      expect(markup).toContain('Charged in full');
      expect(markup).toContain(expected);
      expect(markup).toContain('One parcel to your BOX NOW locker');
      expect(markup).toContain(
        lines.some((line) => !line.preorder)
          ? 'Your whole order, in-stock items included, waits and travels with'
          : 'Your order ships in one parcel when',
      );
      expect(markup.indexOf('class="preorder-notice"')).toBeLessThan(markup.indexOf('data-delivery-summary'));
      expect(markup).toContain('Calculating delivery and current prices');
      expect(markup).toContain('Confirming price and availability before payment opens.');
      if (expected === 'When it arrives') expect(markup).not.toContain('October 2026');
    },
  );

  it('uses the Worker fallback snapshot when there are no cart lines', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CheckoutOfferStatus, {
        initialAvailability,
        fallbackLineItem: { ...ordinaryLine, preorder: { shipEstimate: null } },
      }),
    );
    expect(markup.match(/Pre-order in this order/g)).toHaveLength(1);
    expect(markup).toContain('When it arrives');
    expect(markup.indexOf('class="preorder-notice"')).toBeLessThan(markup.indexOf('data-delivery-summary'));
  });

  it('keeps ordinary cart review unchanged and ignores a fallback that is not in the cart', () => {
    cartState.lines = [ordinaryLine, { ...ordinaryLine, variantId: 'variant_ordinary', preorder: null }];
    const markup = renderToStaticMarkup(
      React.createElement(CheckoutOfferStatus, {
        initialAvailability,
        fallbackLineItem: { ...ordinaryLine, preorder: { shipEstimate: null } },
      }),
    );
    expect(markup).not.toContain('Pre-order in this order');
    expect(markup).not.toContain('preorder-notice');
    expect(markup).toContain('Review and Pay');
    expect(markup).toContain('data-delivery-summary');
    expect(markup).toContain('Calculating delivery and current prices');
    expect(markup).toContain('Confirming price and availability before payment opens.');
  });

  it('does not show a preorder notice for an empty review', () => {
    const markup = renderToStaticMarkup(React.createElement(CheckoutOfferStatus, { initialAvailability }));
    expect(markup).not.toContain('preorder-notice');
    expect(markup).toContain('Add a priced item to the cart before checkout.');
    expect(markup).toContain('data-delivery-summary');
  });

  it('places the neutral international card after delivery and before payment, using current cart titles', () => {
    cartState.lines = [ordinaryLine, { ...ordinaryLine, title: 'Barren Point', variantId: 'variant_barren' }];
    const markup = renderToStaticMarkup(
      React.createElement(CheckoutOfferStatus, {
        initialAvailability,
        fallbackLineItem: { ...ordinaryLine, title: 'Unused fallback' },
      }),
    );

    expect(vi.mocked(InternationalOrderNotice).mock.calls.at(-1)?.[0]).toEqual({
      variant: 'card',
      borderTone: 'neutral',
      itemTitles: ['Disintegration', 'Barren Point'],
    });
    const noticePosition = markup.indexOf('data-checkout-international-notice');
    expect(noticePosition).toBeGreaterThan(markup.indexOf('data-delivery-summary'));
    expect(noticePosition).toBeLessThan(markup.indexOf('class="checkout-review__actions"'));

    cartState.lines = [{ ...ordinaryLine, title: 'Updated title' }];
    renderToStaticMarkup(React.createElement(CheckoutOfferStatus, { initialAvailability }));
    expect(vi.mocked(InternationalOrderNotice).mock.calls.at(-1)?.[0].itemTitles).toEqual(['Updated title']);
  });

  it('passes the checkout fallback title to the international card when the cart has no lines', () => {
    renderToStaticMarkup(
      React.createElement(CheckoutOfferStatus, { initialAvailability, fallbackLineItem: ordinaryLine }),
    );
    expect(vi.mocked(InternationalOrderNotice).mock.calls.at(-1)?.[0]).toEqual({
      variant: 'card',
      borderTone: 'neutral',
      itemTitles: ['Disintegration'],
    });
  });

  it('does not mount the international country gate for an empty checkout', () => {
    renderToStaticMarkup(React.createElement(CheckoutOfferStatus, { initialAvailability }));
    expect(InternationalOrderNotice).not.toHaveBeenCalled();
  });
});
