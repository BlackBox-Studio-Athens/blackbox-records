import { publishedContext } from './published-reader';
import type { HomeOffer } from './public-preorder-projection';

// Replaces the web open-preorders reader in the public renderer: pages render the projection commerce last pushed.
export function readOpenPreorders() {
  return publishedContext.getStore()?.preorders?.items ?? [];
}

export function readHomeOffers(): HomeOffer[] {
  return publishedContext.getStore()?.preorders?.homeOffers ?? [];
}
