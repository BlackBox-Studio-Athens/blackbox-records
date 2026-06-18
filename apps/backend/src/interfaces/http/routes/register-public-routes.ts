import type { AppOpenApi } from '../../../env';
import { registerPublicCommerceRoutes } from './register-public-commerce-routes';
import { registerPublicNewsletterRoutes } from './register-public-newsletter-routes';
import { registerStripeWebhookRoutes } from './register-stripe-webhook-routes';

export function registerPublicRoutes(app: AppOpenApi): void {
  registerPublicCommerceRoutes(app);
  registerPublicNewsletterRoutes(app);
  registerStripeWebhookRoutes(app);
}
