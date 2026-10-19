import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBindings } from '../../platform/env';
import { archiveVisitStats, readStaffStats, type StatsQuery } from './index';

let bindings: AppBindings;
const now = new Date('2026-10-19T12:00:00Z');
const query: StatsQuery = {
  source: 'visits',
  range: '7d',
  filters: { page: '/store/', device: 'mobile' },
  compare: true,
};
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  bindings = {
    PRODUCT_ENVIRONMENT: 'LOCAL',
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
    COMMERCE_DB: env.COMMERCE_DB,
    CLOUDFLARE_ANALYTICS_API_TOKEN: 'fixture-token',
    CLOUDFLARE_ACCOUNT_ID: crypto.randomUUID(),
    CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: 'fixture-site',
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function visitsFetch(count = 1, path = '/store/') {
  return vi.fn(async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const rows = Object.fromEntries(
      Object.entries(body.variables)
        .filter(([key]) => key.startsWith('filter'))
        .map(([key, value]) => {
          const date = (value as { datetime_geq: string }).datetime_geq.slice(0, 10);
          return [
            'rows' + key.slice(6),
            Array.from({ length: count }, () => ({
              dimensions: { date, requestPath: path, refererHost: '', countryName: 'Greece', deviceType: 'mobile' },
              sum: { visits: 2 },
              count: 3,
            })),
          ];
        }),
    );
    return Response.json({ data: { viewer: { accounts: [rows] } } });
  });
}

describe('Visits provider and retained history', () => {
  it('uses bounded joint dimensions, combines filters and compares equal windows', async () => {
    const upstream = visitsFetch();
    vi.stubGlobal('fetch', upstream);
    const report = await readStaffStats(bindings, query, now);
    expect(report.totals).toEqual({ visits: 2, pageViews: 3 });
    expect(report.previous).toEqual({ visits: 2, pageViews: 3 });
    expect(report.complete).toBe(true);
    expect(report.daily).toHaveLength(7);
    expect(report.fields.find((field) => field.key === 'page')?.options[0]?.value).toBe('/store/');
    expect(upstream).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(upstream.mock.calls[0]![1].body));
    expect(body.query).toContain('date requestPath refererHost countryName deviceType');
    expect(body.variables.filter0).toMatchObject({ requestHost: 'blackboxrecordsathens.com', bot: 0 });
    const unmatched = await readStaffStats(bindings, { ...query, filters: { page: '/missing' } }, now);
    expect(unmatched.totals.visits).toBe(0);
  });
  it('retains only bounded daily aggregates, replays idempotently and isolates site/environment', async () => {
    const upstream = visitsFetch();
    vi.stubGlobal('fetch', upstream);
    const capture = new Date('2026-10-19T03:00:00Z');
    await archiveVisitStats(bindings, capture);
    await archiveVisitStats(bindings, capture);
    const rows = await env.COMMERCE_DB.prepare('SELECT * FROM SiteAnalyticsDay WHERE siteKey LIKE ? ORDER BY date')
      .bind(`LOCAL/${bindings.CLOUDFLARE_ACCOUNT_ID}/%`)
      .all<{ facts: string; date: string; siteKey: string }>();
    expect(rows.results).toHaveLength(3);
    expect(upstream).toHaveBeenCalledTimes(6);
    expect(rows.results.every((row) => new TextEncoder().encode(row.facts).byteLength <= 65536)).toBe(true);
    expect(rows.results[0]?.date).toBe('2026-10-16');
    const key = rows.results[0]!.siteKey;
    await env.COMMERCE_DB.prepare('INSERT INTO SiteAnalyticsDay VALUES (?, ?, ?, ?)')
      .bind(key, '2024-01-01', capture.toISOString(), '[]')
      .run();
    await env.COMMERCE_DB.prepare('INSERT INTO SiteAnalyticsDay VALUES (?, ?, ?, ?)')
      .bind(
        key,
        '2026-01-01',
        capture.toISOString(),
        JSON.stringify([
          {
            date: '2026-01-01',
            page: '/store/',
            referrer: '',
            country: 'Greece',
            device: 'mobile',
            visits: 8,
            pageViews: 11,
          },
        ]),
      )
      .run();
    await archiveVisitStats(bindings, capture);
    expect(
      (
        await env.COMMERCE_DB.prepare('SELECT date FROM SiteAnalyticsDay WHERE siteKey = ? AND date = ?')
          .bind(key, '2024-01-01')
          .all()
      ).results,
    ).toHaveLength(0);
    const historical: StatsQuery = {
      source: 'visits',
      range: 'custom',
      start: '2026-01-01',
      end: '2026-01-02',
      filters: {},
    };
    const saved = await readStaffStats(bindings, historical, now);
    expect(saved.totals.visits).toBe(8);
    expect(saved.daily.map((row) => row.available)).toEqual([true, false]);
    expect(saved.complete).toBe(false);
    const isolated = await readStaffStats({ ...bindings, PRODUCT_ENVIRONMENT: 'UAT' }, historical, now);
    expect(isolated.totals.visits).toBe(0);
    expect(isolated.daily.every((day) => !day.available)).toBe(true);
  });
  it('rejects saturated provider results and oversized captures without damaging saved history', async () => {
    vi.stubGlobal('fetch', visitsFetch(1001));
    await expect(readStaffStats(bindings, query, now)).rejects.toMatchObject({ safeReason: 'upstream_limit' });
    vi.stubGlobal('fetch', visitsFetch(400, '/' + 'a'.repeat(150)));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(archiveVisitStats(bindings, new Date('2026-10-19T03:00:00Z'))).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'site_analytics_archive_failed', safeReason: 'upstream_limit' }),
    );
    expect(
      (
        await env.COMMERCE_DB.prepare('SELECT date FROM SiteAnalyticsDay WHERE siteKey LIKE ?')
          .bind(`LOCAL/${bindings.CLOUDFLARE_ACCOUNT_ID}/%`)
          .all()
      ).results,
    ).toHaveLength(0);
  });
});

