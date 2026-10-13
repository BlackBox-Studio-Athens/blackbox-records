import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppBindings } from '../../platform/env';
import { createPrismaClient, PrismaOrderStateRepository } from '../../infrastructure/persistence/prisma';
import { createHttpApp } from './app';

const app = createHttpApp();
const now = new Date('2026-10-13T12:00:00.000Z');
let bindings: AppBindings;
const read = (range = '7d') =>
  app.request(
    `http://127.0.0.1/api/internal/store-stats?range=${range}`,
    { headers: { 'X-Request-Id': 'store-stats-test' } },
    bindings,
  );

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  bindings = {
    PRODUCT_ENVIRONMENT: 'LOCAL',
    LOCAL_OPERATOR_EMAIL: 'operator@example.com',
    COMMERCE_DB: env.COMMERCE_DB,
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
  };
  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare('DELETE FROM "CheckoutOrderLine" WHERE "storeItemSlug" = ?').bind('stats-record'),
    env.COMMERCE_DB.prepare('DELETE FROM "CheckoutOrder" WHERE "storeItemSlug" = ?').bind('stats-record'),
  ]);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('store stats', () => {
  it.each(['7d', '30d'] as const)(
    'aggregates %s UTC edges and quantities by paidAt regardless of later status',
    async (range) => {
      const days = range === '7d' ? 7 : 30;
      const start = new Date(Date.UTC(2026, 9, 13 - days + 1));
      const previousStart = new Date(start.getTime() - days * 86400000);
      const middle = new Date(start.getTime() + 86400000);
      const beforePrevious = new Date(previousStart.getTime() - 1);
      const beforeStart = new Date(start.getTime() - 1);
      const rows = [
        {
          id: 'outside',
          createdAt: beforePrevious,
          paidAt: beforePrevious,
          total: 9999,
          delivery: 9999,
          quantities: [99],
        },
        {
          id: 'previous-start',
          createdAt: previousStart,
          paidAt: previousStart,
          total: 900,
          delivery: 300,
          quantities: [2],
        },
        {
          id: 'previous-last',
          createdAt: beforeStart,
          paidAt: beforeStart,
          total: null,
          delivery: null,
          quantities: [3],
        },
        { id: 'current-start', createdAt: start, paidAt: start, total: 2000, delivery: 300, quantities: [2, 3] },
        { id: 'crossed', createdAt: beforePrevious, paidAt: start, total: 700, delivery: null, quantities: [1] },
        ...(['pending_payment', 'paid', 'not_paid', 'needs_review'] as const).map((status) => ({
          id: status,
          status,
          createdAt: middle,
          paidAt: middle,
          total: status === 'needs_review' ? null : 1000,
          delivery: status === 'needs_review' ? null : 200,
          quantities: [2],
        })),
        { id: 'unpaid', createdAt: middle, paidAt: null, total: 500, delivery: 50, quantities: [7] },
        { id: 'sessionless', createdAt: middle, paidAt: null, total: null, delivery: null, quantities: [7] },
        {
          id: 'before-now',
          createdAt: new Date(now.getTime() - 1),
          paidAt: new Date(now.getTime() - 1),
          total: 800,
          delivery: 100,
          quantities: [4],
        },
        { id: 'end', createdAt: now, paidAt: now, total: 9999, delivery: 9999, quantities: [99] },
        {
          id: 'future',
          createdAt: new Date(now.getTime() + 1),
          paidAt: new Date(now.getTime() + 1),
          total: 9999,
          delivery: 9999,
          quantities: [99],
        },
      ];
      const prisma = createPrismaClient(bindings);
      try {
        await prisma.checkoutOrder.createMany({
          data: rows.map((row) => ({
            id: row.id,
            storeItemSlug: 'stats-record',
            variantId: 'variant_stats',
            checkoutSessionId: row.id === 'sessionless' ? null : `cs_test_${row.id.replace(/-/g, '_')}`,
            createdAt: row.createdAt,
            checkoutExpiresAt: now,
            status: 'status' in row ? row.status : ('paid' as const),
            statusUpdatedAt: row.createdAt,
            paidAt: row.paidAt,
            amountTotalMinor: row.total,
            acceptedDeliveryAmountMinor: row.delivery,
          })),
        });
        await prisma.checkoutOrderLine.createMany({
          data: rows.flatMap((row) =>
            row.quantities.map((quantity, index) => ({
              id: `${row.id}-${index}`,
              orderId: row.id,
              storeItemSlug: 'stats-record',
              variantId: `variant_stats_${index}`,
              quantity,
              createdAt: row.createdAt,
            })),
          ),
        });
        const response = await read(range);
        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.get('X-Request-Id')).toBe('store-stats-test');
        expect(await response.json()).toEqual({
          range,
          generatedAt: now.toISOString(),
          currencyCode: 'EUR',
          current: { checkoutsStarted: 7, paidOrders: 7, itemsSold: 18, paidTotalMinor: 6500, deliveryMinor: 1000 },
          previous: { checkoutsStarted: 2, paidOrders: 2, itemsSold: 5, paidTotalMinor: 900, deliveryMinor: 300 },
        });
      } finally {
        await prisma.$disconnect();
      }
    },
  );

  it('uses indexed window and line lookups without a historical table scan', async () => {
    const prisma = createPrismaClient(bindings);
    const query = vi.spyOn(prisma, '$queryRawUnsafe');
    try {
      const figures = await new PrismaOrderStateRepository(prisma).readStoreFigures(
        new Date('2026-10-07T00:00:00Z'),
        now,
      );
      expect(figures).toEqual({
        checkoutsStarted: 0,
        paidOrders: 0,
        itemsSold: 0,
        paidTotalMinor: 0,
        deliveryMinor: 0,
      });
      const [sql] = query.mock.calls[0]!;
      const plan = await env.COMMERCE_DB.prepare(`EXPLAIN QUERY PLAN ${String(sql)}`)
        .bind('2026-10-07T00:00:00.000Z', now.toISOString(), '2026-10-07T00:00:00.000Z', now.toISOString())
        .all<{ detail: string }>();
      const details = plan.results.map((row) => row.detail).join('\n');
      expect(details).toContain('CheckoutOrder_paidAt_idx');
      expect(details).toContain('CheckoutOrder_createdAt_id_idx');
      expect(details).toContain('CheckoutOrderLine_orderId_idx');
      expect(details).not.toMatch(/SCAN (?:paid|CheckoutOrder|CheckoutOrderLine)/);
    } finally {
      await prisma.$disconnect();
    }
  });

  it.each(['', '1d', '7D', '30'])('rejects invalid range %s before reading D1', async (range) => {
    const query = vi.spyOn(PrismaOrderStateRepository.prototype, 'readStoreFigures');
    const response = await read(range);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_request', requestId: 'store-stats-test' });
    expect(query).not.toHaveBeenCalled();
  });

  it('requires range and advertises both stats links in protected discovery', async () => {
    expect((await app.request('http://127.0.0.1/api/internal/store-stats', {}, bindings)).status).toBe(400);
    const discovery = await app.request('http://127.0.0.1/api/internal/', {}, bindings);
    expect(await discovery.json()).toMatchObject({
      links: expect.arrayContaining([
        expect.objectContaining({ href: '/api/internal/store-stats', rel: 'store-stats' }),
        expect.objectContaining({ href: '/api/internal/search-stats', rel: 'search-stats' }),
      ]),
    });
  });

  it('returns safe problem details when D1 fails', async () => {
    vi.spyOn(PrismaOrderStateRepository.prototype, 'readStoreFigures').mockRejectedValue(
      new Error('private order details'),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await read();
    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toContain('application/problem+json');
    const body = await response.json();
    expect(body).toMatchObject({
      detail: 'Store figures are temporarily unavailable. Try again.',
      requestId: 'store-stats-test',
    });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'store_stats_read_failed',
        safeReason: 'database_read_failed',
        requestId: 'store-stats-test',
      }),
    );
    expect(JSON.stringify([body, warn.mock.calls])).not.toContain('private order details');
  });

  it.each(['missing', 'forged'])('rejects %s Access identity before reading D1', async (identity) => {
    const query = vi.spyOn(PrismaOrderStateRepository.prototype, 'readStoreFigures');
    const response = await app.request(
      'https://staff.blackboxrecordsathens.com/api/internal/store-stats?range=7d',
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
    expect(query).not.toHaveBeenCalled();
  });
});
