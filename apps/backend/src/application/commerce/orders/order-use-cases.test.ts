import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CheckoutOrderNotFoundError,
  createPendingCheckoutOrder,
  InvalidOrderTransitionError,
  readCheckoutOrder,
  readRecentCheckoutOrders,
  transitionCheckoutOrder,
} from './';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
  OrderStatus,
} from '../../../domain/commerce/repositories/spi';
import { EMPTY_PAID_CHECKOUT_ORDER_FIELDS } from '../../../domain/commerce/repositories/spi';
import { isAwaitingStock } from './read-checkout-order';
import { currentPaidCheckoutOrder } from '../../../../test/fixtures/current-paid-checkout-order';
import { createStockQuantity } from '../../../domain/commerce';
import { readStoreListingPrices } from '../checkout/readers';
import {
  checkoutSessionId,
  paymentIntentId,
  storeItemSlug,
  variantId,
} from '../../../../test/support/commerce-value-objects';

class InMemoryOrderStateRepository implements OrderStateRepository {
  public readonly records = new Map<string, CheckoutOrderRecord>();
  public saveTransitionCalls = 0;

  public async createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord> {
    const createdAt = input.createdAt ?? new Date('2026-04-25T10:00:00.000Z');
    const record: CheckoutOrderRecord = {
      ...EMPTY_PAID_CHECKOUT_ORDER_FIELDS,
      checkoutSessionId: input.checkoutSessionId,
      checkoutExpiresAt: input.checkoutExpiresAt ?? new Date(createdAt.getTime() + 30 * 60 * 1000),
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
    };

    this.records.set(input.checkoutSessionId, record);

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

describe('order lifecycle use cases', () => {
  it('derives awaiting stock only from paid lines matching a current open cycle', () => {
    const order = currentPaidCheckoutOrder();
    const cycle = '2026-09-01T00:00:00.000Z';
    order.lines[0]!.preorder = { startedAt: cycle, shipEstimate: null };
    const stock = {
      revision: 0,
      variantId: order.lines[0]!.variantId,
      quantity: createStockQuantity(0),
      onlineQuantity: createStockQuantity(0),
      zeroStockState: 'sold_out' as const,
      expectedMonth: null,
      showLowStock: false,
      preorder: { startedAt: cycle, shipEstimate: { kind: 'month' as const, month: '2000-01', part: null } },
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    };
    expect(isAwaitingStock(order, [stock])).toBe(true);
    expect(isAwaitingStock(order, [])).toBe(false);
    expect(isAwaitingStock(order, [{ ...stock, preorder: { ...stock.preorder, startedAt: 'new-cycle' } }])).toBe(false);
    expect(isAwaitingStock(order, [{ ...stock, variantId: variantId('variant_other') }])).toBe(false);
    expect(isAwaitingStock({ ...order, status: 'pending_payment' }, [stock])).toBe(false);
    expect(isAwaitingStock({ ...order, lines: [] }, [stock])).toBe(false);
  });

  it('closes a depleted open pre-order for shoppers while its paid order still awaits stock', async () => {
    const order = currentPaidCheckoutOrder();
    const cycle = '2026-09-01T00:00:00.000Z';
    const shipEstimate = { kind: 'month' as const, month: '2026-11', part: null };
    order.lines[0]!.preorder = { startedAt: cycle, shipEstimate };
    const stock = {
      revision: 0,
      variantId: order.lines[0]!.variantId,
      quantity: createStockQuantity(0),
      onlineQuantity: createStockQuantity(0),
      zeroStockState: 'coming_soon' as const,
      expectedMonth: null,
      showLowStock: false,
      preorder: { startedAt: cycle, shipEstimate },
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    };
    const snapshots = {
      listForListingPricePresentation: async () => [
        {
          amountMinor: 2800,
          currencyCode: 'EUR',
          freshUntil: new Date('2026-10-01T00:00:00.000Z'),
          priceActive: true,
          productActive: true,
          storeItemSlug: storeItemSlug('anarchotribal-vinyl'),
          availability: { status: 'available' as const, canBuy: true },
          stock,
        },
      ],
    };
    const now = new Date('2026-10-07T10:00:00.000Z');

    const [record] = await readStoreListingPrices(snapshots, undefined, now);
    expect(record).toMatchObject({ availabilityState: 'coming_soon', preorder: null });
    await expect(readStoreListingPrices(snapshots, 'preorders', now)).resolves.toEqual([]);
    expect(isAwaitingStock(order, [stock])).toBe(true);
  });

  it('passes the awaiting filter and combined search options to persistence', async () => {
    const listRecent = vi.fn().mockResolvedValue([]);
    const query = {
      limit: 26,
      awaitingStock: true,
      status: 'paid' as const,
      q: 'Buyer',
      notification: 'pending' as const,
    };
    const repository = new InMemoryOrderStateRepository();
    repository.listRecent = listRecent;
    await expect(readRecentCheckoutOrders(repository, query)).resolves.toEqual([]);
    expect(listRecent).toHaveBeenCalledWith(query);
  });
  const shippingLocker = {
    country_code: 'GR' as const,
    locker_id: '4',
    locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
  };
  const primaryCheckoutSessionId = checkoutSessionId('cs_test_123');
  const primaryStoreItemSlug = storeItemSlug('disintegration-black-vinyl-lp');
  const primaryVariantId = variantId('variant_disintegration-black-vinyl-lp_standard');
  let orders: InMemoryOrderStateRepository;

  beforeEach(() => {
    orders = new InMemoryOrderStateRepository();
  });

  it('creates and reads a pending checkout order by checkout session id', async () => {
    const createdAt = new Date('2026-04-25T10:00:00.000Z');

    await expect(
      createPendingCheckoutOrder(orders, {
        checkoutSessionId: primaryCheckoutSessionId,
        createdAt,
        shippingLocker,
        storeItemSlug: primaryStoreItemSlug,
        variantId: primaryVariantId,
      }),
    ).resolves.toMatchObject({
      checkoutSessionId: primaryCheckoutSessionId,
      shippingLocker,
      status: 'pending_payment',
      statusUpdatedAt: createdAt,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    await expect(readCheckoutOrder(orders, primaryCheckoutSessionId)).resolves.toMatchObject({
      checkoutSessionId: primaryCheckoutSessionId,
      status: 'pending_payment',
    });
  });

  it('transitions a pending order to paid and records payment metadata', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: primaryCheckoutSessionId,
      shippingLocker,
      storeItemSlug: primaryStoreItemSlug,
      variantId: primaryVariantId,
    });

    const transitionedAt = new Date('2026-04-25T11:00:00.000Z');

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: primaryCheckoutSessionId,
        stripePaymentIntentId: paymentIntentId('pi_test_123'),
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
      checkoutSessionId: primaryCheckoutSessionId,
      shippingLocker,
      storeItemSlug: primaryStoreItemSlug,
      variantId: primaryVariantId,
    });
    await transitionCheckoutOrder(orders, {
      checkoutSessionId: primaryCheckoutSessionId,
      toStatus: 'paid',
      transitionedAt: new Date('2026-04-25T11:00:00.000Z'),
    });
    orders.saveTransitionCalls = 0;

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: primaryCheckoutSessionId,
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
      checkoutSessionId: primaryCheckoutSessionId,
      shippingLocker,
      storeItemSlug: primaryStoreItemSlug,
      variantId: primaryVariantId,
    });
    await transitionCheckoutOrder(orders, {
      checkoutSessionId: primaryCheckoutSessionId,
      toStatus: 'paid',
    });
    orders.saveTransitionCalls = 0;

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: primaryCheckoutSessionId,
        toStatus: 'not_paid',
      }),
    ).rejects.toBeInstanceOf(InvalidOrderTransitionError);
    expect(orders.saveTransitionCalls).toBe(0);
  });

  it('rejects browser read-path transition attempts', async () => {
    await createPendingCheckoutOrder(orders, {
      checkoutSessionId: primaryCheckoutSessionId,
      shippingLocker,
      storeItemSlug: primaryStoreItemSlug,
      variantId: primaryVariantId,
    });

    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: primaryCheckoutSessionId,
        origin: 'browser_read',
        toStatus: 'paid',
      }),
    ).rejects.toBeInstanceOf(InvalidOrderTransitionError);
  });

  it('throws a not-found error for unknown checkout sessions', async () => {
    await expect(
      transitionCheckoutOrder(orders, {
        checkoutSessionId: checkoutSessionId('cs_missing'),
        toStatus: 'paid',
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderNotFoundError);
  });
});
