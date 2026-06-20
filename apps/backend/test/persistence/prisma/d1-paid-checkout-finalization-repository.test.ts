import { describe, expect, it } from 'vitest';

import {
  createCartQuantity,
  parseCheckoutSessionId,
  parsePaymentIntentId,
  parseVariantId,
} from '../../../src/domain/commerce';
import { D1PaidCheckoutFinalizationRepository } from '../../../src/interfaces/http/routes/d1-paid-checkout-finalization-repository';

type FakeCheckoutOrderRow = {
  checkoutSessionId: string;
  createdAt: string;
  id: string;
  needsReviewAt: null | string;
  notPaidAt: null | string;
  paidAt: null | string;
  shippingLockerCountryCode: null | string;
  shippingLockerId: null | string;
  shippingLockerNameOrLabel: null | string;
  status: 'needs_review' | 'not_paid' | 'paid' | 'pending_payment';
  statusUpdatedAt: string;
  storeItemSlug: string;
  stripePaymentIntentId: null | string;
  updatedAt: string;
  variantId: string;
};

type FakeCheckoutOrderLineRow = {
  createdAt: string;
  id: string;
  orderId: string;
  quantity: number;
  storeItemSlug: string;
  stripePriceId: null | string;
  variantId: string;
};

type FakeStockRow = {
  createdAt: string;
  onlineQuantity: number;
  quantity: number;
  updatedAt: string;
  variantId: string;
};

type FakeStockChangeRow = {
  actorEmail: string;
  id: string;
  notes: null | string;
  quantityDelta: number;
  reason: string;
  recordedAt: string;
  variantId: string;
};

type FakeD1State = {
  batchCalls: number;
  lines: FakeCheckoutOrderLineRow[];
  orders: Map<string, FakeCheckoutOrderRow>;
  stockChanges: Map<string, FakeStockChangeRow>;
  stocks: Map<string, FakeStockRow>;
};

describe('D1PaidCheckoutFinalizationRepository', () => {
  it('finalizes a paid checkout through D1 batch without an interactive transaction', async () => {
    const state = createState();
    const repository = new D1PaidCheckoutFinalizationRepository(createFakeD1Database(state));

    const result = await repository.finalizePaidCheckout({
      checkoutSessionId: parseCheckoutSessionId('cs_test_paid'),
      lineItems: [
        {
          quantity: createCartQuantity(1),
          variantId: parseVariantId('variant_test_standard'),
        },
      ],
      stripePaymentIntentId: parsePaymentIntentId('pi_test_paid'),
      transitionedAt: new Date('2026-06-20T15:00:00.000Z'),
    });

    expect(result.kind).toBe('transitioned');
    expect(state.batchCalls).toBe(1);
    expect(state.orders.get('cs_test_paid')).toMatchObject({
      paidAt: '2026-06-20T15:00:00.000Z',
      status: 'paid',
      stripePaymentIntentId: 'pi_test_paid',
    });
    expect(state.stocks.get('variant_test_standard')).toMatchObject({
      onlineQuantity: 4,
      quantity: 4,
    });
    expect([...state.stockChanges.values()]).toEqual([
      expect.objectContaining({
        actorEmail: 'stripe-webhook',
        quantityDelta: -1,
        reason: 'checkout_paid',
        variantId: 'variant_test_standard',
      }),
    ]);
  });

  it('treats an already-paid checkout as replay without decrementing stock again', async () => {
    const state = createState({
      order: {
        paidAt: '2026-06-20T15:00:00.000Z',
        status: 'paid',
        stripePaymentIntentId: 'pi_test_paid',
      },
      stock: {
        onlineQuantity: 4,
        quantity: 4,
      },
    });
    const repository = new D1PaidCheckoutFinalizationRepository(createFakeD1Database(state));

    const result = await repository.finalizePaidCheckout({
      checkoutSessionId: parseCheckoutSessionId('cs_test_paid'),
      lineItems: [
        {
          quantity: createCartQuantity(1),
          variantId: parseVariantId('variant_test_standard'),
        },
      ],
      stripePaymentIntentId: parsePaymentIntentId('pi_test_paid'),
      transitionedAt: new Date('2026-06-20T15:05:00.000Z'),
    });

    expect(result.kind).toBe('replay');
    expect(state.batchCalls).toBe(0);
    expect(state.stocks.get('variant_test_standard')).toMatchObject({
      onlineQuantity: 4,
      quantity: 4,
    });
    expect(state.stockChanges.size).toBe(0);
  });

  it('returns stock_unavailable without mutating stock or order state', async () => {
    const state = createState({
      stock: {
        onlineQuantity: 0,
        quantity: 0,
      },
    });
    const repository = new D1PaidCheckoutFinalizationRepository(createFakeD1Database(state));

    const result = await repository.finalizePaidCheckout({
      checkoutSessionId: parseCheckoutSessionId('cs_test_paid'),
      lineItems: [
        {
          quantity: createCartQuantity(1),
          variantId: parseVariantId('variant_test_standard'),
        },
      ],
      stripePaymentIntentId: parsePaymentIntentId('pi_test_paid'),
      transitionedAt: new Date('2026-06-20T15:00:00.000Z'),
    });

    expect(result).toMatchObject({
      kind: 'stock_unavailable',
      reason: 'Paid checkout cannot decrement unavailable stock.',
    });
    expect(state.batchCalls).toBe(0);
    expect(state.orders.get('cs_test_paid')).toMatchObject({
      paidAt: null,
      status: 'pending_payment',
      stripePaymentIntentId: null,
    });
    expect(state.stocks.get('variant_test_standard')).toMatchObject({
      onlineQuantity: 0,
      quantity: 0,
    });
    expect(state.stockChanges.size).toBe(0);
  });
});

