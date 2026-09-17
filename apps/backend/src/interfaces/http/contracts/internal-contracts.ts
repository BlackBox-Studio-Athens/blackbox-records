const internalContractModules = [
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
      '/api/internal/variants/{variantId}/stock/history',
      '/api/internal/variants/{variantId}/stock/changes',
      '/api/internal/variants/{variantId}/stock/counts',
    ],
  },
  {
    name: 'internal-catalog',
    paths: [
      '/api/internal/variants/{variantId}/price',
      '/api/internal/items/setup',
      '/api/internal/variants/{variantId}/publication',
    ],
  },
] as const;

export const internalContractPaths = internalContractModules.flatMap((contractModule) => contractModule.paths);
