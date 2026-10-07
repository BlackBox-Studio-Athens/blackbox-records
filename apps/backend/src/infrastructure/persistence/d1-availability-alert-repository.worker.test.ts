import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { parseVariantId } from '../../domain/commerce';
import { D1AvailabilityAlertRepository } from './d1-availability-alert-repository';

const db = env.COMMERCE_DB;
const repository = new D1AvailabilityAlertRepository(db);
const at = (iso: string) => new Date(iso);
const consent = { consentCopyVersion: 'blackbox-availability-alert-v1', consentedAt: at('2026-10-01T10:00:00.000Z') };

async function seedVariant(options: {
  quantity: number;
  held?: number;
  canBuy?: boolean;
  catalogAvailability?: 'published' | 'withheld';
  preorderShipMonth?: string;
}) {
  const id = crypto.randomUUID().slice(0, 8);
  const variantId = parseVariantId(`variant_alert_${id}`);
  const slug = `alert-item-${id}`;
  const timestamp = '2026-10-01T09:00:00.000Z';
  const statements = [
    db
      .prepare(
        `INSERT INTO "StoreItemOption" ("id", "storeItemSlug", "sourceKind", "sourceId", "variantId", "productProjection",
           "catalogAvailability", "createdAt", "updatedAt") VALUES (?, ?, 'release', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        variantId,
        slug,
        slug,
        variantId,
        JSON.stringify({ name: 'BlackBox Records - Anarchotribal - Vinyl' }),
        options.catalogAvailability ?? 'published',
        timestamp,
        timestamp,
      ),
    db
      .prepare(
        `INSERT INTO "ItemAvailability" ("id", "variantId", "status", "canBuy", "updatedAt") VALUES (?, ?, 'available', ?, ?)`,
      )
      .bind(variantId, variantId, options.canBuy === false ? 0 : 1, timestamp),
    db
      .prepare(
        `INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "zeroStockState", "preorderStartedAt",
           "preorderShipMonth", "revision", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 'coming_soon', ?, ?, 0, ?, ?)`,
      )
      .bind(
        variantId,
        variantId,
        options.quantity,
        options.quantity,
        options.preorderShipMonth ? timestamp : null,
        options.preorderShipMonth ?? null,
        timestamp,
        timestamp,
      ),
  ];
  if (options.held) {
    statements.push(
      db
        .prepare(
          `INSERT INTO "CheckoutOrder" ("id", "storeItemSlug", "variantId", "checkoutExpiresAt", "status", "statusUpdatedAt",
             "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?)`,
        )
        .bind(variantId, slug, variantId, timestamp, timestamp, timestamp, timestamp),
      db
        .prepare(
          `INSERT INTO "CheckoutOrderLine" ("id", "orderId", "storeItemSlug", "variantId", "quantity", "createdAt")
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(variantId, variantId, slug, variantId, options.held, timestamp),
    );
  }
  await db.batch(statements);
  return { variantId, slug };
}

async function request(variantId: ReturnType<typeof parseVariantId>, email: string, cap = 2_000, consentedAt?: Date) {
  return repository.request({ ...consent, ...(consentedAt ? { consentedAt } : {}), variantId, email }, cap);
}

async function clearDueAlerts() {
  // Other tests share the database; park their alerts so claims only see this test's rows.
  await db.prepare(`UPDATE "AvailabilityAlert" SET "nextAttemptAt" = '9999-01-01T00:00:00.000Z'`).run();
}

describe('D1 availability alerts', () => {
  it('keeps one alert per variant and address and refuses new addresses at the cap', async () => {
    const { variantId } = await seedVariant({ quantity: 0 });

    await expect(request(variantId, 'one@example.com', 2)).resolves.toBe('accepted');
    await expect(request(variantId, 'one@example.com', 2)).resolves.toBe('accepted');
    await expect(repository.countWaiting(variantId)).resolves.toBe(1);
    await expect(request(variantId, 'two@example.com', 2)).resolves.toBe('accepted');
    await expect(request(variantId, 'three@example.com', 2)).resolves.toBe('cap_reached');
    await expect(request(variantId, 'two@example.com', 2)).resolves.toBe('accepted');
    await expect(repository.countWaiting(variantId)).resolves.toBe(2);
    await expect(
      db
        .prepare(
          `INSERT INTO "AvailabilityAlert" ("id", "variantId", "email", "consentCopyVersion", "consentedAt",
        "nextAttemptAt", "createdAt", "updatedAt") VALUES ('upper', ?, 'Upper@Example.com', 'v', 'x', 'x', 'x', 'x')`,
        )
        .bind(variantId)
        .run(),
    ).rejects.toThrow();
  });

  it('claims the oldest alert only once its variant can be bought after pending holds', async () => {
    await clearDueAlerts();
    const now = at('2026-10-07T10:00:00.000Z');
    const lease = { claimedAt: now, leaseUntil: at('2026-10-07T10:10:00.000Z') };
    const depleted = await seedVariant({ quantity: 0 });
    const held = await seedVariant({ quantity: 2, held: 2 });
    const paused = await seedVariant({ quantity: 3, canBuy: false });
    const withheld = await seedVariant({ quantity: 3, catalogAvailability: 'withheld' });
    const ready = await seedVariant({ quantity: 3, held: 2, preorderShipMonth: '2026-11' });
    for (const variant of [depleted, held, paused, withheld])
      await request(variant.variantId, 'waiting@example.com', 2_000, at('2026-10-01T00:00:00.000Z'));
    await expect(repository.claimDue(lease)).resolves.toBeNull();

    await request(ready.variantId, 'second@example.com', 2_000, at('2026-10-02T00:00:00.000Z'));
    await request(ready.variantId, 'first@example.com', 2_000, at('2026-10-01T12:00:00.000Z'));
    const claimed = await repository.claimDue(lease);
    expect(claimed).toMatchObject({
      alert: { variantId: ready.variantId, email: 'first@example.com', attemptCount: 1, leaseUntil: lease.leaseUntil },
      storeItemSlug: ready.slug,
      availability: { status: 'available', canBuy: true },
      stock: {
        onlineQuantity: 1,
        zeroStockState: 'coming_soon',
        preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: null } },
      },
    });

    // A leased alert is skipped until its lease lapses, then reclaimed with the next attempt.
    const second = await repository.claimDue(lease);
    expect(second?.alert.email).toBe('second@example.com');
    await expect(repository.claimDue(lease)).resolves.toBeNull();
    const reclaimed = await repository.claimDue({
      claimedAt: at('2026-10-07T10:11:00.000Z'),
      leaseUntil: at('2026-10-07T10:21:00.000Z'),
    });
    expect(reclaimed?.alert).toMatchObject({ email: 'first@example.com', attemptCount: 2 });

    // Lease-guarded writes: a stale lease cannot reschedule or delete.
    await expect(repository.delete(claimed!.alert)).resolves.toBe(false);
    await expect(
      repository.reschedule({
        alert: reclaimed!.alert,
        nextAttemptAt: at('2026-10-07T11:00:00.000Z'),
        updatedAt: at('2026-10-07T10:12:00.000Z'),
        refundAttempt: true,
      }),
    ).resolves.toBe(true);
    await expect(
      db
        .prepare(
          'SELECT "status", "attemptCount", "leaseUntil", "nextAttemptAt" FROM "AvailabilityAlert" WHERE "id" = ?',
        )
        .bind(reclaimed!.alert.id)
        .first(),
    ).resolves.toEqual({
      status: 'pending',
      attemptCount: 1,
      leaseUntil: null,
      nextAttemptAt: '2026-10-07T11:00:00.000Z',
    });
    await expect(repository.delete(second!.alert)).resolves.toBe(true);
    await expect(repository.countWaiting(ready.variantId)).resolves.toBe(1);
    await clearDueAlerts();
  });

  it('counts sends per Athens day up to the budget', async () => {
    const day = `2099-0${Math.floor(Math.random() * 9) + 1}-1${Math.floor(Math.random() * 9)}`;
    await db.prepare('DELETE FROM "AvailabilityAlertSendDay" WHERE "day" = ?').bind(day).run();
    await expect(repository.reserveSend(day, 2)).resolves.toBe(true);
    await expect(repository.reserveSend(day, 2)).resolves.toBe(true);
    await expect(repository.reserveSend(day, 2)).resolves.toBe(false);
    await expect(
      db.prepare('SELECT "sentCount" FROM "AvailabilityAlertSendDay" WHERE "day" = ?').bind(day).first('sentCount'),
    ).resolves.toBe(2);
    await expect(repository.reserveSend(day, 0)).resolves.toBe(false);
  });

  it('deletes expired alerts and alerts whose fifth lease lapsed', async () => {
    const { variantId } = await seedVariant({ quantity: 0 });
    await request(variantId, 'old@example.com', 2_000, at('2025-10-01T00:00:00.000Z'));
    await request(variantId, 'fresh@example.com', 2_000, at('2026-10-01T00:00:00.000Z'));
    await request(variantId, 'failed@example.com', 2_000, at('2026-10-01T00:00:00.000Z'));
    await db
      .prepare(
        `UPDATE "AvailabilityAlert" SET "status" = 'sending', "attemptCount" = 5, "leaseUntil" = '2026-10-07T09:00:00.000Z'
         WHERE "variantId" = ? AND "email" = 'failed@example.com'`,
      )
      .bind(variantId)
      .run();

    await repository.deleteExpired({
      now: at('2026-10-07T10:00:00.000Z'),
      requestedBefore: at('2025-10-07T10:00:00.000Z'),
    });

    const { results } = await db
      .prepare('SELECT "email" FROM "AvailabilityAlert" WHERE "variantId" = ?')
      .bind(variantId)
      .all<{ email: string }>();
    expect(results.map((row) => row.email)).toEqual(['fresh@example.com']);
  });
});
