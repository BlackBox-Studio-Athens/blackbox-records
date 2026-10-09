import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AvailabilityAlertCapReachedError,
  AvailabilityAlertIneligibleError,
  requestAvailabilityAlert,
  CheckoutConfigurationError,
  CheckoutAttemptTerminalError,
  CheckoutUnavailableError,
  CheckoutIdempotencyConflictError,
  CheckoutRetryableError,
  NativeCheckoutDisabledError,
  StoreItemNotFoundError,
  VariantMismatchError,
} from '../../../application/commerce/checkout';
import { CatalogDriftError } from '../../../application/commerce/catalog-sync';
import { createHttpApp } from '../app';
import { createPublicCommerceServices } from './public-commerce-services';
import { getCheckoutStateRoute, getStoreItemRoute, getStoreListingPricesRoute } from '../contracts/public-contracts';

const mockDisconnect = vi.fn(async () => {});
const mockReadStoreOffer = vi.fn();
const mockListVariantOffersForStoreItem = vi.fn();
const mockReadStoreCapabilities = vi.fn();
const mockReadStoreListingPrices = vi.fn();
const mockStartCheckout = vi.fn();
const mockQuoteDelivery = vi.fn();
const mockReadCheckoutState = vi.fn();
const mockRegisterNewsletterSignup = vi.fn();
const mockSubmitServicesInquiry = vi.fn();
const mockRequestAvailabilityAlert = vi.fn();

vi.mock('./public-commerce-services', () => ({
  readPublicStoreCapabilities: (...args: unknown[]) => mockReadStoreCapabilities(...args),
  createPublicCommerceServices: vi.fn(() => ({
    disconnect: mockDisconnect,
    errors: {
      AvailabilityAlertCapReachedError,
      AvailabilityAlertIneligibleError,
      CatalogDriftError,
      CheckoutAttemptTerminalError,
      CheckoutConfigurationError,
      CheckoutIdempotencyConflictError,
      CheckoutRetryableError,
      CheckoutUnavailableError,
      NativeCheckoutDisabledError,
      StoreItemNotFoundError,
      VariantMismatchError,
    },
    listVariantOffersForStoreItem: mockListVariantOffersForStoreItem,
    readCheckoutState: mockReadCheckoutState,
    readStoreListingPrices: mockReadStoreListingPrices,
    readStoreOffer: mockReadStoreOffer,
    requestAvailabilityAlert: mockRequestAvailabilityAlert,
    startCheckout: mockStartCheckout,
    quoteDelivery: mockQuoteDelivery,
  })),
}));

vi.mock('./public-newsletter-services', () => ({
  createPublicNewsletterServices: () => ({
    errors: {
      EmailConfigurationError: class EmailConfigurationError extends Error {},
      ZodError: class ZodError extends Error {},
    },
    registerNewsletterSignup: mockRegisterNewsletterSignup,
  }),
}));

