import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { createStockChangeDelta, createStockQuantity, parseVariantId } from '../../src/domain/commerce';
import { RequestIdentityConflictError } from '../../src/domain/commerce/repositories/request-identity';
import type { RequestIdentity } from '../../src/domain/commerce/repositories/request-identity';
import { D1OperatorStockRepository } from '../../src/infrastructure/persistence/prisma/d1-operator-stock-repository';

describe('D1OperatorStockRepository idempotency', () => {
  it('applies one keyed change for concurrent identical requests', async () => {
    const variantId = parseVariantId(`variant_idempotent_change_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const input = {
      actorEmail: 'operator@example.com',
      notes: 'Received shipment',
      quantityDelta: createStockChangeDelta(2),
      reason: 'Inbound',
      requestIdentity: identity('a', 'b'),
      variantId,
    };

    const results = await Promise.all([repository.recordChange(input), repository.recordChange(input)]);

    expect(results[0]?.entry.id).toBe(results[1]?.entry.id);
    expect(results[0]?.stock.quantity).toBe(7);
    expect(results[1]?.stock.quantity).toBe(7);
    await expect(countRows('StockChange', variantId)).resolves.toBe(1);
    await expect(readStock(variantId)).resolves.toMatchObject({ quantity: 7, revision: 1 });
  });

  it('scopes the same key by actor and rejects a changed payload', async () => {
    const variantId = parseVariantId(`variant_idempotent_scope_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const first = {
      actorEmail: 'first@example.com',
      notes: null,
      quantityDelta: createStockChangeDelta(1),
      reason: 'Adjustment',
      requestIdentity: identity('c', 'd'),
      variantId,
    };

    const firstResult = await repository.recordChange(first);
    await expect(
      repository.recordChange({
        ...first,
        quantityDelta: createStockChangeDelta(2),
        requestIdentity: identity('c', 'changed'),
      }),
    ).rejects.toBeInstanceOf(RequestIdentityConflictError);
    const second = await repository.recordChange({ ...first, actorEmail: 'second@example.com' });

    expect(firstResult).not.toBeNull();
    expect(second).not.toBeNull();
    if (!firstResult || !second) return;
    expect(second.entry.id).not.toBe(firstResult.entry.id);
    expect(second.stock.quantity).toBe(7);
    await expect(countRows('StockChange', variantId)).resolves.toBe(2);
  });

  it('replays a count after the revision advances and rejects a stale first execution', async () => {
    const variantId = parseVariantId(`variant_idempotent_count_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const count = {
      actorEmail: 'operator@example.com',
      countedQuantity: createStockQuantity(5),
      expectedRevision: 0,
      notes: 'Cycle count',
      onlineQuantity: createStockQuantity(5),
      requestIdentity: identity('e', 'f'),
      variantId,
    };

    const first = await repository.recordCount(count);
    expect(first?.entry.id).toBeTruthy();

    const changed = await repository.recordChange({
      actorEmail: 'operator@example.com',
      notes: null,
      quantityDelta: createStockChangeDelta(1),
      reason: 'Adjustment',
      requestIdentity: identity('g', 'h'),
      variantId,
    });
    expect(changed?.stock.revision).toBe(2);

    const replay = await repository.recordCount(count);
    expect(replay?.entry.id).toBe(first?.entry.id);
    expect(replay?.stock).toMatchObject({ quantity: 6, revision: 2 });
    await expect(
      repository.recordCount({
        ...count,
        requestIdentity: identity('i', 'j'),
      }),
    ).resolves.toBeNull();
    await expect(countRows('StockCount', variantId)).resolves.toBe(1);
  });

  it('persists restock intent without changing quantities or stock history', async () => {
    const variantId = parseVariantId(`variant_restock_plan_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);

    const planned = await repository.setRestockPlanned({ expectedRevision: 0, restockPlanned: true, variantId });
    expect(planned).toMatchObject({
      onlineQuantity: 5,
      quantity: 5,
      restockPlanned: true,
      revision: 1,
    });
    await expect(
      repository.setRestockPlanned({ expectedRevision: 0, restockPlanned: false, variantId }),
    ).resolves.toBeNull();
    const cleared = await repository.setRestockPlanned({ expectedRevision: 1, restockPlanned: false, variantId });
    expect(cleared).toMatchObject({ restockPlanned: false, revision: 2 });
    await expect(countRows('StockChange', variantId)).resolves.toBe(0);
    await expect(countRows('StockCount', variantId)).resolves.toBe(0);
  });

  it('creates an empty stock row when restock is planned before the first count', async () => {
    const variantId = parseVariantId(`variant_restock_plan_initial_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);

    const planned = await repository.setRestockPlanned({ expectedRevision: null, restockPlanned: true, variantId });

    expect(planned).toMatchObject({
      onlineQuantity: 0,
      quantity: 0,
      restockPlanned: true,
      revision: 0,
    });
    await expect(
      repository.setRestockPlanned({ expectedRevision: null, restockPlanned: false, variantId }),
    ).resolves.toBeNull();
  });
});

function identity(key: string, fingerprint: string): RequestIdentity {
  return {
    keyDigest: key.repeat(64),
    productEnvironment: 'local',
    requestFingerprint: fingerprint.repeat(64),
  };
}

async function seedStock(variantId: string, quantity: number): Promise<void> {
  const now = new Date('2026-09-01T00:00:00.000Z').toISOString();
  await env.COMMERCE_DB.prepare(
    'INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(crypto.randomUUID(), variantId, quantity, quantity, now, now)
    .run();
}

async function readStock(variantId: string): Promise<{ quantity: number; revision: number }> {
  const row = await env.COMMERCE_DB.prepare('SELECT "quantity", "revision" FROM "Stock" WHERE "variantId" = ?')
    .bind(variantId)
    .first<{ quantity: number; revision: number }>();
  if (!row) throw new Error('Stock row missing');
  return row;
}

async function countRows(table: 'StockChange' | 'StockCount', variantId: string): Promise<number> {
  const row = await env.COMMERCE_DB.prepare(`SELECT COUNT(*) AS "count" FROM "${table}" WHERE "variantId" = ?`)
    .bind(variantId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
