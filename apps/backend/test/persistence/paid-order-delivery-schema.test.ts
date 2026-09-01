import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('paid order delivery schema', () => {
  it('accepts the fixed pending shape and rejects invalid money, scope, kind, status, attempts, and terminal timestamps', async () => {
    const orderId = crypto.randomUUID();
    const now = new Date('2026-09-01T08:00:00.000Z').toISOString();
    await env.COMMERCE_DB.prepare(
      [
        'INSERT INTO "CheckoutOrder"',
        '  ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "status", "statusUpdatedAt", "createdAt", "updatedAt")',
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ].join('\n'),
    )
      .bind(
        orderId,
        'paid-delivery-schema-item',
        `variant_paid_delivery_schema_${crypto.randomUUID()}`,
        `cs_test_paid_delivery_schema_${crypto.randomUUID()}`,
        now,
        'pending_payment',
        now,
        now,
        now,
      )
      .run();

    await expect(
      env.COMMERCE_DB.prepare(
        'INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(crypto.randomUUID(), orderId, 'shopper_confirmation', 'pending', 0, now, now, now)
        .run(),
    ).resolves.toBeDefined();

    const invalidStatements = [
      env.COMMERCE_DB.prepare('UPDATE "CheckoutOrder" SET "currencyCode" = ? WHERE "id" = ?').bind('USD', orderId),
      env.COMMERCE_DB.prepare('UPDATE "CheckoutOrder" SET "shippingAddressCountryCode" = ? WHERE "id" = ?').bind(
        'US',
        orderId,
      ),
      env.COMMERCE_DB.prepare(
        'INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), orderId, 'generic_job', 'pending', 0, now, now, now),
      env.COMMERCE_DB.prepare(
        'INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), orderId, 'ops_fulfillment', 'processing', 0, now, now, now),
      env.COMMERCE_DB.prepare(
        'INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), orderId, 'ops_fulfillment', 'pending', 6, now, now, now),
      env.COMMERCE_DB.prepare(
        'INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), orderId, 'ops_fulfillment', 'delivered', 1, now, now),
      env.COMMERCE_DB.prepare(
        'INSERT INTO "CheckoutOrderLine" ("id", "orderId", "storeItemSlug", "variantId", "quantity", "unitAmountMinor", "lineAmountMinor", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(
        crypto.randomUUID(),
        orderId,
        'paid-delivery-schema-item',
        'variant_paid_delivery_schema_line',
        1,
        100,
        99,
        now,
      ),
    ];

    for (const statement of invalidStatements) {
      await expect(statement.run()).rejects.toThrow();
    }
  });
});
