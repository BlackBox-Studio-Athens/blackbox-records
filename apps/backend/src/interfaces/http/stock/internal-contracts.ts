import { createRoute, z } from '@hono/zod-openapi';

import { hypermediaLinkSchema, operatorAccessErrorResponses } from '../../../platform/interfaces/http/responses';

const internalApiDiscoverySchema = z
  .object({ links: z.array(hypermediaLinkSchema).min(1) })
  .strict()
  .openapi('InternalApiDiscovery');

const internalApiDescriptionSchema = z.record(z.string(), z.unknown()).openapi('InternalApiDescription');

export const getInternalApiDiscoveryRoute = createRoute({
  method: 'get',
  path: '/api/internal/',
  operationId: 'getInternalApiDiscovery',
  responses: {
    200: {
      content: { 'application/json': { schema: internalApiDiscoverySchema } },
      description: 'Protected operator API navigation and description links.',
    },
    ...operatorAccessErrorResponses,
  },
  tags: ['Discovery'],
});

export const getInternalApiDescriptionRoute = createRoute({
  method: 'get',
  path: '/api/internal/openapi.json',
  operationId: 'getInternalApiDescription',
  responses: {
    200: {
      content: { 'application/json': { schema: internalApiDescriptionSchema } },
      description: 'Protected internal OpenAPI 3.1 description.',
    },
    ...operatorAccessErrorResponses,
  },
  tags: ['Discovery'],
});

const internalContractModules = [
  [getInternalApiDiscoveryRoute.path, getInternalApiDescriptionRoute.path],
  [
    '/api/internal/orders/search',
    '/api/internal/orders',
    '/api/internal/orders/checkout-sessions/{checkoutSessionId}',
    '/api/internal/order-withdrawals',
  ],
  ['/api/internal/analytics', '/api/internal/store-stats', '/api/internal/search-stats'],
  [
    '/api/internal/inventory',
    '/api/internal/variants',
    '/api/internal/variants/{variantId}/stock',
    '/api/internal/variants/{variantId}/stock/zero-stock-state',
    '/api/internal/variants/{variantId}/stock/low-stock-notice',
    '/api/internal/variants/{variantId}/stock/preorder',
    '/api/internal/variants/{variantId}/stock/history',
    '/api/internal/variants/{variantId}/stock/changes',
    '/api/internal/variants/{variantId}/stock/counts',
  ],
  [
    '/api/internal/variants/{variantId}/selling',
    '/api/internal/variants/{variantId}/price/initialize',
    '/api/internal/variants/{variantId}/price',
    '/api/internal/items/setup',
    '/api/internal/variants/{variantId}/publication',
  ],
] as const;

export const internalContractPaths = internalContractModules.flat();