function createState(
  input: {
    order?: Partial<FakeCheckoutOrderRow>;
    stock?: Partial<FakeStockRow>;
  } = {},
): FakeD1State {
  const order = {
    checkoutSessionId: 'cs_test_paid',
    createdAt: '2026-06-20T14:59:00.000Z',
    id: 'order_test_paid',
    needsReviewAt: null,
    notPaidAt: null,
    paidAt: null,
    shippingLockerCountryCode: null,
    shippingLockerId: null,
    shippingLockerNameOrLabel: null,
    status: 'pending_payment',
    statusUpdatedAt: '2026-06-20T14:59:00.000Z',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    stripePaymentIntentId: null,
    updatedAt: '2026-06-20T14:59:00.000Z',
    variantId: 'variant_test_standard',
    ...input.order,
  } satisfies FakeCheckoutOrderRow;

  const stock = {
    createdAt: '2026-06-20T14:00:00.000Z',
    onlineQuantity: 5,
    quantity: 5,
    updatedAt: '2026-06-20T14:00:00.000Z',
    variantId: 'variant_test_standard',
    ...input.stock,
  } satisfies FakeStockRow;

  return {
    batchCalls: 0,
    lines: [
      {
        createdAt: '2026-06-20T14:59:00.000Z',
        id: 'line_test_paid',
        orderId: 'order_test_paid',
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePriceId: 'price_test_standard',
        variantId: 'variant_test_standard',
      },
    ],
    orders: new Map([[order.checkoutSessionId, order]]),
    stockChanges: new Map(),
    stocks: new Map([[stock.variantId, stock]]),
  };
}

function createFakeD1Database(state: FakeD1State): D1Database {
  return {
    batch: async (statements: D1PreparedStatement[]) => {
      state.batchCalls += 1;

      return statements.map((statement) => (statement as unknown as FakeD1Statement).executeBatch());
    },
    prepare: (sql: string) => new FakeD1Statement(state, sql) as unknown as D1PreparedStatement,
  } as D1Database;
}

class FakeD1Statement {
  private params: unknown[] = [];

  public constructor(
    private readonly state: FakeD1State,
    private readonly sql: string,
  ) {}

  public all<T>(): Promise<D1Result<T>> {
    if (this.sql.includes('FROM "CheckoutOrderLine"')) {
      const [orderId] = this.params;

      return Promise.resolve({
        results: this.state.lines.filter((line) => line.orderId === orderId) as T[],
        success: true,
      } as D1Result<T>);
    }

    throw new Error(`Unhandled fake D1 all SQL: ${this.sql}`);
  }

  public bind(...params: unknown[]): this {
    this.params = params;

    return this;
  }

