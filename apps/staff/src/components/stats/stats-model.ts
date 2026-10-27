import type { StaffStatsQuery, StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { formatCount, formatEuro, formatPosition } from './stats-format';

export type Source = StaffStatsReport['source'];
export type Range = StaffStatsQuery['range'];
export type Grain = 'Days' | 'Weeks' | 'Months';
export type Dimension = StaffStatsReport['fields'][number]['key'];
export type Metrics = StaffStatsReport['totals'];
export const sources: Source[] = ['visits', 'store', 'search'];
export const sourceNames: Record<Source, string> = { visits: 'Visits', store: 'Store', search: 'Google Search' };
export const presets: [Range, string][] = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['90d', '90 days'],
  ['month', 'This month'],
  ['12m', '12 months'],
  ['custom', 'Custom'],
];
export const metricOptions: Record<Source, [string, string][]> = {
  visits: [
    ['visits', 'Visits'],
    ['pageViews', 'Page views'],
  ],
  store: [
    ['paidOrders', 'Paid orders'],
    ['paidTotalMinor', 'Paid total'],
    ['itemsSold', 'Items sold'],
    ['checkoutsStarted', 'Checkouts started'],
  ],
  search: [
    ['clicks', 'Clicks'],
    ['impressions', 'Impressions'],
    ['ctr', 'Click-through rate'],
    ['position', 'Average position'],
  ],
};
export const dimensionKeys: Record<Source, Dimension[]> = {
  visits: ['page', 'referrer', 'country', 'device'],
  store: ['item', 'format'],
  search: ['query', 'page', 'country', 'device'],
};
export type BriefState = {
  range: Range;
  start: string;
  end: string;
  report: 'overview' | Source;
  compare: boolean;
  grain: Grain;
  filters: Record<Source, Partial<Record<Dimension, string>>>;
  metrics: Record<Source, string>;
  groups: Record<Source, Dimension>;
};
const time = (date: string) => Date.parse(`${date}T00:00:00Z`);
const dateAfter = (date: string, days: number) => new Date(time(date) + days * 86400000).toISOString().slice(0, 10);

