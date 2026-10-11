import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

import { readCheckoutOrder, readRecentCheckoutOrders } from './';
import type { CheckoutOrderRecord, OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import { currentPaidCheckoutOrder } from '../../../../test/fixtures/current-paid-checkout-order';
import { checkoutSessionId, paymentIntentId } from '../../../../test/support/commerce-value-objects';

describe('order readback use cases', () => {
  const shippingLocker = {
    country_code: 'GR' as const,
    locker_id: '4',
    locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
  };
  const paidOrder: CheckoutOrderRecord = {
    ...currentPaidCheckoutOrder(),
    checkoutSessionId: checkoutSessionId('cs_old_paid'),
    createdAt: new Date('2026-04-25T10:00:00.000Z'),
    shippingLocker,
    stripePaymentIntentId: paymentIntentId('pi_test_paid'),
  };
  const reviewOrder: CheckoutOrderRecord = {
    ...paidOrder,
    checkoutSessionId: checkoutSessionId('cs_new_review'),
    createdAt: new Date('2026-04-25T11:00:00.000Z'),
    status: 'needs_review',
    paidAt: null,
    stripePaymentIntentId: null,
  };
  let orders: Mocked<OrderStateRepository>;

  beforeEach(() => {
    orders = {
      createPending: vi.fn(),
      findByCheckoutSessionId: vi.fn().mockResolvedValue(paidOrder),
      listRecent: vi.fn(),
      saveTransition: vi.fn(),
    };
  });

  it('reads one checkout order by checkout session id', async () => {
    const result = await readCheckoutOrder(orders, 'cs_old_paid');
    expect(result).toBe(paidOrder);
    expect(result).toMatchObject({
      checkoutSessionId: 'cs_old_paid',
      shippingLocker,
      status: 'paid',
      stripePaymentIntentId: 'pi_test_paid',
    });
    expect(orders.findByCheckoutSessionId).toHaveBeenCalledWith(paidOrder.checkoutSessionId);
  });

  it('forwards a recent read with omitted status and preserves repository order', async () => {
    const records = [reviewOrder, paidOrder];
    orders.listRecent.mockResolvedValue(records);
    const result = await readRecentCheckoutOrders(orders, { limit: 2 });
    expect(result).toBe(records);
    expect(result).toMatchObject([
      { checkoutSessionId: 'cs_new_review', status: 'needs_review' },
      { checkoutSessionId: 'cs_old_paid', status: 'paid' },
    ]);
    expect(orders.listRecent).toHaveBeenCalledWith({ limit: 2, status: null });
  });

  it('forwards the selected status and returns the repository result', async () => {
    const records = [reviewOrder];
    orders.listRecent.mockResolvedValue(records);
    const result = await readRecentCheckoutOrders(orders, { limit: 10, status: 'needs_review' });
    expect(result).toBe(records);
    expect(result).toMatchObject([{ checkoutSessionId: 'cs_new_review', status: 'needs_review' }]);
    expect(orders.listRecent).toHaveBeenCalledWith({ limit: 10, status: 'needs_review' });
  });
});
