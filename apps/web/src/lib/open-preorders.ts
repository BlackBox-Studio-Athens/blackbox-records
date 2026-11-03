import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ShipEstimate } from '@/platform/lib/preorder-estimate';

export type OpenPreorder = { storeItemSlug: string; displayPrice: string; shipEstimate: ShipEstimate | null };
export type HomeOffer = { storeItemSlug: string; availability: 'stocked' | 'sold_out'; displayPrice: string | null };

// The hosted renderer swaps this module for the projection commerce pushes to it. Static builds and astro dev read
// the JSON file named by BLACKBOX_PREORDER_PROJECTION, and otherwise claim no open pre-orders.
function readProjection(): { items: OpenPreorder[]; homeOffers?: HomeOffer[] } {
  const file = process.env.BLACKBOX_PREORDER_PROJECTION;
  return file ? JSON.parse(readFileSync(resolve(file), 'utf8')) : { items: [] };
}

export function readOpenPreorders(): OpenPreorder[] {
  return readProjection().items;
}

export function readHomeOffers(): HomeOffer[] {
  return readProjection().homeOffers ?? [];
}
