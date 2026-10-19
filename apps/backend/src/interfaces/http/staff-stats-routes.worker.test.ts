import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBindings } from '../../platform/env';
import { createPrismaClient } from '../../infrastructure/persistence/prisma';
import { createHttpApp } from './app';

const app = createHttpApp(),
  now = new Date('2026-10-19T12:00:00Z');
let bindings: AppBindings;
const read = (query: string) =>
  app.request(
    `http://127.0.0.1/api/internal/stats?${query}`,
    { headers: { 'X-Request-Id': 'staff-stats-test' } },
    bindings,
  );
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  bindings = {
    PRODUCT_ENVIRONMENT: 'LOCAL',
    LOCAL_OPERATOR_EMAIL: 'staff@example.com',
    COMMERCE_DB: env.COMMERCE_DB,
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Staff rich reports', () => {
  it('caches only protected provider reports and partitions credentials and exact filters', async () => {
    Object.assign(bindings, {
      CLOUDFLARE_ANALYTICS_API_TOKEN: 'fixture-one',
      CLOUDFLARE_ACCOUNT_ID: crypto.randomUUID(),
      CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: 'cache-fixture',
    });
    const upstream = vi.fn(async (_url: unknown, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      return Response.json({
        data: {
          viewer: {
            accounts: [
              Object.fromEntries(
                Object.keys(body.variables)
                  .filter((key) => key.startsWith('filter'))
                  .map((key) => ['rows' + key.slice(6), []]),
              ),
            ],
          },
        },
      });
    });
    vi.stubGlobal('fetch', upstream);
    expect((await read('source=visits&range=7d')).status).toBe(200);
    expect((await read('source=visits&range=7d')).status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect((await read('source=visits&range=7d&page=%2Fstore%2F')).status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(2);
    bindings.CLOUDFLARE_ANALYTICS_API_TOKEN = 'fixture-two';
    expect((await read('source=visits&range=7d')).status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(3);
    expect(
      (await app.request('https://untrusted.example/api/internal/stats?source=visits&range=7d', {}, bindings)).status,
    ).toBe(401);
    expect(upstream).toHaveBeenCalledTimes(3);
  });
  it('counts multi-line orders once, filters merchandise and respects payment/start boundaries', async () => {
    const prisma = createPrismaClient(bindings);
    try {
      await prisma.checkoutOrder.createMany({
        data: [
          {
            id: 'brief-one',
            storeItemSlug: 'brief-record',
            variantId: 'brief-a',
            checkoutSessionId: 'cs_brief_one',
            createdAt: new Date('2026-10-18T00:00:00Z'),
            paidAt: new Date('2026-10-19T00:00:00Z'),
            amountTotalMinor: 3300,
            statusUpdatedAt: now,
            checkoutExpiresAt: now,
          },
          {
            id: 'brief-before',
            storeItemSlug: 'brief-record',
            variantId: 'brief-a',
            checkoutSessionId: 'cs_brief_before',
            createdAt: new Date('2026-10-18T00:00:00Z'),
            paidAt: new Date('2026-10-18T23:59:59.999Z'),
            amountTotalMinor: 500,
            statusUpdatedAt: now,
            checkoutExpiresAt: now,
          },
          {
            id: 'brief-later',
            storeItemSlug: 'brief-record',
            variantId: 'brief-a',
            checkoutSessionId: 'cs_brief_later',
            createdAt: now,
            paidAt: now,
            amountTotalMinor: 9999,
            statusUpdatedAt: now,
            checkoutExpiresAt: now,
          },
        ].map((row) => ({ ...row, status: 'paid' as const })),
      });
      await prisma.checkoutOrderLine.createMany({
        data: [
          {
            id: 'brief-line-a',
            orderId: 'brief-one',
            storeItemSlug: 'brief-record',
            variantId: 'brief-a',
            quantity: 2,
            lineAmountMinor: 2000,
            optionLabel: 'Vinyl',
            displayName: 'Brief Record',
            createdAt: now,
          },
          {
            id: 'brief-line-b',
            orderId: 'brief-one',
            storeItemSlug: 'brief-record',
            variantId: 'brief-b',
            quantity: 1,
            lineAmountMinor: 500,
            optionLabel: 'Vinyl',
            displayName: 'Brief Record',
            createdAt: now,
          },
          {
            id: 'brief-line-c',
            orderId: 'brief-one',
            storeItemSlug: 'brief-shirt',
            variantId: 'brief-c',
            quantity: 1,
            lineAmountMinor: 500,
            optionLabel: 'T-shirt',
            displayName: 'Brief Shirt',
            createdAt: now,
          },
        ],
      });
      const response = await read('source=store&range=today&compare=true');
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      const report = (await response.json()) as any;
      expect(report.totals).toEqual({ paidOrders: 1, paidTotalMinor: 3300, itemsSold: 4, checkoutsStarted: 0 });
      expect(report.previous.paidOrders).toBe(1);
      expect(report.moneyBasis).toBe('paid_total');
      const filtered = (await (await read('source=store&range=today&item=brief-record&format=Vinyl')).json()) as any;
      expect(filtered.totals).toEqual({ paidOrders: 1, paidTotalMinor: 2500, itemsSold: 3, checkoutsStarted: 0 });
      expect(filtered.moneyBasis).toBe('merchandise');
      expect(filtered.breakdowns.find((item: any) => item.dimension === 'item').rows[0].metrics.paidOrders).toBe(1);
      const empty = (await (await read('source=store&range=today&item=missing')).json()) as any;
      expect(empty.totals.paidOrders).toBe(0);
      expect(empty.daily[0].available).toBe(true);
    } finally {
      await prisma.$disconnect();
    }
  });
  it.each([
    'source=store&range=custom&start=2026-10-20&end=2026-10-19',
    'source=visits&range=today&item=bad',
    'source=store&range=ytd',
    'source=store&range=custom',
  ])('rejects invalid selection %s', async (query) => {
    expect((await read(query)).status).toBe(400);
  });
  it('distinguishes unconfigured sources and denies anonymous requests', async () => {
    expect(await (await read('source=visits&range=12m')).json()).toMatchObject({ status: 'not_configured', daily: [] });
    expect(await (await read('source=search&range=30d')).json()).toMatchObject({
      status: 'not_configured',
      timezone: 'America/Los_Angeles',
    });
    expect(
      (await app.request('https://untrusted.example/api/internal/stats?source=store&range=today', {}, bindings)).status,
    ).toBe(401);
    delete bindings.LOCAL_OPERATOR_EMAIL;
    expect((await read('source=store&range=today')).status).toBe(503);
  });
});
