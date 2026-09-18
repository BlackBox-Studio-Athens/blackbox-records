import type { AppOpenApi } from '../../../env';
import { registerPublicCommerceRoutes } from './register-public-commerce-routes';
import { registerPublicNewsletterRoutes } from './register-public-newsletter-routes';
import { registerPublicServicesInquiryRoutes } from './register-public-services-inquiry-routes';
import { registerStripeWebhookRoutes } from './register-stripe-webhook-routes';

export function registerPublicRoutes(app: AppOpenApi, getPublicOpenApiDocument: () => object): void {
  registerPublicCommerceRoutes(app, getPublicOpenApiDocument);
  registerPublicNewsletterRoutes(app);
  registerPublicServicesInquiryRoutes(app);
  registerStripeWebhookRoutes(app);
}
