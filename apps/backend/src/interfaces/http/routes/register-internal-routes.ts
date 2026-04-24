import type { AppOpenApi } from '../../../env';
import { registerInternalStockRoutes } from './register-internal-stock-routes';
import { registerInternalStockUiRoutes } from './register-internal-stock-ui-routes';

export function registerInternalRoutes(app: AppOpenApi): void {
    registerInternalStockRoutes(app);
    registerInternalStockUiRoutes(app);
}
