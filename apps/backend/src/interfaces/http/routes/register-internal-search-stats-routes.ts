import { createRoute, z } from '@hono/zod-openapi';

import type { AppOpenApi } from '../../../platform/env';
import {
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../../../platform/interfaces/http/responses';
import { requestLogger } from '../../../platform/observability';

const tokenUrl = 'https://oauth2.googleapis.com/token';
const scope = 'https://www.googleapis.com/auth/webmasters.readonly';
const rangeSchema = z.enum(['7d', '30d']);
const metrics = {
  clicks: z.number().nonnegative(),
  impressions: z.number().nonnegative(),
  position: z.number().nonnegative(),
};
const responseSchema = z
  .object({
    range: rangeSchema,
    generatedAt: z.string().datetime().nullable(),
    status: z.enum(['ok', 'not_configured']),
    latestDate: z.string().date().nullable(),
    totals: z.object({ ...metrics, position: metrics.position.nullable() }),
    topQueries: z.array(z.object({ query: z.string(), ...metrics })).max(10),
  })
  .openapi('SearchStats');
const credentialsSchema = z.object({
  type: z.literal('service_account'),
  client_email: z.string().email().max(512),
  private_key_id: z.string().min(1).max(512),
  private_key: z.string().min(1).max(16384),
});
const tokenSchema = z.object({
  access_token: z.string().min(1).max(16384),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive().max(86400),
});
const upstreamEnvelope = z
  .object({ responseAggregationType: z.string().optional(), metadata: z.unknown().optional() })
  .strict();
const totalsSchema = upstreamEnvelope.extend({ rows: z.array(z.object(metrics)).max(1).optional() });
const queriesSchema = upstreamEnvelope.extend({
  rows: z
    .array(z.object({ keys: z.array(z.string().max(4096)).length(1), ...metrics }))
    .max(10)
    .optional(),
});
const datesSchema = upstreamEnvelope.extend({
  rows: z
    .array(z.object({ keys: z.array(z.string().date()).length(1), ...metrics }))
    .max(30)
    .optional(),
});

// Only completed tokens are retained; request bodies, credentials and in-flight I/O stay request-local.
let cachedAccessToken: { key: string; token: string; expiresAt: number } | undefined;

class SearchReadFailure extends Error {
  constructor(readonly safeReason: 'upstream_auth' | 'upstream_http' | 'upstream_invalid_shape') {
    super(safeReason);
  }
}

export function registerInternalSearchStatsRoutes(app: AppOpenApi): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/search-stats',
      operationId: 'readSearchStats',
      tags: ['Internal analytics'],
      summary: 'Read Google search totals and top queries.',
      request: { query: z.object({ range: rangeSchema }) },
      responses: {
        200: {
          description: 'Search snapshot or not configured.',
          content: { 'application/json': { schema: responseSchema } },
        },
        400: { description: 'Range must be 7d or 30d.', content: problemContent },
        ...operatorAccessErrorResponses,
        503: {
          description: 'Search figures or operator authentication are temporarily unavailable.',
          content: problemContent,
        },
      },
    }),
    async (context) => {
      const { range } = context.req.valid('query');
      const site = context.env.GOOGLE_SEARCH_CONSOLE_SITE?.trim();
      const credentialsText = context.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS?.trim();
      if (!site || !credentialsText) {
        return jsonNoStore(
          context.json(
            {
              range,
              generatedAt: null,
              status: 'not_configured' as const,
              latestDate: null,
              totals: { clicks: 0, impressions: 0, position: null },
              topQueries: [],
            },
            200,
          ),
        );
      }

      const now = new Date();
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCDate(start.getUTCDate() - (range === '7d' ? 6 : 29));
      const cacheKey = new Request(
        `https://staff.blackboxrecordsathens.com/__search-stats-cache/v1/${context.env.PRODUCT_ENVIRONMENT}/${encodeURIComponent(site)}/${now.toISOString().slice(0, 10)}?range=${range}`,
      );
      let cache: Cache | undefined;
      try {
        cache = await caches.open('search-stats-v1');
        const cached = await cache.match(cacheKey);
        if (cached) return jsonNoStore(context.json(responseSchema.parse(await cached.json()), 200));
      } catch {
        requestLogger(context).warn({ event: 'search_stats_cache_unavailable', safeReason: 'read_failed' });
      }

      let signal: AbortSignal | undefined;
      let upstreamStatus: number | undefined;
      try {
        signal = AbortSignal.timeout(10000);
        const post = async (url: string, headers: HeadersInit, body: string) => {
          upstreamStatus = undefined;
          const response = await fetch(url, { method: 'POST', redirect: 'manual', headers, body, signal });
          upstreamStatus = response.status;
          if (!response.ok) {
            await response.body?.cancel();
            if (response.status === 401 || response.status === 403 || (url === tokenUrl && response.status === 400)) {
              cachedAccessToken = undefined;
              throw new SearchReadFailure('upstream_auth');
            }
            throw new SearchReadFailure('upstream_http');
          }
          return readSearchBody(response);
        };
        const credentialDigest = base64url(
          new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credentialsText))),
        );
        const tokenKey = `${context.env.PRODUCT_ENVIRONMENT}/${credentialDigest}`;
        let token =
          cachedAccessToken?.key === tokenKey && cachedAccessToken.expiresAt > Date.now()
            ? cachedAccessToken.token
            : undefined;
        if (!token) {
          const assertion = await signAssertion(credentialsText);
          const parsed = tokenSchema.safeParse(
            await post(
              tokenUrl,
              { 'Content-Type': 'application/x-www-form-urlencoded' },
              new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
            ),
          );
          if (!parsed.success) throw new SearchReadFailure('upstream_invalid_shape');
          token = parsed.data.access_token;
          cachedAccessToken = { key: tokenKey, token, expiresAt: Date.now() + parsed.data.expires_in * 1000 - 60000 };
        }
        const queryUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
        const query = (dimensions?: string[], rowLimit?: number) =>
          post(
            queryUrl,
            { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            JSON.stringify({
              startDate: start.toISOString().slice(0, 10),
              endDate: now.toISOString().slice(0, 10),
              dataState: 'all',
              ...(dimensions ? { dimensions } : {}),
              ...(rowLimit ? { rowLimit } : {}),
            }),
          );
        const totals = totalsSchema.safeParse(await query());
        if (!totals.success) throw new SearchReadFailure('upstream_invalid_shape');
        const queries = queriesSchema.safeParse(await query(['query'], 10));
        if (!queries.success) throw new SearchReadFailure('upstream_invalid_shape');
        const dates = datesSchema.safeParse(await query(['date'], 30));
        if (!dates.success) throw new SearchReadFailure('upstream_invalid_shape');
        const total = totals.data.rows?.[0];
        const result = responseSchema.parse({
          range,
          generatedAt: now.toISOString(),
          status: 'ok',
          latestDate:
            dates.data.rows
              ?.map((row) => row.keys[0]!)
              .sort()
              .at(-1) ?? null,
          totals: {
            clicks: total?.clicks ?? 0,
            impressions: total?.impressions ?? 0,
            position: total?.impressions ? total.position : null,
          },
          topQueries: (queries.data.rows ?? [])
            .map(({ keys, ...counts }) => ({ query: keys[0]!, ...counts }))
            .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions),
        });
        try {
          await cache?.put(cacheKey, Response.json(result, { headers: { 'Cache-Control': 'public, max-age=3600' } }));
        } catch {
          requestLogger(context).warn({ event: 'search_stats_cache_unavailable', safeReason: 'write_failed' });
        }
        return jsonNoStore(context.json(result, 200));
      } catch (error) {
        requestLogger(context).warn({
          event: 'search_stats_read_failed',
          safeReason: signal?.aborted
            ? 'upstream_timeout'
            : error instanceof SearchReadFailure
              ? error.safeReason
              : 'upstream_http',
          upstreamStatus,
        });
        return jsonError(context, {
          code: 'service_unavailable',
          message: 'Search figures are temporarily unavailable. Try again.',
          status: 503,
        });
      }
    },
  );
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function signAssertion(credentialsText: string): Promise<string> {
  try {
    const credentials = credentialsSchema.parse(JSON.parse(credentialsText));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(
        atob(credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
        (char) => char.charCodeAt(0),
      ),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const encode = (value: object) => base64url(new TextEncoder().encode(JSON.stringify(value)));
    const issuedAt = Math.floor(Date.now() / 1000);
    const input = `${encode({ alg: 'RS256', typ: 'JWT', kid: credentials.private_key_id })}.${encode({
      iss: credentials.client_email,
      scope,
      aud: tokenUrl,
      iat: issuedAt,
      exp: issuedAt + 3600,
    })}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
    return `${input}.${base64url(new Uint8Array(signature))}`;
  } catch {
    throw new SearchReadFailure('upstream_auth');
  }
}

async function readSearchBody(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new SearchReadFailure('upstream_invalid_shape');
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 128 * 1024) throw new SearchReadFailure('upstream_invalid_shape');
      text += decoder.decode(value, { stream: true });
    }
    try {
      return JSON.parse(text + decoder.decode());
    } catch {
      throw new SearchReadFailure('upstream_invalid_shape');
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
