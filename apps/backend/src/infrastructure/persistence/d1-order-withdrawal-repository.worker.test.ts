import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { D1OrderWithdrawalRepository } from './d1-order-withdrawal-repository';

const db = env.COMMERCE_DB;
const repo = new D1OrderWithdrawalRepository(db);
const now = new Date('2026-10-09T10:00:00.000Z');
function notice() {
  const id = crypto.randomUUID();
  return {
    id,
    name: 'Shopper',
    contract: 'The record ordered last Friday',
    email: `${id}@example.com`,
    fingerprint: id,
    requesterHash: id,
    submittedAt: now.toISOString(),
  };
}

describe('D1 withdrawal persistence', () => {
  it('atomically persists the notice and both deliveries, replays original time and refuses changed content', async () => {
    const input = notice();
    expect(await repo.record(input)).toMatchObject({
      kind: 'recorded',
      withdrawal: { submittedAt: input.submittedAt },
    });
    expect(await repo.record({ ...input, submittedAt: '2026-10-09T11:00:00.000Z' })).toMatchObject({
      kind: 'recorded',
      withdrawal: { submittedAt: input.submittedAt },
    });
    expect(await repo.record({ ...input, fingerprint: 'changed', name: 'Different' })).toEqual({ kind: 'conflict' });
    const { results } = await db
      .prepare('SELECT * FROM "OrderWithdrawalDelivery" WHERE "withdrawalId" = ?')
      .bind(input.id)
      .all();
    expect(results).toHaveLength(2);
    expect(results.map((row) => row.status)).toEqual(['pending', 'pending']);
  });

  it('rolls back the notice if an outbox write fails', async () => {
    const existing = notice();
    await repo.record(existing);
    const input = notice();
    await db
      .prepare('UPDATE "OrderWithdrawalDelivery" SET "id" = ? WHERE "id" = ?')
      .bind(`${input.id}:support`, `${existing.id}:support`)
      .run();
    await expect(repo.record(input)).rejects.toThrow();
    expect(await db.prepare('SELECT "id" FROM "OrderWithdrawal" WHERE "id" = ?').bind(input.id).first()).toBeNull();
  });

  it('bounds email relay per recipient without blocking idempotent retries', async () => {
    const base = notice();
    const inputs = Array.from({ length: 6 }, () => ({ ...base, id: crypto.randomUUID() }));
    const results = await Promise.all(inputs.map((input) => repo.record(input)));
    expect(results.filter((result) => result.kind === 'recorded')).toHaveLength(5);
    expect(results.filter((result) => result.kind === 'limited')).toHaveLength(1);
    const accepted = inputs[results.findIndex((result) => result.kind === 'recorded')]!;
    expect(await repo.record(accepted)).toMatchObject({ kind: 'recorded' });
  });

  it('leases once, rejects stale completions and retains crashed fifth attempts for review', async () => {
    const input = notice();
    await repo.record(input);
    const first = await repo.claim(now, input.id);
    const second = await repo.claim(now, input.id);
    expect(first?.kind).toBe('acknowledgement');
    expect(second?.kind).toBe('support');
    expect(await repo.claim(now, input.id)).toBeNull();
    const reclaimed = await repo.claim(new Date(now.getTime() + 6 * 60 * 1000), input.id);
    expect(reclaimed?.attemptCount).toBe(2);
    expect(await repo.finish(first!, { status: 'delivered', nextAttemptAt: null, safeReason: null })).toBe(false);
    expect(await repo.finish(reclaimed!, { status: 'delivered', nextAttemptAt: null, safeReason: null })).toBe(true);
    await db
      .prepare('UPDATE "OrderWithdrawalDelivery" SET "attemptCount" = 5 WHERE "withdrawalId" = ? AND "kind" = ?')
      .bind(input.id, 'support')
      .run();
    await repo.claim(new Date(now.getTime() + 12 * 60 * 1000), input.id);
    expect(
      await db
        .prepare('SELECT "status" FROM "OrderWithdrawalDelivery" WHERE "withdrawalId" = ? AND "kind" = ?')
        .bind(input.id, 'support')
        .first('status'),
    ).toBe('needs_review');
  });
});
