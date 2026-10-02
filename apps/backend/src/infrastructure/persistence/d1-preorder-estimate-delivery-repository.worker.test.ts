import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { D1PreorderEstimateDeliveryRepository } from './d1-preorder-estimate-delivery-repository';

const now = new Date('2026-10-02T10:00:00.000Z');

describe('D1PreorderEstimateDeliveryRepository', () => {
  it('atomically gives one concurrent caller the lease and reads the estimate for sending', async () => {
    const deliveryId = await seedNotice();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    const results = await Promise.all([
      repository.claimDue({ claimedAt: now, deliveryId }),
      repository.claimDue({ claimedAt: now, deliveryId }),
    ]);
    expect(results.map((result) => result.kind).sort()).toEqual(['claimed', 'not_claimed']);
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      attemptCount: 1,
      sequence: 1,
      status: 'pending',
      shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' },
      leaseUntil: new Date('2026-10-02T10:10:00.000Z'),
    });
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('reclaims expired leases and rejects the previous attempt and estimate sequence', async () => {
    const deliveryId = await seedNotice();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    const first = await repository.claimDue({ claimedAt: now, deliveryId });
    expect(first.kind).toBe('claimed');
    if (first.kind !== 'claimed') return;
    await expect(repository.claimDue({ claimedAt: new Date('2026-10-02T10:09:59Z'), deliveryId })).resolves.toEqual({
      kind: 'not_claimed',
    });
    const second = await repository.claimDue({ claimedAt: new Date('2026-10-02T10:10:00Z'), deliveryId });
    expect(second.kind).toBe('claimed');
    if (second.kind !== 'claimed') return;
    expect(second.delivery.attemptCount).toBe(2);
    await expect(
      repository.markDelivered({ delivery: first.delivery, deliveredAt: now, providerMessageId: null }),
    ).resolves.toBe(false);
    await env.COMMERCE_DB.prepare(
      `UPDATE "PreorderEstimateDelivery"
      SET "sequence" = 2, "attemptCount" = 0, "leaseUntil" = NULL, "shipMonth" = NULL, "shipPart" = NULL, "shipDate" = '2026-11-20'
      WHERE "id" = ?`,
    )
      .bind(deliveryId)
      .run();
    const replacement = await repository.claimDue({ claimedAt: new Date('2026-10-02T10:10:00Z'), deliveryId });
    expect(replacement.kind).toBe('claimed');
    if (replacement.kind !== 'claimed') return;
    expect(replacement.delivery).toMatchObject({
      sequence: 2,
      attemptCount: 1,
      shipEstimate: { kind: 'date', date: '2026-11-20' },
    });
    // Hold attempt and lease equal so sequence is the only protection against the stale sender.
    const oldSequence = { ...replacement.delivery, sequence: 1 };
    await expect(
      repository.markDelivered({ delivery: oldSequence, deliveredAt: now, providerMessageId: null }),
    ).resolves.toBe(false);
    await expect(
      repository.reschedule({ delivery: oldSequence, nextAttemptAt: now, safeReason: 'rate_limited', updatedAt: now }),
    ).resolves.toBe(false);
    await expect(
      repository.markNeedsReview({ delivery: oldSequence, needsReviewAt: now, safeReason: 'provider_outcome_unknown' }),
    ).resolves.toBe(false);
    await expect(
      repository.markDelivered({ delivery: replacement.delivery, deliveredAt: now, providerMessageId: 'message-2' }),
    ).resolves.toBe(true);
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      status: 'delivered',
      providerMessageId: 'message-2',
      nextAttemptAt: null,
      leaseUntil: null,
      deliveredAt: now,
    });
    await expect(
      repository.markDelivered({ delivery: replacement.delivery, deliveredAt: now, providerMessageId: 'message-2' }),
    ).resolves.toBe(false);
  });

  it('reschedules transient failures, then terminalizes review with the active lease', async () => {
    const deliveryId = await seedNotice();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    const first = await repository.claimDue({ claimedAt: now, deliveryId });
    expect(first.kind).toBe('claimed');
    if (first.kind !== 'claimed') return;
    const nextAttemptAt = new Date('2026-10-02T10:15:00Z');
    await expect(
      repository.reschedule({ delivery: first.delivery, nextAttemptAt, safeReason: 'rate_limited', updatedAt: now }),
    ).resolves.toBe(true);
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      status: 'pending',
      leaseUntil: null,
      nextAttemptAt,
      safeReason: 'rate_limited',
    });
    await expect(repository.claimDue({ claimedAt: now, deliveryId })).resolves.toEqual({ kind: 'not_claimed' });
    const second = await repository.claimDue({ claimedAt: nextAttemptAt, deliveryId });
    expect(second.kind).toBe('claimed');
    if (second.kind !== 'claimed') return;
    await expect(
      repository.markNeedsReview({
        delivery: second.delivery,
        needsReviewAt: nextAttemptAt,
        safeReason: 'provider_outcome_unknown',
      }),
    ).resolves.toBe(true);
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      status: 'needs_review',
      leaseUntil: null,
      nextAttemptAt: null,
      needsReviewAt: nextAttemptAt,
      deliveredAt: null,
    });
    await expect(repository.claimDue({ claimedAt: nextAttemptAt, deliveryId })).resolves.toEqual({
      kind: 'not_claimed',
    });
  });

  it.each(['targeted', 'scheduled'])('recovers an abandoned fifth claim through %s selection', async (selection) => {
    const deliveryId = await seedNotice();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    let claimedAt = now;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const claim = await repository.claimDue({ claimedAt, deliveryId });
      expect(claim.kind).toBe('claimed');
      if (claim.kind !== 'claimed') return;
      expect(claim.delivery.attemptCount).toBe(attempt);
      claimedAt = claim.delivery.leaseUntil;
    }
    const selectedId = selection === 'targeted' ? deliveryId : null;
    await expect(
      repository.claimDue({ claimedAt: new Date(claimedAt.getTime() - 1), deliveryId: selectedId }),
    ).resolves.not.toMatchObject({ kind: 'claimed', delivery: { id: deliveryId } });
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      status: 'pending',
      attemptCount: 5,
      leaseUntil: claimedAt,
      needsReviewAt: null,
    });
    const recoveryAt = new Date(claimedAt.getTime() + 1);
    await expect(repository.claimDue({ claimedAt: recoveryAt, deliveryId: selectedId })).resolves.not.toMatchObject({
      kind: 'claimed',
      delivery: { id: deliveryId },
    });
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      status: 'needs_review',
      sequence: 1,
      attemptCount: 5,
      leaseUntil: null,
      nextAttemptAt: null,
      needsReviewAt: recoveryAt,
      updatedAt: recoveryAt,
      safeReason: 'provider_outcome_unknown',
    });
    await expect(repository.claimDue({ claimedAt: recoveryAt, deliveryId: selectedId })).resolves.not.toMatchObject({
      kind: 'claimed',
      delivery: { id: deliveryId },
    });
  });

  it('protects a newer sequence from recovery and the abandoned fifth lease owner', async () => {
    const deliveryId = await seedNotice();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    await env.COMMERCE_DB.prepare('UPDATE "PreorderEstimateDelivery" SET "attemptCount" = 4 WHERE "id" = ?')
      .bind(deliveryId)
      .run();
    const fifth = await repository.claimDue({ claimedAt: now, deliveryId });
    expect(fifth.kind).toBe('claimed');
    if (fifth.kind !== 'claimed') return;
    expect(fifth.delivery.attemptCount).toBe(5);
    await env.COMMERCE_DB.prepare(
      'UPDATE "PreorderEstimateDelivery" SET "sequence" = 2, "attemptCount" = 0, "leaseUntil" = NULL WHERE "id" = ?',
    )
      .bind(deliveryId)
      .run();
    const recoveryAt = new Date(fifth.delivery.leaseUntil.getTime() + 1);
    const replacement = await repository.claimDue({ claimedAt: recoveryAt, deliveryId });
    expect(replacement.kind).toBe('claimed');
    if (replacement.kind !== 'claimed') return;
    expect(replacement.delivery).toMatchObject({ id: deliveryId, sequence: 2, attemptCount: 1, status: 'pending' });
    await expect(
      repository.markNeedsReview({
        delivery: fifth.delivery,
        needsReviewAt: recoveryAt,
        safeReason: 'provider_outcome_unknown',
      }),
    ).resolves.toBe(false);
    await expect(repository.findById(deliveryId)).resolves.toMatchObject({
      sequence: 2,
      attemptCount: 1,
      status: 'pending',
      needsReviewAt: null,
      leaseUntil: replacement.delivery.leaseUntil,
    });
  });

  it('selects due notices in order, skips future rows and terminalizes exhausted rows', async () => {
    const older = await seedNotice('2026-10-02T09:00:00.000Z');
    const newer = await seedNotice('2026-10-02T09:30:00.000Z');
    const future = await seedNotice('2026-10-02T11:00:00.000Z');
    const exhausted = await seedNotice('2026-10-02T08:00:00.000Z');
    await env.COMMERCE_DB.prepare('UPDATE "PreorderEstimateDelivery" SET "attemptCount" = 5 WHERE "id" = ?')
      .bind(exhausted)
      .run();
    const repository = new D1PreorderEstimateDeliveryRepository(env.COMMERCE_DB);
    await expect(repository.claimDue({ claimedAt: now, deliveryId: null })).resolves.toMatchObject({
      kind: 'claimed',
      delivery: { id: older },
    });
    await expect(repository.claimDue({ claimedAt: now, deliveryId: null })).resolves.toMatchObject({
      kind: 'claimed',
      delivery: { id: newer },
    });
    await expect(repository.claimDue({ claimedAt: now, deliveryId: null })).resolves.toEqual({ kind: 'not_claimed' });
    await expect(repository.claimDue({ claimedAt: now, deliveryId: future })).resolves.toEqual({ kind: 'not_claimed' });
    await expect(repository.claimDue({ claimedAt: now, deliveryId: exhausted })).resolves.toEqual({
      kind: 'not_claimed',
    });
    await expect(repository.findById(exhausted)).resolves.toMatchObject({
      status: 'needs_review',
      attemptCount: 5,
      leaseUntil: null,
      nextAttemptAt: null,
      needsReviewAt: now,
    });
  });

  it('enforces estimate, sequence and lifecycle checks in the migration', async () => {
    const deliveryId = await seedNotice();
    const update = (set: string) =>
      env.COMMERCE_DB.prepare(`UPDATE "PreorderEstimateDelivery" SET ${set} WHERE "id" = ?`).bind(deliveryId).run();
    for (const set of [
      '"sequence" = 0',
      '"attemptCount" = 6',
      '"status" = \'sent\'',
      '"shipPart" = \'later\'',
      '"shipDate" = \'2026-11-20\'',
      '"status" = \'delivered\'',
    ]) {
      await expect(update(set)).rejects.toThrow();
    }
  });
});

async function seedNotice(nextAttemptAt = '2026-10-02T09:30:00.000Z') {
  const id = crypto.randomUUID();
  const timestamp = '2026-10-02T09:00:00.000Z';
  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare(
      `INSERT INTO "CheckoutOrder"
      ("id", "storeItemSlug", "variantId", "checkoutExpiresAt", "status", "statusUpdatedAt", "createdAt", "updatedAt")
      VALUES (?, 'notice-item', 'variant_notice', ?, 'paid', ?, ?, ?)`,
    ).bind(id, timestamp, timestamp, timestamp, timestamp),
    env.COMMERCE_DB.prepare(
      `INSERT INTO "PreorderEstimateDelivery"
      ("id", "orderId", "variantId", "shipMonth", "shipPart", "status", "nextAttemptAt", "createdAt", "updatedAt")
      VALUES (?, ?, 'variant_notice', '2026-11', 'mid', 'pending', ?, ?, ?)`,
    ).bind(id, id, nextAttemptAt, timestamp, timestamp),
  ]);
  return id;
}
