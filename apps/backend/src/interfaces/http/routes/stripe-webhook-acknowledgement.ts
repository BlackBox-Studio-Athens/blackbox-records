import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import type {
  ApplyNonPaidCheckoutReconciliationResult,
  ApplyPaidCheckoutReconciliationResult,
  CheckoutOrderPaid,
} from '../../../application/commerce/orders';
import {
  hasBlockingCatalogIssue,
  type CatalogSyncIssue,
  type CatalogSyncVariantResult,
} from '../../../application/commerce/catalog-sync';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';
import type { StoreItemSlug } from '../../../domain/commerce';
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
  findStoreItemByStripeProductId: (productId: string) => Promise<StoreItemOptionRecord | null>;
  markCatalogEventFailed: (eventId: string, failureReason: string) => Promise<void>;
  markCatalogEventSucceeded: (eventId: string) => Promise<void>;
  publishCheckoutOrderPaid: (event: CheckoutOrderPaid) => Promise<void>;
  recoverCheckoutOrderSession: (
    orderId: string,
    checkoutSessionId: string,
    checkoutExpiresAt?: Date,
  ) => Promise<boolean>;
  recordCatalogWebhookEvent: (
    input: RecordStripeCatalogWebhookEventInput,
  ) => Promise<RecordStripeCatalogWebhookEventResult>;
  reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) => Promise<CatalogSyncVariantResult>;
  logger?: Pick<AppLogger, 'info' | 'warn'>;
};

export class StripeWebhookReconciliationError extends Error {
  constructor() {
    super('Checkout reconciliation is temporarily unavailable.');
    this.name = 'StripeWebhookReconciliationError';
  }
}

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
    const object = event.catalogObject;
    const parent = 'product' in object ? object.product : null;
    const productId = object.object === 'product' ? object.id : typeof parent === 'string' ? parent : parent?.id;
    const storeItem = productId ? await services.findStoreItemByStripeProductId(productId) : null;
    const identity = { storeItemSlug: storeItem?.storeItemSlug ?? null, variantId: storeItem?.variantId ?? null };
    const catalogObjectIdentity = readCatalogObjectIdentity(event.catalogObject);

    const recordResult = await services.recordCatalogWebhookEvent({
      catalogObjectId: catalogObjectIdentity.catalogObjectId,
      catalogObjectKind: catalogObjectIdentity.catalogObjectKind,
      eventId: event.id,
      eventType: event.type,
      stripeCreatedAt: new Date(event.created * 1000),
      variantId: identity.variantId,
    });

    if (recordResult.status === 'duplicate_succeeded') {
      logCatalogWebhookOutcome(services, {
        outcome: 'duplicate_event',
        retryable: false,
        safeReason: 'duplicate_event',
        storeItemSlug: identity.storeItemSlug,
        stripeEventType: event.type,
        variantId: identity.variantId,
      });

      return {
        received: true,
      };
    }

    if (!storeItem) {
      await services.markCatalogEventSucceeded(event.id);
      logCatalogWebhookOutcome(services, {
        outcome: 'catalog_ignored',
        retryable: false,
        safeReason: 'variant_not_found',
        storeItemSlug: identity.storeItemSlug,
        stripeEventType: event.type,
        variantId: identity.variantId,
      });

      return {
        ignored: true,
        received: true,
      };
    }

    try {
      const catalogResult = await services.reconcileCatalogVariant(storeItem);
      const blockingIssue = catalogResult.issues.find((issue) => hasBlockingCatalogIssue([issue]));
      await services.markCatalogEventSucceeded(event.id);

      if (blockingIssue) {
        logCatalogWebhookOutcome(services, {
          outcome: 'catalog_drift',
          retryable: false,
          safeReason: blockingIssue.code,
          storeItemSlug: storeItem.storeItemSlug,
          stripeEventType: event.type,
          variantId: storeItem.variantId,
        });

        return {
          ignored: true,
          received: true,
        };
      }
    } catch (error) {
      await services.markCatalogEventFailed(event.id, 'reconciliation_failed');
      logCatalogWebhookOutcome(services, {
        outcome: 'catalog_reconciliation_failed',
        retryable: true,
        safeReason: 'reconciliation_failed',
        storeItemSlug: storeItem.storeItemSlug,
        stripeEventType: event.type,
        variantId: storeItem.variantId,
      });

      throw error;
    }

    logCatalogWebhookOutcome(services, {
      outcome: 'catalog_reconciled',
      retryable: false,
      storeItemSlug: storeItem.storeItemSlug,
      stripeEventType: event.type,
      variantId: storeItem.variantId,
    });

    return {
      received: true,
    };
  }

  const reconciliation = reconcileCheckoutSession(toStripeCheckoutSessionState(event.checkoutSession), event.type);

  if (reconciliation.source.orderId) {
    try {
      await services.recoverCheckoutOrderSession(
        reconciliation.source.orderId,
        reconciliation.source.checkoutSessionId,
        Number.isFinite(event.checkoutSession.expires_at)
          ? new Date(event.checkoutSession.expires_at * 1000)
          : undefined,
      );
    } catch {
      throw new StripeWebhookReconciliationError();
    }
  }

  if (reconciliation.recommendedOrderStatus === 'paid') {
    let result: ApplyPaidCheckoutReconciliationResult;
    try {
      result = await services.applyPaidCheckoutReconciliation(reconciliation);
    } catch {
      throw new StripeWebhookReconciliationError();
    }

    if (
      result.kind === 'missing_order' &&
      !reconciliation.source.orderId &&
      !event.checkoutSession.metadata?.storeItemSlug &&
      !event.checkoutSession.metadata?.variantId
    ) {
      return { received: true, ignored: true };
    }

    services.logger?.info({
      checkoutSessionIdHash: safeCheckoutSessionId(reconciliation.source.checkoutSessionId),
      event: 'stripe_webhook_outcome',
      outcome: `paid_${result.kind}`,
      provider: 'stripe',
      retryable: result.kind === 'missing_order' || result.kind === 'stock_unavailable',
      safeReason: 'reason' in result ? result.reason : undefined,
    });

    if (result.kind === 'missing_order' || result.kind === 'stock_unavailable' || result.kind === 'rejected') {
      throw new StripeWebhookReconciliationError();
    }

    if (result.kind === 'applied') {
      try {
        await services.publishCheckoutOrderPaid(result.checkoutOrderPaid);
      } catch {
        services.logger?.warn({ event: 'paid_order_delivery_outcome', safeReason: 'unknown', status: 'pending' });
      }
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

type CatalogWebhookSafeReason =
  CatalogSyncIssue['code'] | 'duplicate_event' | 'reconciliation_failed' | 'variant_not_found';

function logCatalogWebhookOutcome(
  services: StripeWebhookAcknowledgementServices,
  input: {
    outcome: string;
    retryable: boolean;
    safeReason?: CatalogWebhookSafeReason;
    storeItemSlug: StoreItemSlug | null;
    stripeEventType: string;
    variantId: RecordStripeCatalogWebhookEventInput['variantId'];
  },
): void {
  const log = input.retryable ? services.logger?.warn : services.logger?.info;

  log?.({
    event: 'stripe_webhook_outcome',
    outcome: input.outcome,
    provider: 'stripe',
    retryable: input.retryable,
    safeReason: input.safeReason,
    storeItemSlug: input.storeItemSlug ?? undefined,
    stripeEventType: input.stripeEventType,
    variantId: input.variantId ?? undefined,
  });
}