vi.mock('./public-services-inquiry-services', () => ({
  createPublicServicesInquiryServices: () => ({
    errors: {
      EmailConfigurationError: class EmailConfigurationError extends Error {},
    },
    submitServicesInquiry: mockSubmitServicesInquiry,
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
  it('returns only the authoritative public quote and rejects browser money overrides', async () => {
    const app = createHttpApp();
    const lines = [
      {
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
        quantity: 1,
      },
    ];
    const quote = {
      tier: 'manual',
      amountMinor: 300,
      currencyCode: 'EUR',
      merchandiseGrossMinor: 2480,
      totalAmountMinor: 2780,
    };
    mockQuoteDelivery.mockResolvedValue(quote);
    const response = await app.request(
      'http://backend.test/api/store/delivery-quote',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      },
      testBindings,
    );
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(await response.json()).toEqual({ quote });
    for (const override of [{ amountMinor: 1 }, { tier: 'small' }, { totalVatMinor: 0 }]) {
      const rejected = await app.request(
        'http://backend.test/api/store/delivery-quote',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines, ...override }),
        },
        testBindings,
      );
      expect(rejected.status).toBe(400);
    }
    expect(mockQuoteDelivery).toHaveBeenCalledTimes(1);
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadStoreCapabilities.mockResolvedValue({
      nativeCheckout: {
        enabled: false,
        unavailableReason: 'Native checkout is temporarily unavailable.',
      },
    });
  });

  it('returns backend-known store item offer state', async () => {
    mockReadStoreOffer.mockResolvedValueOnce({
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      preorder: null,
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
    await expect(response.json()).resolves.toMatchObject({
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      preorder: null,
      links: [
        {
          href: '/api/store/items/disintegration-black-vinyl-lp',
          rel: 'self',
          type: 'application/json',
        },
        {
          href: '/api/store/items/disintegration-black-vinyl-lp/variants',
          rel: 'variants',
          type: 'application/json',
        },
      ],
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
    expect(createPublicCommerceServices).not.toHaveBeenCalled();
    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      nativeCheckout: {
        enabled: false,
        unavailableReason: 'Native checkout is temporarily unavailable.',
      },
    });
  });

  it.each([
    null,
    { shipEstimate: null },
    { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } },
    { shipEstimate: { kind: 'date', date: '2026-10-20' } },
  ] as const)('returns the ready pre-order contract without a private cycle key (%j)', async (preorder) => {
    const offer = {
      availability: { label: 'Available', status: 'available' },
      canCheckout: true,
      catalogStatus: 'ready',
      lowStockQuantity: 2,
      preorder,
      price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    };
    const schema = getStoreItemRoute.responses[200].content['application/json'].schema;
    expect(schema.safeParse(offer).success).toBe(true);
    expect(schema.safeParse({ ...offer, preorder: undefined }).success).toBe(false);
    const app = createHttpApp();
    mockReadStoreOffer.mockResolvedValueOnce(offer);
    mockListVariantOffersForStoreItem.mockResolvedValueOnce([offer]);
    for (const suffix of ['', '/variants']) {
      const response = await app.request(
        `http://backend.test/api/store/items/disintegration-black-vinyl-lp${suffix}`,
        {},
        testBindings,
      );
      expect(response.status).toBe(200);
      expectNoStoreCacheControl(response);
      const body = await response.json();
      if (suffix && !Array.isArray(body)) throw new Error('Expected variant offers');
      const returnedOffer: unknown = suffix && Array.isArray(body) ? body[0] : body;
      if (
        !returnedOffer ||
        typeof returnedOffer !== 'object' ||
        !('preorder' in returnedOffer) ||
        !('lowStockQuantity' in returnedOffer)
      )
        throw new Error('Expected a ready offer');
      expect(returnedOffer.preorder).toEqual(preorder);
      expect(returnedOffer.lowStockQuantity).toBe(2);
      expect(JSON.stringify(returnedOffer)).not.toContain('startedAt');
      expect(schema.safeParse(returnedOffer).success).toBe(true);
    }
    for (const catalogStatus of ['sold_out', 'catalog_drift'] as const) {
      const unavailable = {
        ...offer,
        availability:
          catalogStatus === 'sold_out'
            ? { label: 'Unavailable', state: 'unavailable', status: 'sold_out' }
            : { label: 'Checkout Paused', status: 'unavailable' },
        canCheckout: false,
        catalogStatus,
        price: null,
        preorder: undefined,
      };
      expect(schema.parse(unavailable)).not.toHaveProperty('preorder');
    }
    const comingSoon = {
      ...offer,
      availability: { label: 'Coming Soon', state: 'coming_soon', status: 'sold_out' },
      canCheckout: false,
      catalogStatus: 'sold_out',
      expectedMonth: '2026-11',
      price: null,
    };
    expect(schema.parse(comingSoon)).toMatchObject({
      availability: { state: 'coming_soon' },
      expectedMonth: '2026-11',
    });
    for (const state of [undefined, 'out_of_stock', 'stocked'])
      expect(schema.safeParse({ ...comingSoon, availability: { ...comingSoon.availability, state } }).success).toBe(
        false,
      );
  });

  it('records Notify me only for Coming Soon or Repressing items, with one answer for repeats', async () => {
    const identity = { storeItemSlug: 'anarchotribal-vinyl', variantId: 'variant_anarchotribal' };
    const waiting = (state: 'coming_soon' | 'repressing' | 'sold_out' | 'unavailable') => ({
      ...identity,
      availability: { label: state, state, status: 'sold_out' },
      canCheckout: false,
      catalogStatus: 'sold_out',
      price: null,
    });
    const offers: Record<string, unknown> = {
      'coming-soon': waiting('coming_soon'),
      repressing: waiting('repressing'),
      'sold-out': waiting('sold_out'),
      unavailable: waiting('unavailable'),
      drift: {
        ...identity,
        availability: { label: 'Checkout Paused', status: 'unavailable' },
        canCheckout: false,
        catalogStatus: 'catalog_drift',
        price: null,
      },
    };
    const stored = new Set<string>();
    let full = false;
    const alerts = {
      request: vi.fn(async (input: { variantId: string; email: string }) => {
        const key = `${input.variantId}:${input.email}`;
        if (stored.has(key)) return 'accepted' as const;
        if (full) return 'cap_reached' as const;
        stored.add(key);
        return 'accepted' as const;
      }),
    };
    mockRequestAvailabilityAlert.mockImplementation(async (storeItemSlug: string, email: string) =>
      requestAvailabilityAlert((offers[storeItemSlug] ?? null) as never, alerts, {
        storeItemSlug,
        email,
        consentedAt: new Date(),
      }),
    );
    const logs = [vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')].map((spy) =>
      spy.mockImplementation(() => {}),
    );
    const app = createHttpApp();
    const post = (slug: string, body: unknown) =>
      app.request(
        `http://backend.test/api/store/items/${slug}/availability-alerts`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        testBindings,
      );
    try {
      const body = { email: '  Shopper@Example.com ', consent: true };
      const first = await post('coming-soon', body);
      expect(first.status).toBe(200);
      expectNoStoreCacheControl(first);
      const firstBody = await first.json();
      expect(firstBody).toEqual({ status: 'requested' });
      const repeat = await post('coming-soon', { ...body, email: 'shopper@example.com' });
      expect(repeat.status).toBe(200);
      expect(await repeat.json()).toEqual(firstBody);
      expect([...stored]).toEqual(['variant_anarchotribal:shopper@example.com']);
      expect((await post('repressing', { email: 'second@example.com', consent: true })).status).toBe(200);

      for (const slug of ['sold-out', 'unavailable', 'drift']) {
        const refused = await post(slug, { email: 'third@example.com', consent: true });
        expect(refused.status).toBe(400);
        expectNoStoreCacheControl(refused);
        expect(await refused.json()).toMatchObject({ code: 'availability_alert_unavailable' });
      }
      expect((await post('missing', body)).status).toBe(404);
      for (const invalid of [
        { email: 'not-an-email', consent: true },
        { email: 'shopper@example.com', consent: false },
        { email: 'shopper@example.com' },
        { ...body, newsletterOptIn: true },
      ]) {
        expect((await post('coming-soon', invalid)).status).toBe(400);
      }

      full = true;
      const busy = await post('coming-soon', { email: 'late@example.com', consent: true });
      expect(busy.status).toBe(503);
      expect(await busy.json()).toMatchObject({ code: 'availability_alert_busy' });
      expect((await post('coming-soon', body)).status).toBe(200);
      expect(stored.size).toBe(2);

      const logged = JSON.stringify(logs.flatMap((spy) => spy.mock.calls));
      expect(logged).toContain('availability_alert_request_outcome');
      expect(logged).not.toMatch(/example\.com|@/i);
    } finally {
      logs.forEach((spy) => spy.mockRestore());
    }
  });

  it('advertises the availability-alert link only on an eligible non-ready offer', async () => {
    const app = createHttpApp();
    const identity = { storeItemSlug: 'anarchotribal-vinyl', variantId: 'variant_anarchotribal' };
    for (const [state, linked] of [
      ['coming_soon', true],
      ['repressing', true],
      ['sold_out', false],
      ['unavailable', false],
    ] as const) {
      mockReadStoreOffer.mockResolvedValueOnce({
        ...identity,
        availability: { label: state, state, status: 'sold_out' },
        canCheckout: false,
        catalogStatus: 'sold_out',
        price: null,
      });
      const response = await app.request('http://backend.test/api/store/items/anarchotribal-vinyl', {}, testBindings);
      const links = ((await response.json()) as { links: { rel: string; href: string }[] }).links;
      expect(links.find((link) => link.rel === 'availability-alert')).toEqual(
        linked
          ? {
              href: '/api/store/items/anarchotribal-vinyl/availability-alerts',
              rel: 'availability-alert',
              type: 'application/json',
            }
          : undefined,
      );
    }
  });

  it('returns one browser-safe no-store listing-price projection without Store Offer reads', async () => {
    mockReadStoreListingPrices.mockResolvedValueOnce([
      {
        availabilityState: 'sold_out',
        displayPrice: '€28.00',
        preorder: { shipEstimate: null },
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
      {
        availabilityState: 'unavailable',
        presentationState: 'unavailable',
        preorder: null,
        storeItemSlug: 'afterglow-tape',
      },
      {
        availabilityState: 'coming_soon',
        displayPrice: '€30.00',
        expectedMonth: '2026-11',
        preorder: null,
        presentationState: 'ready',
        storeItemSlug: 'anarchotribal-vinyl',
      },
    ]);

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/store/listing-prices', {}, testBindings);

    expect(mockReadStoreListingPrices).toHaveBeenCalledOnce();
    expect(mockReadStoreListingPrices).toHaveBeenCalledWith(undefined);
    expect(mockReadStoreOffer).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(response.headers.get('Link')).toContain('</api/store/listing-prices>');
    const body = await response.json();
    expect(body).toEqual([
      {
        availabilityState: 'sold_out',
        displayPrice: '€28.00',
        preorder: { shipEstimate: null },
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
      {
        availabilityState: 'unavailable',
        presentationState: 'unavailable',
        preorder: null,
        storeItemSlug: 'afterglow-tape',
      },
      {
        availabilityState: 'coming_soon',
        displayPrice: '€30.00',
        expectedMonth: '2026-11',
        preorder: null,
        presentationState: 'ready',
        storeItemSlug: 'anarchotribal-vinyl',
      },
    ]);
    expect(JSON.stringify(body)).not.toMatch(
      /variantId|canCheckout|stripe|onlineQuantity|zeroStockState|availabilityAlert|amountMinor|currencyCode|preorderStartedAt|startedAt|"quantity"/,
    );
  });

  it('forwards the preorders scope and preserves a scoped no-store self link', async () => {
    const records = [
      {
        availabilityState: 'stocked',
        displayPrice: '€28.00',
        lowStockQuantity: 2,
        presentationState: 'ready',
        preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } },
        storeItemSlug: 'item',
      },
    ];
    mockReadStoreListingPrices.mockResolvedValueOnce(records);
    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/store/listing-prices?scope=preorders',
      {},
      testBindings,
    );
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(mockReadStoreListingPrices).toHaveBeenCalledExactlyOnceWith('preorders');
    expect(response.headers.get('Link')).toContain('</api/store/listing-prices?scope=preorders>; rel="self"');
    await expect(response.json()).resolves.toEqual(records);
    expect(mockReadStoreOffer).not.toHaveBeenCalled();
  });

  it.each(['all', '', 'Preorders'])('rejects unsupported listing scope %s before reading', async (scope) => {
    const response = await createHttpApp().request(
      `http://backend.test/api/store/listing-prices?scope=${scope}`,
      {},
      testBindings,
    );
    expect(response.status).toBe(400);
    expect(mockReadStoreListingPrices).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { shipEstimate: null },
    { shipEstimate: { kind: 'month', month: '2026-10', part: 'early' } },
    { shipEstimate: { kind: 'date', date: '2026-10-04' } },
  ])('requires shopper preorder metadata on both listing branches: %j', (preorder) => {
    const schema = getStoreListingPricesRoute.responses[200].content['application/json'].schema;
    for (const presentationState of ['ready', 'unavailable']) {
      const record = {
        availabilityState: 'sold_out',
        presentationState,
        storeItemSlug: 'item',
        preorder,
        ...(presentationState === 'ready' ? { displayPrice: '€28.00', lowStockQuantity: 2 } : {}),
      };
      expect(schema.parse([record])).toEqual([record]);
      const { preorder: _preorder, ...withoutPreorder } = record;
      expect(schema.safeParse([withoutPreorder]).success).toBe(false);
      const allowed = [
        'availabilityState',
        'displayPrice',
        'lowStockQuantity',
        'preorder',
        'presentationState',
        'storeItemSlug',
      ];
      expect(Object.keys(record).every((key) => allowed.includes(key))).toBe(true);
    }
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
        links: [
          {
            href: '/api/store/items/disintegration-black-vinyl-lp',
            rel: 'self',
            type: 'application/json',
          },
          {
            href: '/api/store/items/disintegration-black-vinyl-lp/variants',
            rel: 'variants',
            type: 'application/json',
          },
        ],
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);
    expect(response.headers.get('Link')).toContain('rel="self"');
  });

  it('publishes scoped public discovery and omits unavailable checkout actions', async () => {
    mockReadStoreOffer.mockResolvedValueOnce({
      availability: { label: 'Available', status: 'available' },
      canCheckout: true,
      catalogStatus: 'ready',
      preorder: null,
      price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    const app = createHttpApp();
    const discovery = await app.request('http://backend.test/api/store/', {}, testBindings);
    expect(discovery.status).toBe(200);
    expectNoStoreCacheControl(discovery);
    const discoveryBody = (await discovery.json()) as { links?: unknown };
    expect(discoveryBody.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/api/store/openapi.json', rel: 'service-desc' }),
        expect.objectContaining({ href: '/api/store/capabilities', rel: 'capabilities' }),
      ]),
    );
    expect(JSON.stringify(discoveryBody)).not.toContain('/api/internal');

    const description = await app.request('http://backend.test/api/store/openapi.json', {}, testBindings);
    expect(description.status).toBe(200);
    const document = (await description.json()) as {
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    expect(document.paths['/api/internal']).toBeUndefined();
    expect(document.components.schemas.PublicShipEstimate).toBeDefined();
    expect(document.components.schemas.PublicStorePreorder).toBeDefined();
    expect(JSON.stringify(document)).not.toMatch(/CMS_RUNTIME|stripe_secret|\/api\/internal/);

    const item = await app.request(
      'http://backend.test/api/store/items/disintegration-black-vinyl-lp',
      {},
      testBindings,
    );
    expect(await item.json()).not.toHaveProperty('actions');
  });

  it('advertises checkout only when the current capability gate is enabled', async () => {
    mockReadStoreCapabilities.mockResolvedValueOnce({
      nativeCheckout: { enabled: true, unavailableReason: null },
    });
    mockReadStoreOffer.mockResolvedValueOnce({
      availability: { label: 'Available', status: 'available' },
      canCheckout: true,
      catalogStatus: 'ready',
      preorder: null,
      price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    const response = await createHttpApp().request(
      'http://backend.test/api/store/items/disintegration-black-vinyl-lp',
      {},
      testBindings,
    );
    const body = (await response.json()) as { actions?: unknown };
    expect(body.actions).toEqual([
      expect.objectContaining({
        href: '/api/checkout/sessions',
        method: 'POST',
        operationRef: 'createCheckoutSession',
        rel: 'checkout',
        parameters: {
          body: {
            storeItemSlug: 'disintegration-black-vinyl-lp',
            variantId: 'variant_disintegration-black-vinyl-lp_standard',
          },
        },
      }),
    ]);
  });

  it('returns 404 for unknown store items', async () => {
    mockReadStoreOffer.mockResolvedValueOnce(null);

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/store/items/unknown', {}, testBindings);

    expect(response.status).toBe(404);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      type: '/problems/not_found',
      title: 'Not Found',
      status: 404,
      detail: 'Store item not found.',
      code: 'not_found',
      error: 'Store item not found.',
      requestId: expect.any(String),
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
          referer: 'https://blackbox.example/blackbox-records/store/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).toHaveBeenCalledWith({
      cancelUrl: 'https://blackbox.example/blackbox-records/store/checkout/',
      successUrl: 'https://blackbox.example/blackbox-records/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}',
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

  it('forwards a UUIDv4 Idempotency-Key without exposing provider fields', async () => {
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
          'Idempotency-Key': '123e4567-e89b-42d3-a456-426614174000',
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockStartCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });
  });

  it('requires a checkout key when the runtime enforcement flag is enabled', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/checkout/sessions',
      {
        body: JSON.stringify({
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        headers: {
          origin: 'https://blackbox.example',
          referer: 'https://blackbox.example/store/checkout/',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      { ...testBindings, COMMERCE_IDEMPOTENCY_KEYS_REQUIRED: 'true' },
    );

    expect(mockStartCheckout).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'idempotency_key_required',
      status: 409,
    });
  });

  it('allows Idempotency-Key in the browser CORS preflight', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/checkout/sessions',
      {
        headers: {
          'access-control-request-headers': 'Content-Type, Idempotency-Key',
          'access-control-request-method': 'POST',
          origin: 'https://blackbox.example',
        },
        method: 'OPTIONS',
      },
      testBindings,
    );

    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Idempotency-Key');
  });

  it('exposes only the Link relationship header to an allowed browser origin', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/store/listing-prices',
      { headers: { origin: 'https://blackbox.example' } },
      testBindings,
    );

    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Link');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://blackbox.example');
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
      type: '/problems/newsletter_unavailable',
      title: 'Newsletter unavailable.',
      status: 503,
      detail: 'Newsletter signup is temporarily unavailable.',
      code: 'newsletter_unavailable',
      error: 'Newsletter signup is temporarily unavailable.',
      requestId: expect.any(String),
    });
  });

  it('submits Services inquiries through the public Worker route', async () => {
    mockSubmitServicesInquiry.mockResolvedValueOnce({
      idempotencyKey: 'blackbox:local:services-inquiry:test',
      retryable: false,
      status: 'sent',
    });
    const inquiry = {
      bandOrProject: 'BlackBox Test',
      email: 'visitor@example.com',
      message: 'Please send more information.',
      name: 'Test Visitor',
      service: 'General',
      serviceDetails: 'Athens',
    };

    const response = await createHttpApp().request(
      'http://backend.test/api/services/inquiries',
      {
        body: JSON.stringify(inquiry),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox.example',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockSubmitServicesInquiry).toHaveBeenCalledWith(inquiry);
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
  });

  it('maps Services inquiry provider failures to a provider-safe response', async () => {
    mockSubmitServicesInquiry.mockResolvedValueOnce({
      idempotencyKey: 'blackbox:local:services-inquiry:test',
      providerSafeReason: 'provider_unavailable',
      retryable: true,
      status: 'failed',
    });

    const response = await createHttpApp().request(
      'http://backend.test/api/services/inquiries',
      {
        body: JSON.stringify({
          email: 'private@example.com',
          message: 'Private visitor message',
          name: 'Private Visitor',
          service: 'General',
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
    const body = await response.json();
    expect(body).toEqual({
      type: '/problems/services_inquiry_unavailable',
      title: 'Services inquiry unavailable.',
      status: 503,
      detail: 'Services inquiry submission is temporarily unavailable.',
      code: 'services_inquiry_unavailable',
      error: 'Services inquiry submission is temporarily unavailable.',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain('Private');
    expect(JSON.stringify(body)).not.toContain('private@example.com');
  });

  it.each(['recipient', 'to'])('rejects browser %s overrides before sending', async (field) => {
    const response = await createHttpApp().request(
      'http://backend.test/api/services/inquiries',
      {
        body: JSON.stringify({
          email: 'visitor@example.com',
          message: 'Please send more information.',
          name: 'Test Visitor',
          service: 'General',
          [field]: 'attacker@example.com',
        }),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox.example',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(mockSubmitServicesInquiry).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      type: '/problems/invalid_request',
      title: 'Invalid request.',
      status: 400,
      detail: 'Invalid request.',
      code: 'invalid_request',
      error: 'Invalid request.',
      requestId: expect.any(String),
    });
  });

  it('omits raw validation details from public request errors', async () => {
    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/newsletter/registrations',
      {
        body: JSON.stringify({
          consentAccepted: true,
          email: 'not-an-email',
        }),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox.example',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(400);
    expectNoStoreCacheControl(response);
    const body = await response.json();
    expect(body).toEqual({
      type: '/problems/invalid_request',
      title: 'Invalid request.',
      status: 400,
      detail: 'Invalid request.',
      code: 'invalid_request',
      error: 'Invalid request.',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain('issues');
    expect(JSON.stringify(body)).not.toContain('not-an-email');
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
      type: '/problems/checkout_unavailable',
      title: 'Checkout unavailable.',
      status: 409,
      detail: 'Checkout return URL is not allowed.',
      code: 'checkout_unavailable',
      error: 'Checkout return URL is not allowed.',
      requestId: expect.any(String),
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
      type: '/problems/checkout_unavailable',
      title: 'Checkout unavailable.',
      status: 409,
      detail: 'Checkout return URL is not allowed.',
      code: 'checkout_unavailable',
      error: 'Checkout return URL is not allowed.',
      requestId: expect.any(String),
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
      type: '/problems/checkout_unavailable',
      title: 'Checkout unavailable.',
      status: 409,
      detail: 'Checkout is not configured for this item.',
      code: 'checkout_unavailable',
      error: 'Checkout is not configured for this item.',
      requestId: expect.any(String),
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
      type: '/problems/checkout_unavailable',
      title: 'Checkout unavailable.',
      status: 503,
      detail: 'Native checkout is temporarily unavailable.',
      code: 'checkout_unavailable',
      error: 'Native checkout is temporarily unavailable.',
      requestId: expect.any(String),
    });
  });

  it.each([
    null,
    { shipEstimate: null },
    { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } },
    { shipEstimate: { kind: 'date', date: '2026-10-20' } },
  ])('returns the checkout pre-order summary for return and retry UI: %j', async (preorder) => {
    mockReadCheckoutState.mockResolvedValueOnce({
      checkoutSessionId: 'cs_test_123',
      orderStatus: 'paid',
      paymentStatus: 'paid',
      preorder,
      shippingLocker,
      state: 'paid',
      status: 'complete',
    });

    const app = createHttpApp();
    const response = await app.request('http://backend.test/api/checkout/sessions/cs_test_123/state', {}, testBindings);

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    const body = await response.json();
    expect(body).toEqual({
      checkoutSessionId: 'cs_test_123',
      orderStatus: 'paid',
      paymentStatus: 'paid',
      preorder,
      shippingLocker,
      state: 'paid',
      status: 'complete',
    });
    expect(JSON.stringify(body)).not.toContain('fulfillment');
    expect(JSON.stringify(body)).not.toContain('deliveries');
    expect(JSON.stringify(body)).not.toContain('shopperEmail');
    expect(JSON.stringify(body)).not.toContain('shippingAddress');
    expect(JSON.stringify(body)).not.toMatch(/startedAt|preorderStartedAt|lines/);
    const schema = getCheckoutStateRoute.responses[200].content['application/json'].schema;
    expect(schema.safeParse(body).success).toBe(true);
    expect(
      schema.safeParse({
        checkoutSessionId: 'cs_test_123',
        orderStatus: 'paid',
        paymentStatus: 'paid',
        shippingLocker,
        state: 'paid',
        status: 'complete',
      }).success,
    ).toBe(false);
    expect(mockReadCheckoutState).toHaveBeenCalledExactlyOnceWith('cs_test_123');
  });
});