export function periodDates(range: Range, now = new Date()): { start: string; end: string } {
  const end = now.toISOString().slice(0, 10);
  if (range === 'yesterday') {
    const date = dateAfter(end, -1);
    return { start: date, end: date };
  }
  return {
    start:
      range === 'month'
        ? end.slice(0, 7) + '-01'
        : dateAfter(end, range === '12m' ? -364 : range === 'today' || range === 'custom' ? 0 : 1 - parseInt(range)),
    end,
  };
}
export const initialBriefState = (): BriefState => ({
  range: '7d',
  ...periodDates('7d'),
  report: 'overview',
  compare: true,
  grain: 'Days',
  filters: { visits: {}, store: {}, search: {} },
  metrics: { visits: 'visits', store: 'paidOrders', search: 'clicks' },
  groups: { visits: 'page', store: 'item', search: 'query' },
});
export function parseBriefLocation(search: string): BriefState {
  const params = new URLSearchParams(search),
    state = initialBriefState();
  const range = params.get('range');
  if (presets.some(([key]) => key === range)) state.range = range as Range;
  Object.assign(state, periodDates(state.range));
  if (state.range === 'custom') {
    state.start = params.get('start') ?? '';
    state.end = params.get('end') ?? '';
  }
  const report = params.get('report');
  if (sources.includes(report as Source)) state.report = report as Source;
  // Comparison is on unless the link turns it off; older links carrying compare=true still parse.
  state.compare = params.get('compare') !== 'false';
  const grain = params.get('grain');
  if (['Days', 'Weeks', 'Months'].includes(grain ?? '')) state.grain = grain as Grain;
  for (const source of sources) {
    const metric = params.get(`${source}.metric`);
    if (metricOptions[source].some(([key]) => key === metric)) state.metrics[source] = metric!;
    const group = params.get(`${source}.group`);
    if (dimensionKeys[source].includes(group as Dimension)) state.groups[source] = group as Dimension;
    for (const key of dimensionKeys[source]) {
      const value = params.get(`${source}.${key}`);
      if (value && value.length <= 4096) state.filters[source][key] = value;
    }
  }
  return state;
}
export function briefLocation(state: BriefState): string {
  const params = new URLSearchParams();
  if (state.range !== '7d') params.set('range', state.range);
  if (state.range === 'custom') {
    params.set('start', state.start);
    params.set('end', state.end);
  }
  if (state.report !== 'overview') params.set('report', state.report);
  if (!state.compare) params.set('compare', 'false');
  if (state.grain !== 'Days') params.set('grain', state.grain);
  for (const source of sources) {
    if (state.metrics[source] !== metricOptions[source][0]![0]) params.set(`${source}.metric`, state.metrics[source]);
    if (state.groups[source] !== dimensionKeys[source][0]) params.set(`${source}.group`, state.groups[source]);
    for (const key of dimensionKeys[source])
      if (state.filters[source][key]) params.set(`${source}.${key}`, state.filters[source][key]!);
  }
  return `/stats/${params.size ? '?' + params.toString() : ''}`;
}
export const reportQuery = (source: Source, state: BriefState): StaffStatsQuery => ({
  source,
  range: state.range,
  ...(state.range === 'custom' ? { start: state.start, end: state.end } : {}),
  ...(state.compare ? { compare: 'true' as const } : {}),
  ...state.filters[source],
});
export function customDateError(start: string, end: string, now = new Date()): string | null {
  if (!start || !end) return 'Choose both a start date and an end date.';
  if (
    ![start, end].every(
      (date) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Number.isFinite(time(date)) &&
        new Date(time(date)).toISOString().slice(0, 10) === date,
    )
  )
    return 'Choose valid calendar dates.';
  if (start > end) return 'The end date must be on or after the start date.';
  const today = now.toISOString().slice(0, 10);
  if (end > today || start < dateAfter(today, -365)) return 'Choose a period within the past 12 months.';
  return null;
}
export const metricValue = (key: string, value: number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : key === 'paidTotalMinor'
      ? formatEuro(value)
      : key === 'ctr'
        ? value.toFixed(1) + '%'
        : key === 'position'
          ? formatPosition(value)
          : formatCount(value);
export const shortDate = (date: string) =>
  new Date(time(date)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const periodLabel = (start: string, end: string) =>
  !start || !end
    ? 'Custom dates'
    : start === end
      ? `${shortDate(start)} ${start.slice(0, 4)}`
      : `${shortDate(start)}${start.slice(0, 4) !== end.slice(0, 4) ? ' ' + start.slice(0, 4) : ''} – ${shortDate(end)} ${end.slice(0, 4)}`;

export type ChartPoint = { date: string; end: string; available: boolean; partial: boolean; metrics: Metrics };
export function groupStatsDays(rows: StaffStatsReport['daily'], grain: Grain): ChartPoint[] {
  const groups = new Map<string, ChartPoint>();
  for (const row of rows) {
    let key = row.date;
    if (grain === 'Weeks') key = dateAfter(key, -((new Date(time(key)).getUTCDay() + 6) % 7));
    if (grain === 'Months') key = key.slice(0, 7) + '-01';
    const current = groups.get(key) ?? { date: row.date, end: row.date, available: false, partial: false, metrics: {} };
    current.end = row.date;
    current.partial ||= !row.available;
    if (row.available) {
      current.available = true;
      for (const [metric, value] of Object.entries(row.metrics)) {
        if (metric === 'ctr' || metric === 'position') continue;
        current.metrics[metric] = (current.metrics[metric] ?? 0) + (value ?? 0);
      }
      if (row.metrics.position !== null && row.metrics.position !== undefined)
        current.metrics.positionWeight =
          (current.metrics.positionWeight ?? 0) + row.metrics.position * (row.metrics.impressions ?? 0);
    }
    groups.set(key, current);
  }
  return [...groups.values()].map((row) => ({
    ...row,
    metrics: {
      ...row.metrics,
      ctr: row.metrics.impressions ? (100 * (row.metrics.clicks ?? 0)) / row.metrics.impressions : null,
      position: row.metrics.impressions ? (row.metrics.positionWeight ?? 0) / row.metrics.impressions : null,
    },
  }));
}
