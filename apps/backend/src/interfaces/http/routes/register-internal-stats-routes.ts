import { createRoute, z } from '@hono/zod-openapi';
import {
  readStaffStats,
  statsRanges,
  InvalidStatsQuery,
  StatsReadFailure,
  type StatsQuery,
} from '../../../application/analytics';
import type { AppOpenApi } from '../../../platform/env';
import { requestLogger } from '../../../platform/observability';
import {
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../../../platform/interfaces/http/responses';

const dimension = z.enum(['page', 'referrer', 'country', 'device', 'item', 'format', 'query']);
const metrics = z.record(z.string(), z.number().nonnegative().nullable());
const choice = z.object({ value: z.string(), label: z.string() });
const responseSchema = z
  .object({
    source: z.enum(['visits', 'store', 'search']),
    range: z.enum(statsRanges),
    status: z.enum(['ok', 'not_configured']),
    generatedAt: z.string().datetime().nullable(),
    timezone: z.string(),
    period: z.object({
      start: z.string().date(),
      end: z.string().date(),
      previousStart: z.string().date(),
      previousEnd: z.string().date(),
    }),
    totals: metrics,
    previous: metrics.nullable(),
    daily: z.array(z.object({ date: z.string().date(), available: z.boolean(), metrics })).max(366),
    fields: z.array(z.object({ key: dimension, label: z.string(), options: z.array(choice).max(500) })).max(4),
    breakdowns: z.array(z.object({ dimension, rows: z.array(choice.extend({ metrics })).max(100) })).max(4),
    notes: z.array(z.string()).max(10),
    latestDate: z.string().date().nullable(),
    complete: z.boolean(),
    moneyBasis: z.enum(['paid_total', 'merchandise']).nullable(),
  })
  .openapi('StaffStatsReport');
const filter = z.string().min(1).max(4096).optional();
const querySchema = z.object({
  source: z.enum(['visits', 'store', 'search']),
  range: z.enum(statsRanges),
  start: z.string().date().optional(),
  end: z.string().date().optional(),
  compare: z.enum(['true', 'false']).optional(),
  page: filter,
  referrer: filter,
  country: filter,
  device: filter,
  item: filter,
  format: filter,
  query: filter,
});

export function registerInternalStatsRoutes(app: AppOpenApi): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/stats',
      operationId: 'readStaffStats',
      tags: ['Internal analytics'],
      summary: 'Read a filtered aggregate Staff report with daily coverage and comparison.',
      request: { query: querySchema },
      responses: {
        200: {
          description: 'Aggregate report or provider setup state.',
          content: { 'application/json': { schema: responseSchema } },
        },
        400: { description: 'Invalid dates or filters.', content: problemContent },
        ...operatorAccessErrorResponses,
        503: { description: 'The report is temporarily unavailable.', content: problemContent },
      },
    }),
    async (context) => {
      const input = context.req.valid('query');
      const filters: StatsQuery['filters'] = {};
      for (const key of ['page', 'referrer', 'country', 'device', 'item', 'format', 'query'] as const)
        if (input[key]) filters[key] = input[key];
      const query: StatsQuery = {
        source: input.source,
        range: input.range,
        start: input.start,
        end: input.end,
        compare: input.compare === 'true',
        filters,
      };
      const now = new Date();
      try {
        const identity = [
          context.env.PRODUCT_ENVIRONMENT,
          context.env.CLOUDFLARE_ACCOUNT_ID,
          context.env.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG,
          context.env.GOOGLE_SEARCH_CONSOLE_SITE,
          context.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS,
          context.env.CLOUDFLARE_ANALYTICS_API_TOKEN,
        ];
        const digest = [
          ...new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(JSON.stringify([identity, query, now.toISOString().slice(0, 10)])),
            ),
          ),
        ]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        const key = new Request(`https://staff.blackboxrecordsathens.com/__stats/v1/${digest}`);
        let cache: Cache | undefined;
        if (input.source !== 'store') {
          try {
            cache = await caches.open('staff-stats-v1');
            const cached = await cache.match(key);
            if (cached) return jsonNoStore(context.json(responseSchema.parse(await cached.json()), 200));
          } catch {
            requestLogger(context).warn({ event: 'staff_stats_cache_unavailable', safeReason: 'read_failed' });
          }
        }
        const report = responseSchema.parse(await readStaffStats(context.env, query, now));
        if (cache && report.status === 'ok') {
          try {
            await cache.put(key, Response.json(report, { headers: { 'Cache-Control': 'public, max-age=900' } }));
          } catch {
            requestLogger(context).warn({ event: 'staff_stats_cache_unavailable', safeReason: 'write_failed' });
          }
        }
        return jsonNoStore(context.json(report, 200));
      } catch (error) {
        if (error instanceof InvalidStatsQuery)
          return jsonError(context, { code: 'invalid_request', message: error.message, status: 400 });
        requestLogger(context).warn({
          event: 'staff_stats_read_failed',
          source: input.source,
          safeReason: error instanceof StatsReadFailure ? error.safeReason : 'provider_or_database',
          ...(error instanceof StatsReadFailure && error.upstreamStatus
            ? { upstreamStatus: error.upstreamStatus }
            : {}),
        });
        return jsonError(context, {
          code: 'service_unavailable',
          message: 'These figures are temporarily unavailable. Try again.',
          status: 503,
        });
      }
    },
  );
}
