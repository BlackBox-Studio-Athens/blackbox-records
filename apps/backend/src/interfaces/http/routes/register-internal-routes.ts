import type { AppOpenApi } from '../../../env';
import { registerInternalOrderRoutes } from './register-internal-order-routes';
import { registerInternalStockRoutes } from './register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi): void {
  registerInternalOrderRoutes(app);
  registerInternalStockRoutes(app);
}
