import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, it } from 'vitest';
import type { EmDashRuntime } from 'emdash/middleware';
import { readStaffWorkspace } from '../../../src/cms/staff-workspace';
import { currentPublicationKey } from '../../../src/cms/published-storage';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';
import { readPreorderProjection } from '../../../src/interfaces/http/routes/preorder-projection-push';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));

it('exposes an open, buyable shopper pre-order on the existing staff selling record', async () => {
  const prisma = createPrismaClient(env);
  const suffix = crypto.randomUUID();
  const variantId = `variant_staff_preorder_${suffix}`;
  const slug = `staff-preorder-${suffix}`;
  const priceId = `price_staff_preorder_${suffix}`;
  const item = { id: slug, slug, data: { title: 'Release', artist: '' } };
  const runtime = {
    handleContentGet: async () => ({ success: true, data: { item } }),
    handleContentList: async () => ({ success: true, data: { items: [] } }),
  } as unknown as EmDashRuntime;
  const deps = {
    runtime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local' as const,
    readOpenPreorders: async () => (await readPreorderProjection(env, 'preorders')).projection.items,
  };
  const read = async () => {
    const response = await readStaffWorkspace(
      new Request(`https://staff.invalid/?collection=releases&id=${slug}`),
      deps,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    return ((await response.json()) as { data: { items: { selling: { preorderOpen: boolean } }[] } }).data.items[0]!
      .selling.preorderOpen;
  };
  try {
    await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
    await prisma.storeItemOption.create({
      data: { variantId, storeItemSlug: slug, sourceKind: 'release', sourceId: slug, cmsSourceId: slug },
    });
    await prisma.variantStripeMapping.create({
      data: { variantId, stripeProductId: `prod_staff_${suffix}`, stripePriceId: priceId },
    });
    await prisma.storeOfferSnapshot.create({
      data: {
        variantId,
        storeItemSlug: slug,
        stripeLookupKey: slug,
        stripePriceId: priceId,
        amountMinor: 2800,
        currencyCode: 'EUR',
        priceActive: true,
        productActive: true,
        freshUntil: new Date('2000-01-01'),
        syncedAt: new Date('2000-01-01'),
      },
    });
    await prisma.stock.create({
      data: {
        variantId,
        quantity: 2,
        onlineQuantity: 2,
        zeroStockState: 'sold_out',
        preorderStartedAt: '2026-09-01T00:00:00Z',
        preorderShipDate: '2099-12-04',
      },
    });
    await prisma.itemAvailability.create({ data: { variantId, status: 'available', canBuy: true } });
    expect(await read()).toBe(true);
    await prisma.stock.update({ where: { variantId }, data: { preorderShipDate: '2000-01-01' } });
    expect(await read()).toBe(false);
    await prisma.stock.update({
      where: { variantId },
      data: { preorderShipDate: '2099-12-04', quantity: 0, onlineQuantity: 0 },
    });
    expect(await read()).toBe(false);
    await prisma.stock.update({
      where: { variantId },
      data: { quantity: 2, onlineQuantity: 2, preorderStartedAt: null, preorderShipDate: null },
    });
    expect(await read()).toBe(false);
    await prisma.stock.update({
      where: { variantId },
      data: { preorderStartedAt: '2026-09-01T00:00:00Z', preorderShipDate: '2099-12-04' },
    });
    await prisma.itemAvailability.update({ where: { variantId }, data: { canBuy: false } });
    expect(await read()).toBe(false);
    await prisma.itemAvailability.update({ where: { variantId }, data: { canBuy: true } });
    await prisma.storeOfferSnapshot.update({ where: { variantId }, data: { priceActive: false } });
    expect(await read()).toBe(false);
  } finally {
    await prisma.itemAvailability.deleteMany({ where: { variantId } });
    await prisma.stock.deleteMany({ where: { variantId } });
    await prisma.storeOfferSnapshot.deleteMany({ where: { variantId } });
    await prisma.variantStripeMapping.deleteMany({ where: { variantId } });
    await prisma.storeItemOption.deleteMany({ where: { variantId } });
    await prisma.$disconnect();
  }
});
