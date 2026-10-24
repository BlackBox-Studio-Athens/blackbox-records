import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInternalOrderServices } from '../../../src/application/commerce/orders/internal-order-services';
import { runPaidOrderDeliverySchedule } from '../../../src/application/commerce/orders/run-paid-order-delivery-schedule';

const at = new Date('2026-10-17T10:00:00.000Z');
const bindings = {
  ...env,
  PRODUCT_ENVIRONMENT: 'UAT' as const,
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
};
afterEach(() => vi.restoreAllMocks());

async function seedOrder() {
  const id = crypto.randomUUID();
  const checkoutSessionId = `cs_test_${id.replaceAll('-', '_')}`;
  const timestamp = at.toISOString();
  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare(
      `INSERT INTO "CheckoutOrder"
      ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "status", "statusUpdatedAt",
       "createdAt", "updatedAt", "paidAt", "amountTotalMinor", "currencyCode", "newsletterOptIn", "recipientName",
       "shopperEmail", "shippingAddressCity", "shippingAddressCountryCode", "shippingAddressLine1", "shippingAddressPostalCode")
      VALUES (?, 'shipping-item', 'variant_shipping', ?, ?, 'paid', ?, ?, ?, ?, 2500, 'EUR', 0,
              'Shipping Buyer', 'buyer@example.com', 'Athens', 'GR', 'Test Street 1', '10558')`,
    ).bind(id, checkoutSessionId, timestamp, timestamp, timestamp, timestamp, timestamp),
    env.COMMERCE_DB.prepare(
      `INSERT INTO "CheckoutOrderLine"
      ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "displayName", "unitAmountMinor", "lineAmountMinor", "createdAt")
      VALUES (?, ?, 'shipping-item', 'variant_shipping', 'price_shipping', 1, 'Shipping LP', 2500, 2500, ?)`,
    ).bind(id, id, timestamp),
  ]);
  return { id, checkoutSessionId };
}

const mark = (shipped: boolean) => ({ shipped, expectedShipped: !shipped, operatorEmail: 'ops@example.com', at });
const retryAt = new Date(at.getTime() + 15 * 60 * 1000);

