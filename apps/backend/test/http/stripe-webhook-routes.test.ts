import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';
import * as stripeWebhookAcknowledgement from '../../src/interfaces/http/routes/stripe-webhook-acknowledgement';

const {
  mockApplyNonPaidCheckoutReconciliation,
  mockApplyPaidCheckoutReconciliation,
  mockDisconnectStripeWebhookServices,
  mockFindStoreItemByVariantId,
  mockMarkCatalogEventFailed,
  mockMarkCatalogEventSucceeded,
  mockPublishCheckoutOrderPaid,
  mockReconcileCatalogVariant,
  mockRecordCatalogWebhookEvent,
} = vi.hoisted(() => ({
  mockApplyNonPaidCheckoutReconciliation: vi.fn(async () => ({
    kind: 'transitioned',
  })),
  mockApplyPaidCheckoutReconciliation: vi.fn(async () => ({
    checkoutOrderPaid: {
      amountTotalMinor: null,
      checkoutSessionId: 'cs_test_123',
      currencyCode: null,
      customerName: null,
      lineItems: [],
      newsletterOptIn: false,
      occurredAt: new Date('2026-04-25T11:00:00.000Z'),
      orderId: 'order_1',
      orderReference: 'BBR-ORDER1',
      paidAt: new Date('2026-04-25T11:00:00.000Z'),
      paymentStatus: 'paid' as const,
      shippingAddress: {
        city: 'Athens',
        country: 'GR',
        line1: 'Long Street 1',
        line2: null,
        postalCode: '10558',
        state: null,
      },
      shopperContact: {
        email: 'buyer@example.com',
        phone: '+302100000000',
      },
      stripePaymentIntentId: null,
    },
    kind: 'applied',
  })),
  mockDisconnectStripeWebhookServices: vi.fn(async () => {}),
  mockFindStoreItemByVariantId: vi.fn(async () => ({
    sourceId: 'disintegration',
    sourceKind: 'release',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  })),
  mockMarkCatalogEventFailed: vi.fn(async () => undefined),
  mockMarkCatalogEventSucceeded: vi.fn(async () => undefined),
  mockPublishCheckoutOrderPaid: vi.fn(async () => {}),
  mockReconcileCatalogVariant: vi.fn(async () => ({
    actions: [],
    issueCount: 0,
    issues: [],
    lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
    mapping: null,
    resolvedPrice: null,
    snapshot: null,
    storeItem: {
      sourceId: 'disintegration',
      sourceKind: 'release' as const,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    },
  })),
  mockRecordCatalogWebhookEvent: vi.fn(async () => ({
    record: {
      catalogObjectId: 'price_test_123',
      catalogObjectKind: 'price' as const,
      eventId: 'evt_price_updated',
      eventType: 'price.updated',
      processingCompletedAt: null,
      processingFailureReason: null,
      processingStatus: 'pending' as const,
      processedAt: new Date('2026-05-24T00:00:00.000Z'),
      stripeCreatedAt: new Date('2026-05-24T00:00:00.000Z'),
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    },
    status: 'recorded' as const,
  })),
}));

vi.mock('../../src/interfaces/http/routes/stripe-webhook-services', () => ({
  createStripeWebhookServices: () => ({
    applyNonPaidCheckoutReconciliation: mockApplyNonPaidCheckoutReconciliation,
    applyPaidCheckoutReconciliation: mockApplyPaidCheckoutReconciliation,
    catalogEnvironment: 'uat',
    catalogWebhookMutationEnabled: true,
    disconnect: mockDisconnectStripeWebhookServices,
    findStoreItemByVariantId: mockFindStoreItemByVariantId,
    markCatalogEventFailed: mockMarkCatalogEventFailed,
    markCatalogEventSucceeded: mockMarkCatalogEventSucceeded,
    publishCheckoutOrderPaid: mockPublishCheckoutOrderPaid,
    reconcileCatalogVariant: mockReconcileCatalogVariant,
    recordCatalogWebhookEvent: mockRecordCatalogWebhookEvent,
  }),
}));

const webhookSecret = 'whsec_fixture_secret';

const testBindings = {
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  COMMERCE_DB: {} as D1Database,
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: webhookSecret,
};

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

function createStripeEventPayload(type: string): string {
  return JSON.stringify({
    api_version: '2026-04-25.basil',
    created: 1777132800,
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
      },
    },
    id: `evt_${type.replaceAll('.', '_')}`,
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: null,
    type,
  });
}

function createStripeCatalogPriceEventPayload(type: 'price.created' | 'price.updated'): string {
  return JSON.stringify({
    api_version: '2026-04-25.basil',
    created: 1777132800,
    data: {
      object: {
        active: true,
        currency: 'eur',
        id: 'price_test_123',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
        unit_amount: 3200,
      },
    },
    id: `evt_${type.replaceAll('.', '_')}`,
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: null,
    type,
  });
}

function createSignatureHeader(payload: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
}

