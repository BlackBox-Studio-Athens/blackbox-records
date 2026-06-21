import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CheckoutConfigurationError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  StoreItemNotFoundError,
  VariantMismatchError,
} from '../../src/application/commerce/checkout';
import { createHttpApp } from '../../src/interfaces/http/app';

const mockDisconnect = vi.fn(async () => {});
const mockReadStoreOffer = vi.fn();
const mockListVariantOffersForStoreItem = vi.fn();
const mockReadStoreCapabilities = vi.fn();
const mockStartCheckout = vi.fn();
const mockReadCheckoutState = vi.fn();
const mockRegisterNewsletterSignup = vi.fn();

vi.mock('../../src/interfaces/http/routes/public-commerce-services', () => ({
  createPublicCommerceServices: () => ({
    disconnect: mockDisconnect,
    errors: {
      CheckoutConfigurationError,
      CheckoutUnavailableError,
      NativeCheckoutDisabledError,
      StoreItemNotFoundError,
      VariantMismatchError,
    },
    listVariantOffersForStoreItem: mockListVariantOffersForStoreItem,
    readCheckoutState: mockReadCheckoutState,
    readStoreCapabilities: mockReadStoreCapabilities,
    readStoreOffer: mockReadStoreOffer,
    startCheckout: mockStartCheckout,
  }),
}));

vi.mock('../../src/interfaces/http/routes/public-newsletter-services', () => ({
  createPublicNewsletterServices: () => ({
    errors: {
      EmailConfigurationError: class EmailConfigurationError extends Error {},
      ZodError: class ZodError extends Error {},
    },
    registerNewsletterSignup: mockRegisterNewsletterSignup,
  }),
}));

const testBindings = {
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  CHECKOUT_RETURN_ORIGINS: 'https://blackbox.example,http://127.0.0.1:4321',
  COMMERCE_DB: {} as D1Database,
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_123',
};

const shippingLocker = {
  country_code: 'GR',
  locker_id: '4',
  locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
};

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

describe('public commerce routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns backend-known store item offer state', async () => {
    mockReadStoreOffer.mockResolvedValueOnce({
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/store/items/disintegration-black-vinyl-lp',
      {},
      testBindings,
    );

    expect(mockReadStoreOffer).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('returns browser-safe store capability state', async () => {
    mockReadStoreCapabilities.mockResolvedValueOnce({
      nativeCheckout: {
        enabled: false,
        unavailableReason: 'Native checkout is temporarily unavailable.',
      },
    });

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/store/capabilities', {}, testBindings);

    expect(mockReadStoreCapabilities).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      nativeCheckout: {
        enabled: false,
        unavailableReason: 'Native checkout is temporarily unavailable.',
      },
    });
  });

  it('returns variant offers as an array-shaped contract', async () => {
    mockListVariantOffersForStoreItem.mockResolvedValueOnce([
      {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/store/items/disintegration-black-vinyl-lp/variants',
      {},
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual([
      {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);
  });

  it('returns 404 for unknown store items', async () => {
    mockReadStoreOffer.mockResolvedValueOnce(null);

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/store/items/unknown', {}, testBindings);

    expect(response.status).toBe(404);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Store item not found.',
    });
  });

  it('starts hosted Checkout with app identity only for manual BOX NOW fulfillment', async () => {
    mockStartCheckout.mockResolvedValueOnce({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).toHaveBeenCalledWith({
      cancelUrl: 'https://blackbox.example/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      successUrl:
        'https://blackbox.example/blackbox-records/store/disintegration-black-vinyl-lp/checkout/return?session_id={CHECKOUT_SESSION_ID}',
      newsletterOptIn: false,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });
  });

  it('accepts checkout starts without a shipping locker snapshot', async () => {
    mockStartCheckout.mockResolvedValueOnce({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
  });

  it('passes explicit checkout newsletter opt-in without provider details in the browser payload', async () => {
    mockStartCheckout.mockResolvedValueOnce({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          newsletterOptIn: true,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        newsletterOptIn: true,
      }),
    );
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
  });

  it('registers direct newsletter signups through the public Worker route', async () => {
    mockRegisterNewsletterSignup.mockResolvedValueOnce({
      contactRouting: {
        contactEmail: 'fan@example.com',
        intendedSubscriberEmail: 'fan@example.com',
        isSinkRouted: false,
      },
      retryable: false,
      status: 'registered',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/newsletter/registrations',
      {
        body: JSON.stringify({
          consentAccepted: true,
          email: 'fan@example.com',
        }),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox.example',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockRegisterNewsletterSignup).toHaveBeenCalledWith({
      email: 'fan@example.com',
    });
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      status: 'registered',
    });
  });

  it('maps newsletter provider failures to a provider-safe public response', async () => {
    mockRegisterNewsletterSignup.mockResolvedValueOnce({
      contactRouting: {
        contactEmail: 'fan@example.com',
        intendedSubscriberEmail: 'fan@example.com',
        isSinkRouted: false,
      },
      providerSafeReason: 'provider_unavailable',
      retryable: true,
      status: 'failed',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/newsletter/registrations',
      {
        body: JSON.stringify({
          consentAccepted: true,
          email: 'fan@example.com',
        }),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox.example',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(503);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Newsletter signup is temporarily unavailable.',
    });
  });

  it('rejects checkout return URLs from unapproved origins', async () => {
    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://evil.example',
          referer: 'https://evil.example/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout return URL is not allowed.',
    });
  });

  it('ignores malformed checkout referers instead of failing open', async () => {
    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://evil.example',
          referer: 'not-a-url',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout return URL is not allowed.',
    });
  });

  it('maps checkout validation failures to public non-500 responses', async () => {
    mockStartCheckout.mockRejectedValueOnce(new CheckoutConfigurationError());

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(409);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout is not configured for this item.',
    });
  });

  it('maps disabled native checkout to a public service-unavailable response', async () => {
    mockStartCheckout.mockRejectedValueOnce(new NativeCheckoutDisabledError());

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/disintegration-black-vinyl-lp/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(503);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      error: 'Native checkout is temporarily unavailable.',
    });
  });

  it('returns app-owned ReadCheckoutState output for return and retry UI', async () => {
    mockReadCheckoutState.mockResolvedValueOnce({
      checkoutSessionId: 'cs_test_123',
      paymentStatus: 'paid',
      shippingLocker,
      state: 'paid',
      status: 'complete',
    });

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/checkout/sessions/cs_test_123/state', {}, testBindings);

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      paymentStatus: 'paid',
      shippingLocker,
      state: 'paid',
      status: 'complete',
    });
  });
});
