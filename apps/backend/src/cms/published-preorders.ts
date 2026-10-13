import { publishedContext } from './published-reader';

// Replaces the web open-preorders reader in the public renderer: pages render the projection commerce last pushed.
export function readOpenPreorders() {
  return publishedContext.getStore()?.preorders?.items ?? [];
}
