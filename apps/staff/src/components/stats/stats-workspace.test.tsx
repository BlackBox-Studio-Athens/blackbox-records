import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  InternalAnalyticsApiError,
  type SearchStats,
  type SiteAnalytics,
  type StoreStats,
} from '../../lib/backend/internal-analytics-api';
import { createStatsWorkspace, type StatsState } from './stats-workspace';
import { StatsView } from './StatsWorkspace';

vi.mock('../../lib/staff-query', () => ({ useStaffRead: vi.fn() }));
vi.mock('../../lib/staff-navigation', () => ({ writeStaffLocation: vi.fn() }));

const notConfigured: SiteAnalytics = {
  range: '7d',
  generatedAt: null,
  status: 'not_configured',
  daily: [],
  topPaths: [],
  topReferrers: [],
  topCountries: [],
  deviceTypes: [],
};
const ok: SiteAnalytics = {
  ...notConfigured,
  status: 'ok',
  generatedAt: '2026-10-12T14:00:00.000Z',
  daily: [
    { date: '2026-10-11', visits: 64, pageViews: 151 },
    { date: '2026-10-12', visits: 31, pageViews: 74.6 },
  ],
  topPaths: [{ path: '/store/', visits: 96, pageViews: 214 }],
  topReferrers: [{ host: '', visits: 201, pageViews: 486 }],
  topCountries: [
    { country: 'GR', visits: 318, pageViews: 801 },
    { country: 'XX', visits: 3, pageViews: 4 },
  ],
  deviceTypes: [{ deviceType: 'mobile', visits: 301, pageViews: 663 }],
};
const unavailable = 'Analytics is temporarily unavailable. Try again.';
const reads = <T,>(read: Partial<StatsState<T>['reads']['7d']> = {}, denied = false): StatsState<T> => ({
  range: '7d',
  denied,
  reads: {
    '7d': { data: null, loading: false, error: null, ...read },
    '30d': { data: null, loading: false, error: null },
  },
});
const state = (read: Partial<StatsState<SiteAnalytics>['reads']['7d']>, denied = false) => ({
  site: reads(read, denied),
});
const view = ({
  site,
  store = reads<StoreStats>(),
  search = reads<SearchStats>(),
}: {
  site: StatsState<SiteAnalytics>;
  store?: StatsState<StoreStats>;
  search?: StatsState<SearchStats>;
}) => renderToStaticMarkup(<StatsView site={site} store={store} search={search} onRange={vi.fn()} onRetry={vi.fn()} />);

