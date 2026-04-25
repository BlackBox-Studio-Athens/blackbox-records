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

  return {
    received: true,
  };
}
