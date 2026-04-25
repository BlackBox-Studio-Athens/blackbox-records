import { beforeEach, describe, expect, it } from 'vitest';

import {
  CheckoutOrderNotFoundError,
  createPendingCheckoutOrder,
  InvalidOrderTransitionError,
  readCheckoutOrder,
  transitionCheckoutOrder,
} from '../../../../src/application/commerce/orders';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
} from '../../../../src/domain/commerce/repositories';

class InMemoryOrderStateRepository implements OrderStateRepository {
  public readonly records = new Map<string, CheckoutOrderRecord>();
  public saveTransitionCalls = 0;

  public async createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord> {
    const createdAt = input.createdAt ?? new Date('2026-04-25T10:00:00.000Z');
    const record: CheckoutOrderRecord = {
      checkoutSessionId: input.checkoutSessionId,
      createdAt,
      id: `order_${this.records.size + 1}`,
      needsReviewAt: null,
      notPaidAt: null,
      paidAt: null,
      status: 'pending_payment',
      statusUpdatedAt: createdAt,
      storeItemSlug: input.storeItemSlug,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      updatedAt: createdAt,
      variantId: input.variantId,
    };

    this.records.set(record.checkoutSessionId, record);

    return record;
  }

  public async findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null> {
    return this.records.get(checkoutSessionId) ?? null;
  }

  public async saveTransition(
    checkoutSessionId: string,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null> {
    this.saveTransitionCalls += 1;
    const current = this.records.get(checkoutSessionId);

    if (!current) {
      return null;
    }

    const next: CheckoutOrderRecord = {
      ...current,
      needsReviewAt: transition.status === 'needs_review' ? transition.statusUpdatedAt : current.needsReviewAt,
      notPaidAt: transition.status === 'not_paid' ? transition.statusUpdatedAt : current.notPaidAt,
      paidAt: transition.status === 'paid' ? transition.statusUpdatedAt : current.paidAt,
      status: transition.status,
      statusUpdatedAt: transition.statusUpdatedAt,
      stripePaymentIntentId: transition.stripePaymentIntentId ?? current.stripePaymentIntentId,
      updatedAt: transition.statusUpdatedAt,
    };

    this.records.set(checkoutSessionId, next);

    return next;
  }
}

describe('order lifecycle use cases', () => {
  let orders: InMemoryOrderStateRepository;

  beforeEach(() => {
    orders = new InMemoryOrderStateRepository();
  });

  it('creates and reads a pending checkout order by checkout session id', async () => {
    const createdAt = new Date('2026-04-25T10:00:00.000Z');

    await expect(
      createPendingCheckoutOrder(orders, {
        checkoutSessionId: 'cs_test_123',
        createdAt,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      }),
    ).resolves.toMatchObject({
      checkoutSessionId: 'cs_test_123',
      status: 'pending_payment',
      statusUpdatedAt: createdAt,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });

    await expect(readCheckoutOrder(orders, 'cs_test_123')).resolves.toMatchObject({
      checkoutSessionId: 'cs_test_123',
      status: 'pending_payment',
    });
  });

  it('transitions a pending order to paid and records payment metadata', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });

    const transitionedAt = new Date('2026-04-25T11:00:00.000Z');

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: 'cs_test_123',
        stripePaymentIntentId: 'pi_test_123',
        toStatus: 'paid',
        transitionedAt,
      }),
    ).resolves.toEqual({
      order: expect.objectContaining({
        paidAt: transitionedAt,
        status: 'paid',
        statusUpdatedAt: transitionedAt,
        stripePaymentIntentId: 'pi_test_123',
      }),
      transitioned: true,
    });
  });

  it('returns a no-op result for duplicate paid replay without saving another transition', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });
    await transitionCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      toStatus: 'paid',
      transitionedAt: new Date('2026-04-25T11:00:00.000Z'),
    });
    orders.saveTransitionCalls = 0;

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: 'cs_test_123',
        toStatus: 'paid',
        transitionedAt: new Date('2026-04-25T12:00:00.000Z'),
      }),
    ).resolves.toEqual({
      order: expect.objectContaining({
        status: 'paid',
      }),
      transitioned: false,
    });
    expect(orders.saveTransitionCalls).toBe(0);
  });

  it('rejects invalid transitions before persistence writes', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });
    await transitionCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      toStatus: 'paid',
    });
    orders.saveTransitionCalls = 0;

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: 'cs_test_123',
        toStatus: 'not_paid',
      }),
    ).rejects.toBeInstanceOf(InvalidOrderTransitionError);
    expect(orders.saveTransitionCalls).toBe(0);
  });

  it('rejects browser read-path transition attempts', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: 'cs_test_123',
        origin: 'browser_read',
        toStatus: 'paid',
      }),
    ).rejects.toBeInstanceOf(InvalidOrderTransitionError);
  });

  it('throws a not-found error for unknown checkout sessions', async () => {
    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: 'cs_missing',
        toStatus: 'paid',
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderNotFoundError);
  });
});
