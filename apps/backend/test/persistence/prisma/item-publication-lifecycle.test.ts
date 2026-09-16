import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { guardItemLifecycle } from '../../../src/cms/item-publication-recovery';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';

it('requires Publish item for linked content and pauses checkout before unpublish without changing stock or Price', async () => {
  const db = createPrismaClient(env);
  const variantId = 'variant_lifecycle';
  try {
    await db.storeItemOption.create({
      data: {
        variantId,
        storeItemSlug: 'lifecycle-item',
        sourceKind: 'release',
        sourceId: 'lifecycle-source',
        cmsSourceId: 'cms_lifecycle',
        catalogRevision: 1,
        catalogAvailability: 'published',
      },
    });
    await db.itemAvailability.create({ data: { variantId, canBuy: true, status: 'available' } });
    await db.variantStripeMapping.create({
      data: { variantId, stripeProductId: 'prod_lifecycle', stripePriceId: 'price_lifecycle' },
    });
    await db.stock.create({ data: { variantId, quantity: 9, onlineQuantity: 7 } });
    const stock = await db.stock.findUnique({ where: { variantId } });
    const mapping = await db.variantStripeMapping.findUnique({ where: { variantId } });
    for (const status of ['pending_payment', 'paid'] as const) {
      await db.checkoutOrder.create({
        data: {
          id: `lifecycle_${status}`,
          storeItemSlug: 'lifecycle-item',
          variantId,
          checkoutSessionId: `cs_test_lifecycle_${status}`,
          checkoutExpiresAt: new Date('2099-01-01'),
          status,
          statusUpdatedAt: new Date(),
          amountTotalMinor: 2800,
          currencyCode: 'EUR',
          lines: {
            create: {
              storeItemSlug: 'lifecycle-item',
              variantId,
              quantity: 1,
              stripePriceId: 'price_lifecycle',
              displayName: 'Original item',
              unitAmountMinor: 2800,
              lineAmountMinor: 2800,
            },
          },
        },
      });
    }
    const orders = await db.checkoutOrder.findMany({
      where: { variantId },
      include: { lines: true },
      orderBy: { id: 'asc' },
    });
    const source = async () => Response.json({ data: { _rev: 'current' } });
    const request = (path: string, revision = 'current') =>
      new Request('http://127.0.0.1:8787/_emdash/api/content/releases/' + path, {
        method: 'POST',
        body: JSON.stringify({ _rev: revision }),
      });
    for (const path of ['cms_lifecycle/publish', '%63ms_lifecycle/publish/', 'lifecycle-source/publish'])
      expect((await guardItemLifecycle(request(path), env.COMMERCE_DB, source))?.status).toBe(409);
    expect(
      (await guardItemLifecycle(request('cms_lifecycle/unpublish', 'stale'), env.COMMERCE_DB, source))?.status,
    ).toBe(409);
    expect(await db.itemAvailability.findUnique({ where: { variantId } })).toMatchObject({ canBuy: true });
    expect(await guardItemLifecycle(request('%63ms_lifecycle/unpublish/'), env.COMMERCE_DB, source)).toBeNull();
    expect(await db.itemAvailability.findUnique({ where: { variantId } })).toMatchObject({ canBuy: false });
    expect(await db.storeItemOption.findUnique({ where: { variantId } })).toMatchObject({
      catalogAvailability: 'withheld',
      catalogRevision: 2,
    });
    expect(await db.stock.findUnique({ where: { variantId } })).toEqual(stock);
    expect(await db.variantStripeMapping.findUnique({ where: { variantId } })).toEqual(mapping);
    expect(
      await db.checkoutOrder.findMany({ where: { variantId }, include: { lines: true }, orderBy: { id: 'asc' } }),
    ).toEqual(orders);
  } finally {
    await db.$disconnect();
  }
});
