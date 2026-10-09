import { Fetcher } from 'openapi-typescript-fetch';

export const deliveryCharges = { small: 250, medium: 350 };
export const deliveryQuantityBands = Object.freeze([
  { maxUnits: 4, amountMinor: 300 },
  { maxUnits: 8, amountMinor: 600 },
  { maxUnits: null, amountMinor: 1000 },
]);
export const priceDisclosure = 'Shipping calculated in your cart. The complete total is shown before payment.';
export type TaxCollectionMode = 'STRIPE_AUTOMATIC_TAX' | 'NO_TAX_COLLECTED';
export function taxCollectionDisclosure(mode: TaxCollectionMode): string {
  return mode === 'NO_TAX_COLLECTED'
    ? 'No VAT is calculated or collected at checkout.'
    : 'VAT is included, never added again.';
}

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
