import type { AppOpenApi } from '../../../env';
import { registerPublicCommerceRoutes } from './register-public-commerce-routes';

export function registerPublicRoutes(app: AppOpenApi): void {
    registerPublicCommerceRoutes(app);
}
