import { describe, expect, it, vi } from 'vitest';

import { PrismaStripeCatalogWebhookEventRepository } from './';
import { variantId } from '../../../../test/support/commerce-value-objects';

describe('Prisma catalog webhook events', () => {
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
});
