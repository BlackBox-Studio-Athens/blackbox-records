import { describe, expect, it } from 'vitest';

import {
  latestShipEstimate,
  preorderBadges,
  preorderChipText,
  shipEstimateText,
  type ShipEstimate,
} from './preorder-estimate';

const month = (value: string, part: 'early' | 'mid' | 'late' | null = null): ShipEstimate => ({
  kind: 'month',
  month: value,
  part,
});
const date = (value: string): ShipEstimate => ({ kind: 'date', date: value });

describe('shipEstimateText', () => {
  it.each([
    [month('2026-10'), 'around October 2026'],
    [month('2026-10', 'early'), 'around early October 2026'],
    [month('2026-10', 'mid'), 'around mid October 2026'],
    [month('2026-10', 'late'), 'around late October 2026'],
    [date('2026-10-20'), 'on 20 October 2026'],
    [date('2026-12-05'), 'on 5 December 2026'],
  ])('words %j as %s', (estimate, text) => {
    expect(shipEstimateText(estimate)).toBe(text);
  });
});

describe('preorderBadges', () => {
  const releaseDate = '2026-10-16';
  const at = (iso: string) => new Date(iso);

  it('shows the release date before it', () => {
    expect(preorderBadges({ releaseDate, shipEstimate: month('2026-10'), today: at('2026-10-15T23:59:59Z') })).toEqual([
      'Pre-order · out 16 Oct 2026',
    ]);
  });

  it('switches to Out now on the UTC release day', () => {
    expect(preorderBadges({ releaseDate, shipEstimate: month('2026-10'), today: at('2026-10-16T00:00:00Z') })).toEqual([
      'Out now',
      'Pre-order · ships around October 2026',
    ]);
  });

  it('accepts a Date release date', () => {
    expect(
      preorderBadges({
        releaseDate: new Date('2026-10-16T00:00:00Z'),
        shipEstimate: null,
        today: at('2026-10-01T12:00:00Z'),
      }),
    ).toEqual(['Pre-order · out 16 Oct 2026']);
  });

  it('words a month estimate after release', () => {
    expect(
      preorderBadges({ releaseDate, shipEstimate: month('2026-10', 'late'), today: at('2026-11-01T00:00:00Z') }),
    ).toEqual(['Out now', 'Pre-order · ships around late October 2026']);
  });

  it('words an exact date after release', () => {
    expect(
      preorderBadges({ releaseDate, shipEstimate: date('2026-10-20'), today: at('2026-10-17T00:00:00Z') }),
    ).toEqual(['Out now', 'Pre-order · ships 20 Oct 2026']);
  });

  it('drops the estimate when withheld', () => {
    expect(preorderBadges({ releaseDate, shipEstimate: null, today: at('2026-10-17T00:00:00Z') })).toEqual([
      'Out now',
      'Pre-order',
    ]);
  });

  it('shows the pre-order badge alone without a release date', () => {
    const today = at('2026-10-17T00:00:00Z');

    expect(preorderBadges({ shipEstimate: month('2026-10'), today })).toEqual([
      'Pre-order · ships around October 2026',
    ]);
    expect(preorderBadges({ releaseDate: null, shipEstimate: date('2026-10-20'), today })).toEqual([
      'Pre-order · ships 20 Oct 2026',
    ]);
    expect(preorderBadges({ releaseDate: undefined, shipEstimate: null, today })).toEqual(['Pre-order']);
  });
});

describe('preorderChipText', () => {
  it('matches the post-release badge wording', () => {
    expect(preorderChipText(month('2026-10'))).toBe('Pre-order · ships around October 2026');
    expect(preorderChipText(date('2026-10-20'))).toBe('Pre-order · ships 20 Oct 2026');
    expect(preorderChipText(null)).toBe('Pre-order');
  });
});

describe('latestShipEstimate', () => {
  it('is null for an empty list', () => {
    expect(latestShipEstimate([])).toBeNull();
  });

  it('is null when any estimate is withheld', () => {
    expect(latestShipEstimate([month('2026-10'), null])).toBeNull();
  });

  it('picks the latest month and treats a bare month as its end', () => {
    const early = month('2026-10', 'early');
    const bare = month('2026-10');

    expect(latestShipEstimate([early, month('2026-09', 'late')])).toBe(early);
    expect(latestShipEstimate([month('2026-10', 'mid'), early])).toEqual(month('2026-10', 'mid'));
    expect(latestShipEstimate([month('2026-10', 'late'), month('2026-10', 'mid'), bare])).toEqual(
      month('2026-10', 'late'),
    );
    expect(latestShipEstimate([month('2026-10', 'mid'), bare])).toBe(bare);
  });

  it('orders exact dates against months by their sort day', () => {
    const exact = date('2026-10-25');

    expect(latestShipEstimate([month('2026-10', 'mid'), exact])).toBe(exact);
    expect(latestShipEstimate([exact, month('2026-10', 'late')])).toEqual(month('2026-10', 'late'));
    expect(latestShipEstimate([date('2026-10-02'), month('2026-10', 'early')])).toEqual(month('2026-10', 'early'));
  });
});
