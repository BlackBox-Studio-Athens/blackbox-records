import type { AppOpenApi } from '../../../platform/env';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';
import { EmailConfigurationError } from '../../../application/email';
import { jsonError, jsonNoStore } from '../../../platform/interfaces/http/responses';
import {
  postNewsletterConfirmationRoute,
  postAvailabilityWithdrawalLinkRoute,
  postAvailabilityWithdrawalRoute,
} from '../contracts/public-contracts';
import { D1EmailConsentRepository } from '../../../infrastructure/persistence/d1-email-consent-repository';
import { hashEmailConsentToken } from '../../../application/email';

export function registerEmailConsentRoutes(app: AppOpenApi): void {
  app.openapi(postNewsletterConfirmationRoute, async (context) => {
    try {
      const result = await createEmailRuntimeServices(context.env).consent.confirmNewsletter(
        context.req.valid('json').token,
      );
      if (!result)
        return jsonError(context, {
          code: 'invalid_request',
          message: 'Request a new confirmation link.',
          status: 400,
        });
      if (!result.ok)
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Request a new confirmation link.',
          status: 503,
        });
      return jsonNoStore(context.json({ status: 'confirmed' as const }, 200));
    } catch (error) {
      if (error instanceof EmailConfigurationError)
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Newsletter signup is temporarily unavailable.',
          status: 503,
        });
      throw error;
    }
  });
  app.openapi(postAvailabilityWithdrawalLinkRoute, async (context) => {
    try {
      const result = await createEmailRuntimeServices(context.env).consent.requestAlertWithdrawal(
        context.req.valid('json').email,
      );
      if (!result.ok)
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Email delivery is temporarily unavailable.',
          status: 503,
        });
      return jsonNoStore(context.json({ status: 'requested' as const }, 200));
    } catch (error) {
      if (error instanceof EmailConfigurationError)
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Email delivery is temporarily unavailable.',
          status: 503,
        });
      throw error;
    }
  });
  // Withdrawal needs no email credentials or provider access: an outage cannot prevent cancellation.
  app.openapi(postAvailabilityWithdrawalRoute, async (context) => {
    await new D1EmailConsentRepository(context.env.COMMERCE_DB).withdrawAlerts(
      await hashEmailConsentToken(context.req.valid('json').token),
      new Date(),
    );
    return jsonNoStore(context.json({ status: 'withdrawn' as const }, 200));
  });
}
