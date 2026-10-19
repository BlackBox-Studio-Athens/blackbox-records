export const statsRanges = ['today', 'yesterday', '7d', '30d', '90d', 'month', '12m', 'custom'] as const;
export type StatsRange = (typeof statsRanges)[number];
export type StatsSource = 'visits' | 'store' | 'search';
export type StatsDimension = 'page' | 'referrer' | 'country' | 'device' | 'item' | 'format' | 'query';
export type StatsMetrics = Record<string, number | null>;
export type StatsQuery = {
  source: StatsSource;
  range: StatsRange;
  start?: string | undefined;
  end?: string | undefined;
  compare?: boolean | undefined;
  filters: Partial<Record<StatsDimension, string>>;
};
export type StatsPeriod = { start: string; end: string; previousStart: string; previousEnd: string };
export type StatsPoint = { date: string; available: boolean; metrics: StatsMetrics };
export type StatsField = { key: StatsDimension; label: string; options: { value: string; label: string }[] };
export type StatsBreakdown = {
  dimension: StatsDimension;
  rows: { value: string; label: string; metrics: StatsMetrics }[];
};
export type StatsReport = {
  source: StatsSource;
  range: StatsRange;
  status: 'ok' | 'not_configured';
  generatedAt: string | null;
  timezone: string;
  period: StatsPeriod;
  totals: StatsMetrics;
  previous: StatsMetrics | null;
  daily: StatsPoint[];
  fields: StatsField[];
  breakdowns: StatsBreakdown[];
  notes: string[];
  latestDate: string | null;
  complete: boolean;
  moneyBasis: 'paid_total' | 'merchandise' | null;
};

export const DAY_MS = 86_400_000;
export const dateTime = (date: string) => Date.parse(`${date}T00:00:00.000Z`);
export const dayAfter = (date: string, amount: number) =>
  new Date(dateTime(date) + amount * DAY_MS).toISOString().slice(0, 10);
export const dateKeys = (start: string, end: string) => {
  const result: string[] = [];
  for (let time = dateTime(start); time <= dateTime(end); time += DAY_MS)
    result.push(new Date(time).toISOString().slice(0, 10));
  return result;
};

export class InvalidStatsQuery extends Error {}
export class StatsReadFailure extends Error {
  constructor(
    readonly safeReason: 'upstream_http' | 'upstream_shape' | 'upstream_auth' | 'upstream_limit' | 'archive_read',
    readonly upstreamStatus?: number,
  ) {
    super(safeReason);
  }
}

export function resolveStatsPeriod(query: Pick<StatsQuery, 'range' | 'start' | 'end'>, now: Date): StatsPeriod {
  const today = now.toISOString().slice(0, 10);
  let end = today,
    start = today;
  if (query.range === 'yesterday') start = end = dayAfter(today, -1);
  if (query.range === '7d' || query.range === '30d' || query.range === '90d')
    start = dayAfter(today, 1 - parseInt(query.range));
  if (query.range === 'month') start = today.slice(0, 7) + '-01';
  if (query.range === '12m') start = dayAfter(today, -364);
  if (query.range === 'custom') {
    if (!query.start || !query.end) throw new InvalidStatsQuery('Choose both a start date and an end date.');
    start = query.start;
    end = query.end;
  }
  for (const date of [start, end]) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(dateTime(date)) ||
      new Date(dateTime(date)).toISOString().slice(0, 10) !== date
    )
      throw new InvalidStatsQuery('Choose valid calendar dates.');
  }
  if (start > end) throw new InvalidStatsQuery('The end date must be on or after the start date.');
  if (end > today || start < dayAfter(today, -365) || (dateTime(end) - dateTime(start)) / DAY_MS > 365)
    throw new InvalidStatsQuery('Choose a period within the past 12 months.');
  const length = (dateTime(end) - dateTime(start)) / DAY_MS + 1;
  return { start, end, previousStart: dayAfter(start, -length), previousEnd: dayAfter(start, -1) };
}

export function emptyReport(query: StatsQuery, period: StatsPeriod): StatsReport {
  return {
    source: query.source,
    range: query.range,
    status: 'not_configured',
    generatedAt: null,
    timezone: query.source === 'search' ? 'America/Los_Angeles' : 'UTC',
    period,
    totals: {},
    previous: null,
    daily: [],
    fields: [],
    breakdowns: [],
    notes: [],
    latestDate: null,
    complete: false,
    moneyBasis: null,
  };
}

export async function boundedJson(response: Response, maximum = 1_048_576): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new StatsReadFailure('upstream_http', response.status);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new StatsReadFailure('upstream_shape');
  const decoder = new TextDecoder();
  let text = '',
    size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new StatsReadFailure('upstream_limit');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch (error) {
    if (error instanceof StatsReadFailure) throw error;
    throw new StatsReadFailure('upstream_shape');
  } finally {
    reader.releaseLock();
  }
}
