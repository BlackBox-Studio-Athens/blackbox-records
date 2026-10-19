import { createRoute, z } from '@hono/zod-openapi';

import type { AppOpenApi } from '../../../platform/env';
import {
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../../../platform/interfaces/http/responses';
import { requestLogger } from '../../../platform/observability';
import { launchGap } from '../../../application/analytics';

const rangeSchema = z.enum(['7d', '30d']);
const metrics = { visits: z.number().nonnegative(), pageViews: z.number().nonnegative() };
const responseSchema = z
  .object({
    range: rangeSchema,
    generatedAt: z.string().datetime().nullable(),
    status: z.enum(['ok', 'not_configured']),
    daily: z.array(z.object({ date: z.string().date(), ...metrics })),
    topPaths: z.array(z.object({ path: z.string(), ...metrics })),
    topReferrers: z.array(z.object({ host: z.string(), ...metrics })),
    topCountries: z.array(z.object({ country: z.string(), ...metrics })),
    deviceTypes: z.array(z.object({ deviceType: z.string(), ...metrics })),
  })
  .openapi('SiteAnalytics');

const rumRow = z.object({
  count: z.number().nonnegative(),
  sum: z.object({ visits: z.number().nonnegative() }),
});
const breakdownRows = z.array(rumRow.extend({ dimensions: z.object({ value: z.string().max(4096) }) })).max(100);
const graphqlErrorsSchema = z.object({ errors: z.array(z.unknown()).min(1) });
const windowSchema = z.object({
  daily: z.array(rumRow.extend({ dimensions: z.object({ date: z.string().date() }) })).max(7),
  topPaths: breakdownRows,
  topReferrers: breakdownRows,
  topCountries: breakdownRows,
  deviceTypes: breakdownRows,
});
const upstreamSchema = z
  .object({
    errors: z.array(z.unknown()).nullish(),
    data: z.object({
      viewer: z.object({
        accounts: z.array(z.object({}).catchall(z.unknown())).length(1),
      }),
    }),
  })
  .refine((value) => !value.errors?.length);

function query(windows: number) {
  const suffixes = Array.from({ length: windows }, (_, index) => (index === 0 ? '' : String(index)));
  return `query SiteAnalytics($accountTag: string!, ${suffixes.map((suffix) => `$rumFilter${suffix}: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!`).join(', ')}) {
  viewer { accounts(filter: {accountTag: $accountTag}) { ${suffixes
    .map(
      (suffix) => `
    daily${suffix}: rumPageloadEventsAdaptiveGroups(limit: 7, filter: $rumFilter${suffix}, orderBy: [date_ASC]) {
      count sum { visits } dimensions { date }
    }
    topPaths${suffix}: rumPageloadEventsAdaptiveGroups(limit: 25, filter: $rumFilter${suffix}, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: requestPath }
    }
    topReferrers${suffix}: rumPageloadEventsAdaptiveGroups(limit: 25, filter: $rumFilter${suffix}, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: refererHost }
    }
    topCountries${suffix}: rumPageloadEventsAdaptiveGroups(limit: 25, filter: $rumFilter${suffix}, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: countryName }
    }
    deviceTypes${suffix}: rumPageloadEventsAdaptiveGroups(limit: 100, filter: $rumFilter${suffix}, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: deviceType }
    }
  `,
    )
    .join('\n')} } }
}`;
}

class AnalyticsReadFailure extends Error {
  constructor(
    readonly safeReason:
      | 'upstream_http'
      | 'upstream_graphql'
      | 'upstream_invalid_json'
      | 'upstream_body_too_large'
      | 'upstream_invalid_shape',
  ) {
    super(safeReason);
  }
}

