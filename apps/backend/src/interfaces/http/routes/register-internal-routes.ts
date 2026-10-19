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
import { registerInternalAnalyticsRoutes } from './register-internal-analytics-routes';
import { registerInternalStoreStatsRoutes } from './register-internal-store-stats-routes';
import { registerInternalSearchStatsRoutes } from './register-internal-search-stats-routes';
import { schedulePreorderProjectionPush } from './preorder-projection-push';
import { registerInternalStatsRoutes } from './register-internal-stats-routes';

export function registerInternalRoutes(app: AppOpenApi, getInternalOpenApiDocument: () => object): void {
  app.use('/api/internal/*', operatorAccessMiddleware());
  // Stock, pre-order and price writes can change the open pre-orders that public pages render.
  app.use('/api/internal/variants/*', async (context, next) => {
    await next();
    if (!['GET', 'HEAD'].includes(context.req.method) && context.res.ok) schedulePreorderProjectionPush(context);
  });
  const internalDiscoveryLinks = [
    apiLink({ href: '/api/internal/', rel: 'self' }),
    apiLink({ href: '/api/internal/openapi.json', rel: 'service-desc' }),
    apiLink({ href: '/api/internal/inventory', rel: 'inventory' }),
    apiLink({ href: '/api/internal/variants', rel: 'variants' }),
    apiLink({ href: '/api/internal/orders', rel: 'orders' }),
    apiLink({ href: '/api/internal/analytics', rel: 'analytics' }),
    apiLink({ href: '/api/internal/store-stats', rel: 'store-stats' }),
    apiLink({ href: '/api/internal/search-stats', rel: 'search-stats' }),
    apiLink({ href: '/api/internal/stats', rel: 'stats' }),
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
  registerInternalAnalyticsRoutes(app);
  registerInternalStoreStatsRoutes(app);
  registerInternalSearchStatsRoutes(app);
  registerInternalStatsRoutes(app);
  registerInternalStockRoutes(app);
  registerInternalPriceRoutes(app);
  registerInternalSetupRoutes(app);
  registerInternalPublicationRoutes(app);
}
