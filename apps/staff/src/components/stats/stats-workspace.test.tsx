import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InternalAnalyticsApiError, type StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { createStatsWorkspace, idleRead, statsQueryKey } from './stats-workspace';
import { DatePanel, StatsView } from './StatsWorkspace';
import { briefSentence, sparkLabels, sparkState } from './stats-brief';
import {
  briefLocation,
  customDateError,
  groupStatsDays,
  initialBriefState,
  parseBriefLocation,
  periodDates,
} from './stats-model';

vi.mock('../../lib/staff-query', () => ({ useStaffRead: vi.fn() }));
vi.mock('../../lib/staff-navigation', () => ({ writeStaffLocation: vi.fn() }));
const query = { source: 'visits', range: '7d' } as const;
const report: StaffStatsReport = {
  source: 'visits',
  range: '7d',
  status: 'ok',
  generatedAt: '2026-10-19T10:00:00Z',
  timezone: 'UTC',
  period: { start: '2026-10-13', end: '2026-10-19', previousStart: '2026-10-06', previousEnd: '2026-10-12' },
  totals: { visits: 24, pageViews: 40 },
  previous: null,
  daily: [{ date: '2026-10-19', available: true, metrics: { visits: 24, pageViews: 40 } }],
  fields: [],
  breakdowns: [],
  notes: [],
  latestDate: '2026-10-19',
  complete: true,
  moneyBasis: null,
};

describe('report snapshots', () => {
  it('keys the complete query and preserves the snapshot after a failed refresh', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce(report)
      .mockRejectedValueOnce(new InternalAnalyticsApiError(503, 'Try again.', 'req_1'));
    const workspace = createStatsWorkspace(read);
    await workspace.load(query);
    await workspace.load(query, true);
    expect(workspace.getSnapshot().reads[statsQueryKey(query)]).toMatchObject({
      data: report,
      loading: false,
      error: { message: 'Try again.', requestId: 'req_1' },
    });
    expect(statsQueryKey({ ...query, page: '/store/' })).not.toBe(statsQueryKey(query));
  });
  it('ignores a superseded response and clears every snapshot after access denial', async () => {
    let finish!: (value: StaffStatsReport) => void;
    const read = vi
      .fn()
      .mockImplementationOnce(() => new Promise<StaffStatsReport>((resolve) => (finish = resolve)))
      .mockResolvedValueOnce({ ...report, status: 'not_configured' })
      .mockRejectedValueOnce(new InternalAnalyticsApiError(403, 'Denied.'));
    const workspace = createStatsWorkspace(read);
    const first = workspace.load(query);
    await workspace.load(query, true);
    finish(report);
    await first;
    expect(workspace.getSnapshot().reads[statsQueryKey(query)]?.data?.status).toBe('not_configured');
    await workspace.load({ ...query, page: '/store/' });
    expect(workspace.getSnapshot()).toEqual({ denied: true, reads: {} });
    await workspace.load(query, true);
    expect(read).toHaveBeenCalledTimes(3);
  });
  it('deduplicates recent reads and bounds cached queries', async () => {
    const read = vi.fn().mockResolvedValue(report),
      workspace = createStatsWorkspace(read);
    await workspace.load(query);
    await workspace.load(query);
    expect(read).toHaveBeenCalledTimes(1);
    for (let index = 0; index < 20; index++) await workspace.load({ ...query, page: `/${index}` });
    expect(Object.keys(workspace.getSnapshot().reads)).toHaveLength(12);
  });
});

describe('daily brief controls', () => {
  it('shows custom dates only for Custom and excludes redundant presets', () => {
    const props = { issue: null, onDraft: vi.fn(), onApply: vi.fn(), onCancel: vi.fn() };
    const preset = renderToStaticMarkup(
      <DatePanel {...props} draft={{ range: '30d', start: '2026-09-20', end: '2026-10-19' }} />,
    );
    expect(preset).toContain('30 days');
    expect(preset).not.toMatch(/Last month|Year to date|type="date"/);
    const custom = renderToStaticMarkup(
      <DatePanel {...props} draft={{ range: 'custom', start: '2026-09-20', end: '2026-10-19' }} />,
    );
    expect(custom.match(/type="date"/g)).toHaveLength(2);
    expect(custom).toContain('Start date');
    expect(custom).toContain('End date');
  });
  it('renders actual figures and hides them completely when Access expires', () => {
    const props = {
      state: initialBriefState(),
      reads: { visits: { ...idleRead, data: report }, store: idleRead, search: idleRead },
      onChange: vi.fn(),
      onRetry: vi.fn(),
    };
    expect(renderToStaticMarkup(<StatsView {...props} />)).toContain('24 visits.');
    const denied = renderToStaticMarkup(<StatsView {...props} denied />);
    expect(denied).toContain('Access required');
    expect(denied).not.toContain('24 visits.');
  });
  it('round trips independent filters, detail, metric and grain through the URL', () => {
    const state = initialBriefState();
    Object.assign(state, {
      range: 'custom',
      start: '2026-09-01',
      end: '2026-10-01',
      report: 'search',
      grain: 'Weeks',
      compare: true,
    });
    state.filters.visits = { page: '/store/' };
    state.filters.search = { query: 'black box & records' };
    state.metrics.search = 'position';
    expect(parseBriefLocation(new URL(briefLocation(state), 'http://local').search)).toEqual(state);
    expect(customDateError('2026-10-20', '2026-10-19', new Date('2026-10-19'))).toMatch(/end date/);
    expect(customDateError('2026-02-30', '2026-03-01', new Date('2026-10-19'))).toMatch(/valid calendar/);
    expect(periodDates('30d', new Date('2026-03-01'))).toEqual({ start: '2026-01-31', end: '2026-03-01' });
  });
  it('weights Search position and CTR by impressions and preserves wholly missing groups', () => {
    const points = groupStatsDays(
      [
        { date: '2026-10-01', available: true, metrics: { clicks: 1, impressions: 10, position: 2 } },
        { date: '2026-10-02', available: true, metrics: { clicks: 9, impressions: 90, position: 10 } },
        { date: '2026-11-01', available: false, metrics: {} },
      ],
      'Months',
    );
    expect(points[0]?.metrics).toMatchObject({ clicks: 10, impressions: 100, ctr: 10, position: 9.2 });
    expect(points[1]?.available).toBe(false);
    expect(points[1]?.partial).toBe(true);
  });
});

