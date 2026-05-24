import type { VariantId } from '../ids';

export type StripeCatalogWebhookObjectKind = 'price' | 'product';

export type StripeCatalogWebhookEventRecord = {
  catalogObjectId: string;
  catalogObjectKind: StripeCatalogWebhookObjectKind;
  eventId: string;
  eventType: string;
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
  status: 'duplicate' | 'recorded';
};

export interface StripeCatalogWebhookEventRepository {
  recordCatalogEvent(input: RecordStripeCatalogWebhookEventInput): Promise<RecordStripeCatalogWebhookEventResult>;
}
