import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { D1MerchantSyncRepository } from './d1-merchant-sync-repository';
import { runMerchantSynchronization, type MerchantProductInput } from '../../application/commerce/merchant-sync';

const at = new Date('2026-10-27T12:00:00Z');
const scope = () => ({ environment: 'UAT', accountId: crypto.randomUUID(), dataSourceId: 'source' });
const item = { variantId: 'variant', storeItemSlug: 'record' };

describe('D1 Merchant synchronization ledger', () => {
  it('claims one concurrent run per fifteen-minute clock slot', async () => {
    const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
    const target = scope();
    const claims = await Promise.all([repository.claimRun(target, at), repository.claimRun(target, at)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    const claim = claims.find((value) => value !== null)!;
    expect(await repository.finishRun(claim, 'last-variant', at)).toBe(true);
    expect(await repository.claimRun(target, new Date(at.getTime() + 14 * 60000))).toBeNull();
    expect(await repository.claimRun(target, new Date(at.getTime() + 15 * 60000))).toMatchObject({
      cursor: 'last-variant',
    });
  });

  it('keeps cadence despite delivery delays and never replays missed slots', async () => {
    const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
    const target = scope();
    const firstAt = new Date('2026-10-27T12:00:02Z');
    const first = (await repository.claimRun(target, firstAt))!;
    expect(await repository.finishRun(first, 'first', firstAt)).toBe(true);
    expect(await repository.claimRun(target, new Date('2026-10-27T12:05:01Z'))).toBeNull();
    const nextAt = new Date('2026-10-27T12:15:01Z');
    const next = (await repository.claimRun(target, nextAt))!;
    expect(next).toMatchObject({ cursor: 'first' });
    expect(await repository.finishRun(next, 'second', nextAt)).toBe(true);
    const delayedAt = new Date('2026-10-27T13:14:59Z');
    const delayed = (await repository.claimRun(target, delayedAt))!;
    expect(await repository.isClaimCurrent(delayed, new Date('2026-10-27T13:15:01Z'))).toBe(true);
    expect(await repository.claimRun(target, new Date('2026-10-27T13:15:01Z'))).toBeNull();
    expect(await repository.finishRun(delayed, 'delayed', delayedAt)).toBe(true);
    expect(await repository.claimRun(target, delayedAt)).toBeNull();
    expect(await repository.claimRun(target, new Date('2026-10-27T13:15:01Z'))).toMatchObject({ cursor: 'delayed' });
  });

  it('fences an expired worker from all offer writes and cursor updates after reclamation', async () => {
    const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
    const target = scope();
    const first = (await repository.claimRun(target, at))!;
    expect(await repository.manageOffer(first, item, at)).toBe(true);
    const later = new Date(at.getTime() + 15 * 60000);
    const second = (await repository.claimRun(target, later))!;
    expect(await repository.isClaimCurrent(first, later)).toBe(false);
    expect(await repository.manageOffer(first, item, later)).toBe(false);
    expect(await repository.saveSubmitted(first, item.variantId, 'old', later)).toBe(false);
    expect(await repository.removeManaged(first, item.variantId, later)).toBe(false);
    expect(await repository.finishRun(first, 'stale', later)).toBe(false);
    expect(await repository.clearQuotaBlock(first, later)).toBe(false);
    expect(await repository.deferQuota(first, new Date(later.getTime() + 86400000), later)).toBe(false);
    expect(await repository.saveSubmitted(second, item.variantId, 'current', later)).toBe(true);
    expect(await repository.listManaged(second)).toEqual([
      { ...item, inputHash: 'current', submittedAt: later.toISOString() },
    ]);
    expect(await repository.manageOffer(second, item, later)).toBe(true);
    expect(await repository.listManaged(second)).toEqual([
      { ...item, inputHash: null, submittedAt: later.toISOString() },
    ]);
  });

  it('records unknown first-insert success durably and isolates environment, account and source', async () => {
    const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
    const target = scope();
    const claim = (await repository.claimRun(target, at))!;
    expect(await repository.manageOffer(claim, item, at)).toBe(true);
    expect(await repository.listManaged(claim)).toEqual([{ ...item, inputHash: null, submittedAt: null }]);
    for (const isolated of [
      { ...target, environment: 'PRD' },
      { ...target, accountId: 'other' },
      { ...target, dataSourceId: 'other' },
    ]) {
      const isolatedClaim = (await repository.claimRun(isolated, at))!;
      expect(await repository.listManaged(isolatedClaim)).toEqual([]);
      expect(await repository.removeManaged(isolatedClaim, item.variantId, at)).toBe(false);
    }
    expect(await repository.removeManaged(claim, item.variantId, at)).toBe(true);
  });

  it('refuses runs before quota reset and retains the block until a fenced verification clears it', async () => {
    const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
    const target = scope();
    const claim = (await repository.claimRun(target, at))!;
    const reset = new Date('2026-10-28T12:00:00Z');
    expect(await repository.deferQuota(claim, reset, at)).toBe(true);
    expect(await repository.finishRun(claim, 'previous', at)).toBe(true);
    expect(await repository.claimRun(target, new Date(reset.getTime() - 1))).toBeNull();
    const blocked = (await repository.claimRun(target, reset))!;
    expect(blocked).toMatchObject({ quotaBlocked: true, cursor: 'previous' });
    // A failed quota check does not clear persisted state.
    expect(await repository.finishRun(blocked, 'previous', reset)).toBe(true);
    const retryAt = new Date(reset.getTime() + 15 * 60000);
    const verified = (await repository.claimRun(target, retryAt))!;
    expect(verified.quotaBlocked).toBe(true);
    expect(await repository.clearQuotaBlock(verified, retryAt)).toBe(true);
    expect(await repository.finishRun(verified, 'previous', retryAt)).toBe(true);
    expect(await repository.claimRun(target, new Date(retryAt.getTime() + 15 * 60000))).toMatchObject({
      quotaBlocked: false,
    });
  });

  it('uses one atomic claim statement and no offer writes for an unchanged ledger read', async () => {
    let statements = 0;
    const db = new Proxy(env.COMMERCE_DB, {
      get(target, property) {
        if (property === 'prepare')
          return (sql: string) => {
            statements++;
            return target.prepare(sql);
          };
        return Reflect.get(target, property);
      },
    });
    const repository = new D1MerchantSyncRepository(db);
    const claim = (await repository.claimRun(scope(), at))!;
    await repository.listManaged(claim);
    await repository.finishRun(claim, null, at);
    expect(statements).toBe(3);
    // SQL statement count is a local budget; account billing also counts scanned rows and index writes.
    expect(
      await env.COMMERCE_DB.prepare('SELECT COUNT(*) AS count FROM "MerchantManagedOffer" WHERE "scope" = ?')
        .bind(JSON.stringify([claim.scope.environment, claim.scope.accountId, claim.scope.dataSourceId]))
        .first('count'),
    ).toBe(0);
  });

  it('measures the D1 ledger budget for two first submissions', async () => {
    const usage = { statements: 0, rowsRead: 0, rowsWritten: 0 };
    const track = (statement: D1PreparedStatement): D1PreparedStatement =>
      new Proxy(statement, {
        get(target, property) {
          if (property === 'bind') return (...values: unknown[]) => track(target.bind(...values));
          if (property === 'first' || property === 'all' || property === 'run')
            return async () => {
              // all() exposes the same SQL result plus metadata that first() otherwise discards.
              const response = await target.all();
              usage.statements++;
              usage.rowsRead += response.meta.rows_read;
              usage.rowsWritten += response.meta.rows_written;
              return property === 'first' ? (response.results[0] ?? null) : response;
            };
          return Reflect.get(target, property);
        },
      });
    const db = new Proxy(env.COMMERCE_DB, {
      get(target, property) {
        return property === 'prepare' ? (sql: string) => track(target.prepare(sql)) : Reflect.get(target, property);
      },
    });
    const repository = new D1MerchantSyncRepository(db);
    const items = Array.from({ length: 5 }, (_, id) => ({ variantId: `v${id}`, storeItemSlug: `item-${id}` }));
    const outcome = await runMerchantSynchronization({
      repository,
      scope: scope(),
      now: at,
      currentTime: () => at,
      readCatalog: async () => ({ revision: 'accepted', items }),
      isCurrent: async () => true,
      readInput: async (value): Promise<MerchantProductInput> => ({
        offerId: value.variantId,
        contentLanguage: 'en',
        feedLabel: 'GR',
        productAttributes: {
          title: 'Record',
          description: 'Record',
          link: 'https://example.com/record',
          imageLink: 'https://example.com/image.jpg',
          availability: 'IN_STOCK',
          condition: 'NEW',
          price: { amountMicros: '10000000', currencyCode: 'EUR' },
        },
      }),
      provider: { upsert: async () => {}, remove: async () => {} },
    });
    expect(outcome).toMatchObject({ checked: 2, upserted: 2 });
    expect(usage.statements).toBe(11);
    expect(usage.rowsRead).toBeGreaterThan(0);
    expect(usage.rowsWritten).toBeGreaterThan(0);
    console.info('Merchant local D1 two-submission ledger budget', usage);
  });
});
