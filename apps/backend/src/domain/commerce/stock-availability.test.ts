import { describe, expect, it } from 'vitest';

import { createStockQuantity } from './quantities';
import { classifyStoreStockAvailability, readExpectedMonth, storeStockAvailabilityLabels } from './stock-availability';

const available = { status: 'available', canBuy: true } as const;
const stock = (onlineQuantity: number, zeroStockState: 'coming_soon' | 'repressing' | 'sold_out' = 'sold_out') => ({
  onlineQuantity: createStockQuantity(onlineQuantity),
  zeroStockState,
});

describe('classifyStoreStockAvailability', () => {
  it.each(['coming_soon', 'repressing', 'sold_out'] as const)(
    'reports the %s choice once stock is depleted',
    (state) => {
      expect(classifyStoreStockAvailability(available, stock(0, state))).toBe(state);
      expect(classifyStoreStockAvailability({ status: 'sold_out', canBuy: false }, stock(0, state))).toBe(state);
    },
  );

  it.each(['coming_soon', 'repressing', 'sold_out'] as const)('ignores the %s choice while stock remains', (state) => {
    expect(classifyStoreStockAvailability(available, stock(2, state))).toBe('stocked');
  });

  it('reports unavailable for a pause, a missing availability record or non-buyable positive stock', () => {
    expect(classifyStoreStockAvailability({ status: 'available', canBuy: false }, stock(0, 'coming_soon'))).toBe(
      'unavailable',
    );
    expect(classifyStoreStockAvailability({ status: 'available', canBuy: false }, null)).toBe('unavailable');
    expect(classifyStoreStockAvailability(null, stock(0, 'coming_soon'))).toBe('unavailable');
    expect(classifyStoreStockAvailability({ status: 'sold_out', canBuy: false }, stock(2))).toBe('unavailable');
  });

  it('reads a missing stock record as zero stock with the Sold Out default', () => {
    expect(classifyStoreStockAvailability(available, null)).toBe('sold_out');
    expect(classifyStoreStockAvailability({ status: 'sold_out', canBuy: false }, null)).toBe('sold_out');
  });

  it('labels every state in shopper Title Case', () => {
    expect(storeStockAvailabilityLabels).toEqual({
      stocked: 'Available',
      coming_soon: 'Coming Soon',
      repressing: 'Repressing',
      sold_out: 'Sold Out',
      unavailable: 'Unavailable',
    });
  });
});

describe('readExpectedMonth', () => {
  const today = '2026-11-01';

  it.each([
    ['coming_soon', '2026-11', '2026-11'],
    ['repressing', '2027-02', '2027-02'],
    ['coming_soon', '2026-10', undefined],
    ['repressing', null, undefined],
    ['sold_out', '2026-12', undefined],
    ['stocked', '2026-12', undefined],
    ['unavailable', '2026-12', undefined],
  ] as const)('reads %s with %s as %s', (state, expectedMonth, shown) => {
    expect(readExpectedMonth(state, { expectedMonth }, today)).toBe(shown);
  });

  it('reads nothing without a stock record', () => {
    expect(readExpectedMonth('coming_soon', null, today)).toBeUndefined();
  });
});
