import type { AppOpenApi } from '../../../platform/env';
import { operatorAccessMiddleware } from '../auth';
import { getInternalApiDescriptionRoute, getInternalApiDiscoveryRoute } from '../stock/internal-contracts';
import { apiLink, jsonNoStore } from '../../../platform/interfaces/http/responses';
import { registerInternalOrderRoutes } from '../../../application/commerce/orders/register-internal-order-routes';
import { registerInternalPriceRoutes } from './register-internal-price-routes';
import { registerInternalSetupRoutes } from './register-internal-setup-routes';
import { registerInternalPublicationRoutes } from './register-internal-publication-routes';
import { registerInternalWithdrawalRoutes } from './register-withdrawal-routes';
import { registerInternalStockRoutes } from '../stock/register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi, getInternalOpenApiDocument: () => object): void {
  app.use('/api/internal/*', operatorAccessMiddleware());
  const internalDiscoveryLinks = [
    apiLink({ href: '/api/internal/', rel: 'self' }),
    apiLink({ href: '/api/internal/openapi.json', rel: 'service-desc' }),
    apiLink({ href: '/api/internal/inventory', rel: 'inventory' }),
    apiLink({ href: '/api/internal/variants', rel: 'variants' }),
    apiLink({ href: '/api/internal/orders', rel: 'orders' }),
    apiLink({ href: '/api/internal/order-withdrawals', rel: 'order-withdrawals' }),
  ];

  app.openapi(getInternalApiDiscoveryRoute, (context) =>
    jsonNoStore(context.json({ links: internalDiscoveryLinks }, 200)),
  );
  app.openapi(getInternalApiDescriptionRoute, (context) =>
    jsonNoStore(context.json(getInternalOpenApiDocument() as Record<string, unknown>, 200)),
  );

  registerInternalOrderRoutes(app);
  registerInternalWithdrawalRoutes(app);
  registerInternalStockRoutes(app);
  registerInternalPriceRoutes(app);
  registerInternalSetupRoutes(app);
  registerInternalPublicationRoutes(app);
}
