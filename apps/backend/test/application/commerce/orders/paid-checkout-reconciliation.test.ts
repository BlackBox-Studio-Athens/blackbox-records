import { beforeEach, describe, expect, it } from 'vitest';

import { reconcileCheckoutSession } from '../../../../src/application/commerce/checkout';
import {
  applyPaidCheckoutReconciliation,
  createPendingCheckoutOrder,
  finalizePaidCheckoutWithRepositories,
  type ApplyPaidCheckoutReconciliationResult,
  type PaidCheckoutFinalizationRepository,
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
} from '../../../../src/domain/commerce/repositories/spi';
import {
  cartQuantity,
  checkoutSessionId,
  paymentIntentId,
  stockQuantity,
  storeItemSlug,
  stripePriceId,
  variantId as toVariantId,
} from '../../../support/commerce-value-objects';

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
      shippingLocker: input.shippingLocker,
      status: 'pending_payment',
      statusUpdatedAt: createdAt,
      storeItemSlug: input.storeItemSlug,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      updatedAt: createdAt,
      variantId: input.variantId,
      lines: (
        input.lines ?? [
          {
            quantity: cartQuantity(1),
            storeItemSlug: input.storeItemSlug,
            stripePriceId: null,
            variantId: input.variantId,
          },
        ]
      ).map((line, index) => ({
        createdAt,
        id: `order_line_${index + 1}`,
        orderId: `order_${this.records.size + 1}`,
        quantity: line.quantity,
        stripePriceId: line.stripePriceId ?? null,
        storeItemSlug: line.storeItemSlug,
        variantId: line.variantId,
      })),
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
      onlineQuantity: stockQuantity(state.onlineQuantity),
      quantity: stockQuantity(state.quantity),
      updatedAt: new Date('2026-04-25T11:00:00.000Z'),
      variantId: toVariantId(variantId),
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
  const shippingLocker = {
    country_code: 'GR' as const,
    locker_id: '4',
    locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
  };
  const primaryCheckoutSessionId = checkoutSessionId('cs_test_123');
  const primaryStoreItemSlug = storeItemSlug('disintegration-black-vinyl-lp');
  const primaryStripePriceId = stripePriceId('price_test_barren_point');
  const variantId = toVariantId('variant_disintegration-black-vinyl-lp_standard');
  let orders: InMemoryOrderStateRepository;
  let paidCheckoutFinalizer: PaidCheckoutFinalizationRepository;
  let stock: InMemoryStockRepository;
  let stockChanges: InMemoryStockChangeRepository;

  beforeEach(async () => {
    orders = new InMemoryOrderStateRepository();
    stock = new InMemoryStockRepository();
    stockChanges = new InMemoryStockChangeRepository();
    paidCheckoutFinalizer = {
      finalizePaidCheckout: (command) => finalizePaidCheckoutWithRepositories(orders, stock, stockChanges, command),
    };
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: primaryCheckoutSessionId,
      lines: [
        {
          quantity: cartQuantity(1),
          stripePriceId: primaryStripePriceId,
          storeItemSlug: primaryStoreItemSlug,
          variantId,
        },
      ],
      shippingLocker,
      storeItemSlug: primaryStoreItemSlug,
      variantId,
    });
    await stock.save(variantId, {
      onlineQuantity: 2,
      quantity: 3,
    });
    stock.saveCalls = 0;
  });

  it('transitions a paid checkout order and decrements stock once', async () => {
    const result = await applyPaidCheckoutReconciliation(
      orders,
      paidCheckoutFinalizer,
      paidReconciliation(),
      appliedAt,
    );

    expect(result).toEqual({
      checkoutOrderPaid: expect.objectContaining({
        amountTotalMinor: 2500,
        checkoutSessionId: 'cs_test_123',
        currencyCode: 'EUR',
        orderReference: expect.stringMatching(/^BBR-2026-04-25-[A-Z]+-[A-Z]+-[A-Z]+$/),
        paymentStatus: 'paid',
        shippingAddress: expect.objectContaining({
          country: 'GR',
          line1: 'Long Street 1',
        }),
        shopperContact: {
          email: 'buyer@example.com',
          phone: '+302100000000',
        },
      }),
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
    await applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, paidReconciliation(), appliedAt);
    stock.saveCalls = 0;

    await expect(
      applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, paidReconciliation(), appliedAt),
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
        paidCheckoutFinalizer,
        reconcileCheckoutSession({
          amountTotalMinor: null,
          checkoutSessionId: primaryCheckoutSessionId,
          currencyCode: null,
          customer: {
            email: null,
            name: null,
            phone: null,
          },
          newsletterOptIn: false,
          paymentStatus: 'unpaid',
          shippingAddress: null,
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
        paidCheckoutFinalizer,
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
      applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, paidReconciliation(), appliedAt),
    ).resolves.toEqual({
      kind: 'stock_unavailable',
      order: expect.objectContaining({
        status: 'pending_payment',
      }),
      reason: 'Paid checkout cannot decrement unavailable stock.',
    });
    expect(stock.saveCalls).toBe(0);
    expect(stockChanges.records).toHaveLength(0);
  });

  it('uses finalized Stripe line item quantities before decrementing paid stock', async () => {
    const result = await applyPaidCheckoutReconciliation(
      orders,
      paidCheckoutFinalizer,
      paidReconciliation(),
      appliedAt,
      [
        {
          quantity: cartQuantity(2),
          stripePriceId: primaryStripePriceId,
        },
      ],
    );

    expect(result).toMatchObject({
      kind: 'applied',
      stock: {
        onlineQuantity: 0,
        quantity: 1,
      },
      stockChange: {
        quantityDelta: -2,
      },
    });
  });

  it('uses the Stripe paid session amount for pay-what-you-want finalization', async () => {
    const result = await applyPaidCheckoutReconciliation(
      orders,
      paidCheckoutFinalizer,
      paidReconciliation({
        amountTotalMinor: 3700,
      }),
      appliedAt,
      [
        {
          quantity: cartQuantity(1),
          stripePriceId: primaryStripePriceId,
        },
      ],
    );

    expect(result).toMatchObject({
      checkoutOrderPaid: {
        amountTotalMinor: 3700,
        currencyCode: 'EUR',
        lineItems: [
          {
            quantity: 1,
            stripePriceId: primaryStripePriceId,
          },
        ],
      },
      kind: 'applied',
    });
  });

  it('moves paid checkout to needs_review when finalized Stripe line items cannot be mapped', async () => {
    await expect(
      applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, paidReconciliation(), appliedAt, [
        {
          quantity: cartQuantity(2),
          stripePriceId: stripePriceId('price_unmapped'),
        },
      ]),
    ).resolves.toEqual({
      kind: 'needs_review',
      order: expect.objectContaining({
        status: 'needs_review',
      }),
      reason: 'Paid checkout line items could not be reconciled.',
    });
    expect(stock.saveCalls).toBe(0);
    expect(stockChanges.records).toHaveLength(0);
  });
});

function paidReconciliation(overrides: Partial<Parameters<typeof reconcileCheckoutSession>[0]> = {}) {
  const session: Parameters<typeof reconcileCheckoutSession>[0] = {
    amountTotalMinor: 2500,
    checkoutSessionId: checkoutSessionId('cs_test_123'),
    currencyCode: 'EUR',
    customer: {
      email: 'buyer@example.com',
      name: 'Buyer Name',
      phone: '+302100000000',
    },
    newsletterOptIn: true,
    paymentStatus: 'paid',
    shippingAddress: {
      city: 'Athens',
      country: 'GR',
      line1: 'Long Street 1',
      line2: null,
      postalCode: '10558',
      state: null,
    },
    status: 'complete',
    stripePaymentIntentId: paymentIntentId('pi_test_123'),
  };

  return reconcileCheckoutSession({
    ...session,
    ...overrides,
    customer: {
      ...session.customer,
      ...overrides.customer,
    },
  });
}
