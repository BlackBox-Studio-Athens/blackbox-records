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
    expect(await repo.set({ ...mark, operatorEmail: 'b@example.com' })).toBe('conflict');
    expect(await repo.listByOrderIds([orderId])).toEqual([
      { orderId, shippedAt: at.toISOString(), updatedAt: at.toISOString(), updatedBy: 'a@example.com' },
    ]);

    const undoAt = new Date('2026-10-13T11:00:00.000Z');
    const undo = { orderId, shipped: false, expectedShipped: true, operatorEmail: 'b@example.com', at: undoAt };
    expect(await repo.set(undo)).toBe('updated');
    expect(await repo.set(undo)).toBe('conflict');
    expect(await repo.listByOrderIds([orderId])).toEqual([
      { orderId, shippedAt: null, updatedAt: undoAt.toISOString(), updatedBy: 'b@example.com' },
    ]);
    expect(await repo.set(mark)).toBe('updated');
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
