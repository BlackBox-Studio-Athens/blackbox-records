import { z } from 'zod';
import type { AppBindings } from '../../platform/env';
import { createBindingLogger } from '../../platform/observability';
import launchGap from './launch-gap-analytics.json';
import {
  boundedJson,
  dateKeys,
  dateTime,
  dayAfter,
  emptyReport,
  StatsReadFailure,
  type StatsQuery,
  type StatsPeriod,
  type StatsReport,
  type StatsDimension,
  type StatsMetrics,
} from './report';

const factSchema = z.object({
  date: z.string().date(),
  page: z.string().max(4096),
  referrer: z.string().max(512),
  country: z.string().max(128),
  device: z.string().max(64),
  visits: z.number().nonnegative(),
  pageViews: z.number().nonnegative(),
});
type VisitFact = z.infer<typeof factSchema>;
const upstreamRows = z
  .array(
    z.object({
      count: z.number().nonnegative(),
      sum: z.object({ visits: z.number().nonnegative() }),
      dimensions: z.object({
        date: z.string().date(),
        requestPath: z.string().max(4096),
        refererHost: z.string().max(512),
        countryName: z.string().max(128),
        deviceType: z.string().max(64),
      }),
    }),
  )
  .max(1001);
const fields = [
  ['page', 'Page'],
  ['referrer', 'Referrer'],
  ['country', 'Country'],
  ['device', 'Device'],
] as const;
const siteKey = (bindings: AppBindings) =>
  [
    bindings.PRODUCT_ENVIRONMENT,
    bindings.CLOUDFLARE_ACCOUNT_ID?.trim(),
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG?.trim(),
    'blackboxrecordsathens.com',
    'humans-v1',
  ].join('/');
const configured = (bindings: AppBindings) =>
  !!(
    bindings.CLOUDFLARE_ANALYTICS_API_TOKEN?.trim() &&
    bindings.CLOUDFLARE_ACCOUNT_ID?.trim() &&
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG?.trim()
  );

