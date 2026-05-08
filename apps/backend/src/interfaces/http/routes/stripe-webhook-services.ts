import {
  applyNonPaidCheckoutReconciliation,
  applyPaidCheckoutReconciliation,
  type ApplyNonPaidCheckoutReconciliationResult,
  type ApplyPaidCheckoutReconciliationResult,
} from '../../../application/commerce/orders';
import type { CheckoutReconciliation } from '../../../application/commerce/checkout';
import type { AppBindings } from '../../../env';
import { createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStockChangeRepository,
  PrismaStockRepository,
} from '../../../infrastructure/persistence/prisma';

export function createStripeWebhookServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const stockChanges = new PrismaStockChangeRepository(prisma);
  const checkoutGateway = createStripeCheckoutGateway(bindings);

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
  };
}
