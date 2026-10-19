import type { AppBindings } from '../../platform/env';
import { readStoreReportData } from '../commerce/orders';
import { readVisitsReport } from './visits';
import { readSearchReport } from './search';
import {
  dateKeys,
  dateTime,
  dayAfter,
  emptyReport,
  InvalidStatsQuery,
  resolveStatsPeriod,
  type StatsQuery,
  type StatsReport,
} from './report';

export { statsRanges, InvalidStatsQuery, StatsReadFailure } from './report';
export type { StatsQuery, StatsReport, StatsMetrics, StatsDimension, StatsPeriod } from './report';
export { archiveVisitStats } from './visits';
export { signGoogleSearchAssertion } from './google-auth';
export { default as launchGap } from './launch-gap-analytics.json';

const filterKeys = {
  visits: ['page', 'referrer', 'country', 'device'],
  store: ['item', 'format'],
  search: ['query', 'page', 'country', 'device'],
};
export async function readStaffStats(bindings: AppBindings, query: StatsQuery, now = new Date()): Promise<StatsReport> {
  if (Object.keys(query.filters).some((key) => !filterKeys[query.source].includes(key)))
    throw new InvalidStatsQuery('Choose filters supported by this report.');
  const period = resolveStatsPeriod(query, now);
  if (query.source === 'visits') return readVisitsReport(bindings, query, period, now);
  if (query.source === 'search') return readSearchReport(bindings, query, period, now);
  const end = new Date(Math.min(dateTime(dayAfter(period.end, 1)), now.getTime()));
  const data = await readStoreReportData(bindings, new Date(dateTime(period.start)), end, query.filters);
  const report = emptyReport(query, period);
  Object.assign(report, {
    status: 'ok',
    generatedAt: now.toISOString(),
    latestDate: period.end,
    complete: true,
    totals: data.totals,
    fields: data.fields,
    breakdowns: data.breakdowns,
    moneyBasis: query.filters.item || query.filters.format ? 'merchandise' : 'paid_total',
  });
  report.daily = dateKeys(period.start, period.end).map(
    (date) =>
      data.daily.find((row) => row.date === date) ?? {
        date,
        available: true,
        metrics: { paidOrders: 0, paidTotalMinor: 0, itemsSold: 0, checkoutsStarted: 0 },
      },
  );
  if (query.compare)
    report.previous = (
      await readStoreReportData(
        bindings,
        new Date(dateTime(period.previousStart)),
        new Date(dateTime(period.start)),
        query.filters,
        false,
      )
    ).totals;
  report.notes = [
    report.moneyBasis === 'paid_total'
      ? 'Paid total includes retained delivery amounts. Item/format breakdown money shows merchandise only.'
      : 'Filtered money is matching merchandise only; it excludes delivery.',
    'Orders use payment dates in UTC; checkouts use their start dates. Orders can appear in more than one item/format breakdown.',
  ];
  if (period.end === now.toISOString().slice(0, 10)) report.notes.push('Today is still in progress.');
  return report;
}
