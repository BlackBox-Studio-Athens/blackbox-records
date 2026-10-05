import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { exec } = vi.hoisted(() => ({ exec: vi.fn() }));
vi.mock('node:child_process', () => ({ execFileSync: exec }));
import { expireUatCheckouts } from './expire-uat-checkouts';

const args = ['--variant-id', 'variant_test'];
const key = 'sk_test_fixture';
const hold = {
  id: 'order_test',
  checkoutSessionId: 'cs_test_fixture',
  checkoutExpiresAt: '2000-01-01T00:00:00Z',
  paidAt: null,
  stripePaymentIntentId: null,
};
const session = {
  id: hold.checkoutSessionId,
  livemode: false,
  status: 'open',
  payment_status: 'unpaid',
  metadata: { orderId: hold.id },
};
const result = (results: unknown[], changes = 0) => JSON.stringify([{ success: true, results, meta: { changes } }]);
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const request = vi.fn();

beforeEach(() => {
  exec.mockReset().mockReturnValue(result([hold]));
  request.mockReset().mockResolvedValue(response(session));
  vi.stubGlobal('fetch', request);
});
afterEach(() => vi.unstubAllGlobals());

describe('UAT checkout reset', () => {
  it('defaults to bounded, read-only UAT and rejects target/credential overrides before any I/O', async () => {
    for (const extra of [
      ['--env', 'prd'],
      ['--database', 'other'],
      ['--config', 'other'],
    ]) {
      await expect(expireUatCheckouts([...args, ...extra], key)).rejects.toThrow();
    }
    for (const credential of ['sk_live_secret', 'sk_test_mock', '']) {
      await expect(expireUatCheckouts(args, credential)).rejects.toThrow();
    }
    expect(exec).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    const report = await expireUatCheckouts(args, key);
    expect(report).toMatchObject({ mode: 'dry-run', plannedExpiry: 1, plannedRelease: 1, released: 0 });
    expect(exec).toHaveBeenCalledTimes(1);
    const command = exec.mock.calls[0][1] as string[];
    expect(command.slice(1, 4)).toEqual(['d1', 'execute', 'blackbox-records-commerce-uat']);
    expect(command[command.indexOf('--env') + 1]).toBe('uat');
    expect(command[command.indexOf('--command') + 1]).toContain('LIMIT 26');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].method).toBe('GET');
    expect(JSON.stringify(report)).not.toContain(hold.checkoutSessionId);
    expect(JSON.stringify(report)).not.toContain(hold.id);
  });

  it('closes an unpaid Session before the guarded hold release and never edits stock or lines', async () => {
    const events: string[] = [];
    exec.mockImplementation((_node, command: string[]) => {
      const sql = command[command.indexOf('--command') + 1];
      events.push(sql.startsWith('SELECT') ? 'read' : 'release');
      return sql.startsWith('SELECT') ? result([hold]) : result([], 1);
    });
    request.mockImplementation((_url, init) => {
      events.push(init.method);
      return response({ ...session, status: init.method === 'POST' ? 'expired' : 'open' });
    });
    expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ expired: 1, released: 1 });
    expect(events).toEqual(['read', 'GET', 'POST', 'release']);
    const sql = (exec.mock.calls[1][1] as string[]).join(' ');
    expect(sql).toContain("status = 'not_paid'");
    expect(sql).toContain("status = 'pending_payment' AND paidAt IS NULL AND stripePaymentIntentId IS NULL");
    expect(sql).toContain("checkoutSessionId = 'cs_test_fixture'");
    expect(sql).not.toMatch(/UPDATE Stock|DELETE|UPDATE CheckoutOrderLine/);
  });

  it('preserves live, paid, processing, mismatched and uncertain provider sessions', async () => {
    for (const unsafe of [
      { ...session, livemode: true },
      { ...session, payment_status: 'paid' },
      { ...session, status: 'complete' },
      { ...session, id: 'cs_test_other' },
      { ...session, metadata: { orderId: 'other' } },
    ]) {
      exec.mockClear();
      request.mockResolvedValueOnce(response(unsafe));
      expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ skipped: 1, released: 0 });
      expect(exec).toHaveBeenCalledTimes(1);
    }
    exec.mockClear();
    request
      .mockResolvedValueOnce(response(session))
      .mockResolvedValueOnce(response({ error: { code: 'conflict' } }, 400));
    expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ skipped: 1, released: 0 });
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('requires opt-in to quarantine an overdue missing test reference, without asserting expiry', async () => {
    request.mockImplementation(() => response({ error: { code: 'resource_missing' } }, 404));
    expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ skipped: 1, reviewed: 0 });
    expect(exec).toHaveBeenCalledTimes(1);
    expect(await expireUatCheckouts([...args, '--retire-missing'], key)).toMatchObject({
      plannedReview: 1,
      reviewed: 0,
    });
    exec.mockReturnValueOnce(result([hold])).mockReturnValueOnce(result([], 1));
    expect(await expireUatCheckouts([...args, '--apply', '--retire-missing'], key)).toMatchObject({
      expired: 0,
      released: 0,
      reviewed: 1,
    });
    const sql = (exec.mock.calls.at(-1)?.[1] as string[]).join(' ');
    expect(sql).toContain("status = 'needs_review'");
    expect(sql).toContain('needsReviewAt =');
    expect(sql).not.toContain('needsReviewReason =');
    expect(sql).not.toContain('notPaidAt =');
    exec.mockReturnValueOnce(result([{ ...hold, checkoutExpiresAt: '2999-01-01T00:00:00Z' }]));
    expect(await expireUatCheckouts([...args, '--apply', '--retire-missing'], key)).toMatchObject({
      skipped: 1,
      reviewed: 0,
    });
  });

  it('quarantines using the real order schema and preserves a concurrently paid row', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      for (const migration of ['0003_add_checkout_order_lifecycle.sql', '0017_checkout_order_review_reason.sql']) {
        db.exec(readFileSync(new URL(`../apps/backend/prisma/migrations/${migration}`, import.meta.url), 'utf8'));
      }
      db.exec(`INSERT INTO CheckoutOrder (id, storeItemSlug, variantId, checkoutSessionId, status, statusUpdatedAt, updatedAt)
        VALUES ('order_test', 'test', 'variant_test', 'cs_test_fixture', 'pending_payment', '2000-01-01', '2000-01-01')`);
      exec.mockImplementation((_node, command: string[]) => {
        const sql = command[command.indexOf('--command') + 1];
        return sql.startsWith('SELECT') ? result([hold]) : result([], Number(db.prepare(sql).run().changes));
      });
      request.mockImplementation(() => response({ error: { code: 'resource_missing' } }, 404));
      const reset = [...args, '--apply', '--retire-missing'];
      expect(await expireUatCheckouts(reset, key)).toMatchObject({ reviewed: 1 });
      expect(db.prepare('SELECT status, needsReviewReason FROM CheckoutOrder').get()).toMatchObject({
        status: 'needs_review',
        needsReviewReason: null,
      });
      db.exec("UPDATE CheckoutOrder SET status = 'paid', paidAt = '2026-10-05', stripePaymentIntentId = 'pi_test'");
      expect(await expireUatCheckouts(reset, key)).toMatchObject({ conflicts: 1, reviewed: 0 });
      expect(db.prepare('SELECT status FROM CheckoutOrder').get()).toMatchObject({ status: 'paid' });
    } finally {
      db.close();
    }
  });

  it('skips local payment facts, refuses large batches and reports concurrent updates without releasing them', async () => {
    for (const protectedHold of [
      { ...hold, paidAt: '2026-10-05' },
      { ...hold, stripePaymentIntentId: 'pi_test' },
      { ...hold, checkoutSessionId: 'cs_live_test' },
    ]) {
      exec.mockReturnValueOnce(result([protectedHold]));
      expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ skipped: 1 });
    }
    expect(request).not.toHaveBeenCalled();
    exec.mockReturnValueOnce(result(Array.from({ length: 26 }, () => hold)));
    await expect(expireUatCheckouts([...args, '--apply'], key)).rejects.toThrow('25');
    expect(request).not.toHaveBeenCalled();
    request.mockResolvedValueOnce(response({ ...session, status: 'expired' }));
    exec.mockReturnValueOnce(result([hold])).mockReturnValueOnce(result([], 0));
    expect(await expireUatCheckouts([...args, '--apply'], key)).toMatchObject({ conflicts: 1, released: 0 });
  });
});
