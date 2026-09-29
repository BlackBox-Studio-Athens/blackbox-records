import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';

import { PrismaOrderStateRepository, createPrismaClient } from './';

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
