import { beforeEach, describe, expect, it } from 'vitest';

import { readCheckoutOrder, readRecentCheckoutOrders } from '../../../../src/application/commerce/orders';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
  OrderStatus,
} from '../../../../src/domain/commerce/repositories';

class InMemoryOrderStateRepository implements OrderStateRepository {
  public readonly records = new Map<string, CheckoutOrderRecord>();

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

  public async listRecent(input: { limit: number; status?: OrderStatus | null }): Promise<CheckoutOrderRecord[]> {
    return [...this.records.values()]
      .filter((record) => !input.status || record.status === input.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, input.limit);
  }

  public async saveTransition(
    checkoutSessionId: string,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null> {
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

describe('order readback use cases', () => {
  let orders: InMemoryOrderStateRepository;

  beforeEach(async () => {
    orders = new InMemoryOrderStateRepository();
    await orders.createPending({
      checkoutSessionId: 'cs_old_paid',
      createdAt: new Date('2026-04-25T10:00:00.000Z'),
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });
    await orders.saveTransition('cs_old_paid', {
      status: 'paid',
      statusUpdatedAt: new Date('2026-04-25T10:05:00.000Z'),
      stripePaymentIntentId: 'pi_test_paid',
    });
    await orders.createPending({
      checkoutSessionId: 'cs_new_review',
      createdAt: new Date('2026-04-25T11:00:00.000Z'),
      storeItemSlug: 'caregivers-vinyl',
      variantId: 'variant_caregivers-vinyl_standard',
    });
    await orders.saveTransition('cs_new_review', {
      status: 'needs_review',
      statusUpdatedAt: new Date('2026-04-25T11:05:00.000Z'),
    });
  });

  it('reads one checkout order by checkout session id', async () => {
    await expect(readCheckoutOrder(orders, 'cs_old_paid')).resolves.toMatchObject({
      checkoutSessionId: 'cs_old_paid',
      status: 'paid',
      stripePaymentIntentId: 'pi_test_paid',
    });
  });

  it('lists recent checkout orders by creation time', async () => {
    await expect(readRecentCheckoutOrders(orders, { limit: 2 })).resolves.toMatchObject([
      {
        checkoutSessionId: 'cs_new_review',
        status: 'needs_review',
      },
      {
        checkoutSessionId: 'cs_old_paid',
        status: 'paid',
      },
    ]);
  });

  it('filters recent checkout orders by status', async () => {
    await expect(readRecentCheckoutOrders(orders, { limit: 10, status: 'needs_review' })).resolves.toMatchObject([
      {
        checkoutSessionId: 'cs_new_review',
        status: 'needs_review',
      },
    ]);
  });
});
