import type { VariantId } from '../ids';

export type StripeCatalogWebhookObjectKind = 'price' | 'product';
export type StripeCatalogWebhookProcessingStatus = 'failed' | 'pending' | 'succeeded';

export type StripeCatalogWebhookEventRecord = {
  catalogObjectId: string;
  catalogObjectKind: StripeCatalogWebhookObjectKind;
  eventId: string;
  eventType: string;
  processingCompletedAt: Date | null;
  processingFailureReason: string | null;
  processingStatus: StripeCatalogWebhookProcessingStatus;
  processedAt: Date;
  stripeCreatedAt: Date;
  variantId: VariantId | null;
};

export type RecordStripeCatalogWebhookEventInput = {
  catalogObjectId: string;
  catalogObjectKind: StripeCatalogWebhookObjectKind;
  eventId: string;
  eventType: string;
  stripeCreatedAt: Date;
  variantId: VariantId | null;
};

export type RecordStripeCatalogWebhookEventResult = {
  record: StripeCatalogWebhookEventRecord;
  status: 'duplicate_retryable' | 'duplicate_succeeded' | 'recorded';
};

export interface StripeCatalogWebhookEventRepository {
  markCatalogEventFailed(eventId: string, failureReason: string): Promise<void>;
  markCatalogEventSucceeded(eventId: string): Promise<void>;
  recordCatalogEvent(input: RecordStripeCatalogWebhookEventInput): Promise<RecordStripeCatalogWebhookEventResult>;
}
