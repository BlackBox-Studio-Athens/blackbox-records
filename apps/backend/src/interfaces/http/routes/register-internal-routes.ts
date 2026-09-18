import type { AppOpenApi } from '../../../env';
import { operatorAccessMiddleware } from '../auth';
import { getInternalApiDescriptionRoute, getInternalApiDiscoveryRoute } from '../contracts/internal-contracts';
import { apiLink, jsonNoStore } from '../responses';
import { registerInternalOrderRoutes } from './register-internal-order-routes';
import { registerInternalPriceRoutes } from './register-internal-price-routes';
import { registerInternalSetupRoutes } from './register-internal-setup-routes';
import { registerInternalPublicationRoutes } from './register-internal-publication-routes';
import { registerInternalStockRoutes } from './register-internal-stock-routes';

export function registerInternalRoutes(app: AppOpenApi, getInternalOpenApiDocument: () => object): void {
  app.use('/api/internal/*', operatorAccessMiddleware());
  const internalDiscoveryLinks = [
    apiLink({ href: '/api/internal/', rel: 'self' }),
    apiLink({ href: '/api/internal/openapi.json', rel: 'service-desc' }),
    apiLink({ href: '/api/internal/inventory', rel: 'inventory' }),
    apiLink({ href: '/api/internal/variants', rel: 'variants' }),
    apiLink({ href: '/api/internal/orders', rel: 'orders' }),
  ];

  app.openapi(getInternalApiDiscoveryRoute, (context) =>
    jsonNoStore(context.json({ links: internalDiscoveryLinks }, 200)),
  );
  app.openapi(getInternalApiDescriptionRoute, (context) =>
    jsonNoStore(context.json(getInternalOpenApiDocument() as Record<string, unknown>, 200)),
  );

  registerInternalOrderRoutes(app);
  registerInternalStockRoutes(app);
  registerInternalPriceRoutes(app);
  registerInternalSetupRoutes(app);
  registerInternalPublicationRoutes(app);
}
