import { describe, expect, it } from 'vitest';

import { deriveOpenPreorderProjection } from './';
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
    sourceKind: 'release',
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
  deriveOpenPreorderProjection(snapshots, now);

function released(slug: string, quantity = 3, overrides: Partial<StoreOfferListingPriceSnapshotRecord> = {}) {
  const record = snapshot(slug, { quantity, ...overrides });
  return { ...record, stock: { ...record.stock!, preorder: null } };
}

describe('open pre-order projection', () => {
  it('lists ready stocked pre-orders by slug with price and estimate, and withholds a passed month', async () => {
    const { projection } = await project([
      snapshot('sidus-vinyl', { shipEstimate: { kind: 'date', date: '2026-12-04' } }),
      snapshot('afterwise-vinyl', { amountMinor: 3150, shipEstimate: { kind: 'month', month: '2026-09', part: null } }),
    ]);

    expect(projection).toEqual({
      homeOffers: [],
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
        '{"storeItemSlug":"b-vinyl","displayPrice":"€28.00","shipEstimate":{"kind":"month","month":"2026-11","part":"early"}}],"homeOffers":[]}',
    );
  });

  it('lists only released label offers with Store listing prices, in slug order', async () => {
    const { projection } = await project([
      released('z-stocked'),
      released('b-sold-out', 0),
      released('a-flexible', 2, { amountMinor: null }),
      released('distro', 2, { sourceKind: 'distro' }),
      snapshot('open-preorder'),
    ]);
    expect(projection.homeOffers).toEqual([
      { storeItemSlug: 'a-flexible', availability: 'stocked', displayPrice: 'Pay what you want' },
      { storeItemSlug: 'b-sold-out', availability: 'sold_out', displayPrice: '€28.00' },
      { storeItemSlug: 'z-stocked', availability: 'stocked', displayPrice: '€28.00' },
    ]);
    expect(projection.items.map((item) => item.storeItemSlug)).toEqual(['open-preorder']);
  });

  it('presents a staff-open pre-order with no copies as a sold-out Home offer', async () => {
    const { projection } = await project([snapshot('depleted-preorder', { quantity: 0 })]);
    expect(projection.items).toEqual([]);
    expect(projection.homeOffers).toEqual([
      { storeItemSlug: 'depleted-preorder', availability: 'sold_out', displayPrice: '€28.00' },
    ]);
  });

  it.each([
    ['paused', { availability: { status: 'available', canBuy: false } }],
    ['missing availability', { availability: null }],
    ['not ready', { priceActive: false }],
    ['inactive product', { productActive: false }],
    ['Coming Soon', { stock: { ...released('unused', 0).stock, zeroStockState: 'coming_soon' } }],
    ['Repressing', { stock: { ...released('unused', 0).stock, zeroStockState: 'repressing' } }],
  ] as const)('omits a Home offer that is %s', async (_case, overrides) => {
    expect(
      (await project([released('excluded', 0, overrides as Partial<StoreOfferListingPriceSnapshotRecord>)])).projection
        .homeOffers,
    ).toEqual([]);
  });

  it('moves a closed pre-order to Home offers and changes identity only for projected facts', async () => {
    const open = await project([snapshot('afterwise')]);
    const closed = await project([released('afterwise')]);
    expect(closed.projection.items).toEqual([]);
    expect(closed.projection.homeOffers).toEqual([
      { storeItemSlug: 'afterwise', availability: 'stocked', displayPrice: '€28.00' },
    ]);
    expect(closed.identity).not.toBe(open.identity);
    expect((await project([released('afterwise', 2)])).identity).toBe(closed.identity);
    expect((await project([released('afterwise', 0)])).identity).not.toBe(closed.identity);
    expect((await project([released('afterwise', 3, { amountMinor: 3000 })])).identity).not.toBe(closed.identity);
    expect((await project([released('b'), released('a')])).identity).toBe(
      (await project([released('a'), released('b')])).identity,
    );
  });
});
