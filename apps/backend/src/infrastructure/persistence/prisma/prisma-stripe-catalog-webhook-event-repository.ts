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
  processedAt: Date;
  stripeCreatedAt: Date;
  variantId: string | null;
}): StripeCatalogWebhookEventRecord {
  return {
    catalogObjectId: record.catalogObjectId,
    catalogObjectKind: parseCatalogObjectKind(record.catalogObjectKind),
    eventId: record.eventId,
    eventType: record.eventType,
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
          status: 'duplicate',
        };
      }

      throw error;
    }
  }
}

function parseCatalogObjectKind(value: string): StripeCatalogWebhookObjectKind {
  if (value === 'price' || value === 'product') {
    return value;
  }

  throw new Error(`Unsupported Stripe catalog webhook object kind: ${value}.`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
  );
}
