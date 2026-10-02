import { describe, expect, it } from 'vitest';

import {
  athensToday,
  deriveShopperPreorder,
  isPreorderOpen,
  latestShipEstimate,
  parsePreorderShipEstimate,
  samePreorderShipEstimate,
  stockPreorderFromColumns,
  type PreorderShipEstimate,
  type StockPreorder,
} from './';

const month = (value: string, part: 'early' | 'mid' | 'late' | null = null): PreorderShipEstimate => ({
  kind: 'month',
  month: value,
  part,
});
const date = (value: string): PreorderShipEstimate => ({ kind: 'date', date: value });
const stockPreorder = (shipEstimate: PreorderShipEstimate): StockPreorder => ({
  shipEstimate,
  startedAt: '2026-10-01T09:00:00.000Z',
});

describe('athensToday', () => {
  it('uses the Athens calendar date across midnight', () => {
    // Winter (UTC+2): 22:30Z is already the next day in Athens.
    expect(athensToday(new Date('2026-01-10T21:59:59Z'))).toBe('2026-01-10');
    expect(athensToday(new Date('2026-01-10T22:00:00Z'))).toBe('2026-01-11');
  });

  it('follows daylight saving time', () => {
    // Summer (UTC+3): the day turns at 21:00Z.
    expect(athensToday(new Date('2026-07-10T20:59:59Z'))).toBe('2026-07-10');
    expect(athensToday(new Date('2026-07-10T21:00:00Z'))).toBe('2026-07-11');
    // Clocks go forward on 2026-03-29 and back on 2026-10-25.
    expect(athensToday(new Date('2026-03-28T21:59:59Z'))).toBe('2026-03-28');
    expect(athensToday(new Date('2026-03-28T22:00:00Z'))).toBe('2026-03-29');
    expect(athensToday(new Date('2026-10-24T20:59:59Z'))).toBe('2026-10-24');
    expect(athensToday(new Date('2026-10-24T21:00:00Z'))).toBe('2026-10-25');
  });
});

describe('parsePreorderShipEstimate', () => {
  it('accepts months with and without a part, and exact dates', () => {
    expect(parsePreorderShipEstimate({ kind: 'month', month: '2026-10', part: null })).toEqual(month('2026-10'));
    expect(parsePreorderShipEstimate({ kind: 'month', month: '2026-10', part: 'mid' })).toEqual(
      month('2026-10', 'mid'),
    );
    expect(parsePreorderShipEstimate({ kind: 'date', date: '2026-10-20' })).toEqual(date('2026-10-20'));
  });

  it.each([
    null,
    'October',
    {},
    { kind: 'week', week: '2026-W40' },
    { kind: 'month', month: '2026-13', part: null },
    { kind: 'month', month: '2026-1', part: null },
    { kind: 'month', month: '2026-10', part: 'later' },
    { kind: 'month', month: '2026-10' },
    { kind: 'date', date: '2026-02-30' },
    { kind: 'date', date: '2026-10' },
    { kind: 'date', date: 20261020 },
  ])('rejects malformed input %j', (value) => {
    expect(() => parsePreorderShipEstimate(value)).toThrow();
  });
});

describe('stockPreorderFromColumns', () => {
  const empty = { preorderStartedAt: null, preorderShipMonth: null, preorderShipPart: null, preorderShipDate: null };

  it('is null when no pre-order is started', () => {
    expect(stockPreorderFromColumns(empty)).toBeNull();
  });

  it('copies the start instant verbatim and reads month or date', () => {
    const startedAt = '2026-10-01T09:00:00.000Z';
    expect(stockPreorderFromColumns({ ...empty, preorderStartedAt: startedAt, preorderShipMonth: '2026-10' })).toEqual({
      shipEstimate: month('2026-10'),
      startedAt,
    });
    expect(
      stockPreorderFromColumns({
        ...empty,
        preorderStartedAt: startedAt,
        preorderShipMonth: '2026-10',
        preorderShipPart: 'late',
      }),
    ).toEqual({ shipEstimate: month('2026-10', 'late'), startedAt });
    expect(
      stockPreorderFromColumns({ ...empty, preorderStartedAt: startedAt, preorderShipDate: '2026-10-20' }),
    ).toEqual({ shipEstimate: date('2026-10-20'), startedAt });
  });

  it('throws on a started pre-order without an estimate', () => {
    expect(() => stockPreorderFromColumns({ ...empty, preorderStartedAt: '2026-10-01T09:00:00.000Z' })).toThrow();
  });
});

