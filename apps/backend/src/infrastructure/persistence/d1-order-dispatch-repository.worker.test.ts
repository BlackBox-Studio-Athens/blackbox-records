import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { D1OrderDispatchRepository } from './d1-order-dispatch-repository';

const db = env.COMMERCE_DB;
const repo = new D1OrderDispatchRepository(db);
const at = new Date('2026-10-13T10:00:00.000Z');

async function order() {
  const id = crypto.randomUUID();
  const timestamp = at.toISOString();
  await db
    .prepare(
      `INSERT INTO "CheckoutOrder" ("id", "storeItemSlug", "variantId", "checkoutExpiresAt", "status", "statusUpdatedAt",
         "createdAt", "updatedAt") VALUES (?, 'item', 'variant', ?, 'paid', ?, ?, ?)`,
    )
    .bind(id, timestamp, timestamp, timestamp, timestamp)
    .run();
  return id;
}

describe('D1 order dispatch persistence', () => {
  it('marks once, refuses a stale second mark, and undoes with the operator recorded', async () => {
    const orderId = await order();
    const mark = { orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at };
    expect(await repo.set(mark)).toBe('updated');
    const queued = await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all();
    expect(queued.results).toEqual([
      expect.objectContaining({ kind: 'shopper_shipping', status: 'pending', attemptCount: 0 }),
    ]);
    expect(await repo.set({ ...mark, operatorEmail: 'b@example.com' })).toBe('conflict');
    expect(await repo.listByOrderIds([orderId])).toEqual([
      {
        orderId,
        shippedAt: at.toISOString(),
        updatedAt: at.toISOString(),
        updatedBy: 'a@example.com',
        shippingEmailSuppressed: false,
      },
    ]);

    const undoAt = new Date('2026-10-13T11:00:00.000Z');
    const undo = { orderId, shipped: false, expectedShipped: true, operatorEmail: 'b@example.com', at: undoAt };
    expect(await repo.set(undo)).toBe('updated');
    expect(await repo.set(undo)).toBe('conflict');
    expect(await repo.listByOrderIds([orderId])).toEqual([
      {
        orderId,
        shippedAt: null,
        updatedAt: undoAt.toISOString(),
        updatedBy: 'b@example.com',
        shippingEmailSuppressed: false,
      },
    ]);
    expect(await repo.set(mark)).toBe('updated');
    expect(
      (await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
    ).toEqual(queued.results);
  });

  it('queues only one email when two operators mark concurrently', async () => {
    const orderId = await order();
    const mark = { orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at };
    const results = await Promise.all([repo.set(mark), repo.set({ ...mark, operatorEmail: 'b@example.com' })]);
    expect(results.sort()).toEqual(['conflict', 'updated']);
    expect(
      (await db.prepare('SELECT "kind" FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
    ).toEqual([{ kind: 'shopper_shipping' }]);
  });

  it('persists an opt-out through stale requests and undo/re-mark with email requested', async () => {
    const orderId = await order();
    const mark = { orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at };
    expect(await repo.set({ ...mark, sendShippingEmail: false })).toBe('updated');
    expect(await repo.set({ ...mark, sendShippingEmail: true })).toBe('conflict');
    expect(await repo.set({ ...mark, shipped: false, expectedShipped: true })).toBe('updated');
    expect(await repo.set({ ...mark, sendShippingEmail: true })).toBe('updated');
    expect(await repo.listByOrderIds([orderId])).toEqual([
      {
        orderId,
        shippedAt: at.toISOString(),
        updatedAt: at.toISOString(),
        updatedBy: 'a@example.com',
        shippingEmailSuppressed: true,
      },
    ]);
    expect(
      (await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
    ).toEqual([]);
  });

  it('preserves an existing email and its history when a later mark asks to skip', async () => {
    const orderId = await order();
    const mark = { orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at };
    await repo.set(mark);
    const before = (await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all())
      .results;
    await repo.set({ ...mark, shipped: false, expectedShipped: true });
    await repo.set({ ...mark, sendShippingEmail: false });
    expect((await repo.listByOrderIds([orderId]))[0]?.shippingEmailSuppressed).toBe(false);
    expect(
      (await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
    ).toEqual(before);
  });

  it('retains the winning email choice when operators submit competing choices', async () => {
    const orderId = await order();
    const mark = {
      orderId,
      shipped: true,
      expectedShipped: false,
      operatorEmail: 'skip@example.com',
      at,
      sendShippingEmail: false,
    };
    const results = await Promise.all([
      repo.set(mark),
      repo.set({ ...mark, operatorEmail: 'send@example.com', sendShippingEmail: true }),
    ]);
    expect(results.sort()).toEqual(['conflict', 'updated']);
    const [dispatch] = await repo.listByOrderIds([orderId]);
    const queued = (await db.prepare('SELECT * FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all())
      .results;
    expect(dispatch?.shippingEmailSuppressed).toBe(dispatch?.updatedBy === 'skip@example.com');
    expect(queued).toHaveLength(dispatch?.shippingEmailSuppressed ? 0 : 1);
  });

  it('does not queue from a stale request against a historical shipped mark', async () => {
    const orderId = await order();
    await db
      .prepare('INSERT INTO "OrderDispatch" ("orderId", "shippedAt", "updatedAt", "updatedBy") VALUES (?, ?, ?, ?)')
      .bind(orderId, at.toISOString(), at.toISOString(), 'legacy@example.com')
      .run();
    expect(await repo.set({ orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at })).toBe(
      'conflict',
    );
    expect(
      (await db.prepare('SELECT "id" FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
    ).toEqual([]);
  });

  it('rolls back the shipped mark when its email intent cannot be saved', async () => {
    const orderId = await order();
    await db
      .prepare(
        `CREATE TRIGGER fail_shipping_queue BEFORE INSERT ON "PaidOrderDelivery"
      WHEN NEW."orderId" = '${orderId}' BEGIN SELECT RAISE(ABORT, 'forced shipping failure'); END`,
      )
      .run();
    try {
      await expect(
        repo.set({ orderId, shipped: true, expectedShipped: false, operatorEmail: 'a@example.com', at }),
      ).rejects.toThrow('forced shipping failure');
      expect(await repo.listByOrderIds([orderId])).toEqual([]);
      expect(
        (await db.prepare('SELECT "id" FROM "PaidOrderDelivery" WHERE "orderId" = ?').bind(orderId).all()).results,
      ).toEqual([]);
    } finally {
      await db.prepare('DROP TRIGGER fail_shipping_queue').run();
    }
  });

  it('refuses an undo when nothing was marked', async () => {
    const orderId = await order();
    expect(await repo.set({ orderId, shipped: false, expectedShipped: true, operatorEmail: 'a@example.com', at })).toBe(
      'conflict',
    );
    expect(await repo.listByOrderIds([orderId])).toEqual([]);
    expect(await repo.listByOrderIds([])).toEqual([]);
  });
});
