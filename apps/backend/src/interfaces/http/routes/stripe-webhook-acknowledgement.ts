import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import type {
  ApplyNonPaidCheckoutReconciliationResult,
  ApplyPaidCheckoutReconciliationResult,
  CheckoutOrderPaid,
} from '../../../application/commerce/orders';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';
import { parseVariantId } from '../../../domain/commerce';
import type {
  RecordStripeCatalogWebhookEventInput,
  RecordStripeCatalogWebhookEventResult,
  StoreItemOptionRecord,
} from '../../../domain/commerce/repositories/spi';
import type { AppLogger } from '../../../observability';
import { safeCheckoutSessionId } from '../../../observability';

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
  publishCheckoutOrderPaid: (event: CheckoutOrderPaid) => Promise<void>;
  recordCatalogWebhookEvent: (
    input: RecordStripeCatalogWebhookEventInput,
  ) => Promise<RecordStripeCatalogWebhookEventResult>;
  reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) => Promise<unknown>;
  logger?: Pick<AppLogger, 'info' | 'warn'>;
};

export async function acknowledgeVerifiedStripeWebhookEvent(
  event: VerifiedStripeWebhookEvent,
  services: StripeWebhookAcknowledgementServices,
): Promise<StripeWebhookAcknowledgement> {
  if (!event.isAllowed) {
    services.logger?.warn({
      event: 'stripe_webhook_outcome',
      outcome: 'unsupported_event_type',
      provider: 'stripe',
      safeReason: 'unsupported_event_type',
      stripeEventType: event.type,
    });

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
      services.logger?.warn({
        event: 'stripe_webhook_outcome',
        outcome: 'duplicate_event',
        provider: 'stripe',
        safeReason: 'duplicate_event',
        stripeEventType: event.type,
        variantId: variantId ?? undefined,
      });

      return {
        received: true,
      };
    }

    const storeItem = variantId ? await services.findStoreItemByVariantId(variantId) : null;

    if (storeItem) {
      await services.reconcileCatalogVariant(storeItem);
    }

    services.logger?.info({
      event: 'stripe_webhook_outcome',
      outcome: storeItem ? 'catalog_reconciled' : 'catalog_ignored',
      provider: 'stripe',
      safeReason: storeItem ? undefined : 'variant_not_found',
      stripeEventType: event.type,
      variantId: variantId ?? undefined,
    });

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
    const result = await services.applyPaidCheckoutReconciliation(reconciliation);

    services.logger?.info({
      checkoutSessionIdHash: safeCheckoutSessionId(reconciliation.source.checkoutSessionId),
      event: 'stripe_webhook_outcome',
      outcome: `paid_${result.kind}`,
      provider: 'stripe',
      retryable: result.kind === 'missing_order' || result.kind === 'stock_unavailable',
      safeReason: 'reason' in result ? result.reason : undefined,
    });

    if (result.kind === 'applied') {
      await services.publishCheckoutOrderPaid(result.checkoutOrderPaid);
    }
  } else if (
    reconciliation.recommendedOrderStatus === 'needs_review' ||
    reconciliation.recommendedOrderStatus === 'not_paid'
  ) {
    const result = await services.applyNonPaidCheckoutReconciliation(reconciliation);

    services.logger?.info({
      checkoutSessionIdHash: safeCheckoutSessionId(reconciliation.source.checkoutSessionId),
      event: 'stripe_webhook_outcome',
      outcome: `non_paid_${result.kind}`,
      provider: 'stripe',
      retryable: result.kind === 'missing_order',
      safeReason: 'reason' in result ? result.reason : undefined,
    });
  } else {
    services.logger?.info({
      checkoutSessionIdHash: safeCheckoutSessionId(reconciliation.source.checkoutSessionId),
      event: 'stripe_webhook_outcome',
      outcome: 'checkout_no_mutation',
      provider: 'stripe',
      safeReason: 'pending_payment',
    });
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
