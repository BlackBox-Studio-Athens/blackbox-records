import { describe, expect, it } from 'vitest';

import { formatDayMonthYear, formatMonthYear, formatYear } from './content';

describe('content date formatting', () => {
  it('uses the Athens month and year at UTC boundaries in summer and winter', () => {
    expect(formatMonthYear(new Date('2026-08-31T20:59:59Z'))).toBe('Aug 2026');
    expect(formatMonthYear(new Date('2026-08-31T21:00:00Z'))).toBe('Sep 2026');
    expect(formatMonthYear(new Date('2026-12-31T21:59:59Z'))).toBe('Dec 2026');
    expect(formatMonthYear(new Date('2026-12-31T22:00:00Z'))).toBe('Jan 2027');
    expect(formatYear(new Date('2026-12-31T22:00:00Z'))).toBe('2027');
    expect(formatMonthYear(undefined)).toBe('Date to be announced');
  });
  it('formats day-level release dates without local timezone drift', () => {
    expect(formatDayMonthYear(new Date('2026-09-01T00:00:00.000Z'))).toBe('Sep 1, 2026');
  });

  it('formats calendar dates in Greece time', () => {
    expect(formatDayMonthYear(new Date('2026-08-31T22:30:00.000Z'))).toBe('Sep 1, 2026');
  });
});
