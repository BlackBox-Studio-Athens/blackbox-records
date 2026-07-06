import type { AppOpenApi } from '../../../env';
import { normalizeUnknownError, requestLogger, runWithTraceSpan, traceContextFromHono } from '../../../observability';
import {
  StripeWebhookConfigurationError,
  StripeWebhookMissingSignatureError,
  StripeWebhookSignatureVerificationError,
  verifyStripeWebhookEvent,
} from '../../../infrastructure/stripe';
import { jsonError, jsonNoStore } from '../responses';
import { acknowledgeVerifiedStripeWebhookEvent } from './stripe-webhook-acknowledgement';
import { createStripeWebhookServices } from './stripe-webhook-services';

export function registerStripeWebhookRoutes(app: AppOpenApi): void {
  app.post('/api/stripe/webhooks', async (context) => {
    const logger = requestLogger(context);
    const traceContext = traceContextFromHono(context);
    const services = createStripeWebhookServices(context.env, logger, traceContext);

    try {
      const rawBody = await context.req.text();
      const event = await verifyStripeWebhookEvent({
        rawBody,
        signature: context.req.header('stripe-signature') ?? null,
        webhookSecret: context.env.STRIPE_WEBHOOK_SECRET,
      });

      logger.info({
        event: 'stripe_webhook_received',
        outcome: 'verified',
        provider: 'stripe',
        stripeEventType: event.type,
      });

      const acknowledgement = await runWithTraceSpan(
        traceContext,
        'stripe.webhook.reconcile',
        {
          operation: 'stripe_webhook_reconcile',
          productEnvironment: context.env.PRODUCT_ENVIRONMENT,
          stripeEventType: event.type,
        },
        () => acknowledgeVerifiedStripeWebhookEvent(event, services),
      );

      return jsonNoStore(context.json(acknowledgement, 200));
    } catch (error) {
      if (error instanceof StripeWebhookConfigurationError) {
        logger.error({
          event: 'stripe_webhook_outcome',
          outcome: 'configuration_failed',
          provider: 'stripe',
          safeReason: 'webhook_not_configured',
        });

        return jsonError(context, {
          code: 'internal_server_error',
          message: error.message,
          status: 500,
        });
      }

      if (error instanceof StripeWebhookMissingSignatureError) {
        logger.error({
          event: 'stripe_webhook_outcome',
          outcome: 'verification_failed',
          provider: 'stripe',
          safeReason: 'missing_signature',
        });

        return jsonError(context, {
          code: 'invalid_request',
          message: error.message,
          status: 400,
        });
      }

      if (error instanceof StripeWebhookSignatureVerificationError) {
        logger.error({
          event: 'stripe_webhook_outcome',
          outcome: 'verification_failed',
          provider: 'stripe',
          safeReason: 'signature_verification_failed',
        });

        return jsonError(context, {
          code: 'invalid_request',
          message: error.message,
          status: 400,
        });
      }

      logger.error({
        ...normalizeUnknownError(error),
        event: 'stripe_webhook_outcome',
        outcome: 'unexpected_failure',
        provider: 'stripe',
      });

      throw error;
    } finally {
      await services.disconnect();
    }
  });
}
