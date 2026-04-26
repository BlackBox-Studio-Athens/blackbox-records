import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import type { ApplyPaidCheckoutReconciliationResult } from '../../../application/commerce/orders';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';

export type StripeWebhookAcknowledgement = {
  ignored?: true;
  received: true;
};

export type StripeWebhookAcknowledgementServices = {
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
  }

  return {
    received: true,
  };
}
