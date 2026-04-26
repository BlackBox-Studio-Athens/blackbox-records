import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import type {
  ApplyNonPaidCheckoutReconciliationResult,
  ApplyPaidCheckoutReconciliationResult,
} from '../../../application/commerce/orders';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';

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