describe('Stats read state', () => {
  it('keeps the last snapshot and request ID when a later read fails', async () => {
    const readAnalytics = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockRejectedValueOnce(new InternalAnalyticsApiError(503, unavailable, 'req_1'));
    const workspace = createStatsWorkspace(readAnalytics, unavailable);
    await workspace.load('7d');
    await workspace.load('7d');
    expect(readAnalytics).toHaveBeenCalledWith('7d');
    expect(workspace.getSnapshot().reads['7d']).toEqual({
      data: ok,
      loading: false,
      error: { message: unavailable, requestId: 'req_1' },
    });
  });

  it('keeps not_configured as data and ignores a late response for the same range', async () => {
    let resolveFirst!: (value: SiteAnalytics) => void;
    const readAnalytics = vi
      .fn()
      .mockReturnValueOnce(new Promise<SiteAnalytics>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(notConfigured);
    const workspace = createStatsWorkspace(readAnalytics, unavailable);
    const first = workspace.load('7d');
    await workspace.load('7d');
    resolveFirst(ok);
    await first;
    expect(workspace.getSnapshot().reads['7d'].data).toEqual(notConfigured);
  });

  it.each([401, 403])('clears figures on %i and stops reading', async (status) => {
    const readAnalytics = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockRejectedValueOnce(new InternalAnalyticsApiError(status, 'Unauthorized.'));
    const workspace = createStatsWorkspace(readAnalytics, unavailable);
    await workspace.load('7d');
    await workspace.load('7d');
    await workspace.load('30d');
    expect(workspace.getSnapshot()).toMatchObject({ denied: true, reads: { '7d': { data: null } } });
    expect(readAnalytics).toHaveBeenCalledTimes(2);
  });
});

describe('Stats view', () => {
  it('renders figures, readable dimension labels, the partial day and member notes', () => {
    const html = view(state({ data: ok }));
    expect(html).toContain('Read at 12 Oct 2026, 17:00');
    expect(html).toContain(
      '<strong>95 visits</strong> in the last 7 days. Busiest day was <strong>Sun 11 Oct</strong> with <strong>64</strong>. Most visits had no referring site.',
    );
    expect(html).toContain('<span>Store</span>');
    expect(html).toContain('title="/store/ · 214 page views"');
    expect(html).toContain('Direct or unknown');
    expect(html).toContain('<span>Greece</span>');
    expect(html).toContain('<span>Unknown</span>');
    expect(html).toContain('318 · 100%');
    expect(html).toContain('All visits came from phones.');
    expect(html).toContain('Mon 12 Oct (so far)');
    expect(html).not.toMatch(/—/);
    expect(html).toContain('Figures are estimates from Cloudflare; a visit is not a unique person.');
    expect(html).not.toMatch(/Worker|UAT|Local/);
    expect(html).not.toContain('role="alert"');
  });

  it('shows the last figures with their read time, reference and Retry after a failed read', () => {
    const html = view(state({ data: ok, error: { message: unavailable, requestId: 'req_9' } }));
    expect(html).toContain('Showing the last saved figures.');
    expect(html).toContain('Last successful read: 12 Oct 2026, 17:00.');
    expect(html).toContain('Reference: req_9');
    expect(html).toContain('Retry');
    expect(html).toContain('stats-stale');
  });

  it('separates loading, failure without figures, not set up, no visits and access states', () => {
    expect(view(state({ loading: true }))).toContain('Loading stats…');
    const failed = view(state({ error: { message: 'Analytics could not be reached.' } }));
    expect(failed).toContain('Unable to load stats.');
    expect(failed).not.toContain('Last successful read');
    const setup = view(state({ data: notConfigured }));
    expect(setup).toContain('Stats aren&#x27;t available here yet');
    expect(setup).not.toMatch(/UAT|Local|environment/);
    expect(setup).not.toContain('Traffic');
    const quiet = view(
      state({
        data: {
          ...ok,
          daily: ok.daily.map((day) => ({ ...day, visits: 0, pageViews: 0 })),
          topPaths: [],
          deviceTypes: [],
        },
      }),
    );
    expect(quiet).toContain('No visits recorded in the last 7 days.');
    expect(quiet).toContain('No devices yet.');
    expect(view(state({ data: ok }, true))).toContain('Access required');
  });
});

const figures = (paidOrders: number, paidTotalMinor: number, checkoutsStarted: number, itemsSold = paidOrders) => ({
  checkoutsStarted,
  paidOrders,
  itemsSold,
  paidTotalMinor,
  deliveryMinor: paidOrders * 300,
});
const store: StoreStats = {
  range: '7d',
  generatedAt: '2026-10-12T14:00:00.000Z',
  currencyCode: 'EUR',
  current: figures(6, 18400, 9, 8),
  previous: figures(2, 5900, 4, 3),
};
const search: SearchStats = {
  range: '7d',
  generatedAt: '2026-10-12T14:00:00.000Z',
  status: 'ok',
  latestDate: '2026-10-11',
  totals: { clicks: 41, impressions: 1260, position: 8.43 },
  topQueries: [{ query: 'blackbox records', clicks: 14, impressions: 96, position: 1.3 }],
};

describe('Store and Google search', () => {
  it('adds orders, the paid total, checkouts and the visit rate to the summary', () => {
    const html = view({ ...state({ data: ok }), store: reads({ data: store }) });
    expect(html).toContain(
      'Most visits had no referring site. <strong>6 orders</strong> paid, <strong>€184</strong> in total. <strong>9 checkouts</strong> started. About <strong>6.3 paid orders per 100 visits</strong>.',
    );
  });

  it('compares the store with the period before', () => {
    const html = view({ ...state({ data: ok }), store: reads({ data: store }) });
    expect(html).toContain('€184 paid in the last 7 days, up from €59 the 7 days before.');
    expect(html).toContain('aria-label="Paid total: €59 the 7 days before, €184 in the last 7 days"');
    expect(html).toContain('<b>6</b>');
    expect(html).toContain('+4');
    expect(html).toContain('up 4 from 2');
    expect(html).toContain('Paid totals include €18 delivery. Refunds made in Stripe aren&#x27;t subtracted.');
    const quiet = view({
      ...state({ data: ok }),
      store: reads({ data: { ...store, current: figures(0, 0, 0), previous: figures(0, 0, 0) } }),
    });
    expect(quiet).toContain('No orders paid in the last 7 days.');
    expect(quiet).toContain('No orders paid.');
    expect(quiet).not.toContain('per 100 visits');
    expect(quiet).not.toContain('stats-compare');
    const fresh = view({ ...state({ data: ok }), store: reads({ data: { ...store, previous: figures(0, 0, 0) } }) });
    expect(fresh).toContain('€184 paid in the last 7 days; nothing the 7 days before.');
    expect(fresh).toContain('none the 7 days before');
  });

  it('shows Google search figures, terms and the provisional latest day', () => {
    const html = view({ ...state({ data: ok }), search: reads({ data: search }) });
    expect(html).toContain('<strong>41 clicks</strong> from <strong>1,260</strong> appearances in Google results.');
    expect(html).toContain('Average position <strong>8.4</strong>.');
    expect(html).toContain('<td>blackbox records</td><td>14</td><td>96</td><td>1.3</td>');
    expect(html).toContain('the latest day (11 Oct) can still change.');
  });

  it('gives search its not-set-up and empty states', () => {
    const setup = view({
      ...state({ data: ok }),
      search: reads({
        data: {
          ...search,
          status: 'not_configured',
          generatedAt: null,
          latestDate: null,
          totals: { clicks: 0, impressions: 0, position: null },
          topQueries: [],
        },
      }),
    });
    expect(setup).toContain('Search figures aren&#x27;t available here yet.');
    const empty = view({
      ...state({ data: ok }),
      search: reads({ data: { ...search, totals: { clicks: 0, impressions: 0, position: null }, topQueries: [] } }),
    });
    expect(empty).toContain('No Google search data for this range yet.');
  });

  it('keeps visits and the store visible when search fails, with its own reference and Retry', () => {
    const html = view({
      ...state({ data: ok }),
      store: reads({ data: store }),
      search: reads({
        error: { message: 'Search figures are temporarily unavailable. Try again.', requestId: 'req_s' },
      }),
    });
    expect(html).toContain('Search figures are temporarily unavailable. Try again.');
    expect(html).toContain('Reference: req_s');
    expect(html).toContain('Visits per day');
    expect(html).toContain('€184 paid in the last 7 days');
    expect(html.match(/role="alert"/g)).toHaveLength(1);
  });

  it('shows store and search when visits fail, and Access required when any source is denied', () => {
    const html = view({
      ...state({ error: { message: unavailable } }),
      store: reads({ data: store }),
      search: reads({ data: search }),
    });
    expect(html).toContain('Unable to load stats.');
    expect(html).toContain('<strong>6 orders</strong> paid');
    expect(html).not.toContain('per 100 visits');
    expect(html).toContain('41 clicks');
    expect(view({ ...state({ data: ok }), store: reads({}, true) })).toContain('Access required');
  });
});