describe('shipping email from the dispatch service', () => {
  it('never sends or queues after an explicit skip, scheduled recovery, response retry or undo/re-mark', async () => {
    const { id, checkoutSessionId } = await seedOrder();
    const before = await env.COMMERCE_DB.prepare('SELECT * FROM "CheckoutOrder" WHERE "id" = ?').bind(id).first();
    const send = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 'must_not_send' }));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const services = createInternalOrderServices(bindings);
    try {
      expect(await services.setDispatch(checkoutSessionId, { ...mark(true), sendShippingEmail: false })).toMatchObject({
        kind: 'updated',
        read: { dispatch: { shippedAt: at.toISOString(), shippingEmailSuppressed: true }, deliveries: [] },
      });
      expect(await services.setDispatch(checkoutSessionId, mark(true))).toEqual({ kind: 'conflict' });
      await runPaidOrderDeliverySchedule(bindings, retryAt);
      await services.setDispatch(checkoutSessionId, mark(false));
      await services.setDispatch(checkoutSessionId, { ...mark(true), sendShippingEmail: true });
      await runPaidOrderDeliverySchedule(bindings, retryAt);
      expect(await services.readCheckoutOrder(checkoutSessionId)).toMatchObject({
        dispatch: { shippedAt: at.toISOString(), shippingEmailSuppressed: true },
        deliveries: [],
      });
      expect(send).not.toHaveBeenCalled();
      expect(await env.COMMERCE_DB.prepare('SELECT * FROM "CheckoutOrder" WHERE "id" = ?').bind(id).first()).toEqual(
        before,
      );
    } finally {
      await services.disconnect();
    }
  });

  it('sends once after a mark, including response retries and undo/re-mark, without changing paid facts', async () => {
    const { id, checkoutSessionId } = await seedOrder();
    const before = await env.COMMERCE_DB.prepare('SELECT * FROM "CheckoutOrder" WHERE "id" = ?').bind(id).first();
    const send = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 'shipping_message' }));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const services = createInternalOrderServices(bindings);
    try {
      const result = await services.setDispatch(checkoutSessionId, mark(true));
      expect(result).toMatchObject({
        kind: 'updated',
        read: {
          dispatch: { shippedAt: at.toISOString() },
          deliveries: [{ kind: 'shopper_shipping', status: 'delivered', attemptCount: 1 }],
        },
      });
      expect(send).toHaveBeenCalledTimes(1);
      const message = JSON.parse(String(send.mock.calls[0]![1]?.body));
      expect(message.to).toBe('uat-sink@ambkime.resend.app');
      expect(message.subject).toMatch(/^Your order has been shipped · /);
      expect(await services.setDispatch(checkoutSessionId, mark(true))).toEqual({ kind: 'conflict' });
      expect(await services.setDispatch(checkoutSessionId, mark(false))).toMatchObject({ kind: 'updated' });
      expect(await services.setDispatch(checkoutSessionId, mark(true))).toMatchObject({ kind: 'updated' });
      expect(send).toHaveBeenCalledTimes(1);
      expect(await env.COMMERCE_DB.prepare('SELECT * FROM "CheckoutOrder" WHERE "id" = ?').bind(id).first()).toEqual(
        before,
      );
    } finally {
      await services.disconnect();
    }
  });

  it('keeps a failed email pending and the shipment saved, then retries with the same provider identity', async () => {
    const { checkoutSessionId } = await seedOrder();
    const send = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ name: 'rate_limit_exceeded', message: 'Try later' }, { status: 429 }))
      .mockImplementation(async () => Response.json({ id: 'shipping_retry' }));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const services = createInternalOrderServices(bindings);
    try {
      expect(await services.setDispatch(checkoutSessionId, mark(true))).toMatchObject({
        kind: 'updated',
        read: {
          dispatch: { shippedAt: at.toISOString() },
          deliveries: [{ kind: 'shopper_shipping', status: 'pending', nextAttemptAt: retryAt }],
        },
      });
      await services.setDispatch(checkoutSessionId, mark(false));
      await services.setDispatch(checkoutSessionId, mark(true));
      expect(send).toHaveBeenCalledTimes(1);
      await runPaidOrderDeliverySchedule(bindings, retryAt);
      expect(send).toHaveBeenCalledTimes(2);
      const keys = send.mock.calls.map(([, init]) => new Headers(init?.headers).get('idempotency-key'));
      expect(keys[0]).toBeTruthy();
      expect(keys[1]).toBe(keys[0]);
      expect(await services.readCheckoutOrder(checkoutSessionId)).toMatchObject({
        dispatch: { shippedAt: at.toISOString() },
        deliveries: [{ kind: 'shopper_shipping', status: 'delivered', attemptCount: 2 }],
      });
    } finally {
      await services.disconnect();
    }
  });

  it('does not send a pending email after undo and does not reopen review on re-mark', async () => {
    const { checkoutSessionId } = await seedOrder();
    const send = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        Response.json({ name: 'rate_limit_exceeded', message: 'Try later' }, { status: 429 }),
      );
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const services = createInternalOrderServices(bindings);
    try {
      await services.setDispatch(checkoutSessionId, mark(true));
      await services.setDispatch(checkoutSessionId, mark(false));
      await runPaidOrderDeliverySchedule(bindings, retryAt);
      expect(await services.readCheckoutOrder(checkoutSessionId)).toMatchObject({
        dispatch: { shippedAt: null },
        deliveries: [{ kind: 'shopper_shipping', status: 'needs_review', safeReason: 'dispatch_undone' }],
      });
      await services.setDispatch(checkoutSessionId, mark(true));
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      await services.disconnect();
    }
  });

  it('does not mark or queue an incomplete paid order', async () => {
    const { id, checkoutSessionId } = await seedOrder();
    await env.COMMERCE_DB.prepare('UPDATE "CheckoutOrder" SET "recipientName" = NULL WHERE "id" = ?').bind(id).run();
    const send = vi.spyOn(globalThis, 'fetch');
    const services = createInternalOrderServices(bindings);
    try {
      expect(await services.setDispatch(checkoutSessionId, mark(true))).toEqual({ kind: 'not_ready' });
      expect(
        (await env.COMMERCE_DB.prepare('SELECT "id" FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(id).all())
          .results,
      ).toEqual([]);
      expect(send).not.toHaveBeenCalled();
    } finally {
      await services.disconnect();
    }
  });
});
