import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';

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
    mockReadRecentCheckoutOrders.mockResolvedValueOnce([
      {
        checkoutSessionId: 'cs_test_paid',
        createdAt: new Date('2026-04-25T10:00:00.000Z'),
        id: 'order_1',
        needsReviewAt: null,
        notPaidAt: null,
        paidAt: new Date('2026-04-25T10:05:00.000Z'),
        shippingLocker: {
          country_code: 'GR',
          locker_id: '4',
          locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
        },
        status: 'paid',
        statusUpdatedAt: new Date('2026-04-25T10:05:00.000Z'),
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePaymentIntentId: 'pi_test_paid',
        updatedAt: new Date('2026-04-25T10:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
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
    await expect(response.json()).resolves.toEqual([
      {
        checkoutSessionId: 'cs_test_paid',
        createdAt: '2026-04-25T10:00:00.000Z',
        needsReviewAt: null,
        notPaidAt: null,
        paidAt: '2026-04-25T10:05:00.000Z',
        shippingLocker: {
          country_code: 'GR',
          locker_id: '4',
          locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
        },
        status: 'paid',
        statusUpdatedAt: '2026-04-25T10:05:00.000Z',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePaymentIntentId: 'pi_test_paid',
        updatedAt: '2026-04-25T10:05:00.000Z',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);
  });

  it('returns checkout order detail by checkout session id', async () => {
    mockReadCheckoutOrder.mockResolvedValueOnce({
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
      checkoutSessionId: 'cs_test_review',
      createdAt: '2026-04-25T11:00:00.000Z',
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
