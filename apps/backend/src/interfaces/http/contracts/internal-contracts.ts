const internalContractModules = [
  {
    name: 'internal-orders',
    paths: ['/api/internal/orders', '/api/internal/orders/checkout-sessions/{checkoutSessionId}'],
  },
  {
    name: 'internal-stock',
    paths: [
      '/api/internal/variants',
      '/api/internal/variants/{variantId}/stock',
      '/api/internal/variants/{variantId}/stock/history',
      '/api/internal/variants/{variantId}/stock/changes',
      '/api/internal/variants/{variantId}/stock/counts',
    ],
  },
  { name: 'internal-catalog', paths: ['/api/internal/variants/{variantId}/price', '/api/internal/items/setup'] },
] as const;

export const internalContractPaths = internalContractModules.flatMap((contractModule) => contractModule.paths);
