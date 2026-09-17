import { describe, expect, it } from 'vitest';

import { formatDayMonthYear } from './content';

describe('content date formatting', () => {
  it('formats day-level release dates without local timezone drift', () => {
    expect(formatDayMonthYear(new Date('2026-09-01T00:00:00.000Z'))).toBe('Sep 1, 2026');
  });

  it('formats calendar dates in Greece time', () => {
    expect(formatDayMonthYear(new Date('2026-08-31T22:30:00.000Z'))).toBe('Sep 1, 2026');
  });
});
