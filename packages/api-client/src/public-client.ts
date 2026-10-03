import { Fetcher } from 'openapi-typescript-fetch';

export const deliveryCharges = { small: 250, medium: 350 };
export const vatDisclosure = 'VAT included. Shipping calculated in your cart.';

import type {
  components as PublicApiComponents,
  operations as PublicApiOperations,
  paths as PublicApiPaths,
} from './generated/public/schema';

export function createPublicApiFetcher(baseUrl: string) {
  const fetcher = Fetcher.for<PublicApiPaths>();

  fetcher.configure({
    baseUrl,
    init: {
      cache: 'no-store',
    },
  });

  return fetcher;
}

export type PublicApiFetcher = ReturnType<typeof createPublicApiFetcher>;
export type { PublicApiComponents, PublicApiOperations, PublicApiPaths };
