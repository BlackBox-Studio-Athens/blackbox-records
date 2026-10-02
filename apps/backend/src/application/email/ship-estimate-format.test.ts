import { expect, test } from 'vitest';
import { latestEmailShipEstimate, shipEstimateText } from './ship-estimate-format';
import type { EmailShipEstimate } from './types';

test.each([
  [{ kind: 'month', month: '2026-10', part: null }, 'around October 2026'],
  [{ kind: 'month', month: '2026-10', part: 'early' }, 'around early October 2026'],
  [{ kind: 'month', month: '2026-10', part: 'mid' }, 'around mid October 2026'],
  [{ kind: 'month', month: '2026-10', part: 'late' }, 'around late October 2026'],
  [{ kind: 'date', date: '2026-10-20' }, 'on 20 October 2026'],
  [null, 'To be confirmed'],
] satisfies Array<[EmailShipEstimate | null, string]>)('formats %j as %s', (estimate, expected) => {
  expect(shipEstimateText(estimate)).toBe(expected);
});

test('selects the latest month, part or date and withholds the summary if any estimate is unknown', () => {
  const early: EmailShipEstimate = { kind: 'month', month: '2026-10', part: 'early' };
  const mid: EmailShipEstimate = { kind: 'month', month: '2026-10', part: 'mid' };
  const date: EmailShipEstimate = { kind: 'date', date: '2026-10-21' };
  const month: EmailShipEstimate = { kind: 'month', month: '2026-10', part: null };
  expect(latestEmailShipEstimate([date, early, mid])).toEqual(date);
  expect(latestEmailShipEstimate([mid, early])).toEqual(mid);
  expect(latestEmailShipEstimate([date, month])).toEqual(month);
  expect(latestEmailShipEstimate([null, date])).toBeNull();
  expect(latestEmailShipEstimate([date, null])).toBeNull();
  expect(latestEmailShipEstimate([])).toBeNull();
});
