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

  it('reads only compact Store Offer snapshot fields for listing-price presentation', async () => {
    const findMany = vi.fn(async () => []);
    const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository({
      storeOfferSnapshot: { findMany },
    } as never);

    await expect(storeOfferSnapshots.listForListingPricePresentation()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { storeItemSlug: 'asc' },
      select: {
        amountMinor: true,
        currencyCode: true,
        freshUntil: true,
        priceActive: true,
        productActive: true,
        storeItemSlug: true,
      },
    });
  });
});