  public executeBatch(): D1Result {
    if (this.sql.startsWith('INSERT OR IGNORE INTO "StockChange"')) {
      return createD1Result(this.insertStockChange());
    }

    if (this.sql.startsWith('UPDATE "Stock"')) {
      return createD1Result(this.updateStock());
    }

    if (this.sql.startsWith('UPDATE "CheckoutOrder"')) {
      return createD1Result(this.updateCheckoutOrder());
    }

    throw new Error(`Unhandled fake D1 batch SQL: ${this.sql}`);
  }

  public first<T>(): Promise<T | null> {
    if (this.sql.includes('FROM "CheckoutOrder"')) {
      const [checkoutSessionId] = this.params;

      return Promise.resolve((this.state.orders.get(String(checkoutSessionId)) as T | undefined) ?? null);
    }

    if (this.sql.includes('FROM "StockChange"')) {
      const [id] = this.params;

      return Promise.resolve((this.state.stockChanges.get(String(id)) as T | undefined) ?? null);
    }

    if (this.sql.includes('FROM "Stock"')) {
      const [variantId] = this.params;

      return Promise.resolve((this.state.stocks.get(String(variantId)) as T | undefined) ?? null);
    }

    throw new Error(`Unhandled fake D1 first SQL: ${this.sql}`);
  }

  private allStockChangesExist(params: unknown[]): boolean {
    return params.every((stockChangeId) => this.state.stockChanges.has(String(stockChangeId)));
  }

  private allStockIsAvailable(params: unknown[]): boolean {
    for (let index = 0; index < params.length; index += 3) {
      const variantId = String(params[index]);
      const quantity = Number(params[index + 1]);
      const stock = this.state.stocks.get(variantId);

      if (!stock || stock.quantity < quantity || stock.onlineQuantity < quantity) {
        return false;
      }
    }

    return true;
  }

  private insertStockChange(): number {
    const [
      id,
      variantId,
      quantityDelta,
      reason,
      notes,
      actorEmail,
      recordedAt,
      checkoutSessionId,
      expectedStatus,
      ...availabilityParams
    ] = this.params;
    const order = this.state.orders.get(String(checkoutSessionId));

    if (
      !order ||
      order.status !== expectedStatus ||
      this.state.stockChanges.has(String(id)) ||
      !this.allStockIsAvailable(availabilityParams)
    ) {
      return 0;
    }

    this.state.stockChanges.set(String(id), {
      actorEmail: String(actorEmail),
      id: String(id),
      notes: notes === null ? null : String(notes),
      quantityDelta: Number(quantityDelta),
      reason: String(reason),
      recordedAt: String(recordedAt),
      variantId: String(variantId),
    });

    return 1;
  }

  private updateCheckoutOrder(): number {
    const [
      status,
      statusUpdatedAt,
      paidAt,
      paymentIntentId,
      updatedAt,
      checkoutSessionId,
      expectedStatus,
      ...stockChangeIds
    ] = this.params;
    const order = this.state.orders.get(String(checkoutSessionId));

    if (!order || order.status !== expectedStatus || !this.allStockChangesExist(stockChangeIds)) {
      return 0;
    }

    order.status = status as FakeCheckoutOrderRow['status'];
    order.statusUpdatedAt = String(statusUpdatedAt);
    order.paidAt = String(paidAt);
    order.stripePaymentIntentId = paymentIntentId === null ? order.stripePaymentIntentId : String(paymentIntentId);
    order.updatedAt = String(updatedAt);

    return 1;
  }

  private updateStock(): number {
    const [quantity, onlineQuantity, updatedAt, variantId, checkoutSessionId, expectedStatus, ...stockChangeIds] =
      this.params;
    const order = this.state.orders.get(String(checkoutSessionId));
    const stock = this.state.stocks.get(String(variantId));

    if (!order || order.status !== expectedStatus || !stock || !this.allStockChangesExist(stockChangeIds)) {
      return 0;
    }

    stock.quantity -= Number(quantity);
    stock.onlineQuantity -= Number(onlineQuantity);
    stock.updatedAt = String(updatedAt);

    return 1;
  }
}

function createD1Result(changes: number): D1Result {
  return {
    meta: {
      changed_db: changes > 0,
      changes,
      duration: 0,
      last_row_id: 0,
      rows_read: 0,
      rows_written: changes,
      served_by: 'fake-d1',
      size_after: 0,
    },
    results: [],
    success: true,
  } as D1Result;
}
