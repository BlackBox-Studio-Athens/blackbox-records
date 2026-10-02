import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import { readStoreListingPrices } from '../../../src/application/commerce/checkout/readers';
import { D1CheckoutStockHoldRepository } from '../../../src/infrastructure/persistence/d1-checkout-stock-hold-repository';
import { PrismaStoreOfferSnapshotRepository, createPrismaClient } from '../../../src/infrastructure/persistence/prisma';
import { variantId } from '../../support/commerce-value-objects';

describe('Prisma listing price presentation', () => {
  it('reads listing prices and effective stock in one query, matching checkout holds', async () => {
    const prisma = createPrismaClient(env);
    const suffix = crypto.randomUUID();
    const names = [
      'stocked',
      'held',
      'restock',
      'missing-stock',
      'missing-availability',
      'physical-cap',
      'paused',
      'scarce',
    ];
    const ids = names.map((name) => `variant_listing_${name}_${suffix}`);
    const slugs = names.map((name) => `listing-${name}-${suffix}`);
    const date = new Date('2020-01-01T00:00:00Z');
    try {
      await prisma.storeItemOption.createMany({
        data: names.map((name, index) => ({
          sourceId: `listing-${name}-${suffix}`,
          sourceKind: 'release',
          storeItemSlug: slugs[index]!,
          variantId: ids[index]!,
        })),
      });
      await prisma.storeOfferSnapshot.createMany({
        data: names.map((_name, index) => ({
          storeItemSlug: slugs[index]!,
          variantId: ids[index]!,
          amountMinor: 2800,
          currencyCode: 'EUR',
          priceActive: true,
          productActive: true,
          stripeLookupKey: `listing-${index}`,
          stripePriceId: `price_listing_${index}`,
          freshUntil: date,
          syncedAt: date,
        })),
      });
      await prisma.stock.createMany({
        data: names.flatMap((name, index) =>
          name === 'missing-stock'
            ? []
            : [
                {
                  variantId: ids[index]!,
                  quantity: name === 'physical-cap' ? 0 : 2,
                  onlineQuantity: name === 'restock' || name === 'paused' || name === 'physical-cap' ? 0 : 2,
                  restockPlanned: name === 'restock',
                  showLowStock: name === 'scarce' || name === 'stocked' || name === 'restock',
                },
              ],
        ),
      });
      await prisma.itemAvailability.createMany({
        data: names.flatMap((name, index) =>
          name === 'missing-availability'
            ? []
            : [
                {
                  variantId: ids[index]!,
                  status: 'available' as const,
                  canBuy: name !== 'paused',
                },
              ],
        ),
      });
      for (const status of ['pending_payment', 'paid', 'not_paid'] as const) {
        const orderId = `listing-${status}-${suffix}`;
        const itemIndex = status === 'pending_payment' ? 1 : 0;
        await prisma.checkoutOrder.create({
          data: {
            id: orderId,
            storeItemSlug: slugs[itemIndex]!,
            variantId: ids[itemIndex]!,
            status,
            checkoutExpiresAt: date,
            statusUpdatedAt: date,
            lines: { create: { storeItemSlug: slugs[itemIndex]!, variantId: ids[itemIndex]!, quantity: 2 } },
          },
        });
      }
      const query = vi.spyOn(prisma, '$queryRaw');
      const repository = new PrismaStoreOfferSnapshotRepository(prisma);
      const snapshots = (await repository.listForListingPricePresentation()).filter((row) =>
        row.storeItemSlug.endsWith(suffix),
      );
      expect(query).toHaveBeenCalledOnce();
      const holds = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
      for (const [index, slug] of slugs.entries()) {
        expect(snapshots.find((row) => row.storeItemSlug === slug)?.stock?.onlineQuantity ?? null).toBe(
          await holds.findEffectiveAvailability(variantId(ids[index]!)),
        );
      }
      const records = await readStoreListingPrices({ listForListingPricePresentation: async () => snapshots });
      expect(slugs.map((slug) => records.find((record) => record.storeItemSlug === slug)?.availabilityState)).toEqual([
        'stocked',
        'sold_out',
        'out_of_stock',
        'unavailable',
        'unavailable',
        'sold_out',
        'unavailable',
        'stocked',
      ]);
      const lowStockBySlug = slugs.map(
        (slug) =>
          (records.find((record) => record.storeItemSlug === slug) as { lowStockQuantity?: number } | undefined)
            ?.lowStockQuantity,
      );
      expect(lowStockBySlug).toEqual([2, undefined, undefined, undefined, undefined, undefined, undefined, 2]);
      expect(records.every((record) => record.presentationState === 'ready' && record.displayPrice === '€28.00')).toBe(
        true,
      );
      expect(Object.keys(records[0]!).sort()).toEqual([
        'availabilityState',
        'displayPrice',
        'presentationState',
        'storeItemSlug',
      ]);
    } finally {
      await prisma.$disconnect();
    }
  });
});
