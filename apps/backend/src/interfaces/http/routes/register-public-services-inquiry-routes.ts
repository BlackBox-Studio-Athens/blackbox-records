import type { AppOpenApi } from '../../../env';
import { requestLogger } from '../../../observability';
import { postServicesInquiryRoute } from '../contracts/public-contracts';
import { jsonError, jsonNoStore } from '../responses';
import { createPublicServicesInquiryServices } from './public-services-inquiry-services';

export function registerPublicServicesInquiryRoutes(app: AppOpenApi): void {
  app.openapi(postServicesInquiryRoute, async (context) => {
    const services = createPublicServicesInquiryServices(context.env, requestLogger(context));

    try {
      const result = await services.submitServicesInquiry(context.req.valid('json'));

      if (result.status === 'failed') {
        return servicesInquiryUnavailable(context);
      }

      return jsonNoStore(
        context.json(
          {
            status: 'submitted' as const,
          },
          200,
        ),
      );
    } catch (error) {
      if (error instanceof services.errors.EmailConfigurationError) {
        return servicesInquiryUnavailable(context);
      }

      throw error;
    }
  });
}

function servicesInquiryUnavailable(context: Parameters<typeof jsonError>[0]) {
  return jsonError(context, {
    code: 'services_inquiry_unavailable',
    message: 'Services inquiry submission is temporarily unavailable.',
    status: 503,
  });
}
