import { describe, expect, it } from 'vitest';
import { athensToday, preorderBadges, preorderPreview, shipEstimateText, type ShipEstimate } from './preorder-preview';

describe('staff pre-order wording', () => {
  it.each([
    [{ kind: 'month', month: '2026-10', part: null }, 'around October 2026'],
    [{ kind: 'month', month: '2026-10', part: 'early' }, 'around early October 2026'],
    [{ kind: 'month', month: '2026-10', part: 'mid' }, 'around mid October 2026'],
    [{ kind: 'month', month: '2026-10', part: 'late' }, 'around late October 2026'],
    [{ kind: 'date', date: '2026-10-20' }, 'on 20 October 2026'],
  ] satisfies [ShipEstimate, string][])('formats %j', (estimate, text) => {
    expect(shipEstimateText(estimate)).toBe(text);
  });

  it.each([
    ['2026-10-15', { kind: 'month', month: '2026-10', part: null }, ['Pre-order · out 16 Oct 2026']],
    [
      '2026-10-16',
      { kind: 'month', month: '2026-10', part: null },
      ['Out now', 'Pre-order · ships around October 2026'],
    ],
    ['2026-10-17', { kind: 'date', date: '2026-10-20' }, ['Out now', 'Pre-order · ships 20 Oct 2026']],
    ['2026-10-17', null, ['Out now', 'Pre-order']],
  ] satisfies [string, ShipEstimate | null, string[]][])(
    'matches shopper badges on %s',
    (today, shipEstimate, rows) => {
      expect(preorderBadges({ releaseDate: '2026-10-16', today, shipEstimate })).toEqual(rows);
    },
  );

  it('keeps the pre-order alone without an editorial release date', () => {
    expect(preorderBadges({ today: '2026-10-01', shipEstimate: null })).toEqual(['Pre-order']);
    expect(preorderPreview({ kind: 'month', month: '2026-10', part: 'late' }, '2026-10-02')).toEqual([
      'Pre-order · ships around late October 2026',
    ]);
  });

  it('withholds a passed month and ends exact dates on the date', () => {
    expect(preorderPreview({ kind: 'month', month: '2026-09', part: null }, '2026-10-02')).toEqual(['Pre-order']);
    expect(preorderPreview({ kind: 'date', date: '2026-10-20' }, '2026-10-19')).toEqual([
      'Pre-order · ships 20 Oct 2026',
    ]);
    expect(preorderPreview({ kind: 'date', date: '2026-10-20' }, '2026-10-20')).toEqual(['Not on pre-order']);
    expect(preorderPreview({ kind: 'date', date: '2026-10-20' }, '2026-10-21')).toEqual(['Not on pre-order']);
    expect(preorderPreview(null, '2026-10-02')).toEqual(['Not on pre-order']);
  });

  it('uses the Athens calendar across midnight and daylight saving', () => {
    expect(athensToday(new Date('2026-10-02T20:59:59Z'))).toBe('2026-10-02');
    expect(athensToday(new Date('2026-10-02T21:00:00Z'))).toBe('2026-10-03');
    expect(athensToday(new Date('2026-10-25T22:00:00Z'))).toBe('2026-10-26');
  });
});
