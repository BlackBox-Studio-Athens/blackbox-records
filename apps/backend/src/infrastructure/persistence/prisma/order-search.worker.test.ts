import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';

import { PrismaOrderStateRepository, createPrismaClient } from './';
import { PrismaStockRepository } from './prisma-stock-repository';
import { athensToday } from '../../../domain/commerce';

it('returns an empty awaiting page without querying orders when there are no open cycles', async () => {
  const prisma = createPrismaClient(env);
  const stocks = vi.spyOn(prisma.stock, 'findMany').mockResolvedValueOnce([]);
  const query = vi.spyOn(prisma.checkoutOrder, 'findMany');
  try {
    await expect(
      new PrismaOrderStateRepository(prisma).listRecent({ limit: 25, awaitingStock: true }),
    ).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  } finally {
    stocks.mockRestore();
    query.mockRestore();
    await prisma.$disconnect();
  }
});

it('filters paid open-cycle lines before pagination and combines search and notification filters', async () => {
  const prisma = createPrismaClient(env);
  const orders = new PrismaOrderStateRepository(prisma);
  const stocks = new PrismaStockRepository(prisma);
  const createdAt = new Date('2026-09-17T00:00:00Z');
  const cycle = '2026-09-01T00:00:00.000Z';
  try {
    await prisma.stock.createMany({
      data: [
        {
          id: 'await-stock-month',
          variantId: 'variant_await_month',
          preorderStartedAt: cycle,
          preorderShipMonth: '2000-01',
        },
        {
          id: 'await-stock-date',
          variantId: 'variant_await_date',
          preorderStartedAt: cycle,
          preorderShipDate: '2099-11-20',
        },
        {
          id: 'await-stock-passed',
          variantId: 'variant_await_passed',
          preorderStartedAt: cycle,
          preorderShipDate: '2000-01-01',
        },
        {
          id: 'await-stock-today',
          variantId: 'variant_await_today',
          preorderStartedAt: cycle,
          preorderShipDate: athensToday(),
        },
        { id: 'await-stock-ended', variantId: 'variant_await_ended' },
      ].map((stock) => ({ ...stock, quantity: 0, onlineQuantity: 0 })),
    });
    const cases = [
      { suffix: 'a', variantId: 'variant_await_month', startedAt: cycle, status: 'paid' },
      { suffix: 'b', variantId: 'variant_await_month', startedAt: cycle, status: 'paid' },
      { suffix: 'c', variantId: 'variant_await_month', startedAt: cycle, status: 'paid' },
      { suffix: 'd', variantId: 'variant_await_month', startedAt: cycle, status: 'pending_payment' },
      { suffix: 'e', variantId: 'variant_await_month', startedAt: '2026-08-01T00:00:00.000Z', status: 'paid' },
      { suffix: 'f', variantId: 'variant_await_month', startedAt: null, status: 'paid' },
      { suffix: 'g', variantId: 'variant_await_passed', startedAt: cycle, status: 'paid' },
      { suffix: 'h', variantId: 'variant_await_ended', startedAt: cycle, status: 'paid' },
      { suffix: 'i', variantId: 'variant_await_date', startedAt: cycle, status: 'paid' },
      { suffix: 'j', variantId: 'variant_await_today', startedAt: cycle, status: 'paid' },
    ] as const;
    await prisma.checkoutOrder.createMany({
      data: cases.map((row) => ({
        id: `await-order-${row.suffix}`,
        storeItemSlug: 'await-title',
        variantId: 'variant_ordinary_primary',
        checkoutSessionId: `cs_test_await_${row.suffix}`,
        checkoutExpiresAt: createdAt,
        createdAt,
        status: row.status,
        statusUpdatedAt: createdAt,
        recipientName: 'Await Customer',
      })),
    });
    await prisma.checkoutOrderLine.createMany({
      data: cases.map((row) => ({
        id: `await-line-${row.suffix}`,
        orderId: `await-order-${row.suffix}`,
        storeItemSlug: 'await-title',
        variantId: row.variantId,
        preorderStartedAt: row.startedAt,
        quantity: 1,
        createdAt,
      })),
    });
    await prisma.paidOrderDelivery.create({
      data: {
        orderId: 'await-order-a',
        kind: 'shopper_confirmation',
        status: 'needs_review',
        needsReviewAt: createdAt,
      },
    });
    expect((await stocks.listOpenPreorders()).map((stock) => stock.variantId)).toEqual(
      expect.arrayContaining(['variant_await_month', 'variant_await_date']),
    );
    const openVariants = (await stocks.listOpenPreorders()).map((stock) => stock.variantId);
    for (const variant of ['variant_await_passed', 'variant_await_today', 'variant_await_ended']) {
      expect(openVariants).not.toContain(variant);
    }
    const first = await orders.listRecent({ limit: 2, awaitingStock: true, q: 'Await Customer' });
    expect(first.map((order) => order.id)).toEqual(['await-order-i', 'await-order-c']);
    const last = first.at(-1)!;
    expect(
      (
        await orders.listRecent({
          limit: 2,
          awaitingStock: true,
          q: 'Await Customer',
          cursor: { createdAt: last.createdAt, id: last.id },
        })
      ).map((order) => order.id),
    ).toEqual(['await-order-b', 'await-order-a']);
    expect(
      (
        await orders.listRecent({ limit: 1, awaitingStock: true, q: 'Await Customer', notification: 'needs_review' })
      ).map((order) => order.id),
    ).toEqual(['await-order-a']);
    await expect(orders.listRecent({ limit: 25, awaitingStock: true, status: 'pending_payment' })).resolves.toEqual([]);
    // A new cycle cannot flag lines from the previous pre-order.
    await prisma.stock.update({
      where: { variantId: 'variant_await_month' },
      data: { preorderStartedAt: '2026-10-01T00:00:00.000Z' },
    });
    expect(
      (await orders.listRecent({ limit: 25, awaitingStock: true, q: 'Await Customer' })).map((order) => order.id),
    ).toEqual(['await-order-i']);
    await prisma.stock.update({
      where: { variantId: 'variant_await_date' },
      data: { preorderStartedAt: null, preorderShipDate: null },
    });
    await expect(orders.listRecent({ limit: 25, awaitingStock: true, q: 'Await Customer' })).resolves.toEqual([]);
  } finally {
    await prisma.$disconnect();
  }
});

