import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';
import { currentPaidCheckoutOrder } from '../fixtures/current-paid-checkout-order';

const LOCAL_ENV = {
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  COMMERCE_DB: {} as D1Database,
  LOCAL_OPERATOR_EMAIL: 'operator@blackboxrecords.example',
};
const HOSTED_ENV = {
  PRODUCT_ENVIRONMENT: 'UAT' as const,
  COMMERCE_DB: {} as D1Database,
  CF_ACCESS_POLICY_AUD: 'operator-audience',
  CF_ACCESS_TEAM_DOMAIN: 'https://blackbox.cloudflareaccess.com',
};

const mockDisconnect = vi.fn(async () => {});
const mockReadCheckoutOrder = vi.fn();
const mockReadRecentCheckoutOrders = vi.fn();
const mockCreateInternalOrderServices = vi.fn();

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

vi.mock('../../src/interfaces/http/routes/internal-order-services', () => ({
  createInternalOrderServices: (...args: unknown[]) => {
    mockCreateInternalOrderServices(...args);

    return {
      disconnect: mockDisconnect,
      readCheckoutOrder: mockReadCheckoutOrder,
      readRecentCheckoutOrders: mockReadRecentCheckoutOrders,
    };
  },
}));

describe('internal order routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a hosted request without an Access assertion before service construction', async () => {
    const app = createHttpApp();

    const response = await app.request('https://ops.example/api/internal/orders', undefined, HOSTED_ENV);

    expect(response.status).toBe(401);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      code: 'unauthorized',
      error: 'Unauthorized.',
      requestId: expect.any(String),
    });
    expect(mockCreateInternalOrderServices).not.toHaveBeenCalled();
    expect(mockReadRecentCheckoutOrders).not.toHaveBeenCalled();
  });

  it('lists recent checkout orders for operators on the protected internal surface', async () => {
    const paidOrder = currentPaidCheckoutOrder();
    mockReadRecentCheckoutOrders.mockResolvedValueOnce([
      {
        deliveries: [
          {
            attemptCount: 1,
            createdAt: new Date('2026-08-31T10:00:00.000Z'),
            deliveredAt: new Date('2026-08-31T10:01:00.000Z'),
            id: 'delivery_internal_only',
            kind: 'shopper_confirmation',
            needsReviewAt: null,
            nextAttemptAt: null,
            orderId: paidOrder.id,
            providerMessageId: 'provider_internal_only',
            safeReason: null,
            status: 'delivered',
            updatedAt: new Date('2026-08-31T10:01:00.000Z'),
          },
        ],
        order: paidOrder,
      },
    ]);

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/orders?status=paid&limit=10',
      undefined,
      LOCAL_ENV,
    );

    expect(mockReadRecentCheckoutOrders).toHaveBeenCalledWith({
      limit: 10,
      status: 'paid',
    });
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    const body = await response.json();
    expect(body).toEqual([
      expect.objectContaining({
        deliveries: [
          {
            attemptCount: 1,
            createdAt: '2026-08-31T10:00:00.000Z',
            deliveredAt: '2026-08-31T10:01:00.000Z',
            kind: 'shopper_confirmation',
            needsReviewAt: null,
            nextAttemptAt: null,
            safeReason: null,
            status: 'delivered',
            updatedAt: '2026-08-31T10:01:00.000Z',
          },
        ],
        fulfillment: {
          amountTotalMinor: 2500,
          currencyCode: 'EUR',
          kind: 'current',
          lines: [
            expect.objectContaining({
              displayName: 'Disintegration Black Vinyl LP',
              lineAmountMinor: 2500,
              unitAmountMinor: 2500,
            }),
          ],
          newsletterConsent: {
            consentedAt: '2026-08-31T10:00:00.000Z',
            copyVersion: 'blackbox-newsletter-v1',
            optedIn: true,
          },
          paidAt: '2026-08-31T10:00:00.000Z',
          recipientName: 'Buyer Name',
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
        },
        status: 'paid',
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain('provider_internal_only');
    expect(JSON.stringify(body)).not.toContain('delivery_internal_only');
    expect(JSON.stringify(body)).not.toContain('leaseUntil');
  });

  it('returns checkout order detail by checkout session id', async () => {
    mockReadCheckoutOrder.mockResolvedValueOnce({
      deliveries: [],
      order: {
        checkoutExpiresAt: new Date('2026-04-25T11:30:00.000Z'),
        checkoutSessionId: 'cs_test_review',
        createdAt: new Date('2026-04-25T11:00:00.000Z'),
        id: 'order_2',
        needsReviewAt: new Date('2026-04-25T11:05:00.000Z'),
        notPaidAt: null,
        paidAt: null,
        shippingLocker: null,
        status: 'needs_review',
        statusUpdatedAt: new Date('2026-04-25T11:05:00.000Z'),
        storeItemSlug: 'caregivers-vinyl',
        stripePaymentIntentId: null,
        updatedAt: new Date('2026-04-25T11:05:00.000Z'),
        variantId: 'variant_caregivers-vinyl_standard',
      },
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/orders/checkout-sessions/cs_test_review',
      undefined,
      LOCAL_ENV,
    );

    expect(mockReadCheckoutOrder).toHaveBeenCalledWith('cs_test_review');
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      checkoutExpiresAt: '2026-04-25T11:30:00.000Z',
      checkoutSessionId: 'cs_test_review',
      createdAt: '2026-04-25T11:00:00.000Z',
      deliveries: [],
      fulfillment: { kind: 'unavailable' },
      needsReviewAt: '2026-04-25T11:05:00.000Z',
      notPaidAt: null,
      paidAt: null,
      shippingLocker: null,
      status: 'needs_review',
      statusUpdatedAt: '2026-04-25T11:05:00.000Z',
      storeItemSlug: 'caregivers-vinyl',
      stripePaymentIntentId: null,
      updatedAt: '2026-04-25T11:05:00.000Z',
      variantId: 'variant_caregivers-vinyl_standard',
    });
  });

  it('does not expose partial fulfillment fields from an incomplete paid row', async () => {
    mockReadCheckoutOrder.mockResolvedValueOnce({
      deliveries: [],
      order: {
        ...currentPaidCheckoutOrder(),
        recipientName: null,
        shopperEmail: 'must-not-leak@example.com',
        shippingAddressLine1: 'Must Not Leak 1',
      },
    });

    const response = await createHttpApp().request(
      'http://127.0.0.1/api/internal/orders/checkout-sessions/cs_test_paid',
      undefined,
      LOCAL_ENV,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(body).toEqual(
      expect.objectContaining({ fulfillment: { kind: 'incomplete', reason: 'incomplete_paid_fulfillment' } }),
    );
    expect(JSON.stringify(body)).not.toContain('must-not-leak@example.com');
    expect(JSON.stringify(body)).not.toContain('Must Not Leak 1');
  });

  it('returns 404 when an order cannot be found by checkout session id', async () => {
    mockReadCheckoutOrder.mockResolvedValueOnce(null);

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/orders/checkout-sessions/cs_missing',
      undefined,
      LOCAL_ENV,
    );

    expect(response.status).toBe(404);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      code: 'not_found',
      error: 'Checkout order not found.',
      requestId: expect.any(String),
    });
  });
});
