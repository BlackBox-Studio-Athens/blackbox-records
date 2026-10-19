import { z } from 'zod';
import type { AppBindings } from '../../platform/env';
import { googleSearchToken, invalidateGoogleSearchToken } from './google-auth';
import {
  boundedJson,
  dateKeys,
  dayAfter,
  emptyReport,
  StatsReadFailure,
  type StatsMetrics,
  type StatsQuery,
  type StatsPeriod,
  type StatsReport,
} from './report';

const metricSchema = {
  clicks: z.number().nonnegative(),
  impressions: z.number().nonnegative(),
  position: z.number().nonnegative(),
};
const rowSchema = z.object({ ...metricSchema, keys: z.array(z.string().max(4096)).optional() });
const envelope = z.object({
  rows: z.array(rowSchema).max(366).optional(),
  metadata: z.object({ first_incomplete_date: z.string().date().optional() }).optional(),
});
const fields = [
  ['query', 'Search query'],
  ['page', 'Page'],
  ['country', 'Country'],
  ['device', 'Device'],
] as const;
const metrics = (row?: { clicks: number; impressions: number; position: number }): StatsMetrics => ({
  clicks: row?.clicks ?? 0,
  impressions: row?.impressions ?? 0,
  ctr: row?.impressions ? (100 * row.clicks) / row.impressions : null,
  position: row?.impressions ? row.position : null,
});

export async function readSearchReport(
  bindings: AppBindings,
  query: StatsQuery,
  period: StatsPeriod,
  now: Date,
): Promise<StatsReport> {
  const report = emptyReport(query, period);
  const site = bindings.GOOGLE_SEARCH_CONSOLE_SITE?.trim();
  if (!site || !bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS?.trim()) return report;
  const signal = AbortSignal.timeout(15000);
  const token = await googleSearchToken(bindings, signal);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const read = async (start: string, end: string, dimension?: string) => {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'manual',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        dataState: 'all',
        rowLimit: dimension === 'date' ? 366 : dimension ? 100 : 1,
        ...(dimension ? { dimensions: [dimension] } : {}),
        ...(Object.keys(query.filters).length
          ? {
              dimensionFilterGroups: [
                {
                  groupType: 'and',
                  filters: Object.entries(query.filters).map(([dimension, expression]) => ({
                    dimension,
                    operator: 'equals',
                    expression,
                  })),
                },
              ],
            }
          : {}),
      }),
      signal,
    });
    if (response.status === 401) invalidateGoogleSearchToken();
    const parsed = envelope.safeParse(await boundedJson(response, 256 * 1024));
    if (!parsed.success || parsed.data.rows?.some((row) => dimension && row.keys?.length !== 1))
      throw new StatsReadFailure('upstream_shape');
    return { rows: parsed.data.rows ?? [], incomplete: parsed.data.metadata?.first_incomplete_date };
  };
  const totals = await read(period.start, period.end);
  const dates = await read(period.start, period.end, 'date'),
    days = dates.rows;
  if (
    days.some(
      (row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.keys![0]!) || row.keys![0]! < period.start || row.keys![0]! > period.end,
    ) ||
    new Set(days.map((row) => row.keys![0])).size !== days.length
  )
    throw new StatsReadFailure('upstream_shape');
  const latest =
    days
      .map((row) => row.keys![0]!)
      .sort()
      .at(-1) ?? null;
  const pacificToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const incomplete = dates.incomplete ?? totals.incomplete;
  // shortcut: without provider completeness metadata, recent empty dates need a conservative three-day delay.
  const finalThrough = incomplete ? dayAfter(incomplete, -1) : dayAfter(pacificToday, -3);
  report.status = 'ok';
  report.generatedAt = now.toISOString();
  report.latestDate = latest;
  report.complete = period.end <= finalThrough;
  report.totals = metrics(totals.rows[0]);
  report.daily = dateKeys(period.start, period.end).map((date) => ({
    date,
    available: date <= finalThrough || days.some((row) => row.keys![0] === date),
    metrics: metrics(days.find((row) => row.keys![0] === date)),
  }));
  if (query.compare && report.complete && period.previousStart >= dayAfter(now.toISOString().slice(0, 10), -480))
    report.previous = metrics((await read(period.previousStart, period.previousEnd)).rows[0]);
  for (const [dimension, label] of fields) {
    const rows = (await read(period.start, period.end, dimension)).rows;
    const display = (value: string) => {
      if (dimension === 'page') {
        try {
          return new URL(value).pathname;
        } catch {
          return value;
        }
      }
      return dimension === 'country' ? value.toUpperCase() : value;
    };
    report.fields.push({
      key: dimension,
      label,
      options: rows.map((row) => ({ value: row.keys![0]!, label: display(row.keys![0]!) })),
    });
    report.breakdowns.push({
      dimension,
      rows: rows.map((row) => ({ value: row.keys![0]!, label: display(row.keys![0]!), metrics: metrics(row) })),
    });
  }
  report.notes = [
    'Google reports calendar days in Pacific Time. Recent figures may be delayed.',
    'Google supplies top available rows; private, low-volume queries can be omitted.',
  ];
  if (!report.complete) report.notes.push('Some selected dates have not been reported. Missing days are not zero.');
  return report;
}
