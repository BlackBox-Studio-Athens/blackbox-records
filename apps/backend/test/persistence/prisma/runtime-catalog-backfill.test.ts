import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { applyRuntimeCatalogBackfill } from '../../../../../scripts/apply-runtime-catalog-backfill';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';

it('applies a whole catalog plan atomically while preserving existing commerce tables and timestamps', async () => {
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  try {
    const rows = [];
    for (const name of ['first', 'second', 'untouched']) {
      rows.push(
        await prisma.storeItemOption.create({
          data: {
            storeItemSlug: `backfill-${name}`,
            sourceKind: 'release',
            sourceId: name,
            variantId: `variant_backfill_${name}`,
          },
        }),
      );
    }
    const variantId = rows[0].variantId;
    await prisma.stock.create({ data: { variantId, quantity: 8, onlineQuantity: 5, revision: 3 } });
    await prisma.itemAvailability.create({ data: { variantId, status: 'available', canBuy: false } });
    await prisma.variantStripeMapping.create({
      data: { variantId, stripePriceId: 'price_existing', stripeProductId: 'prod_existing' },
    });
    await prisma.stockChange.create({
      data: { variantId, quantityDelta: -2, reason: 'offline_sale', actorEmail: 'operator@example.test' },
    });
    await prisma.storeOfferSnapshot.create({
      data: {
        variantId,
        storeItemSlug: rows[0].storeItemSlug,
        stripePriceId: 'price_existing',
        stripeLookupKey: 'existing',
        amountMinor: 2400,
        currencyCode: 'EUR',
        priceActive: true,
        productActive: true,
        syncedAt: new Date(),
        freshUntil: new Date(Date.now() + 86_400_000),
      },
    });
    for (const status of ['pending_payment', 'paid'] as const) {
      await prisma.checkoutOrder.create({
        data: {
          variantId,
          storeItemSlug: rows[0].storeItemSlug,
          checkoutSessionId: `cs_backfill_${status}`,
          checkoutExpiresAt: new Date(Date.now() + 86_400_000),
          status,
          statusUpdatedAt: new Date(),
          amountTotalMinor: 4800,
          currencyCode: 'EUR',
          paidAt: status === 'paid' ? new Date() : null,
          lines: {
            create: {
              variantId,
              storeItemSlug: rows[0].storeItemSlug,
              stripePriceId: 'price_historical',
              quantity: 2,
              unitAmountMinor: 2400,
              lineAmountMinor: 4800,
            },
          },
        },
      });
    }
    const plan = {
      environment: 'local' as const,
      unchanged: [],
      updates: rows.slice(0, 2).map((before) => ({
        before,
        data: {
          cmsSourceId: `cms-${before.sourceId}`,
          itemType: 'Vinyl 12-inch',
          priceKind: 'fixed',
          productProjection: {
            name: before.sourceId,
            description: 'Copy',
            imageUrls: [],
            metadata: {},
            taxCode: 'txcd_99999999',
          },
          catalogAvailability: 'published',
          catalogRevision: 1,
        },
      })),
    };
    expect(await applyRuntimeCatalogBackfill(env.COMMERCE_DB, plan, { environment: 'local' })).toMatchObject({
      dryRun: true,
      applied: 0,
    });
    expect(await prisma.storeItemOption.findMany({ orderBy: { createdAt: 'asc' } })).toEqual(rows);

    // A concurrent edit to the second row must also prevent the first row from changing.
    await prisma.storeItemOption.update({ where: { id: rows[1].id }, data: { sourceId: 'changed-source' } });
    await expect(
      applyRuntimeCatalogBackfill(env.COMMERCE_DB, plan, { environment: 'local', apply: true }),
    ).rejects.toThrow('Stale backfill plan');
    expect(await prisma.storeItemOption.findUnique({ where: { id: rows[0].id } })).toEqual(rows[0]);
    await prisma.storeItemOption.update({ where: { id: rows[1].id }, data: { sourceId: rows[1].sourceId } });
    plan.updates[1].before = await prisma.storeItemOption.findUniqueOrThrow({ where: { id: rows[1].id } });
    const conflicting = structuredClone(plan);
    conflicting.updates[1].data.cmsSourceId = conflicting.updates[0].data.cmsSourceId;
    await expect(
      applyRuntimeCatalogBackfill(env.COMMERCE_DB, conflicting, { environment: 'local', apply: true }),
    ).rejects.toThrow();
    expect(await prisma.storeItemOption.findUnique({ where: { id: rows[0].id } })).toEqual(rows[0]);
    const report = await applyRuntimeCatalogBackfill(env.COMMERCE_DB, plan, { environment: 'local', apply: true });
    expect(report.applied).toBe(2);
    for (const evidence of report.preserved.filter(({ table }) => table !== 'StoreItemOption')) {
      expect(evidence.afterSha256).toBe(evidence.beforeSha256);
    }
    expect(report.preserved.find(({ table }) => table === 'Stock')?.rows).toBe(1);
    expect(report.preserved.find(({ table }) => table === 'CheckoutOrder')?.rows).toBe(2);
    expect(report.preserved.find(({ table }) => table === 'CheckoutOrderLine')?.rows).toBe(2);
    expect(await prisma.storeItemOption.findUnique({ where: { id: rows[2].id } })).toEqual(rows[2]);
    for (const { before, data } of plan.updates) {
      expect(await prisma.storeItemOption.findUnique({ where: { id: before.id } })).toEqual({ ...before, ...data });
    }
    await expect(
      applyRuntimeCatalogBackfill(env.COMMERCE_DB, plan, { environment: 'local', apply: true }),
    ).rejects.toThrow('Stale backfill plan');
    await expect(
      applyRuntimeCatalogBackfill(env.COMMERCE_DB, plan, { environment: 'uat', apply: true }),
    ).rejects.toThrow('environment');
    await expect(
      applyRuntimeCatalogBackfill(
        env.COMMERCE_DB,
        { ...plan, environment: 'prd' },
        { environment: 'prd', apply: true },
      ),
    ).rejects.toThrow('one-run');
  } finally {
    await prisma.$disconnect();
  }
});
