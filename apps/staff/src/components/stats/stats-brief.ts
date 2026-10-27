import type { StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { formatDayTick, formatEuro, plural } from './stats-format';
import type { ChartPoint, Grain } from './stats-model';

// Brief-only helpers live apart from stats-model so the shared Overview chunk does not carry them.

/** Axis labels for a brief chart: every bar up to seven, otherwise the first, middle and last. */
export function sparkLabels(points: ChartPoint[], grain: Grain): string[] {
  const label = (point: ChartPoint) => {
    const date = new Date(`${point.date}T00:00:00Z`);
    if (grain === 'Months') return date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
    if (grain === 'Days' && points.length <= 7)
      return date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
    return formatDayTick(point.date);
  };
  const middle = Math.floor((points.length - 1) / 2);
  return points.map((point, index) =>
    points.length <= 7 || index === 0 || index === middle || index === points.length - 1 ? label(point) : '',
  );
}

/** "values" draws bars; "zero" means every reported day was zero; "missing" means no day was reported. */
export function sparkState(points: ChartPoint[], metric: string): 'values' | 'zero' | 'missing' {
  const reported = points.filter((point) => point.available);
  if (!reported.length) return 'missing';
  return reported.some((point) => (point.metrics[metric] ?? 0) > 0) ? 'values' : 'zero';
}

/** The brief's opening sentence from reported figures only, or null when no source has figures. */
export function briefSentence(visits: StaffStatsReport | null, store: StaffStatsReport | null): string | null {
  const reported = (report: StaffStatsReport | null) =>
    report?.status === 'ok' && report.daily.some((day) => day.available) ? report.totals : null;
  const visitTotals = reported(visits),
    storeTotals = reported(store);
  const parts: string[] = [];
  if (visitTotals?.visits !== null && visitTotals?.visits !== undefined)
    parts.push(plural(visitTotals.visits, 'visit'));
  if (storeTotals?.paidOrders !== null && storeTotals?.paidOrders !== undefined)
    parts.push(
      storeTotals.paidOrders
        ? `${plural(storeTotals.paidOrders, 'paid order')} worth ${formatEuro(storeTotals.paidTotalMinor ?? 0)}`
        : 'no paid orders',
    );
  if (!parts.length) return null;
  const sentence = `${parts.join(' and ')}.`;
  return sentence[0]!.toUpperCase() + sentence.slice(1);
}
