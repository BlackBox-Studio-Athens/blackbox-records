import type { AppOpenApi } from '../../../env';
import {
  StripeWebhookConfigurationError,
  StripeWebhookMissingSignatureError,
  StripeWebhookSignatureVerificationError,
  verifyStripeWebhookEvent,
} from '../../../infrastructure/stripe';
import { acknowledgeVerifiedStripeWebhookEvent } from './stripe-webhook-acknowledgement';

export function registerStripeWebhookRoutes(app: AppOpenApi): void {
  app.post('/api/stripe/webhooks', async (context) => {
    try {
      const rawBody = await context.req.text();
      const event = await verifyStripeWebhookEvent({
        rawBody,
        signature: context.req.header('stripe-signature') ?? null,
        webhookSecret: context.env.STRIPE_WEBHOOK_SECRET,
      });
      const acknowledgement = await acknowledgeVerifiedStripeWebhookEvent(event);

      return context.json(acknowledgement, 200);
    } catch (error) {
      if (error instanceof StripeWebhookConfigurationError) {
        return context.json({ error: error.message }, 500);
      }

      if (error instanceof StripeWebhookMissingSignatureError) {
        return context.json({ error: error.message }, 400);
      }

      if (error instanceof StripeWebhookSignatureVerificationError) {
        return context.json({ error: error.message }, 400);
      }

      throw error;
    }
  });
}
