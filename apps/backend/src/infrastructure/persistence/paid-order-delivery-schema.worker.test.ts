import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('paid order delivery schema', () => {
  it('preserves existing delivery history and dispatch marks without backfilling shipping email', async () => {
    const db = env.TEST_MIGRATION_DB;
    const { results: tables } = await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`,
      )
      .all<{ name: string }>();
    for (const { name } of tables) await db.prepare(`DROP TABLE "${name}"`).run();
    const migrationIndex = env.TEST_MIGRATIONS.findIndex(({ name }) => name.startsWith('0037_'));
    expect(migrationIndex).toBeGreaterThan(0);
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, migrationIndex));
    const at = '2026-10-17T09:00:00.000Z';
    await db.batch([
      db
        .prepare(
          `INSERT INTO "CheckoutOrder" ("id", "storeItemSlug", "variantId", "checkoutExpiresAt", "status", "statusUpdatedAt", "createdAt", "updatedAt")
        VALUES ('migration_shipping_order', 'item', 'variant', ?, 'paid', ?, ?, ?)`,
        )
        .bind(at, at, at, at),
      db
        .prepare(
          `INSERT INTO "OrderDispatch" ("orderId", "shippedAt", "updatedAt", "updatedBy")
        VALUES ('migration_shipping_order', ?, ?, 'legacy@example.com')`,
        )
        .bind(at, at),
      db
        .prepare(
          `INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil", "safeReason", "createdAt", "updatedAt")
        VALUES ('migration_pending', 'migration_shipping_order', 'shopper_confirmation', 'pending', 2, ?, ?, 'rate_limited', ?, ?)`,
        )
        .bind(at, at, at, at),
      db
        .prepare(
          `INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "deliveredAt", "providerMessageId", "createdAt", "updatedAt")
        VALUES ('migration_delivered', 'migration_shipping_order', 'ops_fulfillment', 'delivered', 1, ?, 'provider_saved', ?, ?)`,
        )
        .bind(at, at, at),
      db
        .prepare(
          `INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "attemptCount", "needsReviewAt", "safeReason", "createdAt", "updatedAt")
        VALUES ('migration_review', 'migration_shipping_order', 'newsletter_registration', 'needs_review', 5, ?, 'validation', ?, ?)`,
        )
        .bind(at, at, at),
    ]);
    const before = (await db.prepare('SELECT * FROM "PaidOrderDelivery" ORDER BY "id"').all()).results;
    const dispatch = await db.prepare('SELECT * FROM "OrderDispatch"').first();

    await applyD1Migrations(db, env.TEST_MIGRATIONS);

    expect((await db.prepare('SELECT * FROM "PaidOrderDelivery" ORDER BY "id"').all()).results).toEqual(before);
    expect(await db.prepare('SELECT * FROM "OrderDispatch"').first()).toEqual(dispatch);
    await expect(
      db
        .prepare(
          `INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "nextAttemptAt", "createdAt", "updatedAt")
      VALUES ('migration_shipping', 'migration_shipping_order', 'shopper_shipping', 'pending', ?, ?, ?)`,
        )
        .bind(at, at, at)
        .run(),
    ).resolves.toBeDefined();
  });

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
