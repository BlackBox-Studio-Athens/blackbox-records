import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import type {
  ApplyNonPaidCheckoutReconciliationResult,
  ApplyPaidCheckoutReconciliationResult,
} from '../../../application/commerce/orders';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';
import { parseVariantId } from '../../../domain/commerce';
import type {
  RecordStripeCatalogWebhookEventInput,
  RecordStripeCatalogWebhookEventResult,
  StoreItemOptionRecord,
} from '../../../domain/commerce/repositories/spi';

export type StripeWebhookAcknowledgement = {
  ignored?: true;
  received: true;
};

export type StripeWebhookAcknowledgementServices = {
  applyNonPaidCheckoutReconciliation: (
    reconciliation: ReturnType<typeof reconcileCheckoutSession>,
  ) => Promise<ApplyNonPaidCheckoutReconciliationResult>;
  applyPaidCheckoutReconciliation: (
    reconciliation: ReturnType<typeof reconcileCheckoutSession>,
  ) => Promise<ApplyPaidCheckoutReconciliationResult>;
  findStoreItemByVariantId: (variantId: string) => Promise<StoreItemOptionRecord | null>;
  recordCatalogWebhookEvent: (
    input: RecordStripeCatalogWebhookEventInput,
  ) => Promise<RecordStripeCatalogWebhookEventResult>;
  reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) => Promise<unknown>;
};

export async function acknowledgeVerifiedStripeWebhookEvent(
  event: VerifiedStripeWebhookEvent,
  services: StripeWebhookAcknowledgementServices,
): Promise<StripeWebhookAcknowledgement> {
  if (!event.isAllowed) {
    return {
      ignored: true,
      received: true,
    };
  }

  if ('catalogObject' in event) {
    const variantId = readVariantIdFromCatalogObject(event.catalogObject);
    const catalogObjectIdentity = readCatalogObjectIdentity(event.catalogObject);
    const recordResult = await services.recordCatalogWebhookEvent({
      catalogObjectId: catalogObjectIdentity.catalogObjectId,
      catalogObjectKind: catalogObjectIdentity.catalogObjectKind,
      eventId: event.id,
      eventType: event.type,
      stripeCreatedAt: new Date(event.created * 1000),
      variantId,
    });

    if (recordResult.status === 'duplicate') {
      return {
        received: true,
      };
    }

    const storeItem = variantId ? await services.findStoreItemByVariantId(variantId) : null;

    if (storeItem) {
      await services.reconcileCatalogVariant(storeItem);
    }

    return storeItem
      ? {
          received: true,
        }
      : {
          ignored: true,
          received: true,
        };
  }

  const reconciliation = reconcileCheckoutSession(toStripeCheckoutSessionState(event.checkoutSession));

  if (reconciliation.recommendedOrderStatus === 'paid') {
    await services.applyPaidCheckoutReconciliation(reconciliation);
  } else if (
    reconciliation.recommendedOrderStatus === 'needs_review' ||
    reconciliation.recommendedOrderStatus === 'not_paid'
  ) {
    await services.applyNonPaidCheckoutReconciliation(reconciliation);
  }

  return {
    received: true,
  };
}

function readCatalogObjectIdentity(
  catalogObject: Extract<VerifiedStripeWebhookEvent, { catalogObject: unknown }>['catalogObject'],
): Pick<RecordStripeCatalogWebhookEventInput, 'catalogObjectId' | 'catalogObjectKind'> {
  return {
    catalogObjectId: catalogObject.id,
    catalogObjectKind: catalogObject.object === 'price' ? 'price' : 'product',
  };
}

function readVariantIdFromCatalogObject(
  catalogObject: Extract<VerifiedStripeWebhookEvent, { catalogObject: unknown }>['catalogObject'],
): RecordStripeCatalogWebhookEventInput['variantId'] {
  if ('deleted' in catalogObject) {
    return null;
  }

  const metadataVariantId = readOptionalString(catalogObject.metadata?.variantId);

  if (metadataVariantId) {
    return parseVariantId(metadataVariantId);
  }

  if ('lookup_key' in catalogObject) {
    return readVariantIdFromLookupKey(catalogObject.lookup_key);
  }

  return null;
}

function readVariantIdFromLookupKey(lookupKey: string | null): RecordStripeCatalogWebhookEventInput['variantId'] {
  const parts = lookupKey?.split(':') ?? [];

  return parts.length === 4 && parts[3]?.startsWith('variant_') ? parseVariantId(parts[3]) : null;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