describe('Stats brief readability', () => {
  const day = (date: string, visits: number | null) => ({
    date,
    available: visits !== null,
    metrics: visits === null ? {} : { visits },
  });
  const withDays = (daily: ReturnType<typeof day>[]): StaffStatsReport => ({
    ...report,
    daily,
    totals: { visits: daily.reduce((sum, row) => sum + ((row.metrics.visits as number | undefined) ?? 0), 0) },
  });

  it('compares with the previous period unless a link turns it off', () => {
    expect(parseBriefLocation('').compare).toBe(true);
    expect(parseBriefLocation('?compare=true').compare).toBe(true);
    expect(parseBriefLocation('?compare=false').compare).toBe(false);
    expect(briefLocation(initialBriefState())).toBe('/stats/');
    expect(briefLocation({ ...initialBriefState(), compare: false })).toBe('/stats/?compare=false');
  });

  it('labels every day of a week and the ends and middle of longer periods', () => {
    const week = groupStatsDays(
      ['2026-10-21', '2026-10-22', '2026-10-23'].map((date) => day(date, 1)),
      'Days',
    );
    expect(sparkLabels(week, 'Days')).toEqual(['Wed', 'Thu', 'Fri']);
    const month = groupStatsDays(
      Array.from({ length: 9 }, (_, index) => day(`2026-10-0${index + 1}`, 1)),
      'Days',
    );
    expect(sparkLabels(month, 'Days')).toEqual(['1 Oct', '', '', '', '5 Oct', '', '', '', '9 Oct']);
  });

  it('tells a reported zero apart from missing days', () => {
    expect(sparkState(groupStatsDays([day('2026-10-21', 0), day('2026-10-22', 0)], 'Days'), 'visits')).toBe('zero');
    expect(sparkState(groupStatsDays([day('2026-10-21', null)], 'Days'), 'visits')).toBe('missing');
    expect(sparkState(groupStatsDays([day('2026-10-21', null), day('2026-10-22', 3)], 'Days'), 'visits')).toBe(
      'values',
    );
    const zero = renderToStaticMarkup(
      <StatsView
        state={initialBriefState()}
        reads={{
          visits: { ...idleRead, data: withDays([day('2026-10-21', 0), day('2026-10-22', 0)]) },
          store: idleRead,
          search: idleRead,
        }}
        onChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(zero).toContain('No visits in these dates.');
    expect(zero).not.toContain('stats-brief-spark');
    const gaps = renderToStaticMarkup(
      <StatsView
        state={initialBriefState()}
        reads={{
          visits: { ...idleRead, data: withDays([day('2026-10-21', null), day('2026-10-22', 4)]) },
          store: idleRead,
          search: idleRead,
        }}
        onChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(gaps).toContain('data-state="missing"');
    expect(gaps).toContain('Hatched days have no figures yet.');
    expect(gaps).toContain('Highest 4');
  });

  it('opens with reported figures only, without filler', () => {
    const store: StaffStatsReport = {
      ...report,
      source: 'store',
      totals: { paidOrders: 4, paidTotalMinor: 9900 },
    };
    expect(briefSentence(report, store)).toBe('24 visits and 4 paid orders worth €99.');
    expect(briefSentence(null, { ...store, totals: { paidOrders: 0, paidTotalMinor: 0 } })).toBe('No paid orders.');
    expect(briefSentence(null, null)).toBeNull();
    const html = renderToStaticMarkup(
      <StatsView
        state={initialBriefState()}
        reads={{ visits: idleRead, store: idleRead, search: idleRead }}
        onChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(html).not.toContain('at a glance');
    expect(html).toContain('checked=""');
  });
});
