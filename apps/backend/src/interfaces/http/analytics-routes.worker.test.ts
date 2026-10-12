import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { commerceRuntimeConfigFromBindings, type AppBindings } from '../../platform/env';
import { createHttpApp } from './app';
import fixture from './routes/fixtures/site-analytics-graphql.json';

const secret = 'test-analytics-secret-never-expose';
let bindings: AppBindings;
let cache: Cache;
const app = createHttpApp();
const read = (range = '7d', requestId = 'analytics-test') =>
  app.request(
    `http://127.0.0.1/api/internal/analytics?range=${range}`,
    { headers: { 'X-Request-Id': requestId } },
    bindings,
  );

beforeEach(async () => {
  cache = await caches.open('site-analytics-v1');
  vi.spyOn(caches, 'open').mockResolvedValue(cache);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'));
  bindings = {
    PRODUCT_ENVIRONMENT: 'LOCAL',
    LOCAL_OPERATOR_EMAIL: 'operator@blackboxrecords.example',
    COMMERCE_DB: env.COMMERCE_DB,
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
    CLOUDFLARE_ANALYTICS_API_TOKEN: secret,
    CLOUDFLARE_ACCOUNT_ID: crypto.randomUUID(),
    CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: 'test-site',
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('protected analytics read', () => {
  it.each(['', '1d', '90d', '7D', '7d%20', '30'])('rejects unsupported range %s before fetching', async (range) => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const response = await read(range);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_request', requestId: 'analytics-test' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('requires a range', async () => {
    const response = await app.request('http://127.0.0.1/api/internal/analytics', {}, bindings);
    expect(response.status).toBe(400);
  });

  it.each(['7d', '30d'])('maps the recorded GraphQL shape and fills UTC days for %s', async (range) => {
    const upstream = vi.fn().mockImplementation(() => Promise.resolve(Response.json(fixture)));
    vi.stubGlobal('fetch', upstream);
    const response = await read(range);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json<{ daily: unknown[] }>();
    expect(body).toMatchObject({
      range,
      generatedAt: '2026-10-12T12:00:00.000Z',
      status: 'ok',
      topPaths: [
        { path: '/', visits: 8, pageViews: 12 },
        { path: '/store/', visits: 3, pageViews: 5 },
      ],
      topReferrers: [
        { host: '', visits: 7, pageViews: 10 },
        { host: 'bandcamp.com', visits: 4, pageViews: 7 },
      ],
      topCountries: [{ country: 'GR', visits: 11, pageViews: 17 }],
      deviceTypes: [{ deviceType: 'mobile', visits: 11, pageViews: 17 }],
    });
    expect(body).not.toHaveProperty('workerRequests');
    expect(body.daily).toHaveLength(range === '7d' ? 7 : 30);
    expect(body.daily[0]).toEqual({ date: range === '7d' ? '2026-10-06' : '2026-09-13', visits: 0, pageViews: 0 });
    expect(body.daily.at(-1)).toEqual({ date: '2026-10-12', visits: 3, pageViews: 5 });
    const [url, init] = upstream.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(init.headers.Authorization).toBe(`Bearer ${secret}`);
    const request = JSON.parse(init.body);
    expect(request.variables).toEqual({
      accountTag: bindings.CLOUDFLARE_ACCOUNT_ID,
      rumFilter: {
        siteTag: 'test-site',
        datetime_geq: range === '7d' ? '2026-10-06T00:00:00.000Z' : '2026-09-13T00:00:00.000Z',
        datetime_lt: '2026-10-12T12:00:00.000Z',
      },
    });
    expect(request.query).not.toContain('workersInvocationsAdaptive');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(body)).not.toContain(secret);
  });

  it('uses the real Workers Cache API for 15 minutes without caching request identity', async () => {
    const upstream = vi.fn().mockImplementation(() => Promise.resolve(Response.json(fixture)));
    vi.stubGlobal('fetch', upstream);
    const put = vi.spyOn(cache, 'put');
    const first = await read('7d', 'first-read');
    const second = await read('7d', 'second-read');
    expect(await second.json()).toEqual(await first.json());
    expect(second.headers.get('X-Request-Id')).toBe('second-read');
    expect(upstream).toHaveBeenCalledTimes(1);
    const [key, stored] = put.mock.calls[0]!;
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=900');
    expect(stored.headers.has('X-Request-Id')).toBe(false);
    expect((key as Request).url).not.toContain(secret);
    await read('30d');
    expect(upstream).toHaveBeenCalledTimes(2);
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG = 'another-site';
    await read();
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  it('returns configured empty traffic separately from missing configuration', async () => {
    const empty = structuredClone(fixture);
    const account = empty.data.viewer.accounts[0]!;
    account.daily = [];
    account.topPaths = [];
    account.topReferrers = [];
    account.topCountries = [];
    account.deviceTypes = [];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(empty)));
    const body = await (
      await read()
    ).json<{
      status: string;
      daily: Array<{ visits: number; pageViews: number }>;
      topPaths: unknown[];
    }>();
    expect(body.status).toBe('ok');
    expect(body.daily).toHaveLength(7);
    expect(body.daily.every((day) => day.visits === 0 && day.pageViews === 0)).toBe(true);
    expect(body.topPaths).toEqual([]);
  });

  it('still returns fresh data if optional Cache API operations fail', async () => {
    vi.spyOn(cache, 'match').mockRejectedValue(new Error(secret));
    vi.spyOn(cache, 'put').mockRejectedValue(new Error(secret));
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(fixture)));
    const response = await read();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok' });
    expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
  });

  it.each(['CLOUDFLARE_ANALYTICS_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_WEB_ANALYTICS_SITE_TAG'] as const)(
    'returns not_configured when %s is missing, before reading any cache',
    async (name) => {
      const upstream = vi.fn().mockResolvedValue(Response.json(fixture));
      vi.stubGlobal('fetch', upstream);
      await read();
      bindings[name] = '  ';
      const response = await read();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        range: '7d',
        generatedAt: null,
        status: 'not_configured',
        daily: [],
        topPaths: [],
        topReferrers: [],
        topCountries: [],
        deviceTypes: [],
      });
      expect(upstream).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['http', 'graphql', 'invalid_json', 'invalid_shape', 'network', 'oversized'])(
    'returns safe problem details for %s failure without caching it',
    async (failure) => {
      const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const upstream = vi.fn().mockImplementation(() => {
        if (failure === 'network') throw new Error(secret);
        return Promise.resolve(
          failure === 'http'
            ? new Response(secret, { status: 403 })
            : failure === 'graphql'
              ? Response.json({ ...fixture, errors: [{ message: secret }] })
              : failure === 'invalid_shape'
                ? Response.json({ data: secret })
                : new Response(failure === 'oversized' ? secret.repeat(10000) : secret),
        );
      });
      vi.stubGlobal('fetch', upstream);
      const response = await read();
      expect(response.status).toBe(503);
      expect(response.headers.get('Content-Type')).toContain('application/problem+json');
      expect(response.headers.get('X-Request-Id')).toBe('analytics-test');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      const body = await response.json();
      expect(body).toEqual({
        type: '/problems/service_unavailable',
        title: 'Service unavailable.',
        status: 503,
        code: 'service_unavailable',
        detail: 'Analytics is temporarily unavailable. Try again.',
        error: 'Analytics is temporarily unavailable. Try again.',
        requestId: 'analytics-test',
      });
      expect(JSON.stringify([body, log.mock.calls])).not.toContain(secret);
      await read();
      expect(upstream).toHaveBeenCalledTimes(2);
    },
  );

  it('aborts an upstream request at the configured deadline', async () => {
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'TimeoutError')));
          }),
      ),
    );
    const pending = read();
    await vi.waitFor(() => expect(timeout).toHaveBeenCalledWith(10000));
    controller.abort();
    expect((await pending).status).toBe(503);
  });

  it.each(['missing', 'forged'])('rejects %s Access identity even when data is cached', async (identity) => {
    const upstream = vi.fn().mockResolvedValue(Response.json(fixture));
    vi.stubGlobal('fetch', upstream);
    await read();
    const response = await app.request(
      'https://staff.blackboxrecordsathens.com/api/internal/analytics?range=7d',
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
    expect(await response.json()).toMatchObject({ code: 'unauthorized' });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('forwards analytics configuration through the existing Durable Object runtime config', () => {
    expect(commerceRuntimeConfigFromBindings(bindings)).toMatchObject({
      CLOUDFLARE_ANALYTICS_API_TOKEN: secret,
      CLOUDFLARE_ACCOUNT_ID: bindings.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: 'test-site',
    });
  });
});
