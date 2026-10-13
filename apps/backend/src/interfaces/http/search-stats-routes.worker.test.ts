import { env } from 'cloudflare:workers';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { commerceRuntimeConfigFromBindings, type AppBindings } from '../../platform/env';
import { createHttpApp } from './app';

const tokenUrl = 'https://oauth2.googleapis.com/token';
const token = 'generated-test-access-token-never-expose';
const app = createHttpApp();
const now = new Date('2026-10-13T12:00:00.000Z');
let bindings: AppBindings;
let pair: CryptoKeyPair;
let privateKey: string;
let credentialsText: string;
let cache: Cache;
const read = (range = '7d', requestId = 'search-stats-test') =>
  app.request(
    `http://127.0.0.1/api/internal/search-stats?range=${range}`,
    { headers: { 'X-Request-Id': requestId } },
    bindings,
  );
const row = (clicks: number, impressions: number, position: number, key?: string) => ({
  clicks,
  impressions,
  position,
  ...(key === undefined ? {} : { keys: [key] }),
});
const queryRows = [row(2, 20, 3, 'blackbox records'), row(5, 15, 2, 'label'), row(5, 25, 4, 'vinyl')];

beforeAll(async () => {
  pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  privateKey = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))))}\n-----END PRIVATE KEY-----`;
});
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  credentialsText = JSON.stringify({
    type: 'service_account',
    client_email: 'stats@test-project.iam.gserviceaccount.com',
    private_key_id: crypto.randomUUID(),
    private_key: privateKey,
    token_uri: 'https://ignored.example/token',
  });
  bindings = {
    PRODUCT_ENVIRONMENT: 'LOCAL',
    LOCAL_OPERATOR_EMAIL: 'operator@example.com',
    COMMERCE_DB: env.COMMERCE_DB,
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
    GOOGLE_SEARCH_CONSOLE_SITE: `sc-domain:stats-${crypto.randomUUID()}.example`,
    GOOGLE_SEARCH_CONSOLE_CREDENTIALS: credentialsText,
  };
  cache = await caches.open('search-stats-v1');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function stubUpstream(overrides: { totals?: unknown; queries?: unknown; dates?: unknown; expiresIn?: number } = {}) {
  const upstream = vi.fn(async (url: string, init: RequestInit) => {
    const request = new Request(url, init);
    expect(request.method).toBe('POST');
    expect(request.redirect).toBe('manual');
    if (url === tokenUrl)
      return Response.json({ access_token: token, token_type: 'Bearer', expires_in: overrides.expiresIn ?? 3600 });
    expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    const body = await request.json<{ dimensions?: string[] }>();
    return Response.json(
      body.dimensions?.[0] === 'query'
        ? (overrides.queries ?? { rows: queryRows })
        : body.dimensions?.[0] === 'date'
          ? (overrides.dates ?? { rows: [row(1, 5, 2, '2026-10-12'), row(2, 7, 4, '2026-10-07')] })
          : (overrides.totals ?? { rows: [row(30, 400, 4.5)] }),
    );
  });
  vi.stubGlobal('fetch', upstream);
  return upstream;
}

describe('Search Console stats', () => {
  it.each(['7d', '30d'])(
    'signs a verifiable RS256 JWT and queries %s totals, terms and latest data date',
    async (range) => {
      const upstream = stubUpstream();
      const response = await read(range);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(await response.json()).toEqual({
        range,
        generatedAt: now.toISOString(),
        status: 'ok',
        latestDate: '2026-10-12',
        totals: { clicks: 30, impressions: 400, position: 4.5 },
        topQueries: [
          { query: 'vinyl', clicks: 5, impressions: 25, position: 4 },
          { query: 'label', clicks: 5, impressions: 15, position: 2 },
          { query: 'blackbox records', clicks: 2, impressions: 20, position: 3 },
        ],
      });
      expect(upstream).toHaveBeenCalledTimes(4);
      const [url, init] = upstream.mock.calls[0]!;
      expect(url).toBe(tokenUrl);
      const form = new URLSearchParams(String(init.body));
      expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
      const assertion = form.get('assertion')!;
      const [header, claims, signature] = assertion.split('.') as [string, string, string];
      const decode = (value: string) => atob(value.replace(/-/g, '+').replace(/_/g, '/'));
      expect(JSON.parse(decode(header))).toEqual({
        alg: 'RS256',
        typ: 'JWT',
        kid: JSON.parse(credentialsText).private_key_id,
      });
      const issuedAt = now.getTime() / 1000;
      expect(JSON.parse(decode(claims))).toEqual({
        iss: 'stats@test-project.iam.gserviceaccount.com',
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        aud: tokenUrl,
        iat: issuedAt,
        exp: issuedAt + 3600,
      });
      expect(
        await crypto.subtle.verify(
          'RSASSA-PKCS1-v1_5',
          pair.publicKey,
          Uint8Array.from(decode(signature), (char) => char.charCodeAt(0)),
          new TextEncoder().encode(`${header}.${claims}`),
        ),
      ).toBe(true);
      const bodies = upstream.mock.calls.slice(1).map(([queryUrl, queryInit]) => {
        expect(queryUrl).toBe(
          `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(bindings.GOOGLE_SEARCH_CONSOLE_SITE!)}/searchAnalytics/query`,
        );
        expect(queryInit.signal).toBeInstanceOf(AbortSignal);
        return JSON.parse(String(queryInit.body));
      });
      const window = {
        startDate: range === '7d' ? '2026-10-07' : '2026-09-14',
        endDate: '2026-10-13',
        dataState: 'all',
      };
      expect(bodies).toEqual([
        window,
        { ...window, dimensions: ['query'], rowLimit: 10 },
        { ...window, dimensions: ['date'], rowLimit: 30 },
      ]);
    },
  );

  it('caches only snapshots for one hour and verifies Access before a cache hit', async () => {
    const upstream = stubUpstream();
    const put = vi.spyOn(cache, 'put');
    vi.spyOn(caches, 'open').mockResolvedValue(cache);
    const first = await read('7d', 'first');
    vi.setSystemTime(new Date(now.getTime() + 1000));
    const second = await read('7d', 'second');
    expect(await second.json()).toEqual(await first.json());
    expect(second.headers.get('X-Request-Id')).toBe('second');
    expect(upstream).toHaveBeenCalledTimes(4);
    const [key, stored] = put.mock.calls[0]!;
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(stored.headers.has('X-Request-Id')).toBe(false);
    expect(new URL((key as Request).url).pathname).toContain('/__search-stats-cache/v1/LOCAL/');
    expect((key as Request).url).not.toContain(token);
    expect((key as Request).url).not.toContain('PRIVATE');
    await read('30d');
    expect(upstream).toHaveBeenCalledTimes(7);
    bindings.GOOGLE_SEARCH_CONSOLE_SITE = 'sc-domain:other.example';
    await read();
    expect(upstream).toHaveBeenCalledTimes(10);
    bindings.PRODUCT_ENVIRONMENT = 'UAT';
    bindings.CF_ACCESS_TEAM_DOMAIN = 'https://blackbox-records.cloudflareaccess.com';
    bindings.CF_ACCESS_POLICY_AUD = 'staff';
    expect((await read()).status).toBe(401);
    expect(upstream).toHaveBeenCalledTimes(10);
  });

  it('refreshes a token a minute before expiry and isolates credentials', async () => {
    const upstream = stubUpstream();
    await read();
    vi.setSystemTime(new Date(now.getTime() + 3539 * 1000));
    await read('30d');
    expect(upstream.mock.calls.filter(([url]) => url === tokenUrl)).toHaveLength(1);
    vi.setSystemTime(new Date(now.getTime() + 3540 * 1000));
    bindings.GOOGLE_SEARCH_CONSOLE_SITE = 'sc-domain:expiry.example';
    await read();
    expect(upstream.mock.calls.filter(([url]) => url === tokenUrl)).toHaveLength(2);
    bindings.GOOGLE_SEARCH_CONSOLE_SITE = 'sc-domain:rotation.example';
    bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS = JSON.stringify({
      ...JSON.parse(credentialsText),
      private_key_id: 'rotated-test-key',
    });
    await read();
    expect(upstream.mock.calls.filter(([url]) => url === tokenUrl)).toHaveLength(3);
  });

  it('returns empty configured data and null position when there are no impressions', async () => {
    stubUpstream({ totals: { rows: [row(0, 0, 0)] }, queries: {}, dates: {} });
    expect(await (await read()).json()).toMatchObject({
      status: 'ok',
      latestDate: null,
      totals: { clicks: 0, impressions: 0, position: null },
      topQueries: [],
    });
    bindings.GOOGLE_SEARCH_CONSOLE_SITE = 'sc-domain:empty.example';
    stubUpstream({ totals: {}, queries: {}, dates: {} });
    expect(await (await read()).json()).toMatchObject({
      status: 'ok',
      latestDate: null,
      totals: { clicks: 0, impressions: 0, position: null },
      topQueries: [],
    });
  });

  it.each(['GOOGLE_SEARCH_CONSOLE_SITE', 'GOOGLE_SEARCH_CONSOLE_CREDENTIALS'] as const)(
    'returns not_configured for absent or blank %s without reading a cached snapshot',
    async (name) => {
      const upstream = stubUpstream();
      await read();
      const match = vi.spyOn(cache, 'match');
      vi.spyOn(caches, 'open').mockResolvedValue(cache);
      for (const value of [undefined, '', '   ']) {
        bindings[name] = value;
        const response = await read();
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          range: '7d',
          generatedAt: null,
          status: 'not_configured',
          latestDate: null,
          totals: { clicks: 0, impressions: 0, position: null },
          topQueries: [],
        });
      }
      expect(upstream).toHaveBeenCalledTimes(4);
      expect(match).not.toHaveBeenCalled();
    },
  );

  it.each(['', '1d', '7D', '30'])('rejects invalid range %s without fetching', async (range) => {
    const upstream = stubUpstream();
    expect((await read(range)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('requires a range', async () => {
    expect((await app.request('http://127.0.0.1/api/internal/search-stats', {}, bindings)).status).toBe(400);
  });

  it.each([
    ['token_auth', 'upstream_auth'],
    ['token_http', 'upstream_http'],
    ['search_auth', 'upstream_auth'],
    ['http', 'upstream_http'],
    ['redirect', 'upstream_http'],
    ['network', 'upstream_http'],
    ['token_shape', 'upstream_invalid_shape'],
    ['totals_shape', 'upstream_invalid_shape'],
    ['queries_shape', 'upstream_invalid_shape'],
    ['dates_shape', 'upstream_invalid_shape'],
    ['json', 'upstream_invalid_shape'],
    ['oversized', 'upstream_invalid_shape'],
    ['no_body', 'upstream_invalid_shape'],
    ['credentials_json', 'upstream_auth'],
    ['credentials_key', 'upstream_auth'],
  ])('handles %s without leaking keys, assertions, tokens or provider bodies', async (failure, safeReason) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let assertion = '';
    const providerBody = 'private-upstream-body';
    const upstream = vi.fn(async (url: string, init: RequestInit) => {
      const request = new Request(url, init);
      expect(request.redirect).toBe('manual');
      if (url === tokenUrl) {
        assertion = new URLSearchParams(String(init.body)).get('assertion')!;
        if (failure === 'token_auth') return new Response(providerBody, { status: 400 });
        if (failure === 'token_http') return new Response(providerBody, { status: 500 });
        if (failure === 'token_shape') return Response.json({ access_token: token, expires_in: providerBody });
        return Response.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
      }
      if (failure === 'network') throw new Error(`${privateKey} ${token} ${assertion}`);
      if (failure === 'search_auth') return new Response(providerBody, { status: 403 });
      if (failure === 'http') return new Response(providerBody, { status: 500 });
      if (failure === 'redirect')
        return new Response(null, { status: 302, headers: { Location: 'https://other.example' } });
      if (failure === 'json') return new Response(providerBody);
      if (failure === 'oversized') return new Response(providerBody.repeat(10000));
      if (failure === 'no_body') return new Response(null);
      const body = JSON.parse(String(init.body));
      if (!body.dimensions)
        return Response.json(failure === 'totals_shape' ? { data: providerBody } : { rows: [row(1, 10, 2)] });
      if (body.dimensions[0] === 'query')
        return Response.json(failure === 'queries_shape' ? { rows: [row(-1, 3, 2, providerBody)] } : { rows: [] });
      return Response.json(failure === 'dates_shape' ? { rows: [row(1, 3, 2, 'not-a-date')] } : {});
    });
    vi.stubGlobal('fetch', upstream);
    if (failure === 'credentials_json') bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS = providerBody;
    if (failure === 'credentials_key')
      bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS = JSON.stringify({
        ...JSON.parse(credentialsText),
        private_key: providerBody,
      });
    const put = vi.spyOn(cache, 'put');
    vi.spyOn(caches, 'open').mockResolvedValue(cache);
    const response = await read();
    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toContain('application/problem+json');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Request-Id')).toBe('search-stats-test');
    const problem = await response.json();
    expect(problem).toEqual({
      type: '/problems/service_unavailable',
      title: 'Service unavailable.',
      status: 503,
      code: 'service_unavailable',
      detail: 'Search figures are temporarily unavailable. Try again.',
      error: 'Search figures are temporarily unavailable. Try again.',
      requestId: 'search-stats-test',
    });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'search_stats_read_failed', safeReason, requestId: 'search-stats-test' }),
    );
    const exposed = JSON.stringify([problem, warn.mock.calls]);
    for (const secret of [privateKey, credentialsText, token, providerBody, assertion].filter(Boolean))
      expect(exposed).not.toContain(secret);
    expect(put).not.toHaveBeenCalled();
  });

  it('keeps the shared ten-second deadline active while a query body streams', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    const upstream = vi.fn(async (url: string, init: RequestInit) => {
      expect(new Request(url, init).signal).toBeInstanceOf(AbortSignal);
      if (url === tokenUrl) return Response.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
      return new Response(
        new ReadableStream({
          start(stream) {
            controller.signal.addEventListener('abort', () =>
              stream.error(new DOMException('private timeout', 'TimeoutError')),
            );
          },
        }),
      );
    });
    vi.stubGlobal('fetch', upstream);
    const pending = read();
    await vi.waitFor(() => expect(upstream).toHaveBeenCalledTimes(2));
    expect(timeout).toHaveBeenCalledExactlyOnceWith(10000);
    controller.abort();
    expect((await pending).status).toBe(503);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'search_stats_read_failed', safeReason: 'upstream_timeout' }),
    );
  });

  it('still serves successful data when optional cache reads and writes fail', async () => {
    vi.spyOn(caches, 'open').mockResolvedValue(cache);
    vi.spyOn(cache, 'match').mockRejectedValue(new Error(privateKey));
    vi.spyOn(cache, 'put').mockRejectedValue(new Error(token));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubUpstream();
    expect((await read()).status).toBe(200);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(privateKey);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(token);
  });

  it.each(['missing', 'forged'])('rejects %s Access identity even with a snapshot cached', async (identity) => {
    const upstream = stubUpstream();
    await read();
    const response = await app.request(
      'https://staff.blackboxrecordsathens.com/api/internal/search-stats?range=7d',
      {
        headers: {
          'cf-access-authenticated-user-email': 'operator@example.com',
          ...(identity === 'forged' ? { 'Cf-Access-Jwt-Assertion': 'forged' } : {}),
        },
      },
      {
        ...bindings,
        PRODUCT_ENVIRONMENT: 'PRD',
        CF_ACCESS_TEAM_DOMAIN: 'https://blackbox-records.cloudflareaccess.com',
        CF_ACCESS_POLICY_AUD: 'staff',
      },
    );
    expect(response.status).toBe(401);
    expect(upstream).toHaveBeenCalledTimes(4);
  });

  it('forwards the optional Search Console bindings through commerce runtime config', () => {
    expect(commerceRuntimeConfigFromBindings(bindings)).toMatchObject({
      GOOGLE_SEARCH_CONSOLE_SITE: bindings.GOOGLE_SEARCH_CONSOLE_SITE,
      GOOGLE_SEARCH_CONSOLE_CREDENTIALS: credentialsText,
    });
  });
});
