import { parseVariantId } from '../../../domain/commerce';
import type {
  RecordStripeCatalogWebhookEventInput,
  RecordStripeCatalogWebhookEventResult,
  StripeCatalogWebhookEventRecord,
  StripeCatalogWebhookEventRepository,
  StripeCatalogWebhookObjectKind,
} from '../../../domain/commerce/repositories/spi';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStripeCatalogWebhookEvent(record: {
  catalogObjectId: string;
  catalogObjectKind: string;
  eventId: string;
  eventType: string;
  processingCompletedAt: Date | null;
  processingFailureReason: string | null;
  processingStatus: string;
  processedAt: Date;
  stripeCreatedAt: Date;
  variantId: string | null;
}): StripeCatalogWebhookEventRecord {
  return {
    catalogObjectId: record.catalogObjectId,
    catalogObjectKind: parseCatalogObjectKind(record.catalogObjectKind),
    eventId: record.eventId,
    eventType: record.eventType,
    processingCompletedAt: record.processingCompletedAt,
    processingFailureReason: record.processingFailureReason,
    processingStatus: parseProcessingStatus(record.processingStatus),
    processedAt: record.processedAt,
    stripeCreatedAt: record.stripeCreatedAt,
    variantId: record.variantId ? parseVariantId(record.variantId) : null,
  };
}

export class PrismaStripeCatalogWebhookEventRepository implements StripeCatalogWebhookEventRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async recordCatalogEvent(
    input: RecordStripeCatalogWebhookEventInput,
  ): Promise<RecordStripeCatalogWebhookEventResult> {
    try {
      const record = await this.prisma.stripeCatalogWebhookEvent.create({
        data: {
          catalogObjectId: input.catalogObjectId,
          catalogObjectKind: input.catalogObjectKind,
          eventId: input.eventId,
          eventType: input.eventType,
          processingStatus: 'pending',
          stripeCreatedAt: input.stripeCreatedAt,
          variantId: input.variantId,
        },
      });

      return {
        record: mapStripeCatalogWebhookEvent(record),
        status: 'recorded',
      };
    } catch (error) {
      const existingRecord = await this.prisma.stripeCatalogWebhookEvent.findUnique({
        where: {
          eventId: input.eventId,
        },
      });

      if (existingRecord && isUniqueConstraintError(error)) {
        return {
          record: mapStripeCatalogWebhookEvent(existingRecord),
          status: existingRecord.processingStatus === 'succeeded' ? 'duplicate_succeeded' : 'duplicate_retryable',
        };
      }

      throw error;
    }
  }

  public async markCatalogEventSucceeded(eventId: string): Promise<void> {
    await this.prisma.stripeCatalogWebhookEvent.update({
      data: {
        processingCompletedAt: new Date(),
        processingFailureReason: null,
        processingStatus: 'succeeded',
      },
      where: {
        eventId,
      },
    });
  }

  public async markCatalogEventFailed(eventId: string, failureReason: string): Promise<void> {
    await this.prisma.stripeCatalogWebhookEvent.updateMany({
      data: {
        processingCompletedAt: null,
        processingFailureReason: failureReason,
        processingStatus: 'failed',
      },
      where: {
        eventId,
        processingStatus: {
          not: 'succeeded',
        },
      },
    });
  }
}

function parseCatalogObjectKind(value: string): StripeCatalogWebhookObjectKind {
  if (value === 'price' || value === 'product') {
    return value;
  }

  throw new Error(`Unsupported Stripe catalog webhook object kind: ${value}.`);
}

function parseProcessingStatus(value: string): StripeCatalogWebhookEventRecord['processingStatus'] {
  if (value === 'failed' || value === 'pending' || value === 'succeeded') {
    return value;
  }

  throw new Error(`Unsupported Stripe catalog webhook processing status: ${value}.`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
  );
}
