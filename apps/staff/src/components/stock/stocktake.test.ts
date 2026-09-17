import { describe, expect, it } from 'vitest';
import { recordProgress, stocktakeSchema, type Stocktake } from './stocktake';

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
});
