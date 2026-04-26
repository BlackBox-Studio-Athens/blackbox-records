import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER } from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

const mockDisconnect = vi.fn(async () => {});
const mockReadCheckoutOrder = vi.fn();
const mockReadRecentCheckoutOrders = vi.fn();

vi.mock('../../src/interfaces/http/routes/internal-order-services', () => ({
  createInternalOrderServices: () => ({
    disconnect: mockDisconnect,
    readCheckoutOrder: mockReadCheckoutOrder,
    readRecentCheckoutOrders: mockReadRecentCheckoutOrders,
  }),
}));

describe('internal order routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires an Access-authenticated operator identity header', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/api/internal/orders');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing operator identity.',
    });
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
        status: 'paid',
        statusUpdatedAt: new Date('2026-04-25T10:05:00.000Z'),
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePaymentIntentId: 'pi_test_paid',
        updatedAt: new Date('2026-04-25T10:05:00.000Z'),
        variantId: 'variant_barren-point_standard',
      },
    ]);

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/internal/orders?status=paid&limit=10',
      {
        headers: {
          [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
        },
      },
      {
        APP_ENV: 'local',
        COMMERCE_DB: {} as D1Database,
      },
    );

    expect(mockReadRecentCheckoutOrders).toHaveBeenCalledWith({
      limit: 10,
      status: 'paid',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        checkoutSessionId: 'cs_test_paid',
        createdAt: '2026-04-25T10:00:00.000Z',
        needsReviewAt: null,
        notPaidAt: null,
        paidAt: '2026-04-25T10:05:00.000Z',
        status: 'paid',
        statusUpdatedAt: '2026-04-25T10:05:00.000Z',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePaymentIntentId: 'pi_test_paid',
        updatedAt: '2026-04-25T10:05:00.000Z',
        variantId: 'variant_barren-point_standard',
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
      status: 'needs_review',
      statusUpdatedAt: new Date('2026-04-25T11:05:00.000Z'),
      storeItemSlug: 'caregivers-vinyl',
      stripePaymentIntentId: null,
      updatedAt: new Date('2026-04-25T11:05:00.000Z'),
      variantId: 'variant_caregivers-vinyl_standard',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/internal/orders/checkout-sessions/cs_test_review',
      {
        headers: {
          [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
        },
      },
      {
        APP_ENV: 'local',
        COMMERCE_DB: {} as D1Database,
      },
    );

    expect(mockReadCheckoutOrder).toHaveBeenCalledWith('cs_test_review');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      checkoutSessionId: 'cs_test_review',
      createdAt: '2026-04-25T11:00:00.000Z',
      needsReviewAt: '2026-04-25T11:05:00.000Z',
      notPaidAt: null,
      paidAt: null,
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
      'http://backend.test/api/internal/orders/checkout-sessions/cs_missing',
      {
        headers: {
          [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
        },
      },
      {
        APP_ENV: 'local',
        COMMERCE_DB: {} as D1Database,
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout order not found.',
    });
  });
});
