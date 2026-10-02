import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { createStockChangeDelta, createStockQuantity, parseVariantId } from '../../../domain/commerce';
import { RequestIdentityConflictError } from '../../../domain/commerce/repositories/request-identity';
import type { RequestIdentity } from '../../../domain/commerce/repositories/request-identity';
import { D1OperatorStockRepository } from './d1-operator-stock-repository';
import { D1PreorderEstimateDeliveryRepository } from '../d1-preorder-estimate-delivery-repository';

describe('transactional pre-order estimate notices', () => {
  it('only notifies paid orders in the current cycle, coalesces edits and discards pending notices on end', async () => {
    const variantId = parseVariantId(`variant_preorder_notices_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const notices = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    const preorder = {
      startedAt: '2026-09-01T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2099-11', part: null },
    } as const;
    const paid = await seedPreorderOrder(variantId, preorder.startedAt);
    const secondPaid = await seedPreorderOrder(variantId, preorder.startedAt);
    for (const status of ['pending_payment', 'not_paid', 'needs_review'] as const)
      await seedPreorderOrder(variantId, preorder.startedAt, status);
    await seedPreorderOrder(variantId, '2026-08-01T10:00:00.000Z');
    await seedPreorderOrder(variantId, null);
    await seedPreorderOrder(`variant_other_${crypto.randomUUID()}`, preorder.startedAt);
    expect(await repository.setStockPreorder({ variantId, preorder, expectedRevision: null })).toMatchObject({
      revision: 0,
    });
    await expect(readNotices(variantId)).resolves.toEqual([]);
    expect(await repository.setStockPreorder({ variantId, preorder, expectedRevision: 0 })).toMatchObject({
      revision: 0,
    });
    await expect(readNotices(variantId)).resolves.toEqual([]);
    const date = { ...preorder, shipEstimate: { kind: 'date', date: '2099-11-20' } } as const;
    await expect(repository.setStockPreorder({ variantId, preorder: date, expectedRevision: 7 })).resolves.toBeNull();
    await expect(readNotices(variantId)).resolves.toEqual([]);
    await repository.setStockPreorder({ variantId, preorder: date, expectedRevision: 0 });
    const firstRows = await readNotices(variantId);
    expect(firstRows.map((row) => row.orderId).sort()).toEqual([paid, secondPaid].sort());
    expect(firstRows.every((row) => row.sequence === 1)).toBe(true);
    const id = firstRows[0]!.id;
    const claimedAt = new Date('2099-01-01T10:00:00Z');
    const firstClaim = await notices.claimDue({ claimedAt, deliveryId: id });
    expect(firstClaim.kind).toBe('claimed');
    if (firstClaim.kind !== 'claimed') return;
    const latest = { ...preorder, shipEstimate: { kind: 'month', month: '2099-12', part: 'late' } } as const;
    await repository.setStockPreorder({ variantId, preorder: latest, expectedRevision: 1 });
    const secondRows = await readNotices(variantId);
    expect(secondRows.map((row) => row.id).sort()).toEqual(firstRows.map((row) => row.id).sort());
    await expect(notices.findById(id)).resolves.toMatchObject({
      shipEstimate: latest.shipEstimate,
      sequence: 2,
      status: 'pending',
      attemptCount: 0,
      leaseUntil: null,
      providerMessageId: null,
      deliveredAt: null,
      needsReviewAt: null,
    });
    const secondClaim = await notices.claimDue({ claimedAt, deliveryId: id });
    expect(secondClaim.kind).toBe('claimed');
    if (secondClaim.kind !== 'claimed') return;
    expect(secondClaim.delivery.leaseUntil).toEqual(firstClaim.delivery.leaseUntil);
    expect(secondClaim.delivery.attemptCount).toBe(firstClaim.delivery.attemptCount);
    await expect(
      notices.markDelivered({ delivery: firstClaim.delivery, deliveredAt: claimedAt, providerMessageId: 'old' }),
    ).resolves.toBe(false);
    await expect(repository.setStockPreorder({ variantId, preorder: null, expectedRevision: 1 })).resolves.toBeNull();
    await expect(readNotices(variantId)).resolves.toHaveLength(2);
    await notices.markDelivered({
      delivery: secondClaim.delivery,
      deliveredAt: claimedAt,
      providerMessageId: 'latest',
    });
    await repository.setStockPreorder({ variantId, preorder: null, expectedRevision: 2 });
    await expect(readNotices(variantId)).resolves.toEqual([expect.objectContaining({ id, status: 'delivered' })]);
    await repository.setStockPreorder({
      variantId,
      preorder: { ...latest, startedAt: '2026-10-02T10:00:00.000Z' },
      expectedRevision: 3,
    });
    await expect(readNotices(variantId)).resolves.toHaveLength(1);
    await expect(countRows('StockChange', variantId)).resolves.toBe(0);
    await expect(countRows('StockCount', variantId)).resolves.toBe(0);
  });

  it('enqueues one notice for the winning concurrent revision and treats a passed month as open', async () => {
    const variantId = parseVariantId(`variant_preorder_notice_race_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const preorder = {
      startedAt: '2026-09-01T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2000-01', part: null },
    } as const;
    await repository.setStockPreorder({ variantId, preorder, expectedRevision: null });
    const orderId = await seedPreorderOrder(variantId, preorder.startedAt);
    const results = await Promise.all(
      ['early', 'late'].map((part) =>
        repository.setStockPreorder({
          variantId,
          expectedRevision: 0,
          preorder: { ...preorder, shipEstimate: { kind: 'month', month: '2099-11', part: part as 'early' | 'late' } },
        }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    await expect(readNotices(variantId)).resolves.toEqual([expect.objectContaining({ orderId, sequence: 1 })]);
    await expect(readStock(variantId)).resolves.toMatchObject({ revision: 1 });
    const closedVariantId = parseVariantId(`variant_preorder_notice_closed_${crypto.randomUUID()}`);
    const closed = { startedAt: preorder.startedAt, shipEstimate: { kind: 'date', date: '2000-01-01' } } as const;
    await repository.setStockPreorder({ variantId: closedVariantId, preorder: closed, expectedRevision: null });
    await seedPreorderOrder(closedVariantId, closed.startedAt);
    await repository.setStockPreorder({
      variantId: closedVariantId,
      expectedRevision: 0,
      preorder: {
        startedAt: '2026-10-02T10:00:00.000Z',
        shipEstimate: { kind: 'month', month: '2099-11', part: null },
      },
    });
    await expect(readNotices(closedVariantId)).resolves.toEqual([]);
  });

  it('rolls stock back when enqueue or pending-notice cleanup fails', async () => {
    const variantId = parseVariantId(`variant_preorder_notice_rollback_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const preorder = {
      startedAt: '2026-09-01T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2099-11', part: null },
    } as const;
    const edit = { ...preorder, shipEstimate: { kind: 'date', date: '2099-11-20' } } as const;
    await repository.setStockPreorder({ variantId, preorder, expectedRevision: null });
    await seedPreorderOrder(variantId, preorder.startedAt);
    const trigger = `notice_fail_${crypto.randomUUID().replaceAll('-', '')}`;
    for (const action of ['INSERT', 'DELETE'] as const) {
      await env.COMMERCE_DB.prepare(
        `CREATE TRIGGER "${trigger}" BEFORE ${action} ON "PreorderEstimateDelivery"
        WHEN ${action === 'INSERT' ? 'NEW' : 'OLD'}."variantId" = '${variantId}'
        BEGIN SELECT RAISE(ABORT, 'notice mutation failed'); END`,
      ).run();
      try {
        await expect(
          repository.setStockPreorder({
            variantId,
            expectedRevision: action === 'INSERT' ? 0 : 1,
            preorder: action === 'INSERT' ? edit : null,
          }),
        ).rejects.toThrow();
        await expect(readStock(variantId)).resolves.toMatchObject({ revision: action === 'INSERT' ? 0 : 1 });
        await expect(readNotices(variantId)).resolves.toHaveLength(action === 'INSERT' ? 0 : 1);
      } finally {
        await env.COMMERCE_DB.prepare(`DROP TRIGGER "${trigger}"`).run();
      }
      if (action === 'INSERT') await repository.setStockPreorder({ variantId, expectedRevision: 0, preorder: edit });
    }
  });
});

describe('D1OperatorStockRepository idempotency', () => {
  it('revision-checks pre-order writes, creates an empty row and keeps quantities and history', async () => {
    const variantId = parseVariantId(`variant_preorder_write_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const preorder = {
      startedAt: '2026-10-02T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' },
    } as const;
    const start = await repository.setStockPreorder({ expectedRevision: null, preorder, variantId });
    expect(start).toMatchObject({ preorder, revision: 0, quantity: 0, onlineQuantity: 0 });
    await expect(
      repository.setStockPreorder({ expectedRevision: null, preorder: null, variantId }),
    ).resolves.toBeNull();
    await expect(repository.setStockPreorder({ expectedRevision: 7, preorder: null, variantId })).resolves.toBeNull();
    const changed = await repository.setStockPreorder({
      expectedRevision: 0,
      preorder: { ...preorder, shipEstimate: { kind: 'date', date: '2026-11-20' } },
      variantId,
    });
    expect(changed).toMatchObject({
      revision: 1,
      preorder: { startedAt: preorder.startedAt, shipEstimate: { kind: 'date', date: '2026-11-20' } },
    });
    expect(await repository.setStockPreorder({ expectedRevision: 1, preorder: null, variantId })).toMatchObject({
      preorder: null,
      revision: 2,
      quantity: 0,
      onlineQuantity: 0,
    });
    await expect(countRows('StockChange', variantId)).resolves.toBe(0);
    await expect(countRows('StockCount', variantId)).resolves.toBe(0);
  });
  it('allows only one concurrent pre-order edit and preserves stock, flags and ledger rows', async () => {
    const variantId = parseVariantId(`variant_preorder_race_${crypto.randomUUID()}`);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    const preorder = {
      startedAt: '2026-10-02T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' },
    } as const;
    await expect(repository.setStockPreorder({ variantId, expectedRevision: 1, preorder })).resolves.toBeNull();
    await expect(
      env.COMMERCE_DB.prepare('SELECT * FROM "Stock" WHERE "variantId" = ?').bind(variantId).first(),
    ).resolves.toBeNull();
    await seedStock(variantId, 9);
    await env.COMMERCE_DB.prepare(
      'UPDATE "Stock" SET "onlineQuantity" = 4, "restockPlanned" = 1, "showLowStock" = 1 WHERE "variantId" = ?',
    )
      .bind(variantId)
      .run();
    await repository.recordChange({
      actorEmail: 'operator@example.com',
      variantId,
      quantityDelta: createStockChangeDelta(1),
      reason: 'Inbound',
      notes: null,
    });
    const started = await repository.setStockPreorder({ variantId, expectedRevision: 1, preorder });
    expect(started).toMatchObject({
      quantity: 10,
      onlineQuantity: 5,
      restockPlanned: true,
      showLowStock: true,
      revision: 2,
      preorder,
    });
    const edits = await Promise.all(
      ['2026-11-20', '2026-11-21'].map((date) =>
        repository.setStockPreorder({
          variantId,
          expectedRevision: 2,
          preorder: { ...preorder, shipEstimate: { kind: 'date', date } },
        }),
      ),
    );
    expect(edits.filter(Boolean)).toHaveLength(1);
    const edited = edits.find(Boolean)!;
    expect(edited).toMatchObject({
      quantity: 10,
      onlineQuantity: 5,
      revision: 3,
      preorder: { startedAt: preorder.startedAt },
    });
    expect(edited.createdAt).toEqual(started?.createdAt);
    await repository.setStockPreorder({ variantId, expectedRevision: 3, preorder: null });
    await expect(
      env.COMMERCE_DB.prepare(
        'SELECT "preorderStartedAt", "preorderShipMonth", "preorderShipPart", "preorderShipDate", "quantity", "onlineQuantity", "restockPlanned", "showLowStock" FROM "Stock" WHERE "variantId" = ?',
      )
        .bind(variantId)
        .first(),
    ).resolves.toEqual({
      preorderStartedAt: null,
      preorderShipMonth: null,
      preorderShipPart: null,
      preorderShipDate: null,
      quantity: 10,
      onlineQuantity: 5,
      restockPlanned: 1,
      showLowStock: 1,
    });
    await expect(countRows('StockChange', variantId)).resolves.toBe(1);
    await expect(countRows('StockCount', variantId)).resolves.toBe(0);
  });
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

  it('persists the copies-left notice without changing quantities or restock intent', async () => {
    const variantId = parseVariantId(`variant_low_stock_${crypto.randomUUID()}`);
    await seedStock(variantId, 4);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);

    const enabled = await repository.setShowLowStock({ expectedRevision: 0, showLowStock: true, variantId });
    expect(enabled).toMatchObject({
      onlineQuantity: 4,
      quantity: 4,
      restockPlanned: false,
      revision: 1,
      showLowStock: true,
    });
    await expect(
      repository.setShowLowStock({ expectedRevision: 0, showLowStock: false, variantId }),
    ).resolves.toBeNull();
    const disabled = await repository.setShowLowStock({ expectedRevision: 1, showLowStock: false, variantId });
    expect(disabled).toMatchObject({ revision: 2, showLowStock: false });
    await expect(countRows('StockChange', variantId)).resolves.toBe(0);
  });

  it('keeps the flags and pre-order on stock returned from a change, a count and their replays', async () => {
    const variantId = parseVariantId(`variant_stock_flags_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const repository = new D1OperatorStockRepository(env.COMMERCE_DB);
    await repository.setRestockPlanned({ expectedRevision: 0, restockPlanned: true, variantId });
    await repository.setShowLowStock({ expectedRevision: 1, showLowStock: true, variantId });
    await env.COMMERCE_DB.prepare(
      'UPDATE "Stock" SET "preorderStartedAt" = ?, "preorderShipMonth" = ?, "preorderShipPart" = ? WHERE "variantId" = ?',
    )
      .bind('2026-09-01T09:00:00.000Z', '2026-10', 'mid', variantId)
      .run();
    const kept = {
      preorder: {
        shipEstimate: { kind: 'month', month: '2026-10', part: 'mid' },
        startedAt: '2026-09-01T09:00:00.000Z',
      },
      restockPlanned: true,
      showLowStock: true,
    };

    const change = {
      actorEmail: 'operator@example.com',
      notes: null,
      quantityDelta: createStockChangeDelta(1),
      reason: 'Adjustment',
      requestIdentity: identity('m', 'n'),
      variantId,
    };
    expect((await repository.recordChange(change))?.stock).toMatchObject(kept);
    expect((await repository.recordChange(change))?.stock).toMatchObject(kept);

    const count = {
      actorEmail: 'operator@example.com',
      countedQuantity: createStockQuantity(6),
      expectedRevision: 3,
      notes: null,
      onlineQuantity: createStockQuantity(6),
      requestIdentity: identity('o', 'p'),
      variantId,
    };
    expect((await repository.recordCount(count))?.stock).toMatchObject(kept);
    expect((await repository.recordCount(count))?.stock).toMatchObject(kept);
  });

  it('rejects pre-order columns that break the combination rule', async () => {
    const variantId = parseVariantId(`variant_preorder_checks_${crypto.randomUUID()}`);
    await seedStock(variantId, 5);
    const update = (set: string) =>
      env.COMMERCE_DB.prepare(`UPDATE "Stock" SET ${set} WHERE "variantId" = ?`).bind(variantId).run();
    const started = `"preorderStartedAt" = '2026-09-01T09:00:00.000Z'`;

    await expect(update(started)).rejects.toThrow();
    await expect(
      update(`${started}, "preorderShipMonth" = '2026-10', "preorderShipDate" = '2026-10-20'`),
    ).rejects.toThrow();
    await expect(update(`${started}, "preorderShipDate" = '2026-10-20', "preorderShipPart" = 'mid'`)).rejects.toThrow();
    await expect(update(`${started}, "preorderShipMonth" = '2026-10', "preorderShipPart" = 'later'`)).rejects.toThrow();
    await expect(update(`"preorderShipMonth" = '2026-10'`)).rejects.toThrow();
    await expect(
      update(`${started}, "preorderShipMonth" = '2026-10', "preorderShipPart" = 'late'`),
    ).resolves.toBeTruthy();
    await expect(
      update('"preorderStartedAt" = NULL, "preorderShipMonth" = NULL, "preorderShipPart" = NULL'),
    ).resolves.toBeTruthy();
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

async function readNotices(variantId: string) {
  const rows = await env.COMMERCE_DB.prepare(
    'SELECT "id", "orderId", "status", "sequence" FROM "PreorderEstimateDelivery" WHERE "variantId" = ? ORDER BY "orderId"',
  )
    .bind(variantId)
    .all<{ id: string; orderId: string; status: string; sequence: number }>();
  return rows.results;
}

async function seedPreorderOrder(
  variantId: string,
  cycle: string | null,
  status: 'paid' | 'pending_payment' | 'not_paid' | 'needs_review' = 'paid',
) {
  const id = crypto.randomUUID();
  const timestamp = '2026-10-02T09:00:00.000Z';
  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare(
      `INSERT INTO "CheckoutOrder"
      ("id", "storeItemSlug", "variantId", "checkoutExpiresAt", "status", "statusUpdatedAt", "createdAt", "updatedAt")
      VALUES (?, 'preorder-notice-item', ?, ?, ?, ?, ?, ?)`,
    ).bind(id, variantId, timestamp, status, timestamp, timestamp, timestamp),
    env.COMMERCE_DB.prepare(
      `INSERT INTO "CheckoutOrderLine"
      ("id", "orderId", "storeItemSlug", "variantId", "quantity", "preorderStartedAt", "preorderShipMonth", "createdAt")
      VALUES (?, ?, 'preorder-notice-item', ?, 1, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), id, variantId, cycle, cycle ? '2099-11' : null, timestamp),
  ]);
  return id;
}
