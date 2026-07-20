export type TraceEvent = {
  name: string;
  dur?: number;
  ts?: number;
  pid?: number;
  tid?: number;
  args?: { name?: string };
};

export type StoreActivationMilestones = {
  clickToPricesSettledMs: number;
  clickToStoreContentMs: number;
  clickToVeilClosedMs: number;
};

type Interval = { end: number; start: number };

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

export function summarize(values: number[]) {
  return {
    median: percentile(values, 0.5),
    p75: percentile(values, 0.75),
    p95: percentile(values, 0.95),
    maximum: Math.max(0, ...values),
    total: values.reduce((sum, value) => sum + value, 0),
  };
}

export function extractStoreActivationMilestones({
  clickAt,
  pricesSettledAt,
  storeContentAt,
  veilClosedAt,
}: {
  clickAt: number;
  pricesSettledAt: number;
  storeContentAt: number;
  veilClosedAt: number;
}): StoreActivationMilestones {
  return {
    clickToPricesSettledMs: pricesSettledAt - clickAt,
    clickToStoreContentMs: storeContentAt - clickAt,
    clickToVeilClosedMs: veilClosedAt - clickAt,
  };
}

export function summarizeStoreActivationRuns(runs: Array<StoreActivationMilestones & { rejectionReasons: string[] }>) {
  const accepted = runs.filter((run) => run.rejectionReasons.length === 0);
  return {
    acceptedRuns: accepted.length,
    rejectedRuns: runs.length - accepted.length,
    clickToPricesSettledMs: summarize(accepted.map((run) => run.clickToPricesSettledMs)),
    clickToStoreContentMs: summarize(accepted.map((run) => run.clickToStoreContentMs)),
    clickToVeilClosedMs: summarize(accepted.map((run) => run.clickToVeilClosedMs)),
  };
}

export function storeActivationRejectionReasons({
  cardCount,
  expectedCardCount,
  storeHtmlRequestStartMs,
  visibilityState,
}: {
  cardCount: number;
  expectedCardCount: number;
  storeHtmlRequestStartMs: number | null;
  visibilityState: string;
}) {
  const reasons: string[] = [];
  if (visibilityState !== 'visible') reasons.push(`document visibility was ${visibilityState}`);
  if (storeHtmlRequestStartMs === null) reasons.push('Store HTML request was not observed');
  else if (storeHtmlRequestStartMs > 500)
    reasons.push(`Store HTML request started after ${storeHtmlRequestStartMs} ms`);
  if (cardCount !== expectedCardCount) reasons.push(`expected ${expectedCardCount} Store cards, found ${cardCount}`);
  return reasons;
}

export function countStoreActivationRequests(urls: string[]) {
  const pathnames = urls.map((url) => new URL(url, 'https://example.test').pathname);
  return {
    listingProjection: pathnames.filter((pathname) => pathname.endsWith('/api/store/listing-prices')).length,
    perCardStoreOffer: pathnames.filter((pathname) => /\/api\/store\/items\/[^/]+\/?$/.test(pathname)).length,
    storeHtml: pathnames.filter((pathname) => pathname.endsWith('/store/')).length,
  };
}

function mergeIntervals(events: TraceEvent[], names: Set<string>) {
  const intervals = events
    .filter((event) => names.has(event.name) && event.ts !== undefined && event.dur !== undefined)
    .map((event) => ({ start: event.ts!, end: event.ts! + event.dur! }))
    .toSorted((left, right) => left.start - right.start);
  const merged: Interval[] = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
    else merged.push(interval);
  }
  return merged;
}

function rendererMainThread(events: TraceEvent[]) {
  const candidates = events.filter((event) => event.name === 'thread_name' && event.args?.name === 'CrRendererMain');
  const scored = candidates.map((candidate) => ({
    pid: candidate.pid,
    tid: candidate.tid,
    taskTime: events
      .filter(
        (event) =>
          event.name === 'RunTask' &&
          event.pid === candidate.pid &&
          event.tid === candidate.tid &&
          event.dur !== undefined,
      )
      .reduce((total, event) => total + event.dur!, 0),
  }));
  const target = scored.toSorted((left, right) => right.taskTime - left.taskTime)[0];
  if (target?.pid === undefined || target.tid === undefined)
    throw new Error('Trace has no Chromium renderer main thread.');
  return target;
}

function intervalDurations(events: TraceEvent[], names: Set<string>) {
  return mergeIntervals(events, names).map((interval) => (interval.end - interval.start) / 1000);
}

export function summarizeTrace(events: TraceEvent[]) {
  const target = rendererMainThread(events);
  const mainEvents = events.filter((event) => event.pid === target.pid && event.tid === target.tid);
  const style = intervalDurations(mainEvents, new Set(['RecalculateStyles', 'UpdateLayoutTree']));
  const layout = intervalDurations(mainEvents, new Set(['Layout']));
  const paint = intervalDurations(mainEvents, new Set(['Paint', 'CompositeLayers']));
  const script = intervalDurations(
    mainEvents,
    new Set(['EvaluateScript', 'EventDispatch', 'FireAnimationFrame', 'FunctionCall']),
  );
  const tasks = mainEvents.filter((event) => event.name === 'RunTask' && event.dur).map((event) => event.dur! / 1000);
  const workIntervals = mergeIntervals(
    mainEvents,
    new Set([
      'EvaluateScript',
      'FunctionCall',
      'RecalculateStyles',
      'UpdateLayoutTree',
      'Layout',
      'Paint',
      'CompositeLayers',
    ]),
  );
  const workWindowMicroseconds = 16_667;
  const workByWindow: number[] = [];
  if (workIntervals.length > 0) {
    const firstWorkWindow = Math.floor(workIntervals[0].start / workWindowMicroseconds);
    const lastWorkWindow = Math.floor(workIntervals.at(-1)!.end / workWindowMicroseconds);
    workByWindow.push(...Array.from({ length: lastWorkWindow - firstWorkWindow + 1 }, () => 0));
    for (const interval of workIntervals) {
      let cursor = interval.start;
      while (cursor < interval.end) {
        const windowIndex = Math.floor(cursor / workWindowMicroseconds);
        const boundary = (windowIndex + 1) * workWindowMicroseconds;
        const end = Math.min(interval.end, boundary);
        workByWindow[windowIndex - firstWorkWindow] += (end - cursor) / 1000;
        cursor = end;
      }
    }
  }
  const fontEvents = mainEvents.filter((event) => /font/i.test(event.name)).map((event) => event.name);
  return {
    style: summarize(style),
    layout: summarize(layout),
    paint: summarize(paint),
    mainStyleLayoutPaint: summarize(workByWindow),
    script: summarize(script),
    taskCount: tasks.length,
    longTaskCount: tasks.filter((duration) => duration >= 50).length,
    longTaskTime: tasks.filter((duration) => duration >= 50).reduce((total, duration) => total + duration, 0),
    fontEvents: Object.entries(Object.groupBy(fontEvents, (name) => name)).map(([name, values]) => ({
      name,
      count: values?.length ?? 0,
    })),
  };
}

export function dynamicImportSpecifiers(source: string) {
  return [...source.matchAll(/\bimport\(\s*(["'`])([^"'`]+\.js)\1\s*\)/g)].map((match) => match[2]);
}