describe('Stripe webhook routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockApplyNonPaidCheckoutReconciliation.mockClear();
    mockApplyPaidCheckoutReconciliation.mockClear();
    mockDisconnectStripeWebhookServices.mockClear();
    mockFindStoreItemByVariantId.mockClear();
    mockMarkCatalogEventFailed.mockClear();
    mockMarkCatalogEventSucceeded.mockClear();
    mockPublishCheckoutOrderPaid.mockClear();
    mockReconcileCatalogVariant.mockClear();
    mockRecordCatalogWebhookEvent.mockClear();
  });

  it('acknowledges valid allowed checkout-session events after signature verification', async () => {
    const payload = createStripeEventPayload('checkout.session.completed');
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(acknowledgeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutSession: expect.objectContaining({
          id: 'cs_test_123',
          object: 'checkout.session',
        }),
        id: 'evt_checkout_session_completed',
        isAllowed: true,
        type: 'checkout.session.completed',
      }),
      expect.anything(),
    );
    expect(mockApplyPaidCheckoutReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendedOrderStatus: 'paid',
      }),
    );
    expect(mockPublishCheckoutOrderPaid).toHaveBeenCalledWith(
      expect.objectContaining({
        orderReference: 'BBR-ORDER1',
      }),
    );
    expect(mockApplyNonPaidCheckoutReconciliation).not.toHaveBeenCalled();
  });

  it('acknowledges allowed checkout-session events through shared reconciliation without exposing recommendations', async () => {
    const payload = JSON.stringify({
      api_version: '2026-04-25.basil',
      created: 1777132800,
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          payment_intent: 'pi_test_123',
          payment_status: 'no_payment_required',
          status: 'complete',
        },
      },
      id: 'evt_checkout_session_completed',
      livemode: false,
      object: 'event',
      pending_webhooks: 1,
      request: null,
      type: 'checkout.session.completed',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(mockApplyNonPaidCheckoutReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendedOrderStatus: 'needs_review',
      }),
    );
    expect(mockApplyPaidCheckoutReconciliation).not.toHaveBeenCalled();
  });

  it('acknowledges expired checkout-session events through non-paid reconciliation', async () => {
    const payload = JSON.stringify({
      api_version: '2026-04-25.basil',
      created: 1777132800,
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          payment_status: 'unpaid',
          status: 'expired',
        },
      },
      id: 'evt_checkout_session_expired',
      livemode: false,
      object: 'event',
      pending_webhooks: 1,
      request: null,
      type: 'checkout.session.expired',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(mockApplyNonPaidCheckoutReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendedOrderStatus: 'not_paid',
      }),
    );
    expect(mockApplyPaidCheckoutReconciliation).not.toHaveBeenCalled();
  });

  it('acknowledges open checkout-session events without lifecycle mutation', async () => {
    const payload = JSON.stringify({
      api_version: '2026-04-25.basil',
      created: 1777132800,
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          payment_status: 'unpaid',
          status: 'open',
        },
      },
      id: 'evt_checkout_session_completed',
      livemode: false,
      object: 'event',
      pending_webhooks: 1,
      request: null,
      type: 'checkout.session.completed',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(mockApplyNonPaidCheckoutReconciliation).not.toHaveBeenCalled();
    expect(mockApplyPaidCheckoutReconciliation).not.toHaveBeenCalled();
  });

  it('acknowledges but ignores valid unsupported events', async () => {
    const payload = createStripeEventPayload('payment_intent.succeeded');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      ignored: true,
      received: true,
    });
  });

  it('rejects missing Stripe signatures before acknowledging an event', async () => {
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(400);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      code: 'invalid_request',
      error: 'Stripe webhook signature is required.',
      requestId: expect.any(String),
    });
    expect(acknowledgeSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures before acknowledging an event', async () => {
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: `${payload}\n`,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(400);
    expectNoStoreCacheControl(response);
    const body = await response.json();
    expect(body).toEqual({
      code: 'invalid_request',
      error: 'Stripe webhook signature verification failed.',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain('cs_test_123');
    expect(JSON.stringify(body)).not.toContain('evt_checkout_session_completed');
    expect(JSON.stringify(body)).not.toContain('stripe-signature');
    expect(acknowledgeSpy).not.toHaveBeenCalled();
  });

  it('returns a configuration error when the webhook secret is missing', async () => {
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      {
        ...testBindings,
        STRIPE_WEBHOOK_SECRET: undefined,
      },
    );

    expect(response.status).toBe(500);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      code: 'internal_server_error',
      error: 'Stripe webhook is not configured.',
      requestId: expect.any(String),
    });
  });

  it('returns a retryable non-2xx response when catalog reconciliation fails', async () => {
    const payload = createStripeCatalogPriceEventPayload('price.updated');
    mockReconcileCatalogVariant.mockRejectedValueOnce(new Error('Stripe unavailable'));

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(500);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      code: 'internal_server_error',
      error: 'Internal Server Error',
      requestId: expect.any(String),
    });
    expect(mockMarkCatalogEventFailed).toHaveBeenCalledWith('evt_price_updated', 'reconciliation_failed');
    expect(mockMarkCatalogEventSucceeded).not.toHaveBeenCalled();
  });

  it('acknowledges signed price-created catalog events through reconciliation', async () => {
    const payload = createStripeCatalogPriceEventPayload('price.created');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(mockRecordCatalogWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'evt_price_created',
        eventType: 'price.created',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    );
    expect(mockReconcileCatalogVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    );
    expect(mockMarkCatalogEventSucceeded).toHaveBeenCalledWith('evt_price_created');
  });
});
