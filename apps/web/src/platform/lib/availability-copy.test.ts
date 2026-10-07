import { describe, expect, it } from 'vitest';

import {
  availabilityChipText,
  availabilityLabel,
  availabilityNote,
  availabilityTone,
  expectedMonthText,
  isNotifiable,
} from './availability-copy';

describe('availability copy', () => {
  it.each([
    ['coming_soon', 'Coming Soon', 'incoming', true, 'First pressing on its way'],
    ['repressing', 'Repressing', 'incoming', true, 'More copies being pressed'],
    ['sold_out', 'Sold Out', 'sold-out', false, ''],
    ['stocked', null, null, false, ''],
    ['unavailable', null, null, false, ''],
    ['out_of_stock', null, null, false, ''],
    [undefined, null, null, false, ''],
  ])('%s reads %s', (state, label, tone, notifiable, note) => {
    expect(availabilityLabel(state)).toBe(label);
    expect(availabilityTone(state)).toBe(tone);
    expect(isNotifiable(state)).toBe(notifiable);
    expect(availabilityNote(state)).toBe(note);
  });

  it('formats expected months and ignores malformed ones', () => {
    expect(expectedMonthText('2026-11')).toBe('Expected November 2026');
    expect(expectedMonthText('2027-09')).toBe('Expected September 2027');
    expect(expectedMonthText('2026-13')).toBe('');
    expect(expectedMonthText('2026-11-01')).toBe('');
    expect(expectedMonthText(null)).toBe('');
  });

  it('puts a short month inside the card chip only for on-the-way states', () => {
    expect(availabilityChipText('coming_soon', '2026-11')).toBe('Coming Soon · Nov 2026');
    expect(availabilityChipText('repressing', '2026-09')).toBe('Repressing · Sep 2026');
    expect(availabilityChipText('repressing')).toBe('Repressing');
    expect(availabilityChipText('sold_out', '2026-11')).toBe('Sold Out');
    expect(availabilityChipText('unavailable', '2026-11')).toBe('');
  });
});
