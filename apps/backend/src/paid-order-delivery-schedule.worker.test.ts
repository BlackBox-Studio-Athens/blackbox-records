import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import worker from './index';
import { runPaidOrderDeliverySchedule } from './application/commerce/orders/run-paid-order-delivery-schedule';

describe('paid order delivery schedule', () => {
  it('exports one scheduled handler and treats an empty delivery queue as a no-op', async () => {
    expect(worker.scheduled).toBeTypeOf('function');

    await expect(runPaidOrderDeliverySchedule(env, new Date('2026-09-01T10:30:00.000Z'))).resolves.toEqual([]);
  });

  it.each([0, 3, 6])(
    'shares five rows with %i paid deliveries first and preserves the paid results',
    async (paidCount) => {
      const timestamp = '2026-09-01T10:00:00.000Z';
      const statements: D1PreparedStatement[] = [];
      const prefix = crypto.randomUUID();
      for (const [kind, count] of [
        ['paid', paidCount],
        ['notice', 6],
      ] as const) {
        for (let index = 0; index < count; index += 1) {
          const id = `${prefix}-${kind}-${index}`;
          statements.push(
            env.COMMERCE_DB.prepare(
              `INSERT INTO "CheckoutOrder"
            ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "status", "statusUpdatedAt",
             "createdAt", "updatedAt", "paidAt", "amountTotalMinor", "currencyCode", "newsletterOptIn", "recipientName",
             "shopperEmail", "shippingAddressCity", "shippingAddressCountryCode", "shippingAddressLine1", "shippingAddressPostalCode")
            VALUES (?, 'schedule-item', 'variant_schedule', ?, ?, 'paid', ?, ?, ?, ?, 2500, 'EUR', 0,
                    'Schedule Buyer', 'buyer@example.com', 'Athens', 'GR', 'Test Street 1', '10558')`,
            ).bind(id, `cs_test_${id.replaceAll('-', '_')}`, timestamp, timestamp, timestamp, timestamp, timestamp),
            env.COMMERCE_DB.prepare(
              `INSERT INTO "CheckoutOrderLine"
            ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "displayName", "unitAmountMinor",
             "lineAmountMinor", "createdAt", "preorderStartedAt", "preorderShipMonth")
            VALUES (?, ?, 'schedule-item', 'variant_schedule', 'price_schedule', 1, 'Schedule Vinyl', 2500, 2500, ?, ?, '2026-10')`,
            ).bind(id, id, timestamp, timestamp),
            kind === 'paid'
              ? env.COMMERCE_DB.prepare(
                  `INSERT INTO "PaidOrderDelivery"
                ("id", "orderId", "kind", "status", "nextAttemptAt", "createdAt", "updatedAt")
                VALUES (?, ?, 'shopper_confirmation', 'pending', ?, ?, ?)`,
                ).bind(id, id, timestamp, timestamp, timestamp)
              : env.COMMERCE_DB.prepare(
                  `INSERT INTO "PreorderEstimateDelivery"
                ("id", "orderId", "variantId", "shipMonth", "status", "nextAttemptAt", "createdAt", "updatedAt")
                VALUES (?, ?, 'variant_schedule', '2026-11', 'pending', ?, ?, ?)`,
                ).bind(id, id, timestamp, timestamp, timestamp),
          );
        }
      }
      await env.COMMERCE_DB.batch(statements);
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});
      try {
        const paidProcessed = Math.min(5, paidCount);
        const results = await runPaidOrderDeliverySchedule(
          {
            ...env,
            PRODUCT_ENVIRONMENT: 'LOCAL',
            RESEND_API_KEY: 're_mock_blackbox_local',
          },
          new Date('2026-09-01T10:30:00.000Z'),
        );
        expect(results).toHaveLength(paidProcessed);
        expect(
          results.every((result) => result.kind === 'delivered' && result.deliveryId.startsWith(`${prefix}-paid-`)),
        ).toBe(true);
        const paidLog = info.mock.calls.find(([record]) => record.event === 'paid_order_delivery_schedule_outcome')![0];
        const noticeLog = info.mock.calls.find(
          ([record]) => record.event === 'preorder_estimate_notice_schedule_outcome',
        )![0];
        expect(paidLog).toMatchObject({
          processedCount: paidProcessed,
          deliveredCount: paidProcessed,
          status: 'completed',
        });
        expect(noticeLog).toMatchObject({
          processedCount: 5 - paidProcessed,
          deliveredCount: 5 - paidProcessed,
          status: 'completed',
        });
        expect(info.mock.calls.indexOf(info.mock.calls.find(([record]) => record === paidLog)!)).toBeLessThan(
          info.mock.calls.indexOf(info.mock.calls.find(([record]) => record === noticeLog)!),
        );
        for (const [table, expected] of [
          ['PaidOrderDelivery', paidProcessed],
          ['PreorderEstimateDelivery', 5 - paidProcessed],
        ] as const) {
          const rows = await env.COMMERCE_DB.prepare(
            `SELECT "status", "attemptCount", "leaseUntil" FROM "${table}" WHERE "id" LIKE ?`,
          )
            .bind(`${prefix}%`)
            .all<{ status: string; attemptCount: number; leaseUntil: string | null }>();
          expect(rows.results.filter((row) => row.status === 'delivered')).toHaveLength(expected);
          expect(
            rows.results
              .filter((row) => row.status === 'pending')
              .every((row) => row.attemptCount === 0 && row.leaseUntil === null),
          ).toBe(true);
        }
      } finally {
        info.mockRestore();
        await env.COMMERCE_DB.batch(
          ['PaidOrderDelivery', 'PreorderEstimateDelivery', 'CheckoutOrderLine', 'CheckoutOrder'].map((table) =>
            env.COMMERCE_DB.prepare(`DELETE FROM "${table}" WHERE "id" LIKE ?`).bind(`${prefix}%`),
          ),
        );
      }
    },
  );

  it('sends a due availability alert only after order email and in the rows order email left', async () => {
    const id = crypto.randomUUID().slice(0, 8);
    const variantId = `variant_schedule_alert_${id}`;
    const timestamp = '2026-09-01T09:00:00.000Z';
    const bindings = { ...env, PRODUCT_ENVIRONMENT: 'LOCAL' as const, RESEND_API_KEY: 're_mock_blackbox_local' };
    await env.COMMERCE_DB.batch([
      env.COMMERCE_DB.prepare(
        `INSERT INTO "StoreItemOption" ("id", "storeItemSlug", "sourceKind", "sourceId", "variantId", "productProjection",
           "catalogAvailability", "createdAt", "updatedAt") VALUES (?, ?, 'release', ?, ?, ?, 'published', ?, ?)`,
      ).bind(
        variantId,
        `schedule-alert-${id}`,
        variantId,
        variantId,
        '{"name":"Schedule Alert LP"}',
        timestamp,
        timestamp,
      ),
      env.COMMERCE_DB.prepare(
        `INSERT INTO "ItemAvailability" ("id", "variantId", "status", "canBuy", "updatedAt") VALUES (?, ?, 'available', 1, ?)`,
      ).bind(variantId, variantId, timestamp),
      env.COMMERCE_DB.prepare(
        `INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "revision", "createdAt", "updatedAt")
         VALUES (?, ?, 2, 2, 0, ?, ?)`,
      ).bind(variantId, variantId, timestamp, timestamp),
      env.COMMERCE_DB.prepare(
        `INSERT INTO "AvailabilityAlert" ("id", "variantId", "email", "consentCopyVersion", "consentedAt", "nextAttemptAt",
           "createdAt", "updatedAt") VALUES (?, ?, 'waiting@example.com', 'v1', ?, ?, ?, ?)`,
      ).bind(variantId, variantId, timestamp, timestamp, timestamp, timestamp),
    ]);
    // Park alerts other tests left so this run can only claim the one seeded here.
    await env.COMMERCE_DB.prepare(
      `UPDATE "AvailabilityAlert" SET "nextAttemptAt" = '9999-01-01T00:00:00.000Z' WHERE "id" <> ?`,
    )
      .bind(variantId)
      .run();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      await runPaidOrderDeliverySchedule(bindings, new Date('2026-09-01T10:30:00.000Z'), {
        itemNames: async (slug) =>
          slug === `schedule-alert-${id}` ? { title: 'Schedule Alert', artist: 'Tester' } : null,
      });
      const events = info.mock.calls.map(([record]) => record.event);
      expect(events.indexOf('availability_alert_schedule_outcome')).toBeGreaterThan(
        events.indexOf('preorder_estimate_notice_schedule_outcome'),
      );
      const outcome = info.mock.calls.find(([record]) => record.event === 'availability_alert_schedule_outcome')![0];
      expect(outcome).toMatchObject({ status: 'completed' });
      expect(JSON.stringify(info.mock.calls)).not.toContain('waiting@example.com');
      const remaining = await env.COMMERCE_DB.prepare(
        'SELECT COUNT(*) AS "count" FROM "AvailabilityAlert" WHERE "id" = ?',
      )
        .bind(variantId)
        .first<{ count: number }>('count');
      expect(outcome).toMatchObject({ deliveredCount: 1, budgetExhausted: false });
      expect(remaining).toBe(0);
    } finally {
      info.mockRestore();
      await env.COMMERCE_DB.batch(
        ['AvailabilityAlert', 'Stock', 'ItemAvailability', 'StoreItemOption'].map((table) =>
          env.COMMERCE_DB.prepare(`DELETE FROM "${table}" WHERE "id" = ?`).bind(variantId),
        ),
      );
    }
  });
});
