import {
  applyNonPaidCheckoutReconciliation,
  applyPaidCheckoutReconciliation,
  processPaidOrderDeliveriesForOrder,
  type ApplyNonPaidCheckoutReconciliationResult,
  type ApplyPaidCheckoutReconciliationResult,
  type CheckoutOrderPaid,
} from '../../../application/commerce/orders';
import {
  CatalogReconciler,
  createCurrentCatalogProductProjectionReader,
} from '../../../application/commerce/catalog-sync';
import type { CheckoutReconciliation } from '../../../application/commerce/checkout';
import { EmailConfigurationError } from '../../../application/email';
import { readPaidCheckoutFulfillment, type StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import { parseCheckoutSessionId } from '../../../domain/commerce';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../../../env';
import type { AppLogger } from '../../../observability';
import { createBindingLogger } from '../../../observability';
import { createStripeCatalogGateway, createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
  PrismaStripeCatalogWebhookEventRepository,
} from '../../../infrastructure/persistence/prisma';
import { D1PaidCheckoutFinalizationRepository } from './d1-paid-checkout-finalization-repository';
import { D1CheckoutStockHoldRepository } from '../../../infrastructure/persistence/d1-checkout-stock-hold-repository';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';

export function createStripeWebhookServices(bindings: AppBindings, logger: AppLogger = createBindingLogger(bindings)) {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const paidCheckoutFinalizer = new D1PaidCheckoutFinalizationRepository(bindings.COMMERCE_DB);
  const paidOrderDeliveries = new D1PaidOrderDeliveryRepository(bindings.COMMERCE_DB);
  const checkoutHolds = new D1CheckoutStockHoldRepository(bindings.COMMERCE_DB);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const catalogWebhookEvents = new PrismaStripeCatalogWebhookEventRepository(prisma);
  const productProjections = createCurrentCatalogProductProjectionReader();
  const checkoutGateway = createStripeCheckoutGateway(bindings);
  const catalogReconciler = new CatalogReconciler({
    environment: productEnvironmentProfile.workerDeploymentTarget,
    storeItems,
    storeOfferSnapshots,
    stripeCatalog: createStripeCatalogGateway(bindings),
    variantStripeMappings,
  });

  return {
    applyNonPaidCheckoutReconciliation: (
      reconciliation: CheckoutReconciliation,
    ): Promise<ApplyNonPaidCheckoutReconciliationResult> => applyNonPaidCheckoutReconciliation(orders, reconciliation),
    applyPaidCheckoutReconciliation: (
      reconciliation: CheckoutReconciliation,
    ): Promise<ApplyPaidCheckoutReconciliationResult> =>
      checkoutGateway
        .readCheckoutSessionLineItems(reconciliation.source.checkoutSessionId)
        .then((lineItems) =>
          applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, reconciliation, new Date(), lineItems),
        ),
    disconnect: async () => prisma.$disconnect(),
    catalogEnvironment: productEnvironmentProfile.workerDeploymentTarget,
    logger,
    findStoreItemByVariantId: (variantId: string) => storeItems.findByVariantId(variantId),
    markCatalogEventFailed: catalogWebhookEvents.markCatalogEventFailed.bind(catalogWebhookEvents),
    markCatalogEventSucceeded: catalogWebhookEvents.markCatalogEventSucceeded.bind(catalogWebhookEvents),
    publishCheckoutOrderPaid: async (event: CheckoutOrderPaid): Promise<void> => {
      const persistedOrder = await orders.findById(event.orderId);
      const paidFulfillment = persistedOrder ? readPaidCheckoutFulfillment(persistedOrder) : null;

      if (paidFulfillment?.kind !== 'current') {
        logger.warn({
          event: 'paid_order_delivery_outcome',
          orderReference: event.orderReference,
          safeReason: 'incomplete_paid_fulfillment',
          status: 'needs_review',
        });

        return;
      }

      try {
        const emailRuntime = createEmailRuntimeServices(bindings);

        await processPaidOrderDeliveriesForOrder({
          config: emailRuntime.config,
          logger,
          order: paidFulfillment.order,
          provider: emailRuntime.provider,
          repository: paidOrderDeliveries,
        });
      } catch (error) {
        logger.warn({
          event: 'paid_order_delivery_outcome',
          orderReference: event.orderReference,
          safeReason: error instanceof EmailConfigurationError ? error.safeReason : 'unknown',
          status: 'pending',
        });
      }
    },
    recoverCheckoutOrderSession: (orderId: string, checkoutSessionId: string) =>
      checkoutHolds.recoverCheckoutSession(orderId, parseCheckoutSessionId(checkoutSessionId), new Date()),
    recordCatalogWebhookEvent: catalogWebhookEvents.recordCatalogEvent.bind(catalogWebhookEvents),
    reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) =>
      catalogReconciler.reconcileVariant(storeItem, {
        apply: true,
        applyProductProjection: false,
        productProjection: productProjections.findByStoreItem(storeItem),
      }),
  };
}
