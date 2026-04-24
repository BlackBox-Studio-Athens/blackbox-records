import type { AppOpenApi } from '../../../env';
import { registerInternalStockRoutes } from './register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi): void {
    registerInternalStockRoutes(app);
}
