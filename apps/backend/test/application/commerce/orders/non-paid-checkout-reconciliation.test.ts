import { beforeEach, describe, expect, it } from 'vitest';

import {
  reconcileCheckoutSession,
  type StripeCheckoutPaymentStatus,
  type StripeCheckoutSessionStatus,
} from '../../../../src/application/commerce/checkout';
import {
  applyNonPaidCheckoutReconciliation,
  createPendingCheckoutOrder,
  type ApplyNonPaidCheckoutReconciliationResult,
} from '../../../../src/application/commerce/orders';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
  OrderStatus,
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

describe('non-paid checkout reconciliation', () => {
  const appliedAt = new Date('2026-04-25T11:00:00.000Z');
  let orders: InMemoryOrderStateRepository;

  beforeEach(async () => {
    orders = new InMemoryOrderStateRepository();
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_barren-point_standard',
    });
  });

  it('transitions expired checkout sessions to not_paid without stock dependencies', async () => {
    await expect(
      applyNonPaidCheckoutReconciliation(orders, reconciliation('expired', 'unpaid'), appliedAt),
    ).resolves.toEqual({
      kind: 'transitioned',
      order: expect.objectContaining({
        notPaidAt: appliedAt,
        status: 'not_paid',
        statusUpdatedAt: appliedAt,
      }),
    } satisfies ApplyNonPaidCheckoutReconciliationResult);
  });

  it('transitions no-payment-required checkout sessions to needs_review for operator inspection', async () => {
    await expect(
      applyNonPaidCheckoutReconciliation(orders, reconciliation('complete', 'no_payment_required'), appliedAt),
    ).resolves.toEqual({
      kind: 'transitioned',
      order: expect.objectContaining({
        needsReviewAt: appliedAt,
        status: 'needs_review',
        statusUpdatedAt: appliedAt,
      }),
    } satisfies ApplyNonPaidCheckoutReconciliationResult);
  });

  it('treats duplicate terminal non-paid delivery as replay without another transition write', async () => {
    await applyNonPaidCheckoutReconciliation(orders, reconciliation('expired', 'unpaid'), appliedAt);
    orders.saveTransitionCalls = 0;

    await expect(
      applyNonPaidCheckoutReconciliation(orders, reconciliation('expired', 'unpaid'), appliedAt),
    ).resolves.toEqual({
      kind: 'replay',
      order: expect.objectContaining({
        status: 'not_paid',
      }),
    });
    expect(orders.saveTransitionCalls).toBe(0);
  });

  it('ignores open and processing checkout sessions because they are not terminal', async () => {
    await expect(
      applyNonPaidCheckoutReconciliation(orders, reconciliation('open', 'unpaid'), appliedAt),
    ).resolves.toEqual({
      kind: 'ignored',
      reason: 'pending_or_paid_recommendation',
    });
    expect(orders.records.get('cs_test_123')?.status).toBe('pending_payment');
    expect(orders.saveTransitionCalls).toBe(0);
  });

  it('returns missing_order when the checkout session has no persisted order row', async () => {
    await expect(
      applyNonPaidCheckoutReconciliation(
        new InMemoryOrderStateRepository(),
        reconciliation('expired', 'unpaid'),
        appliedAt,
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      kind: 'missing_order',
    });
  });

  it('rejects invalid transitions without mutating stock or order state', async () => {
    await applyNonPaidCheckoutReconciliation(orders, reconciliation('expired', 'unpaid'), appliedAt);

    await expect(
      applyNonPaidCheckoutReconciliation(orders, reconciliation('complete', 'no_payment_required'), appliedAt),
    ).resolves.toEqual({
      kind: 'rejected',
      reason: 'Order cannot transition from not_paid to needs_review.',
    });
  });
});

function reconciliation(status: StripeCheckoutSessionStatus, paymentStatus: StripeCheckoutPaymentStatus) {
  return reconcileCheckoutSession({
    checkoutSessionId: 'cs_test_123',
    paymentStatus,
    status,
    stripePaymentIntentId: 'pi_test_123',
  });
}
