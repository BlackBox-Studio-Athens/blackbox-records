import type { AppOpenApi } from '../../../env';
import { operatorAccessMiddleware } from '../auth';
import { registerInternalOrderRoutes } from './register-internal-order-routes';
import { registerInternalStockRoutes } from './register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi): void {
  app.use('/api/internal/*', operatorAccessMiddleware());
  registerInternalOrderRoutes(app);
  registerInternalStockRoutes(app);
}
