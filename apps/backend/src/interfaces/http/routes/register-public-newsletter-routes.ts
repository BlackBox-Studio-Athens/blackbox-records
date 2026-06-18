import type { AppOpenApi } from '../../../env';
import { postNewsletterRegistrationRoute } from '../contracts/public-contracts';
import { createPublicNewsletterServices } from './public-newsletter-services';

const newsletterUnavailableResponse = {
  error: 'Newsletter signup is temporarily unavailable.',
};

const jsonNoStore = <TResponse extends Response>(response: TResponse): TResponse => {
  response.headers.set('Cache-Control', 'no-store');

  return response;
};

export function registerPublicNewsletterRoutes(app: AppOpenApi): void {
  app.openapi(postNewsletterRegistrationRoute, async (context) => {
    const services = createPublicNewsletterServices(context.env);

    try {
      const result = await services.registerNewsletterSignup({
        email: context.req.valid('json').email,
      });

      if (result.status === 'failed') {
        return jsonNoStore(context.json(newsletterUnavailableResponse, 503));
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
        return jsonNoStore(context.json({ error: 'Enter a valid email address.' }, 400));
      }

      if (error instanceof services.errors.EmailConfigurationError) {
        return jsonNoStore(context.json(newsletterUnavailableResponse, 503));
      }

      throw error;
    }
  });
}