it('has the order pagination index', async () => {
  const { results } = await env.COMMERCE_DB.prepare('PRAGMA index_list("CheckoutOrder")').all<{ name: string }>();
  expect(results.map(({ name }) => name)).toContain('CheckoutOrder_createdAt_id_idx');
});

it('searches all matching orders before cursor pagination, including email filters and tied dates', async () => {
  const prisma = createPrismaClient(env);
  const orders = new PrismaOrderStateRepository(prisma);
  const createdAt = new Date('2026-09-17T00:00:00Z');
  try {
    await prisma.checkoutOrder.createMany({
      data: ['a', 'b', 'c'].map((suffix) => ({
        id: `search-order-${suffix}`,
        storeItemSlug: 'search-title',
        variantId: 'variant_search',
        checkoutSessionId: `cs_test_search_${suffix}`,
        checkoutExpiresAt: createdAt,
        createdAt,
        status: 'paid' as const,
        statusUpdatedAt: createdAt,
        recipientName: 'Search Customer',
        shopperEmail: `search-${suffix}@example.com`,
        stripePaymentIntentId: `pi_search_${suffix}`,
      })),
    });
    await prisma.paidOrderDelivery.create({
      data: {
        orderId: 'search-order-a',
        kind: 'shopper_confirmation',
        status: 'needs_review',
        needsReviewAt: createdAt,
      },
    });
    const first = await orders.listRecent({ limit: 2, status: 'paid', q: 'Search Customer' });
    expect(first.map(({ id }) => id)).toEqual(['search-order-c', 'search-order-b']);
    const last = first.at(-1)!;
    expect(
      (
        await orders.listRecent({
          limit: 2,
          status: 'paid',
          q: 'Search Customer',
          cursor: { createdAt: last.createdAt, id: last.id },
        })
      ).map(({ id }) => id),
    ).toEqual(['search-order-a']);
    expect(
      (await orders.listRecent({ limit: 1, status: 'paid', q: 'Search Customer', notification: 'needs_review' })).map(
        ({ id }) => id,
      ),
    ).toEqual(['search-order-a']);
    for (const q of ['search-a@example.com', 'pi_search_a', 'cs_test_search_a', 'search-order-a']) {
      expect((await orders.listRecent({ limit: 1, status: null, q }))[0]?.id).toBe('search-order-a');
    }
  } finally {
    await prisma.$disconnect();
  }
});