describe('Google Search provider', () => {
  it('sends exact intersecting filters, preserves private-query gaps and computes actual CTR', async () => {
    const pair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    );
    bindings.GOOGLE_SEARCH_CONSOLE_SITE = 'sc-domain:fixture.example';
    bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS = JSON.stringify({
      type: 'service_account',
      client_email: 'fixture@example.com',
      private_key_id: crypto.randomUUID(),
      private_key: `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))))}\n-----END PRIVATE KEY-----`,
    });
    const bodies: any[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('oauth2'))
          return Response.json({ access_token: 'fixture-access', token_type: 'Bearer', expires_in: 3600 });
        const body = JSON.parse(String(init.body));
        bodies.push(body);
        const dimension = body.dimensions?.[0];
        return Response.json({
          rows: [
            {
              clicks: 2,
              impressions: 20,
              position: 4,
              ...(dimension
                ? {
                    keys: [
                      dimension === 'date'
                        ? '2026-10-17'
                        : dimension === 'page'
                          ? 'https://fixture.example/store/'
                          : 'fixture',
                    ],
                  }
                : {}),
            },
          ],
          metadata: { first_incomplete_date: '2026-10-18' },
        });
      }),
    );
    const report = await readStaffStats(
      bindings,
      { source: 'search', range: '7d', compare: true, filters: { query: 'records', device: 'MOBILE' } },
      now,
    );
    expect(report.totals).toMatchObject({ clicks: 2, impressions: 20, ctr: 10, position: 4 });
    expect(report.previous).toBeNull();
    expect(report.complete).toBe(false);
    expect(report.daily.at(-1)?.available).toBe(false);
    expect(report.timezone).toBe('America/Los_Angeles');
    expect(bodies).toHaveLength(6);
    expect(bodies[0].dimensionFilterGroups[0].filters).toEqual([
      { dimension: 'query', operator: 'equals', expression: 'records' },
      { dimension: 'device', operator: 'equals', expression: 'MOBILE' },
    ]);
    expect(report.breakdowns.find((row) => row.dimension === 'page')?.rows[0]?.label).toBe('/store/');
  });
});
