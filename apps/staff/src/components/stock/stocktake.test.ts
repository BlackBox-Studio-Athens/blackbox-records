import { describe, expect, it } from 'vitest';
import { pendingChangeSchema, pendingCountSchema, recordProgress, stocktakeSchema, type Stocktake } from './stocktake';

describe('stocktake progress', () => {
  it('retains a fixed sequence, advances once and replaces a skipped result when confirmed', () => {
    const session: Stocktake = {
      items: [{ variantId: 'a' }, { variantId: 'b' }],
      index: 0,
      confirmed: [],
      skipped: [],
      q: '',
      area: 'all',
      format: '',
    };
    const skipped = recordProgress(session, 'skipped');
    expect(skipped.index).toBe(1);
    expect(skipped.skipped).toEqual(['a']);
    const confirmed = recordProgress({ ...skipped, index: 0 }, 'confirmed');
    expect(confirmed.skipped).toEqual([]);
    expect(confirmed.confirmed).toEqual(['a']);
    expect(recordProgress(confirmed, 'confirmed').index).toBe(1);
    expect(stocktakeSchema.safeParse({ ...session, index: 2 }).success).toBe(false);
    expect(stocktakeSchema.parse(JSON.parse(JSON.stringify(confirmed)))).toEqual(confirmed);
  });

  it('preserves a retry key when a pending intent has no notes', () => {
    const idempotencyKey = '123e4567-e89b-42d3-a456-426614174000';

    expect(
      pendingChangeSchema.safeParse({
        delta: 1,
        idempotencyKey,
        notes: null,
        reason: 'sale',
        variantId: 'variant-a',
      }).success,
    ).toBe(true);
    expect(
      pendingCountSchema.safeParse({
        countedQuantity: '5',
        expectedRevision: 2,
        idempotencyKey,
        notes: null,
        onlineQuantity: '5',
        variantId: 'variant-a',
      }).success,
    ).toBe(true);
  });
});