async function fetchFacts(
  bindings: AppBindings,
  windows: { start: string; end: string }[],
  signal: AbortSignal,
): Promise<VisitFact[]> {
  const query = `query StaffStats($accountTag:string!,${windows.map((_, index) => `$filter${index}:AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!`).join(',')}) { viewer { accounts(filter:{accountTag:$accountTag}) { ${windows.map((_, index) => `rows${index}:rumPageloadEventsAdaptiveGroups(limit:1001,filter:$filter${index},orderBy:[date_ASC]){count sum{visits} dimensions{date requestPath refererHost countryName deviceType}}`).join('\n')} } } }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${bindings.CLOUDFLARE_ANALYTICS_API_TOKEN!.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: bindings.CLOUDFLARE_ACCOUNT_ID!.trim(),
        ...Object.fromEntries(
          windows.map((window, index) => [
            `filter${index}`,
            {
              datetime_geq: window.start,
              datetime_lt: window.end,
              siteTag: bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG!.trim(),
              requestHost: 'blackboxrecordsathens.com',
              bot: 0,
            },
          ]),
        ),
      },
    }),
    signal,
  });
  const parsed = z
    .object({
      errors: z.array(z.unknown()).nullish(),
      data: z.object({ viewer: z.object({ accounts: z.array(z.record(z.string(), z.unknown())).length(1) }) }),
    })
    .safeParse(await boundedJson(response));
  if (!parsed.success || parsed.data.errors?.length) throw new StatsReadFailure('upstream_shape');
  const facts: VisitFact[] = [];
  for (let index = 0; index < windows.length; index++) {
    const rows = upstreamRows.safeParse(parsed.data.data.viewer.accounts[0]![`rows${index}`]);
    if (!rows.success) throw new StatsReadFailure('upstream_shape');
    if (rows.data.length === 1001) throw new StatsReadFailure('upstream_limit');
    const window = windows[index]!,
      lastDate = new Date(Date.parse(window.end) - 1).toISOString().slice(0, 10);
    if (rows.data.some((row) => row.dimensions.date < window.start.slice(0, 10) || row.dimensions.date > lastDate))
      throw new StatsReadFailure('upstream_shape');
    for (const row of rows.data)
      facts.push({
        date: row.dimensions.date,
        page: row.dimensions.requestPath,
        referrer: row.dimensions.refererHost,
        country: row.dimensions.countryName,
        device: row.dimensions.deviceType,
        visits: row.sum.visits,
        pageViews: row.count,
      });
  }
  return facts;
}

const total = (facts: VisitFact[]): StatsMetrics => ({
  visits: facts.reduce((sum, row) => sum + row.visits, 0),
  pageViews: facts.reduce((sum, row) => sum + row.pageViews, 0),
});

const filterValue = (value: string) => value || '(none)';

export async function readVisitsReport(
  bindings: AppBindings,
  query: StatsQuery,
  period: StatsPeriod,
  now: Date,
): Promise<StatsReport> {
  const report = emptyReport(query, period);
  if (!configured(bindings)) return report;
  const today = now.toISOString().slice(0, 10);
  const earliest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1));
  earliest.setUTCDate(
    Math.min(
      now.getUTCDate(),
      new Date(Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth() + 1, 0)).getUTCDate(),
    ),
  );
  const liveStart = dayAfter(earliest.toISOString().slice(0, 10), 1);
  const start = query.compare ? period.previousStart : period.start;
  const facts: VisitFact[] = [],
    available = new Set<string>();
  if (start < liveStart) {
    const archiveEnd = liveStart < dayAfter(period.end, 1) ? liveStart : dayAfter(period.end, 1);
    const rows = await bindings.COMMERCE_DB.prepare(
      'SELECT "date", "facts" FROM "SiteAnalyticsDay" WHERE "siteKey" = ? AND "date" >= ? AND "date" < ? ORDER BY "date"',
    )
      .bind(siteKey(bindings), start, archiveEnd)
      .all<{ date: string; facts: string }>();
    for (const row of rows.results) {
      const parsed = z
        .array(factSchema)
        .max(1000)
        .safeParse(JSON.parse(row.facts) as unknown);
      if (!parsed.success || parsed.data.some((fact) => fact.date !== row.date))
        throw new StatsReadFailure('archive_read');
      facts.push(...parsed.data);
      available.add(row.date);
      if (facts.length > 50_000) throw new StatsReadFailure('upstream_limit');
    }
  }
  const windows: { start: string; end: string }[] = [];
  let first = start > liveStart ? start : liveStart;
  while (first <= period.end) {
    const last = dayAfter(first, 6) > period.end ? period.end : dayAfter(first, 6);
    windows.push({
      start: new Date(dateTime(first)).toISOString(),
      end: new Date(Math.min(dateTime(dayAfter(last, 1)), now.getTime())).toISOString(),
    });
    for (const day of dateKeys(first, last)) available.add(day);
    first = dayAfter(last, 1);
  }
  const signal = AbortSignal.timeout(10000);
  for (let index = 0; index < windows.length; index += 4) {
    facts.push(...(await fetchFacts(bindings, windows.slice(index, index + 4), signal)));
    if (facts.length > 50_000) throw new StatsReadFailure('upstream_limit');
  }
  const selected = facts.filter((row) =>
    Object.entries(query.filters).every(([key, value]) => filterValue(String(row[key as keyof VisitFact])) === value),
  );
  const current = selected.filter((row) => row.date >= period.start && row.date <= period.end);
  report.status = 'ok';
  report.generatedAt = now.toISOString();
  report.latestDate = today;
  report.complete = dateKeys(period.start, period.end).every((day) => available.has(day));
  report.totals = total(current);
  report.daily = dateKeys(period.start, period.end).map((date) => ({
    date,
    available: available.has(date),
    metrics: total(current.filter((row) => row.date === date)),
  }));
  report.previous =
    query.compare &&
    report.complete &&
    dateKeys(period.previousStart, period.previousEnd).every((day) => available.has(day))
      ? total(selected.filter((row) => row.date >= period.previousStart && row.date <= period.previousEnd))
      : null;
  for (const [key, label] of fields) {
    const options = [
      ...new Set(facts.filter((row) => row.date >= period.start && row.date <= period.end).map((row) => row[key])),
    ].sort();
    report.fields.push({
      key,
      label,
      options: options.slice(0, 100).map((value) => ({ value: filterValue(value), label: visitLabel(key, value) })),
    });
    const groups = new Map<string, VisitFact[]>();
    for (const row of current) {
      const group = groups.get(row[key]) ?? [];
      group.push(row);
      groups.set(row[key], group);
    }
    report.breakdowns.push({
      dimension: key,
      rows: [...groups]
        .map(([value, rows]) => ({ value: filterValue(value), label: visitLabel(key, value), metrics: total(rows) }))
        .sort((a, b) => (b.metrics.visits ?? 0) - (a.metrics.visits ?? 0))
        .slice(0, 100),
    });
  }
  report.notes = ['Visits are estimates, not unique people. Days follow UTC.'];
  if (period.end === today) report.notes.push('Today is still in progress.');
  if (!report.complete)
    report.notes.push(
      'Some dates have no retained history. Earlier unavailable dates are not zero. A full year builds as aggregate history is saved.',
    );
  if (
    bindings.CLOUDFLARE_ACCOUNT_ID?.trim() === launchGap.accountTag &&
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG?.trim() === launchGap.siteTag
  ) {
    const gapDate = launchGap.startInclusive.slice(0, 10);
    const inCurrent = gapDate >= period.start && gapDate <= period.end,
      inPrevious = query.compare && gapDate >= period.previousStart && gapDate <= period.previousEnd;
    if (inCurrent || inPrevious) {
      if (Object.keys(query.filters).length) {
        if (inCurrent) report.complete = false;
        report.previous = null;
        report.notes.push('The launch-day edge estimate cannot be attributed to combined filters.');
      } else {
        const metrics = launchGap.daily.reduce(
          (result, row) => ({ visits: result.visits + row.sum.visits, pageViews: result.pageViews + row.count }),
          { visits: 0, pageViews: 0 },
        );
        const target = inCurrent ? report.totals : report.previous;
        if (target) {
          target.visits = (target.visits ?? 0) + metrics.visits;
          target.pageViews = (target.pageViews ?? 0) + metrics.pageViews;
        }
        const point = report.daily.find((row) => row.date === gapDate);
        if (point) {
          point.metrics.visits = (point.metrics.visits ?? 0) + metrics.visits;
          point.metrics.pageViews = (point.metrics.pageViews ?? 0) + metrics.pageViews;
        }
        if (inCurrent)
          for (const [dimension, rows] of [
            ['page', launchGap.topPaths],
            ['referrer', launchGap.topReferrers],
            ['country', launchGap.topCountries],
            ['device', launchGap.deviceTypes],
          ] as const) {
            const breakdown = report.breakdowns.find((item) => item.dimension === dimension)!;
            for (const row of rows) {
              const existing = breakdown.rows.find((item) => item.value === filterValue(row.dimensions.value));
              if (existing) {
                existing.metrics.visits = (existing.metrics.visits ?? 0) + row.sum.visits;
                existing.metrics.pageViews = (existing.metrics.pageViews ?? 0) + row.count;
              } else
                breakdown.rows.push({
                  value: filterValue(row.dimensions.value),
                  label: visitLabel(dimension, row.dimensions.value),
                  metrics: { visits: row.sum.visits, pageViews: row.count },
                });
            }
            breakdown.rows.sort((a, b) => (b.metrics.visits ?? 0) - (a.metrics.visits ?? 0));
            breakdown.rows = breakdown.rows.slice(0, 100);
          }
        report.notes.push(
          'Includes the documented launch-day edge estimate. That estimate has no joint filter attribution.',
        );
      }
    }
  }
  return report;
}

function visitLabel(key: StatsDimension, value: string): string {
  if (!value) return key === 'referrer' ? 'Direct' : 'Unknown';
  if (key === 'page') return value === '/' ? 'Home' : value;
  if (key === 'country' && /^[A-Z]{2}$/.test(value)) {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value;
    } catch {
      return value;
    }
  }
  return value;
}

export async function archiveVisitStats(bindings: AppBindings, now: Date): Promise<void> {
  if (now.getUTCHours() !== 3 || now.getUTCMinutes() !== 0 || !configured(bindings)) return;
  const logger = createBindingLogger(bindings),
    today = now.toISOString().slice(0, 10);
  try {
    for (let offset = 1; offset <= 3; offset++) {
      const date = dayAfter(today, -offset);
      const facts = await fetchFacts(
        bindings,
        [{ start: `${date}T00:00:00.000Z`, end: `${dayAfter(date, 1)}T00:00:00.000Z` }],
        AbortSignal.timeout(10000),
      );
      if (facts.some((row) => row.date !== date)) throw new StatsReadFailure('upstream_shape');
      const payload = JSON.stringify(facts);
      if (new TextEncoder().encode(payload).byteLength > 65536) throw new StatsReadFailure('upstream_limit');
      await bindings.COMMERCE_DB.prepare(
        'INSERT INTO "SiteAnalyticsDay" ("siteKey", "date", "capturedAt", "facts") VALUES (?, ?, ?, ?) ON CONFLICT ("siteKey", "date") DO UPDATE SET "capturedAt" = excluded."capturedAt", "facts" = excluded."facts"',
      )
        .bind(siteKey(bindings), date, now.toISOString(), payload)
        .run();
    }
    await bindings.COMMERCE_DB.prepare('DELETE FROM "SiteAnalyticsDay" WHERE "siteKey" = ? AND "date" < ?')
      .bind(siteKey(bindings), dayAfter(today, -730))
      .run();
  } catch (error) {
    logger.warn({
      event: 'site_analytics_archive_failed',
      safeReason: error instanceof StatsReadFailure ? error.safeReason : 'archive_write',
    });
  }
}
