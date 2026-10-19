import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { commerceRuntimeConfigFromBindings, type AppBindings } from '../../platform/env';
import { createHttpApp } from './app';
import fixture from './routes/fixtures/site-analytics-graphql.json';
import liveFixture from './routes/fixtures/site-analytics-live-graphql.json';
import { launchGap } from '../../application/analytics';

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

function windowFixture(init: RequestInit, source = fixture) {
  const result = structuredClone(source);
  const account: Record<string, unknown> = result.data.viewer.accounts[0]!;
  const { variables } = JSON.parse(String(init.body));
  for (const name of Object.keys(variables)) {
    if (!/^rumFilter\d+$/.test(name)) continue;
    for (const key of Object.keys(source.data.viewer.accounts[0]!))
      account[`${key}${name.slice('rumFilter'.length)}`] = [];
  }
  return result;
}

beforeEach(async () => {
  cache = await caches.open('site-analytics-v4');
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
  it.each(['7d', '30d'])(
    'adds the frozen launch estimate once and preserves RUM and the contract for %s',
    async (range) => {
      vi.setSystemTime(new Date('2026-10-16T14:00:00.000Z'));
      bindings.CLOUDFLARE_ACCOUNT_ID = launchGap.accountTag;
      bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG = launchGap.siteTag;
      const upstream = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        const result = windowFixture(init);
        // The first RUM minute is retained in the normal provider data, not in the estimate.
        result.data.viewer.accounts[0]!.daily = [{ dimensions: { date: '2026-10-16' }, count: 2, sum: { visits: 1 } }];
        return Promise.resolve(Response.json(result));
      });
      vi.stubGlobal('fetch', upstream);
      const response = await read(range);
      const result = await response.json<Record<string, unknown>>();
      expect(response.status).toBe(200);
      expect(Object.keys(result)).toEqual([
        'range',
        'generatedAt',
        'status',
        'daily',
        'topPaths',
        'topReferrers',
        'topCountries',
        'deviceTypes',
      ]);
      expect(result.daily).toContainEqual({ date: '2026-10-16', visits: 51, pageViews: 52 });
      expect(result.daily).toContainEqual({ date: '2026-10-15', visits: 0, pageViews: 0 });
      expect(result.topPaths).toContainEqual({ path: '/', visits: 50, pageViews: 54 });
      expect(result.topCountries).toContainEqual({ country: 'GR', visits: 43, pageViews: 49 });
      expect(result.deviceTypes).toContainEqual({ deviceType: 'mobile', visits: 47, pageViews: 53 });
      expect(result.topReferrers).toEqual([
        { host: '', visits: 7, pageViews: 10 },
        { host: 'bandcamp.com', visits: 4, pageViews: 7 },
      ]);
      expect(await (await read(range, 'second-read')).json()).toEqual(result);
      expect(upstream).toHaveBeenCalledTimes(1);
      expect(caches.open).toHaveBeenCalledWith('site-analytics-v4');
      expect(launchGap.endExclusive).toBe('2026-10-16T12:19:00Z');
      expect(launchGap.daily).toEqual([{ dimensions: { date: '2026-10-16' }, sum: { visits: 50 }, count: 50 }]);
      for (const key of ['topPaths', 'topCountries', 'deviceTypes'] as const) {
        expect(launchGap[key].reduce((sum, row) => sum + row.sum.visits, 0)).toBe(50);
        expect(launchGap[key].reduce((sum, row) => sum + row.count, 0)).toBe(50);
      }
    },
  );

  it.each([
    ['2026-10-16T12:18:59.999Z', '7d', false],
    ['2026-10-16T12:19:00.000Z', '7d', true],
    ['2026-10-22T23:59:59.999Z', '7d', true],
    ['2026-10-23T00:00:00.000Z', '7d', false],
    ['2026-10-23T00:00:00.000Z', '30d', true],
    ['2026-11-14T23:59:59.999Z', '30d', true],
    ['2026-11-15T00:00:00.000Z', '30d', false],
    ['2026-10-15T23:59:59.999Z', '30d', false],
  ])('limits the estimate to the overlapping range at %s (%s)', async (timestamp, range, included) => {
    vi.setSystemTime(new Date(timestamp));
    bindings.CLOUDFLARE_ACCOUNT_ID = launchGap.accountTag;
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG = launchGap.siteTag;
    await cache.delete(
      new Request(
        `https://staff.blackboxrecordsathens.com/__analytics-cache/v4/LOCAL/${launchGap.accountTag}/${launchGap.siteTag}/${timestamp.slice(0, 10)}?range=${range}`,
      ),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        const result = windowFixture(init);
        for (const key of Object.keys(result.data.viewer.accounts[0]!)) {
          (result.data.viewer.accounts[0] as Record<string, unknown>)[key] = [];
        }
        return Promise.resolve(Response.json(result));
      }),
    );
    const result = await (
      await read(range)
    ).json<{ daily: Array<{ visits: number; pageViews: number }>; topPaths: unknown[] }>();
    expect(result.daily.reduce((sum, row) => sum + row.visits, 0)).toBe(included ? 50 : 0);
    expect(result.daily.reduce((sum, row) => sum + row.pageViews, 0)).toBe(included ? 50 : 0);
    expect(result.topPaths).toHaveLength(included ? 8 : 0);
  });

  it.each(['account', 'site'])('does not add production traffic to another %s', async (different) => {
    vi.setSystemTime(new Date('2026-10-16T14:00:00.000Z'));
    bindings.CLOUDFLARE_ACCOUNT_ID = different === 'account' ? crypto.randomUUID() : launchGap.accountTag;
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG = different === 'site' ? 'another-site' : launchGap.siteTag;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(fixture)));
    const result = await (await read()).json<{ daily: Array<{ date: string; visits: number; pageViews: number }> }>();
    expect(result.daily.find((row) => row.date === '2026-10-16')).toEqual({
      date: '2026-10-16',
      visits: 0,
      pageViews: 0,
    });
  });

  it.each(['2026-10-13T12:00:00.000Z', '2027-01-01T00:00:00.000Z'])(
    'aligns consecutive windows with the seven-day query at %s',
    async (timestamp) => {
      vi.setSystemTime(new Date(timestamp));
      const upstream = vi.fn().mockImplementation((url: string, init: RequestInit) => {
        expect(new Request(url, init).redirect).toBe('manual');
        return Promise.resolve(Response.json(windowFixture(init)));
      });
      vi.stubGlobal('fetch', upstream);
      expect((await read('7d')).status).toBe(200);
      expect((await read('30d')).status).toBe(200);
      expect(upstream).toHaveBeenCalledTimes(2);
      const seven = JSON.parse(upstream.mock.calls[0]![1].body as string);
      const thirty = JSON.parse(upstream.mock.calls[1]![1].body as string);
      expect(thirty.variables.rumFilter).toEqual(seven.variables.rumFilter);
      const newestFields =
        /(?:daily|topPaths|topReferrers|topCountries|deviceTypes): rumPageloadEventsAdaptiveGroups\([^)]*\)\s*\{[^}]*\}[^}]*\}/g;
      expect(thirty.query.match(newestFields)).toEqual(seven.query.match(newestFields));
      expect(seven.query.match(newestFields)).toHaveLength(5);
      const filters = Object.entries(thirty.variables)
        .filter(([key]) => key.startsWith('rumFilter'))
        .map(([, value]) => value) as Array<{ datetime_geq: string; datetime_lt: string }>;
      expect(filters).toHaveLength(5);
      expect(Object.keys(seven.variables)).toEqual(['accountTag', 'rumFilter']);
      const midnight = new Date(timestamp);
      midnight.setUTCHours(0, 0, 0, 0);
      const expectedOffsets = [6, 13, 20, 27, 29];
      filters.forEach((filter, index) => {
        expect(filter.datetime_geq).toBe(
          new Date(midnight.getTime() - expectedOffsets[index]! * 86400000).toISOString(),
        );
        expect(filter.datetime_lt).toBe(index === 0 ? timestamp : filters[index - 1]!.datetime_geq);
        expect(new Date(filter.datetime_lt).getTime() - new Date(filter.datetime_geq).getTime()).toBeLessThanOrEqual(
          7 * 86400000,
        );
      });
      expect(new Date(filters[4]!.datetime_lt).getTime() - new Date(filters[4]!.datetime_geq).getTime()).toBe(
        2 * 86400000,
      );
      expect(thirty.query.match(/limit: 25/g)).toHaveLength(15);
      expect(thirty.query.match(/limit: 100/g)).toHaveLength(5);
    },
  );

  it('merges dates and every breakdown key, ranks by visits and retains all devices', async () => {
    vi.setSystemTime(new Date('2026-10-13T12:00:00.000Z'));
    const row = (value: string, visits: number, count = visits) => ({ dimensions: { value }, sum: { visits }, count });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init: RequestInit) => {
        expect(new Request(url, init).method).toBe('POST');
        const result = windowFixture(init);
        const account: Record<string, unknown> = result.data.viewer.accounts[0]!;
        for (let index = 0; index < 5; index++) {
          const suffix = index === 0 ? '' : String(index);
          account[`daily${suffix}`] =
            index === 0
              ? [
                  { dimensions: { date: '2026-10-09' }, sum: { visits: 12 }, count: 12 },
                  { dimensions: { date: '2026-10-09' }, sum: { visits: 5 }, count: 7 },
                ]
              : [
                  {
                    dimensions: { date: ['2026-09-30', '2026-09-23', '2026-09-16', '2026-09-14'][index - 1] },
                    sum: { visits: index + 1 },
                    count: index + 2,
                  },
                ];
          for (const key of ['topPaths', 'topReferrers', 'topCountries', 'deviceTypes']) {
            account[`${key}${suffix}`] = [
              row('shared', index + 1, 10),
              ...Array.from({ length: 12 }, (_, item) => row(`key-${item}`, 12 - item, item + 100)),
            ];
          }
        }
        return Promise.resolve(Response.json(result));
      }),
    );
    const response = await read('30d');
    expect(response.status).toBe(200);
    const result = await response.json<{
      daily: unknown[];
      topPaths: unknown[];
      topReferrers: unknown[];
      topCountries: unknown[];
      deviceTypes: unknown[];
    }>();
    expect(result.daily).toHaveLength(30);
    expect(result.daily).toContainEqual({ date: '2026-10-09', visits: 17, pageViews: 19 });
    expect(result.daily[0]).toEqual({ date: '2026-09-14', visits: 5, pageViews: 6 });
    for (const [key, dimension] of [
      ['topPaths', 'path'],
      ['topReferrers', 'host'],
      ['topCountries', 'country'],
      ['deviceTypes', 'deviceType'],
    ] as const) {
      expect(result[key]).toHaveLength(key === 'deviceTypes' ? 13 : 10);
      expect(result[key][0]).toEqual({ [dimension]: 'key-0', visits: 60, pageViews: 500 });
    }
    expect(result.deviceTypes).toContainEqual({ deviceType: 'shared', visits: 15, pageViews: 50 });
  });

  it('rejects a missing older window without caching a partial 30-day snapshot', async () => {
    const put = vi.spyOn(cache, 'put');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(fixture)));
    expect((await read('30d')).status).toBe(503);
    expect(put).not.toHaveBeenCalled();
  });

  it.each(['7d', '30d'])('constructs a valid workerd upstream request for %s', async (range) => {
    let requestError: unknown;
    const upstream = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      try {
        const request = new Request(url, init);
        expect(request.redirect).toBe('manual');
        expect(request.headers.get('Authorization')).toBe(`Bearer ${secret}`);
      } catch (error) {
        requestError = error;
        throw error;
      }
      return Promise.resolve(Response.json(windowFixture(init, liveFixture)));
    });
    vi.stubGlobal('fetch', upstream);
    const response = await read(range);
    expect(requestError).toBeUndefined();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok', range });
    expect(upstream).toHaveBeenCalledOnce();
  });

  it.each([301, 302, 303, 307, 308])('rejects an upstream %s redirect without following it', async (status) => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const upstream = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      expect(new Request(url, init).redirect).toBe('manual');
      return Promise.resolve(new Response(null, { status, headers: { Location: 'https://other.example/' } }));
    });
    vi.stubGlobal('fetch', upstream);
    const response = await read();
    expect(response.status).toBe(503);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'analytics_read_failed', safeReason: 'upstream_http', upstreamStatus: status }),
    );
    expect(upstream).toHaveBeenCalledOnce();
    expect(JSON.stringify([await response.json(), log.mock.calls])).not.toContain(secret);
  });

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
    const upstream = vi
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => Promise.resolve(Response.json(windowFixture(init))));
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
    expect(request.variables).toMatchObject({
      accountTag: bindings.CLOUDFLARE_ACCOUNT_ID,
      rumFilter: {
        siteTag: 'test-site',
        requestHost: 'blackboxrecordsathens.com',
        bot: 0,
        datetime_geq: '2026-10-06T00:00:00.000Z',
        datetime_lt: '2026-10-12T12:00:00.000Z',
      },
    });
    expect(request.query).not.toContain('workersInvocationsAdaptive');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(body)).not.toContain(secret);
  });

  it.each(['7d', '30d'])('reads the captured live Cloudflare response as a stream for %s', async (range) => {
    vi.setSystemTime(new Date('2026-10-13T12:00:00.000Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        const bytes = new TextEncoder().encode(JSON.stringify(windowFixture(init, liveFixture)));
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                for (let offset = 0; offset < bytes.length; offset += 127)
                  controller.enqueue(bytes.slice(offset, offset + 127));
                controller.close();
              },
            }),
          ),
        );
      }),
    );
    const response = await read(range);
    expect(response.status).toBe(200);
    const body = await response.json<{ daily: Array<{ date: string; visits: number; pageViews: number }> }>();
    expect(body.daily).toHaveLength(range === '7d' ? 7 : 30);
    expect(body.daily.find((day) => day.date === '2026-10-09')).toEqual({
      date: '2026-10-09',
      visits: 17,
      pageViews: 17,
    });
    expect(body.daily.at(-1)).toEqual({ date: '2026-10-13', visits: 0, pageViews: 0 });
    expect(body).toMatchObject({
      status: 'ok',
      topPaths: expect.arrayContaining([{ path: '/', visits: 2, pageViews: 2 }]),
      topReferrers: [{ host: 'www.google.com', visits: 17, pageViews: 17 }],
      topCountries: [{ country: 'US', visits: 17, pageViews: 17 }],
      deviceTypes: [{ deviceType: 'desktop', visits: 17, pageViews: 17 }],
    });
  });

  it('uses the real Workers Cache API for 15 minutes without caching request identity', async () => {
    const upstream = vi
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => Promise.resolve(Response.json(windowFixture(init))));
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
    expect(new URL((key as Request).url).pathname).toContain('/__analytics-cache/v4/');
    await read('30d');
    expect(upstream).toHaveBeenCalledTimes(2);
    bindings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG = 'another-site';
    await read();
    expect(upstream).toHaveBeenCalledTimes(3);
    bindings.CLOUDFLARE_ACCOUNT_ID = crypto.randomUUID();
    await read();
    expect(upstream).toHaveBeenCalledTimes(4);
  });

  it.each(['v1', 'v2', 'v3'])('does not serve a snapshot from the earlier %s cache', async (version) => {
    vi.mocked(caches.open).mockRestore();
    const oldCache = await caches.open(`site-analytics-${version}`);
    await oldCache.put(
      new Request(
        `https://staff.blackboxrecordsathens.com/__analytics-cache/${version}/LOCAL/${bindings.CLOUDFLARE_ACCOUNT_ID}/test-site/2026-10-12?range=7d`,
      ),
      Response.json(
        {
          range: '7d',
          generatedAt: '2026-10-12T12:00:00.000Z',
          status: 'ok',
          daily: [{ date: '2026-10-12', visits: 999, pageViews: 999 }],
          topPaths: [],
          topReferrers: [],
          topCountries: [],
          deviceTypes: [],
        },
        { headers: { 'Cache-Control': 'public, max-age=900' } },
      ),
    );
    const open = vi.spyOn(caches, 'open');
    const upstream = vi.fn().mockImplementation(() => Promise.resolve(Response.json(fixture)));
    vi.stubGlobal('fetch', upstream);
    expect(await (await read()).json()).toMatchObject({ status: 'ok' });
    expect(upstream).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledExactlyOnceWith('site-analytics-v4');
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

  it.each([
    ['http', 'upstream_http'],
    ['graphql', 'upstream_graphql'],
    ['invalid_json', 'upstream_invalid_json'],
    ['invalid_shape', 'upstream_invalid_shape'],
    ['missing_body', 'upstream_invalid_shape'],
    ['network', 'upstream_network'],
    ['oversized', 'upstream_body_too_large'],
  ])('returns safe problem details and a fixed reason for %s without caching it', async (failure, safeReason) => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const upstream = vi.fn().mockImplementation(() => {
      if (failure === 'network') throw new Error(secret);
      return Promise.resolve(
        failure === 'http'
          ? new Response(secret, { status: 403 })
          : failure === 'graphql'
            ? Response.json({ data: null, errors: [{ message: secret }] })
            : failure === 'invalid_shape'
              ? Response.json({ data: secret })
              : new Response(
                  failure === 'missing_body' ? null : failure === 'oversized' ? secret.repeat(10000) : secret,
                ),
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
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'analytics_read_failed',
        requestId: 'analytics-test',
        safeReason,
        ...(failure === 'network' ? {} : { upstreamStatus: failure === 'http' ? 403 : 200 }),
      }),
    );
    await read();
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('aborts an upstream request at the configured deadline', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'analytics_read_failed',
        safeReason: 'upstream_timeout',
        requestId: 'analytics-test',
      }),
    );
  });

  it('keeps the abort deadline active while the upstream body is streaming', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    const upstream = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            start(stream) {
              controller.signal.addEventListener('abort', () => stream.error(new DOMException(secret, 'TimeoutError')));
            },
          }),
        ),
      ),
    );
    vi.stubGlobal('fetch', upstream);
    const pending = read();
    await vi.waitFor(() => expect(upstream).toHaveBeenCalledOnce());
    controller.abort();
    expect((await pending).status).toBe(503);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'analytics_read_failed',
        safeReason: 'upstream_timeout',
        upstreamStatus: 200,
      }),
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
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
