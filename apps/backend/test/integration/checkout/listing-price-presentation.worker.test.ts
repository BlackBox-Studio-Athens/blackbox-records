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
      'coming-soon',
      'missing-stock',
      'missing-availability',
      'physical-cap',
      'paused',
      'scarce',
      'withheld',
      'reached',
      'unpriced',
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
        data: names.map((name, index) => ({
          storeItemSlug: slugs[index]!,
          variantId: ids[index]!,
          amountMinor: 2800,
          currencyCode: 'EUR',
          priceActive: name !== 'unpriced',
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
                  onlineQuantity: name === 'coming-soon' || name === 'paused' || name === 'physical-cap' ? 0 : 2,
                  zeroStockState:
                    name === 'coming-soon' ? 'coming_soon' : name === 'physical-cap' ? 'repressing' : 'sold_out',
                  // Repressing with a month already passed in Athens shows no month.
                  expectedMonth: name === 'coming-soon' ? '2026-11' : name === 'physical-cap' ? '2026-09' : null,
                  showLowStock: name === 'scarce' || name === 'stocked' || name === 'coming-soon',
                  preorderStartedAt: ['held', 'scarce', 'withheld', 'reached', 'unpriced'].includes(name)
                    ? '2026-09-01T10:00:00.000Z'
                    : null,
                  preorderShipMonth: ['scarce', 'unpriced'].includes(name)
                    ? '2026-10'
                    : name === 'withheld'
                      ? '2026-09'
                      : null,
                  preorderShipPart: name === 'scarce' ? 'late' : null,
                  preorderShipDate: name === 'held' ? '2026-10-04' : name === 'reached' ? '2026-10-03' : null,
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
      await expect(holds.readAvailability(variantId(ids[1]!))).resolves.toEqual({
        availableOnlineQuantity: 0,
        heldQuantity: 2,
      });
      await expect(holds.readAvailability(variantId(ids[0]!))).resolves.toEqual({
        availableOnlineQuantity: 2,
        heldQuantity: 0,
      });
      for (const [index, slug] of slugs.entries()) {
        expect(snapshots.find((row) => row.storeItemSlug === slug)?.stock?.onlineQuantity ?? null).toBe(
          await holds.findEffectiveAvailability(variantId(ids[index]!)),
        );
      }
      const now = new Date('2026-10-02T21:01:00Z');
      const records = await readStoreListingPrices(
        { listForListingPricePresentation: async () => snapshots },
        undefined,
        now,
      );
      expect(slugs.map((slug) => records.find((record) => record.storeItemSlug === slug)?.availabilityState)).toEqual([
        'stocked',
        'sold_out',
        'coming_soon',
        // A missing stock record reads as zero stock with the Sold Out default.
        'sold_out',
        'unavailable',
        'repressing',
        'unavailable',
        'stocked',
        'stocked',
        'stocked',
        'stocked',
      ]);
      const lowStockBySlug = slugs.map(
        (slug) =>
          (records.find((record) => record.storeItemSlug === slug) as { lowStockQuantity?: number } | undefined)
            ?.lowStockQuantity,
      );
      expect(lowStockBySlug).toEqual([
        2,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        2,
        undefined,
        undefined,
        undefined,
      ]);
      expect(slugs.map((slug) => records.find((record) => record.storeItemSlug === slug)?.expectedMonth)).toEqual([
        undefined,
        undefined,
        '2026-11',
        ...Array(8).fill(undefined),
      ]);
      expect(Object.keys(records.find((record) => record.storeItemSlug === slugs[2])!).sort()).toEqual([
        'availabilityState',
        'displayPrice',
        'expectedMonth',
        'preorder',
        'presentationState',
        'storeItemSlug',
      ]);
      expect(
        records
          .filter((record) => record.storeItemSlug !== slugs[10])
          .every((record) => record.presentationState === 'ready' && record.displayPrice === '€28.00'),
      ).toBe(true);
      expect(Object.keys(records.find((record) => record.storeItemSlug === slugs[1])!).sort()).toEqual([
        'availabilityState',
        'displayPrice',
        'preorder',
        'presentationState',
        'storeItemSlug',
      ]);
      expect(slugs.map((slug) => records.find((record) => record.storeItemSlug === slug)?.preorder)).toEqual([
        null,
        // Held copies leave no buyable stock, so the open pre-order is closed for shoppers.
        null,
        null,
        null,
        null,
        null,
        null,
        { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } },
        { shipEstimate: null },
        null,
        { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
      ]);
      expect(snapshots.find((record) => record.storeItemSlug === slugs[7])?.stock?.preorder).toEqual({
        startedAt: '2026-09-01T10:00:00.000Z',
        shipEstimate: { kind: 'month', month: '2026-10', part: 'late' },
      });
      expect(records.find((record) => record.storeItemSlug === slugs[10])?.presentationState).toBe('unavailable');
      query.mockClear();
      const narrowed = (await readStoreListingPrices(repository, 'preorders', now)).filter((row) =>
        row.storeItemSlug.endsWith(suffix),
      );
      expect(query).toHaveBeenCalledOnce();
      expect(narrowed).toEqual(records.filter((record) => record.preorder !== null));
      expect(query.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({
          strings: expect.arrayContaining([expect.stringContaining('WHERE stock."preorderStartedAt" IS NOT NULL')]),
        }),
      );
      for (const record of records) {
        const allowed = [
          'availabilityState',
          'displayPrice',
          'expectedMonth',
          'lowStockQuantity',
          'preorder',
          'presentationState',
          'storeItemSlug',
        ];
        expect(Object.keys(record).every((key) => allowed.includes(key))).toBe(true);
      }
      expect(JSON.stringify(records)).not.toMatch(
        /preorderStartedAt|startedAt|onlineQuantity|"quantity"|zeroStockState|availabilityAlert/,
      );
    } finally {
      await prisma.$disconnect();
    }
  });
});
