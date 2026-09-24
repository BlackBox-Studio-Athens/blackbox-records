import { createRoute, z } from '@hono/zod-openapi';

import { hypermediaLinkSchema, operatorAccessErrorResponses } from '../responses';

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
  {
    name: 'internal-discovery',
    paths: [getInternalApiDiscoveryRoute.path, getInternalApiDescriptionRoute.path],
  },
  {
    name: 'internal-orders',
    paths: [
      '/api/internal/orders/search',
      '/api/internal/orders',
      '/api/internal/orders/checkout-sessions/{checkoutSessionId}',
    ],
  },
  {
    name: 'internal-stock',
    paths: [
      '/api/internal/inventory',
      '/api/internal/variants',
      '/api/internal/variants/{variantId}/stock',
      '/api/internal/variants/{variantId}/stock/restock-plan',
      '/api/internal/variants/{variantId}/stock/history',
      '/api/internal/variants/{variantId}/stock/changes',
      '/api/internal/variants/{variantId}/stock/counts',
    ],
  },
  {
    name: 'internal-catalog',
    paths: [
      '/api/internal/variants/{variantId}/selling',
      '/api/internal/variants/{variantId}/price/initialize',
      '/api/internal/variants/{variantId}/price',
      '/api/internal/items/setup',
      '/api/internal/variants/{variantId}/publication',
    ],
  },
] as const;

export const internalContractPaths = internalContractModules.flatMap((contractModule) => contractModule.paths);
