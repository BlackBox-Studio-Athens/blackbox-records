import type { AppOpenApi } from '../../../env';
import { operatorAccessMiddleware } from '../auth';
import { registerInternalOrderRoutes } from './register-internal-order-routes';
import { registerInternalPriceRoutes } from './register-internal-price-routes';
import { registerInternalSetupRoutes } from './register-internal-setup-routes';
import { registerInternalPublicationRoutes } from './register-internal-publication-routes';
import { registerInternalStockRoutes } from './register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi): void {
  app.use('/api/internal/*', operatorAccessMiddleware());
  registerInternalOrderRoutes(app);
  registerInternalStockRoutes(app);
  registerInternalPriceRoutes(app);
  registerInternalSetupRoutes(app);
  registerInternalPublicationRoutes(app);
}