export function registerInternalAnalyticsRoutes(app: AppOpenApi): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/analytics',
      operationId: 'readSiteAnalytics',
      tags: ['Internal analytics'],
      summary: 'Read site visits, page views and their top breakdowns.',
      request: { query: z.object({ range: rangeSchema }) },
      responses: {
        200: {
          description: 'Analytics snapshot or not configured.',
          content: { 'application/json': { schema: responseSchema } },
        },
        400: { description: 'Range must be 7d or 30d.', content: problemContent },
        ...operatorAccessErrorResponses,
        503: {
          description: 'Analytics or operator authentication is temporarily unavailable.',
          content: problemContent,
        },
      },
    }),
    async (context) => {
      const { range } = context.req.valid('query');
      const token = context.env.CLOUDFLARE_ANALYTICS_API_TOKEN?.trim();
      const accountTag = context.env.CLOUDFLARE_ACCOUNT_ID?.trim();
      const siteTag = context.env.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG?.trim();
      if (!token || !accountTag || !siteTag) {
        return jsonNoStore(
          context.json(
            {
              range,
              generatedAt: null,
              status: 'not_configured' as const,
              daily: [],
              topPaths: [],
              topReferrers: [],
              topCountries: [],
              deviceTypes: [],
            },
            200,
          ),
        );
      }

      const now = new Date();
      const days = range === '7d' ? 7 : 30;
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCDate(start.getUTCDate() - days + 1);
      // Isolate environments/sites and UTC windows; cache only data, never identity or request IDs.
      const cacheKey = new Request(
        `https://staff.blackboxrecordsathens.com/__analytics-cache/v4/${context.env.PRODUCT_ENVIRONMENT}/${encodeURIComponent(accountTag)}/${encodeURIComponent(siteTag)}/${now.toISOString().slice(0, 10)}?range=${range}`,
      );
      let cache: Cache | undefined;
      try {
        cache = await caches.open('site-analytics-v4');
        const cached = await cache.match(cacheKey);
        if (cached) return jsonNoStore(context.json(responseSchema.parse(await cached.json()), 200));
      } catch {
        requestLogger(context).warn({ event: 'analytics_cache_unavailable', safeReason: 'read_failed' });
      }

      let upstreamStatus: number | undefined;
      let signal: AbortSignal | undefined;
      try {
        signal = AbortSignal.timeout(10000);
        // Use the identical newest seven UTC days for both ranges to avoid wider-window sampling.
        const windows = [];
        let end = now;
        for (let remaining = days; remaining > 0; remaining -= 7) {
          const begin = new Date(end);
          begin.setUTCHours(0, 0, 0, 0);
          begin.setUTCDate(begin.getUTCDate() - Math.min(remaining, 7) + (windows.length === 0 ? 1 : 0));
          windows.push({ datetime_geq: begin.toISOString(), datetime_lt: end.toISOString() });
          end = begin;
        }
        const upstream = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          redirect: 'manual',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query(windows.length),
            variables: {
              accountTag,
              ...Object.fromEntries(
                windows.map((filter, index) => [
                  `rumFilter${index === 0 ? '' : index}`,
                  { ...filter, siteTag, requestHost: 'blackboxrecordsathens.com', bot: 0 },
                ]),
              ),
            },
          }),
          signal,
        });
        upstreamStatus = upstream.status;
        if (!upstream.ok) {
          await upstream.body?.cancel();
          throw new AnalyticsReadFailure('upstream_http');
        }
        const body = await readGraphqlBody(upstream);
        if (graphqlErrorsSchema.safeParse(body).success) throw new AnalyticsReadFailure('upstream_graphql');
        const parsed = upstreamSchema.safeParse(body);
        if (!parsed.success) throw new AnalyticsReadFailure('upstream_invalid_shape');
        const account = parsed.data.data.viewer.accounts[0]!;
        const data = windows.map((_, index) => {
          const suffix = index === 0 ? '' : String(index);
          const window = windowSchema.safeParse(
            Object.fromEntries(Object.keys(windowSchema.shape).map((key) => [key, account[`${key}${suffix}`]])),
          );
          if (!window.success) throw new AnalyticsReadFailure('upstream_invalid_shape');
          return window.data;
        });
        // Captured edge visits end before the first RUM minute; merge this estimate only once.
        if (
          accountTag === launchGap.accountTag &&
          siteTag === launchGap.siteTag &&
          start <= new Date(launchGap.startInclusive) &&
          now >= new Date(launchGap.endExclusive)
        ) {
          data.push(windowSchema.parse(launchGap));
        }
        const dailyRows = data.flatMap((window) => window.daily);
        const daily = Array.from({ length: days }, (_, index) => {
          const date = new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10);
          const rows = dailyRows.filter((row) => row.dimensions.date === date);
          return {
            date,
            visits: rows.reduce((sum, row) => sum + row.sum.visits, 0),
            pageViews: rows.reduce((sum, row) => sum + row.count, 0),
          };
        });
        const breakdown = (key: 'topPaths' | 'topReferrers' | 'topCountries' | 'deviceTypes') => {
          const merged = new Map<string, { value: string; visits: number; pageViews: number }>();
          for (const row of data.flatMap((window) => window[key])) {
            const value = row.dimensions.value;
            const counts = merged.get(value) ?? { value, visits: 0, pageViews: 0 };
            counts.visits += row.sum.visits;
            counts.pageViews += row.count;
            merged.set(value, counts);
          }
          return [...merged.values()]
            .sort((a, b) => b.visits - a.visits)
            .slice(0, key === 'deviceTypes' ? undefined : 10);
        };
        const result = responseSchema.parse({
          range,
          generatedAt: now.toISOString(),
          status: 'ok',
          daily,
          topPaths: breakdown('topPaths').map(({ value, ...counts }) => ({ path: value, ...counts })),
          topReferrers: breakdown('topReferrers').map(({ value, ...counts }) => ({ host: value, ...counts })),
          topCountries: breakdown('topCountries').map(({ value, ...counts }) => ({ country: value, ...counts })),
          deviceTypes: breakdown('deviceTypes').map(({ value, ...counts }) => ({ deviceType: value, ...counts })),
        });
        try {
          await cache?.put(cacheKey, Response.json(result, { headers: { 'Cache-Control': 'public, max-age=900' } }));
        } catch {
          requestLogger(context).warn({ event: 'analytics_cache_unavailable', safeReason: 'write_failed' });
        }
        return jsonNoStore(context.json(result, 200));
      } catch (error) {
        requestLogger(context).warn({
          event: 'analytics_read_failed',
          safeReason: signal?.aborted
            ? 'upstream_timeout'
            : error instanceof AnalyticsReadFailure
              ? error.safeReason
              : 'upstream_network',
          upstreamStatus,
        });
        return jsonError(context, {
          code: 'service_unavailable',
          message: 'Analytics is temporarily unavailable. Try again.',
          status: 503,
        });
      }
    },
  );
}

async function readGraphqlBody(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new AnalyticsReadFailure('upstream_invalid_shape');
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 128 * 1024) throw new AnalyticsReadFailure('upstream_body_too_large');
      text += decoder.decode(value, { stream: true });
    }
    try {
      return JSON.parse(text + decoder.decode());
    } catch {
      throw new AnalyticsReadFailure('upstream_invalid_json');
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
