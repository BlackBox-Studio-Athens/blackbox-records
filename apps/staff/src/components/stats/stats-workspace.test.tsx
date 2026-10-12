import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InternalAnalyticsApiError, type SiteAnalytics } from '../../lib/backend/internal-analytics-api';
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
const state = (read: Partial<StatsState['reads']['7d']>, denied = false): StatsState => ({
  range: '7d',
  denied,
  reads: {
    '7d': { data: null, loading: false, error: null, ...read },
    '30d': { data: null, loading: false, error: null },
  },
});
const view = (value: StatsState) =>
  renderToStaticMarkup(<StatsView state={value} onRange={vi.fn()} onRetry={vi.fn()} />);

describe('Stats read state', () => {
  it('keeps the last snapshot and request ID when a later read fails', async () => {
    const readAnalytics = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockRejectedValueOnce(new InternalAnalyticsApiError(503, unavailable, 'req_1'));
    const workspace = createStatsWorkspace({ readAnalytics });
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
    const workspace = createStatsWorkspace({ readAnalytics });
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
    const workspace = createStatsWorkspace({ readAnalytics });
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
    expect(html).toContain('class="stats-stale"');
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
