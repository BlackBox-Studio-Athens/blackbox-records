import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ShipEstimate } from '@/platform/lib/preorder-estimate';

export type OpenPreorder = { storeItemSlug: string; displayPrice: string; shipEstimate: ShipEstimate | null };

// The hosted renderer swaps this module for the projection commerce pushes to it. Static builds and astro dev read
// the JSON file named by BLACKBOX_PREORDER_PROJECTION, and otherwise claim no open pre-orders.
export function readOpenPreorders(): OpenPreorder[] {
  const file = process.env.BLACKBOX_PREORDER_PROJECTION;
  if (!file) return [];
  return (JSON.parse(readFileSync(resolve(file), 'utf8')) as { items: OpenPreorder[] }).items;
}
