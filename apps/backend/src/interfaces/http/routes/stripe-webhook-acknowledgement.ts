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
  type StripeCatalogEnvironment,
} from '../../../application/commerce/catalog-sync';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';
import { parseStoreItemSlug, parseVariantId, type StoreItemSlug } from '../../../domain/commerce';
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
  catalogEnvironment: StripeCatalogEnvironment;
  catalogWebhookMutationEnabled: boolean;
  findStoreItemByVariantId: (variantId: string) => Promise<StoreItemOptionRecord | null>;
  markCatalogEventFailed: (eventId: string, failureReason: string) => Promise<void>;
  markCatalogEventSucceeded: (eventId: string) => Promise<void>;
  publishCheckoutOrderPaid: (event: CheckoutOrderPaid) => Promise<void>;
  recordCatalogWebhookEvent: (
    input: RecordStripeCatalogWebhookEventInput,
  ) => Promise<RecordStripeCatalogWebhookEventResult>;
  reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) => Promise<CatalogSyncVariantResult>;
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
    const identity = readCatalogObjectEventIdentity(event.catalogObject, services.catalogEnvironment);
    const catalogObjectIdentity = readCatalogObjectIdentity(event.catalogObject);

    if (!services.catalogWebhookMutationEnabled) {
      logCatalogWebhookOutcome(services, {
        outcome: 'catalog_readiness_only',
        retryable: false,
        safeReason: 'prd_open_gate_closed',
        storeItemSlug: identity.storeItemSlug,
        stripeEventType: event.type,
        variantId: identity.variantId,
      });

      return {
        ignored: true,
        received: true,
      };
    }

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

    if (identity.safeReason) {
      await services.markCatalogEventSucceeded(event.id);
      logCatalogWebhookOutcome(services, {
        outcome: 'catalog_ignored',
        retryable: false,
        safeReason: identity.safeReason,
        storeItemSlug: identity.storeItemSlug,
        stripeEventType: event.type,
        variantId: identity.variantId,
      });

      return {
        ignored: true,
        received: true,
      };
    }

    const storeItem = identity.variantId ? await services.findStoreItemByVariantId(identity.variantId) : null;

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

type CatalogWebhookIgnoredReason =
  | 'conflicting_catalog_identity'
  | 'duplicate_event'
  | 'foreign_environment_identity'
  | 'malformed_catalog_identity'
  | 'missing_variant_identity'
  | 'prd_open_gate_closed'
  | 'reconciliation_failed'
  | 'variant_not_found';

type CatalogWebhookSafeReason = CatalogWebhookIgnoredReason | CatalogSyncIssue['code'];

type CatalogObjectEventIdentity = {
  safeReason?: CatalogWebhookIgnoredReason;
  storeItemSlug: StoreItemSlug | null;
  variantId: RecordStripeCatalogWebhookEventInput['variantId'];
};

type ParsedCatalogIdentity =
  | {
      environment: StripeCatalogEnvironment;
      storeItemSlug: StoreItemSlug;
      type: 'valid';
      variantId: NonNullable<RecordStripeCatalogWebhookEventInput['variantId']>;
    }
  | {
      type: 'malformed';
    }
  | {
      type: 'external';
    }
  | {
      type: 'missing';
    };

function readCatalogObjectEventIdentity(
  catalogObject: Extract<VerifiedStripeWebhookEvent, { catalogObject: unknown }>['catalogObject'],
  environment: StripeCatalogEnvironment,
): CatalogObjectEventIdentity {
  if ('deleted' in catalogObject) {
    return {
      safeReason: 'missing_variant_identity',
      storeItemSlug: null,
      variantId: null,
    };
  }

  const metadataIdentity = readMetadataEventIdentity(catalogObject.metadata ?? {});
  const lookupIdentity =
    'lookup_key' in catalogObject
      ? readLookupKeyEventIdentity(catalogObject.lookup_key)
      : ({ type: 'missing' } as const);
  const parsedIdentities = [metadataIdentity, lookupIdentity];

  if (parsedIdentities.some((identity) => identity.type === 'malformed')) {
    return {
      safeReason: 'malformed_catalog_identity',
      storeItemSlug: null,
      variantId: null,
    };
  }

  const validIdentities = parsedIdentities.filter(
    (identity): identity is Extract<ParsedCatalogIdentity, { type: 'valid' }> => identity.type === 'valid',
  );
  const firstIdentity = validIdentities[0];

  if (firstIdentity && validIdentities.some((identity) => !sameParsedCatalogIdentity(identity, firstIdentity))) {
    return {
      safeReason: 'conflicting_catalog_identity',
      storeItemSlug: firstIdentity.storeItemSlug,
      variantId: firstIdentity.variantId,
    };
  }

  if (firstIdentity?.environment === environment) {
    if (lookupIdentity.type === 'external') {
      return {
        safeReason: 'conflicting_catalog_identity',
        storeItemSlug: firstIdentity.storeItemSlug,
        variantId: firstIdentity.variantId,
      };
    }

    return firstIdentity;
  }

  if (firstIdentity) {
    return {
      safeReason: 'foreign_environment_identity',
      storeItemSlug: firstIdentity.storeItemSlug,
      variantId: firstIdentity.variantId,
    };
  }

  return {
    safeReason: 'missing_variant_identity',
    storeItemSlug: null,
    variantId: null,
  };
}

function sameParsedCatalogIdentity(
  left: Extract<ParsedCatalogIdentity, { type: 'valid' }>,
  right: Extract<ParsedCatalogIdentity, { type: 'valid' }>,
): boolean {
  return (
    left.environment === right.environment &&
    left.storeItemSlug === right.storeItemSlug &&
    left.variantId === right.variantId
  );
}

function readMetadataEventIdentity(metadata: Record<string, string>): ParsedCatalogIdentity {
  if (
    !metadata.appEnv &&
    !metadata.sourceId &&
    !metadata.sourceKind &&
    !metadata.storeItemSlug &&
    !metadata.variantId
  ) {
    return { type: 'missing' };
  }

  if (
    !metadata.appEnv ||
    !metadata.sourceId ||
    !metadata.sourceKind ||
    !metadata.storeItemSlug ||
    !metadata.variantId
  ) {
    return { type: 'malformed' };
  }

  const environment = parseCatalogEnvironment(metadata.appEnv);

  if (!environment) {
    return { type: 'malformed' };
  }

  try {
    return {
      environment,
      storeItemSlug: parseStoreItemSlug(metadata.storeItemSlug),
      type: 'valid',
      variantId: parseVariantId(metadata.variantId),
    };
  } catch {
    return { type: 'malformed' };
  }
}

function readLookupKeyEventIdentity(lookupKey: string | null): ParsedCatalogIdentity {
  if (!lookupKey) {
    return { type: 'missing' };
  }

  if (!lookupKey.startsWith('blackbox:')) {
    return { type: 'external' };
  }

  const parts = lookupKey.split(':');
  const environment = parseCatalogEnvironment(parts[1]);

  if (parts.length !== 4 || !environment || !parts[2] || !parts[3]) {
    return { type: 'malformed' };
  }

  try {
    return {
      environment,
      storeItemSlug: parseStoreItemSlug(parts[2]),
      type: 'valid',
      variantId: parseVariantId(parts[3]),
    };
  } catch {
    return { type: 'malformed' };
  }
}

function parseCatalogEnvironment(value: unknown): StripeCatalogEnvironment | null {
  return value === 'local' || value === 'uat' || value === 'prd' ? value : null;
}

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
