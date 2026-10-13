import { describe, expect, it } from 'vitest';

import { deriveOpenPreorderProjection, readStoreListingPrices } from './';
import type { StoreOfferListingPriceSnapshotRecord } from '../../../../domain/commerce/repositories/spi';
import { createStockQuantity, type PreorderShipEstimate } from '../../../../domain/commerce';
import { storeItemSlug } from '../../../../../test/support/commerce-value-objects';

const now = new Date('2026-10-13T09:00:00.000Z');
const month: PreorderShipEstimate = { kind: 'month', month: '2026-11', part: 'early' };

function snapshot(
  slug: string,
  {
    quantity = 3,
    shipEstimate = month as PreorderShipEstimate,
    ...overrides
  } = {} as Partial<StoreOfferListingPriceSnapshotRecord> & { quantity?: number; shipEstimate?: PreorderShipEstimate },
): StoreOfferListingPriceSnapshotRecord {
  return {
    availability: { status: 'available', canBuy: true },
    stock: {
      onlineQuantity: createStockQuantity(quantity),
      zeroStockState: 'sold_out',
      expectedMonth: null,
      showLowStock: false,
      preorder: { shipEstimate, startedAt: '2026-09-01T00:00:00.000Z' },
    },
    amountMinor: 2800,
    currencyCode: 'EUR',
    freshUntil: now,
    priceActive: true,
    productActive: true,
    storeItemSlug: storeItemSlug(slug),
    ...overrides,
  };
}

const project = async (snapshots: StoreOfferListingPriceSnapshotRecord[]) =>
  deriveOpenPreorderProjection(
    await readStoreListingPrices({ listForListingPricePresentation: async () => snapshots }, 'preorders', now),
  );

describe('open pre-order projection', () => {
  it('lists ready stocked pre-orders by slug with price and estimate, and withholds a passed month', async () => {
    const { projection } = await project([
      snapshot('sidus-vinyl', { shipEstimate: { kind: 'date', date: '2026-12-04' } }),
      snapshot('afterwise-vinyl', { amountMinor: 3150, shipEstimate: { kind: 'month', month: '2026-09', part: null } }),
    ]);

    expect(projection).toEqual({
      items: [
        { storeItemSlug: 'afterwise-vinyl', displayPrice: '€31.50', shipEstimate: null },
        { storeItemSlug: 'sidus-vinyl', displayPrice: '€28.00', shipEstimate: { kind: 'date', date: '2026-12-04' } },
      ],
    });
  });

  it.each([
    ['paused', { availability: { status: 'paused', canBuy: false } }],
    ['not buyable', { availability: { status: 'available', canBuy: false } }],
    ['inactive price', { priceActive: false }],
    ['sold out', { quantity: 0 }],
    ['an exact date that arrived', { shipEstimate: { kind: 'date', date: '2026-10-13' } }],
  ] as const)('omits a pre-order that is %s', async (_case, overrides) => {
    const { projection } = await project([snapshot('sidus-vinyl', overrides as never)]);
    expect(projection.items).toEqual([]);
  });

  it('derives a stable identity from canonical JSON, independent of input order', async () => {
    const first = await project([snapshot('b-vinyl'), snapshot('a-vinyl')]);
    const second = await project([snapshot('a-vinyl'), snapshot('b-vinyl')]);
    const empty = await project([]);

    expect(first.identity).toMatch(/^[0-9a-f]{64}$/);
    expect(second.identity).toBe(first.identity);
    expect(empty.identity).not.toBe(first.identity);
    // The canonical form is part of the renderer contract; changing it re-renders every published page.
    expect(JSON.stringify(first.projection)).toBe(
      '{"items":[{"storeItemSlug":"a-vinyl","displayPrice":"€28.00","shipEstimate":{"kind":"month","month":"2026-11","part":"early"}},' +
        '{"storeItemSlug":"b-vinyl","displayPrice":"€28.00","shipEstimate":{"kind":"month","month":"2026-11","part":"early"}}]}',
    );
  });
});
