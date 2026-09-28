import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import {
  PrismaItemAvailabilityRepository,
  PrismaOrderStateRepository,
  PrismaStockChangeRepository,
  PrismaStockCountRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaStripeCatalogWebhookEventRepository,
  PrismaVariantStripeMappingRepository,
  createPrismaClient,
} from '../../../src/infrastructure/persistence/prisma';
import { variantId } from '../../support/commerce-value-objects';
import { D1CheckoutStockHoldRepository } from '../../../src/infrastructure/persistence/d1-checkout-stock-hold-repository';
import { readStoreListingPrices } from '../../../src/application/commerce/readers';

describe('Prisma repository seams', () => {
  it('constructs repository implementations against the shared Prisma client seam', async () => {
    const prisma = createPrismaClient({
      COMMERCE_DB: env.COMMERCE_DB,
    });

    const storeItemOptions = new PrismaStoreItemOptionRepository(prisma);
    const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
    const stock = new PrismaStockRepository(prisma);
    const stockChanges = new PrismaStockChangeRepository(prisma);
    const stockCounts = new PrismaStockCountRepository(prisma);
    const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
    const catalogWebhookEvents = new PrismaStripeCatalogWebhookEventRepository(prisma);
    const orders = new PrismaOrderStateRepository(prisma);

    expect(typeof prisma.checkoutOrder.findUnique).toBe('function');
    expect(typeof prisma.stripeCatalogWebhookEvent.findUnique).toBe('function');
    expect(typeof orders.createPending).toBe('function');
    expect(typeof orders.findByCheckoutSessionId).toBe('function');
    expect(typeof orders.saveTransition).toBe('function');
    expect(typeof storeItemOptions.findByStoreItemSlug).toBe('function');
    expect(typeof storeItemOptions.findByVariantId).toBe('function');
    expect(typeof storeItemOptions.findBySource).toBe('function');
    expect(typeof storeItemOptions.search).toBe('function');
    expect(typeof itemAvailability.findByVariantId).toBe('function');
    expect(typeof stock.findByVariantId).toBe('function');
    expect(typeof stock.save).toBe('function');
    expect(typeof stockChanges.listByVariantId).toBe('function');
    expect(typeof stockChanges.record).toBe('function');
    expect(typeof stockCounts.listByVariantId).toBe('function');
    expect(typeof stockCounts.record).toBe('function');
    expect(typeof catalogWebhookEvents.markCatalogEventFailed).toBe('function');
    expect(typeof catalogWebhookEvents.markCatalogEventSucceeded).toBe('function');
    expect(typeof catalogWebhookEvents.recordCatalogEvent).toBe('function');
    expect(typeof variantStripeMappings.findByVariantId).toBe('function');

    await prisma.$disconnect();
  });

  it('keeps catalog webhook duplicates retryable until processing succeeds', async () => {
    const records = new Map<string, Record<string, unknown>>();
    const prisma = {
      stripeCatalogWebhookEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          if (records.has(String(data.eventId))) {
            const duplicateError = new Error('Unique constraint violation') as Error & { code: string };
            duplicateError.code = 'P2002';
            throw duplicateError;
          }

          const record = {
            processingCompletedAt: null,
            processingFailureReason: null,
            processedAt: new Date('2026-05-24T00:00:00.000Z'),
            ...data,
          };
          records.set(String(data.eventId), record);

          return record;
        }),
        findUnique: vi.fn(async ({ where }: { where: { eventId: string } }) => records.get(where.eventId) ?? null),
        update: vi.fn(async ({ data, where }: { data: Record<string, unknown>; where: { eventId: string } }) => {
          const current = records.get(where.eventId);

          if (!current) {
            throw new Error('missing record');
          }

          const next = {
            ...current,
            ...data,
          };
          records.set(where.eventId, next);

          return next;
        }),
        updateMany: vi.fn(
          async ({
            data,
            where,
          }: {
            data: Record<string, unknown>;
            where: { eventId: string; processingStatus?: { not?: string } };
          }) => {
            const current = records.get(where.eventId);

            if (!current || current.processingStatus === where.processingStatus?.not) {
              return { count: 0 };
            }

            records.set(where.eventId, {
              ...current,
              ...data,
            });

            return { count: 1 };
          },
        ),
      },
    };
    const catalogWebhookEvents = new PrismaStripeCatalogWebhookEventRepository(prisma as never);
    const eventId = 'evt_catalog_status_retry';
    const input = {
      catalogObjectId: 'price_test_status',
      catalogObjectKind: 'price' as const,
      eventId,
      eventType: 'price.updated',
      stripeCreatedAt: new Date('2026-05-24T00:00:00.000Z'),
      variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
    };

    const recorded = await catalogWebhookEvents.recordCatalogEvent(input);
    const pendingDuplicate = await catalogWebhookEvents.recordCatalogEvent(input);
    await catalogWebhookEvents.markCatalogEventFailed(eventId, 'reconciliation_failed');
    const failed = records.get(eventId);
    const failedDuplicate = await catalogWebhookEvents.recordCatalogEvent(input);
    await catalogWebhookEvents.markCatalogEventSucceeded(eventId);
    await catalogWebhookEvents.markCatalogEventFailed(eventId, 'late_concurrent_failure');
    const succeeded = records.get(eventId);
    const succeededDuplicate = await catalogWebhookEvents.recordCatalogEvent(input);

    expect(recorded).toMatchObject({
      record: {
        processingStatus: 'pending',
      },
      status: 'recorded',
    });
    expect(pendingDuplicate.status).toBe('duplicate_retryable');
    expect(failed).toMatchObject({
      processingFailureReason: 'reconciliation_failed',
      processingStatus: 'failed',
    });
    expect(failedDuplicate.status).toBe('duplicate_retryable');
    expect(succeeded).toMatchObject({
      processingFailureReason: null,
      processingStatus: 'succeeded',
    });
    expect(succeededDuplicate.status).toBe('duplicate_succeeded');
  });

  it('reads listing prices and effective stock in one query, matching checkout holds', async () => {
    const prisma = createPrismaClient(env);
    const suffix = crypto.randomUUID();
    const names = ['stocked', 'held', 'restock', 'missing-stock', 'missing-availability', 'physical-cap', 'paused'];
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
      ]);
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
