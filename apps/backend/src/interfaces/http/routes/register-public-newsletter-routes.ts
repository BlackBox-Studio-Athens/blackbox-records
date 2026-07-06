import type { AppOpenApi } from '../../../env';
import { requestLogger } from '../../../observability';
import { postNewsletterRegistrationRoute } from '../contracts/public-contracts';
import { jsonError, jsonNoStore } from '../responses';
import { createPublicNewsletterServices } from './public-newsletter-services';

export function registerPublicNewsletterRoutes(app: AppOpenApi): void {
  app.openapi(postNewsletterRegistrationRoute, async (context) => {
    const logger = requestLogger(context);
    const services = createPublicNewsletterServices(context.env, logger);

    try {
      const result = await services.registerNewsletterSignup({
        email: context.req.valid('json').email,
      });

      if (result.status === 'failed') {
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Newsletter signup is temporarily unavailable.',
          status: 503,
        });
      }

      return jsonNoStore(
        context.json(
          {
            status: 'registered' as const,
          },
          200,
        ),
      );
    } catch (error) {
      if (error instanceof services.errors.ZodError) {
        return jsonError(context, {
          code: 'invalid_request',
          message: 'Enter a valid email address.',
          status: 400,
        });
      }

      if (error instanceof services.errors.EmailConfigurationError) {
        return jsonError(context, {
          code: 'newsletter_unavailable',
          message: 'Newsletter signup is temporarily unavailable.',
          status: 503,
        });
      }

      throw error;
    }
  });
}
