import { createRoute, z } from '@hono/zod-openapi';

import type { AppOpenApi } from '../../../platform/env';
import {
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../../../platform/interfaces/http/responses';
import { requestLogger } from '../../../platform/observability';

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
const upstreamSchema = z
  .object({
    errors: z.array(z.unknown()).nullish(),
    data: z.object({
      viewer: z.object({
        accounts: z
          .array(
            z.object({
              daily: z.array(rumRow.extend({ dimensions: z.object({ date: z.string().date() }) })).max(31),
              topPaths: breakdownRows,
              topReferrers: breakdownRows,
              topCountries: breakdownRows,
              deviceTypes: breakdownRows,
            }),
          )
          .length(1),
      }),
    }),
  })
  .refine((value) => !value.errors?.length);

const query = `query SiteAnalytics($accountTag: string!, $rumFilter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer { accounts(filter: {accountTag: $accountTag}) {
    daily: rumPageloadEventsAdaptiveGroups(limit: 31, filter: $rumFilter, orderBy: [date_ASC]) {
      count sum { visits } dimensions { date }
    }
    topPaths: rumPageloadEventsAdaptiveGroups(limit: 10, filter: $rumFilter, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: requestPath }
    }
    topReferrers: rumPageloadEventsAdaptiveGroups(limit: 10, filter: $rumFilter, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: refererHost }
    }
    topCountries: rumPageloadEventsAdaptiveGroups(limit: 10, filter: $rumFilter, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: countryName }
    }
    deviceTypes: rumPageloadEventsAdaptiveGroups(limit: 100, filter: $rumFilter, orderBy: [count_DESC]) {
      count sum { visits } dimensions { value: deviceType }
    }
  } }
}`;

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
        `https://staff.blackboxrecordsathens.com/__analytics-cache/v2/${context.env.PRODUCT_ENVIRONMENT}/${encodeURIComponent(accountTag)}/${encodeURIComponent(siteTag)}/${now.toISOString().slice(0, 10)}?range=${range}`,
      );
      let cache: Cache | undefined;
      try {
        cache = await caches.open('site-analytics-v2');
        const cached = await cache.match(cacheKey);
        if (cached) return jsonNoStore(context.json(responseSchema.parse(await cached.json()), 200));
      } catch {
        requestLogger(context).warn({ event: 'analytics_cache_unavailable', safeReason: 'read_failed' });
      }

      let upstreamStatus: number | undefined;
      let signal: AbortSignal | undefined;
      try {
        signal = AbortSignal.timeout(10000);
        const filter = { datetime_geq: start.toISOString(), datetime_lt: now.toISOString() };
        const upstream = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          redirect: 'manual',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: {
              accountTag,
              rumFilter: { ...filter, siteTag, requestHost: 'blackboxrecordsathens.com', bot: 0 },
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
        const data = parsed.data.data.viewer.accounts[0]!;
        const daily = Array.from({ length: days }, (_, index) => {
          const date = new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10);
          const rows = data.daily.filter((row) => row.dimensions.date === date);
          return {
            date,
            visits: rows.reduce((sum, row) => sum + row.sum.visits, 0),
            pageViews: rows.reduce((sum, row) => sum + row.count, 0),
          };
        });
        const breakdown = (rows: z.infer<typeof breakdownRows>) =>
          rows.map((row) => ({ value: row.dimensions.value, visits: row.sum.visits, pageViews: row.count }));
        const result = responseSchema.parse({
          range,
          generatedAt: now.toISOString(),
          status: 'ok',
          daily,
          topPaths: breakdown(data.topPaths).map(({ value, ...counts }) => ({ path: value, ...counts })),
          topReferrers: breakdown(data.topReferrers).map(({ value, ...counts }) => ({ host: value, ...counts })),
          topCountries: breakdown(data.topCountries).map(({ value, ...counts }) => ({ country: value, ...counts })),
          deviceTypes: breakdown(data.deviceTypes).map(({ value, ...counts }) => ({ deviceType: value, ...counts })),
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
