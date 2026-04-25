import { reconcileCheckoutSession } from '../../../application/commerce/checkout';
import { toStripeCheckoutSessionState } from '../../../infrastructure/stripe';
import type { VerifiedStripeWebhookEvent } from '../../../infrastructure/stripe';

export type StripeWebhookAcknowledgement = {
  ignored?: true;
  received: true;
};

export async function acknowledgeVerifiedStripeWebhookEvent(
  event: VerifiedStripeWebhookEvent,
): Promise<StripeWebhookAcknowledgement> {
  if (!event.isAllowed) {
    return {
      ignored: true,
      received: true,
    };
  }

  reconcileCheckoutSession(toStripeCheckoutSessionState(event.checkoutSession));

  return {
    received: true,
  };
}
