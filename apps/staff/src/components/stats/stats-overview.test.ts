import { describe, expect, it } from 'vitest';
import type { StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import {
  figureChange,
  formatFigure,
  leadSentence,
  overviewFigures,
  overviewLocation,
  parseOverviewRange,
  periodSentence,
  statsLink,
} from './stats-overview';

const report = (
  source: StaffStatsReport['source'],
  totals: Record<string, number | null>,
  previous: Record<string, number | null> | null,
  status: StaffStatsReport['status'] = 'ok',
): StaffStatsReport => ({
  source,
  range: '7d',
  status,
  generatedAt: '2026-10-27T09:06:00Z',
  timezone: 'UTC',
  period: { start: '2026-10-21', end: '2026-10-27', previousStart: '2026-10-14', previousEnd: '2026-10-20' },
  totals,
  previous,
  daily: [{ date: '2026-10-27', available: status === 'ok', metrics: totals }],
  fields: [],
  breakdowns: [],
  notes: [],
  complete: true,
  latestDate: '2026-10-24',
  moneyBasis: source === 'store' ? 'paid_total' : null,
});

describe('Overview figures', () => {
  const reports = {
    visits: report('visits', { visits: 136 }, { visits: 112 }),
    store: report('store', { paidOrders: 4, paidTotalMinor: 9900 }, { paidOrders: 3, paidTotalMinor: 7200 }),
    search: report('search', {}, null, 'not_configured'),
  };

  it('reads each figure from its source and keeps a missing source distinct from zero', () => {
    const figures = overviewFigures(reports, '7d');
    expect(figures.map((figure) => [figure.key, figure.value, figure.previous])).toEqual([
      ['visits', 136, 112],
      ['paidOrders', 4, 3],
      ['paidTotalMinor', 9900, 7200],
      ['clicks', null, null],
    ]);
    expect(formatFigure(figures[2]!)).toBe('€99');
  });

  it('states the change with a sign and percentage so it never depends on colour', () => {
    expect(figureChange({ key: 'visits', value: 136, previous: 112 })).toEqual({ direction: 'up', text: '+24 (21%)' });
    expect(figureChange({ key: 'paidTotalMinor', value: 7200, previous: 9900 })).toEqual({
      direction: 'down',
      text: '−€27 (27%)',
    });
    expect(figureChange({ key: 'paidOrders', value: 2, previous: 0 })).toEqual({ direction: 'up', text: '+2' });
    expect(figureChange({ key: 'paidOrders', value: 3, previous: 3 })?.direction).toBe('same');
    expect(figureChange({ key: 'clicks', value: 3, previous: null })).toBeNull();
  });

  it('writes one sentence from real figures only', () => {
    expect(leadSentence(overviewFigures(reports, '7d'), '7d')).toBe(
      '136 visits and 4 paid orders worth €99. Visits are up 21% on the 7 days before.',
    );
    expect(leadSentence(overviewFigures({ store: reports.store }, 'today'), 'today')).toBe('4 paid orders worth €99.');
    expect(leadSentence(overviewFigures({}, '7d'), '7d')).toBeNull();
  });

  it('links each figure to its comparison in Stats and keeps the period in the URL', () => {
    expect(statsLink('store', 'paidTotalMinor', '30d')).toBe(
      '/stats/?range=30d&report=store&compare=true&store.metric=paidTotalMinor',
    );
    expect(parseOverviewRange('?range=30d')).toBe('30d');
    expect(parseOverviewRange('?range=90d')).toBe('7d');
    expect(overviewLocation('7d')).toBe('/');
    expect(periodSentence('7d', new Date('2026-10-27T10:00:00Z'))).toBe(
      'Last 7 days, 21 Oct – 27 Oct 2026, against the 7 days before',
    );
  });
});
