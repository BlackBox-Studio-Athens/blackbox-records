import { beforeEach, describe, expect, it } from 'vitest';

import { reconcileCheckoutSession } from '../../../../src/application/commerce/checkout';
import {
  applyPaidCheckoutReconciliation,
  createPendingCheckoutOrder,
  type ApplyPaidCheckoutReconciliationResult,
} from '../../../../src/application/commerce/orders';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
  OrderStatus,
  RecordStockChangeInput,
  StockChangeRecord,
  StockChangeRepository,
  StockRecord,
  StockRepository,
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

class InMemoryStockRepository implements StockRepository {
  public readonly records = new Map<string, StockRecord>();
  public saveCalls = 0;

  public async findByVariantId(variantId: string): Promise<StockRecord | null> {
    return this.records.get(variantId) ?? null;
  }

  public async save(variantId: string, state: { onlineQuantity: number; quantity: number }): Promise<StockRecord> {
    this.saveCalls += 1;
    const record: StockRecord = {
      createdAt: new Date('2026-04-24T10:00:00.000Z'),
      onlineQuantity: state.onlineQuantity,
      quantity: state.quantity,
      updatedAt: new Date('2026-04-25T11:00:00.000Z'),
      variantId,
    };

    this.records.set(variantId, record);

    return record;
  }
}

class InMemoryStockChangeRepository implements StockChangeRepository {
  public readonly records: StockChangeRecord[] = [];

  public async listByVariantId(variantId: string, limit: number): Promise<StockChangeRecord[]> {
    return this.records.filter((record) => record.variantId === variantId).slice(0, limit);
  }

  public async record(input: RecordStockChangeInput): Promise<StockChangeRecord> {
    const record: StockChangeRecord = {
      actorEmail: input.actorEmail,
      id: `stock_change_${this.records.length + 1}`,
      notes: input.notes,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      recordedAt: input.recordedAt ?? new Date('2026-04-25T11:00:00.000Z'),
      variantId: input.variantId,
    };

    this.records.push(record);

    return record;
  }
}

describe('paid checkout reconciliation', () => {
  const appliedAt = new Date('2026-04-25T11:00:00.000Z');
  const variantId = 'variant_barren-point_standard';
  let orders: InMemoryOrderStateRepository;
  let stock: InMemoryStockRepository;
  let stockChanges: InMemoryStockChangeRepository;

  beforeEach(async () => {
    orders = new InMemoryOrderStateRepository();
    stock = new InMemoryStockRepository();
    stockChanges = new InMemoryStockChangeRepository();
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: 'cs_test_123',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId,
    });
    await stock.save(variantId, {
      onlineQuantity: 2,
      quantity: 3,
    });
    stock.saveCalls = 0;
  });

  it('transitions a paid checkout order and decrements stock once', async () => {
    const result = await applyPaidCheckoutReconciliation(orders, stock, stockChanges, paidReconciliation(), appliedAt);

    expect(result).toEqual({
      kind: 'applied',
      order: expect.objectContaining({
        paidAt: appliedAt,
        status: 'paid',
        stripePaymentIntentId: 'pi_test_123',
      }),
      stock: expect.objectContaining({
        onlineQuantity: 1,
        quantity: 2,
      }),
      stockChange: expect.objectContaining({
        actorEmail: 'stripe-webhook',
        notes: 'Checkout session cs_test_123',
        quantityDelta: -1,
        reason: 'checkout_paid',
      }),
    } satisfies ApplyPaidCheckoutReconciliationResult);
  });

  it('does not decrement stock for duplicate paid webhook replay', async () => {
    await applyPaidCheckoutReconciliation(orders, stock, stockChanges, paidReconciliation(), appliedAt);
    stock.saveCalls = 0;

    await expect(
      applyPaidCheckoutReconciliation(orders, stock, stockChanges, paidReconciliation(), appliedAt),
    ).resolves.toEqual({
      kind: 'replay',
      order: expect.objectContaining({
        status: 'paid',
      }),
    });
    expect(stock.saveCalls).toBe(0);
    expect(stockChanges.records).toHaveLength(1);
  });

  it('ignores non-paid checkout reconciliation recommendations', async () => {
    await expect(
      applyPaidCheckoutReconciliation(
        orders,
        stock,
        stockChanges,
        reconcileCheckoutSession({
          checkoutSessionId: 'cs_test_123',
          paymentStatus: 'unpaid',
          status: 'open',
        }),
        appliedAt,
      ),
    ).resolves.toEqual({
      kind: 'ignored',
      reason: 'not_paid_recommendation',
    });
    expect(orders.records.get('cs_test_123')?.status).toBe('pending_payment');
    expect(stock.saveCalls).toBe(0);
  });

  it('does not decrement stock when no order exists for the paid checkout session', async () => {
    await expect(
      applyPaidCheckoutReconciliation(
        new InMemoryOrderStateRepository(),
        stock,
        stockChanges,
        paidReconciliation(),
        appliedAt,
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      kind: 'missing_order',
    });
    expect(stock.saveCalls).toBe(0);
  });

  it('does not decrement stock below zero when paid stock is unavailable', async () => {
    await stock.save(variantId, {
      onlineQuantity: 0,
      quantity: 3,
    });
    stock.saveCalls = 0;

    await expect(
      applyPaidCheckoutReconciliation(orders, stock, stockChanges, paidReconciliation(), appliedAt),
    ).resolves.toEqual({
      kind: 'stock_unavailable',
      order: expect.objectContaining({
        status: 'paid',
      }),
      reason: 'Paid checkout cannot decrement unavailable stock.',
    });
    expect(stock.saveCalls).toBe(0);
    expect(stockChanges.records).toHaveLength(0);
  });
});

function paidReconciliation() {
  return reconcileCheckoutSession({
    checkoutSessionId: 'cs_test_123',
    paymentStatus: 'paid',
    status: 'complete',
    stripePaymentIntentId: 'pi_test_123',
  });
}
