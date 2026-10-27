import type { StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { briefLocation, initialBriefState, metricValue, periodDates, periodLabel, type Source } from './stats-model';
import { formatEuro, plural } from './stats-format';

export type OverviewRange = 'today' | '7d' | '30d';
export const overviewRanges: [OverviewRange, string][] = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
];

export function parseOverviewRange(search: string): OverviewRange {
  const range = new URLSearchParams(search).get('range');
  return overviewRanges.some(([key]) => key === range) ? (range as OverviewRange) : '7d';
}

export const overviewLocation = (range: OverviewRange) => (range === '7d' ? '/' : `/?range=${range}`);

/** "Last 7 days, 21 Oct – 27 Oct 2026, against the 7 days before." */
export function periodSentence(range: OverviewRange, now = new Date()): string {
  const { start, end } = periodDates(range, now);
  if (range === 'today') return `Today, ${periodLabel(start, end)}, against yesterday`;
  const days = range === '7d' ? 7 : 30;
  return `Last ${days} days, ${periodLabel(start, end)}, against the ${days} days before`;
}

export type Figure = {
  key: string;
  label: string;
  source: Source;
  href: string;
  /** `null` when the source has no figure for this period; distinct from zero. */
  value: number | null;
  previous: number | null;
};

const figureDefinitions: { key: string; label: string; source: Source }[] = [
  { key: 'visits', label: 'Visits', source: 'visits' },
  { key: 'paidOrders', label: 'Paid orders', source: 'store' },
  { key: 'paidTotalMinor', label: 'Paid total', source: 'store' },
  { key: 'clicks', label: 'Google clicks', source: 'search' },
];

export function statsLink(source: Source, metric: string, range: OverviewRange): string {
  const state = initialBriefState();
  return briefLocation({
    ...state,
    range,
    report: source,
    compare: true,
    metrics: { ...state.metrics, [source]: metric },
  });
}

const usable = (report: StaffStatsReport | null | undefined) =>
  report?.status === 'ok' && report.daily.some((day) => day.available) ? report : null;

export function overviewFigures(
  reports: Partial<Record<Source, StaffStatsReport | null>>,
  range: OverviewRange,
): Figure[] {
  return figureDefinitions.map(({ key, label, source }) => {
    const report = usable(reports[source]);
    return {
      key,
      label,
      source,
      href: statsLink(source, key, range),
      value: report?.totals[key] ?? null,
      previous: report?.previous?.[key] ?? null,
    };
  });
}

export type Change = { direction: 'up' | 'down' | 'same'; text: string };

/** Signed change in words and figures, so direction never depends on colour. */
export function figureChange(figure: Pick<Figure, 'key' | 'value' | 'previous'>): Change | null {
  if (figure.value === null || figure.previous === null) return null;
  const difference = figure.value - figure.previous;
  if (difference === 0) return { direction: 'same', text: 'Same as before' };
  const sign = difference > 0 ? '+' : '−';
  const amount =
    figure.key === 'paidTotalMinor' ? formatEuro(Math.abs(difference)) : metricValue(figure.key, Math.abs(difference));
  const percent = figure.previous ? ` (${Math.round((100 * Math.abs(difference)) / figure.previous)}%)` : '';
  return { direction: difference > 0 ? 'up' : 'down', text: `${sign}${amount}${percent}` };
}

/** One sentence of actual figures, or null when neither Visits nor Store has any. */
export function leadSentence(figures: Figure[], range: OverviewRange): string | null {
  const find = (key: string) => figures.find((figure) => figure.key === key);
  const visits = find('visits'),
    orders = find('paidOrders'),
    total = find('paidTotalMinor');
  const parts: string[] = [];
  if (visits?.value !== null && visits?.value !== undefined) parts.push(plural(visits.value, 'visit'));
  if (orders?.value !== null && orders?.value !== undefined)
    parts.push(
      orders.value && total?.value !== null && total?.value !== undefined
        ? `${plural(orders.value, 'paid order')} worth ${formatEuro(total.value)}`
        : orders.value
          ? plural(orders.value, 'paid order')
          : 'no paid orders',
    );
  if (!parts.length) return null;
  let sentence = `${parts.join(' and ')}.`;
  sentence = sentence[0]!.toUpperCase() + sentence.slice(1);
  const change = visits && figureChange(visits);
  if (change && visits.previous) {
    const before = range === 'today' ? 'yesterday' : `the ${range === '7d' ? 7 : 30} days before`;
    const percent = Math.round((100 * Math.abs(visits.value! - visits.previous)) / visits.previous);
    sentence +=
      change.direction === 'same'
        ? ` Visits are level with ${before}.`
        : ` Visits are ${change.direction} ${percent}% on ${before}.`;
  }
  return sentence;
}

export const formatFigure = (figure: Pick<Figure, 'key' | 'value'>) => metricValue(figure.key, figure.value);
export { formatReadTime } from './stats-format';
export { shortDate } from './stats-model';
