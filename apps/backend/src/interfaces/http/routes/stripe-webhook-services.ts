import {
  applyNonPaidCheckoutReconciliation,
  applyPaidCheckoutReconciliation,
  type ApplyNonPaidCheckoutReconciliationResult,
  type ApplyPaidCheckoutReconciliationResult,
} from '../../../application/commerce/orders';
import { CatalogReconciler } from '../../../application/commerce/catalog-sync';
import type { CheckoutReconciliation } from '../../../application/commerce/checkout';
import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../env';
import { createStripeCatalogGateway, createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaStockChangeRepository,
  PrismaStockRepository,
  PrismaVariantStripeMappingRepository,
  PrismaStripeCatalogWebhookEventRepository,
} from '../../../infrastructure/persistence/prisma';

export function createStripeWebhookServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const stockChanges = new PrismaStockChangeRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const catalogWebhookEvents = new PrismaStripeCatalogWebhookEventRepository(prisma);
  const checkoutGateway = createStripeCheckoutGateway(bindings);
  const catalogReconciler = new CatalogReconciler({
    environment: bindings.APP_ENV,
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
          applyPaidCheckoutReconciliation(orders, stock, stockChanges, reconciliation, new Date(), lineItems),
        ),
    disconnect: async () => prisma.$disconnect(),
    findStoreItemByVariantId: (variantId: string) => storeItems.findByVariantId(variantId),
    recordCatalogWebhookEvent: catalogWebhookEvents.recordCatalogEvent.bind(catalogWebhookEvents),
    reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) =>
      catalogReconciler.reconcileVariant(storeItem, { apply: true }),
  };
}