describe('isPreorderOpen and deriveShopperPreorder', () => {
  it('keeps a month estimate open, current or passed', () => {
    expect(isPreorderOpen(stockPreorder(month('2026-10')), '2026-10-15')).toBe(true);
    expect(isPreorderOpen(stockPreorder(month('2026-09')), '2026-10-15')).toBe(true);
  });

  it('shows the estimate for the current month, and for a later one', () => {
    expect(deriveShopperPreorder(stockPreorder(month('2026-10', 'early')), '2026-10-31')).toEqual({
      shipEstimate: month('2026-10', 'early'),
    });
    expect(deriveShopperPreorder(stockPreorder(month('2027-01')), '2026-10-31')).toEqual({
      shipEstimate: month('2027-01'),
    });
  });

  it('withholds a passed month but keeps the pre-order', () => {
    expect(deriveShopperPreorder(stockPreorder(month('2026-09', 'late')), '2026-10-01')).toEqual({
      shipEstimate: null,
    });
    expect(deriveShopperPreorder(stockPreorder(month('2025-12')), '2026-01-01')).toEqual({ shipEstimate: null });
  });

  it('keeps an exact date open until it arrives', () => {
    const preorder = stockPreorder(date('2026-10-20'));
    expect(isPreorderOpen(preorder, '2026-10-19')).toBe(true);
    expect(isPreorderOpen(preorder, '2026-10-20')).toBe(false);
    expect(isPreorderOpen(preorder, '2026-10-21')).toBe(false);
    expect(deriveShopperPreorder(preorder, '2026-10-19')).toEqual({ shipEstimate: date('2026-10-20') });
    expect(deriveShopperPreorder(preorder, '2026-10-20')).toBeNull();
    expect(deriveShopperPreorder(preorder, '2026-10-21')).toBeNull();
  });

  it('is null without a pre-order', () => {
    expect(deriveShopperPreorder(null, '2026-10-01')).toBeNull();
  });
});

describe('samePreorderShipEstimate', () => {
  it('compares kind, month, part and date', () => {
    expect(samePreorderShipEstimate(month('2026-10'), month('2026-10'))).toBe(true);
    expect(samePreorderShipEstimate(month('2026-10'), month('2026-10', 'mid'))).toBe(false);
    expect(samePreorderShipEstimate(month('2026-10'), month('2026-11'))).toBe(false);
    expect(samePreorderShipEstimate(date('2026-10-20'), date('2026-10-20'))).toBe(true);
    expect(samePreorderShipEstimate(date('2026-10-20'), date('2026-10-21'))).toBe(false);
    expect(samePreorderShipEstimate(month('2026-10'), date('2026-10-20'))).toBe(false);
    expect(samePreorderShipEstimate(date('2026-10-20'), month('2026-10'))).toBe(false);
  });
});

describe('latestShipEstimate', () => {
  it('is null for an empty list', () => {
    expect(latestShipEstimate([])).toBeNull();
  });

  it('is null when any entry is withheld', () => {
    expect(latestShipEstimate([month('2026-10'), null])).toBeNull();
    expect(latestShipEstimate([null, month('2026-10')])).toBeNull();
  });

  it('orders months by their last day and parts as day 10, 20 and 31', () => {
    expect(latestShipEstimate([month('2026-10', 'early'), month('2026-10', 'mid')])).toEqual(month('2026-10', 'mid'));
    expect(latestShipEstimate([month('2026-10', 'late'), month('2026-10', 'mid')])).toEqual(month('2026-10', 'late'));
    expect(latestShipEstimate([month('2026-10', 'late'), month('2026-10')])).toEqual(month('2026-10', 'late'));
    expect(latestShipEstimate([month('2026-10'), month('2026-11', 'early')])).toEqual(month('2026-11', 'early'));
  });

  it('compares months with exact dates', () => {
    expect(latestShipEstimate([date('2026-10-25'), month('2026-10', 'mid')])).toEqual(date('2026-10-25'));
    expect(latestShipEstimate([date('2026-10-05'), month('2026-10', 'early')])).toEqual(month('2026-10', 'early'));
    expect(latestShipEstimate([date('2026-10-20'), month('2026-11')])).toEqual(month('2026-11'));
  });

  it('returns the only estimate', () => {
    expect(latestShipEstimate([date('2026-10-20')])).toEqual(date('2026-10-20'));
  });
});
