import { describe, expect, it, vi } from 'vitest';

import { readStoreListingPrices } from './';
import type { StoreOfferListingPriceSnapshotRecord } from '../../../../domain/commerce/repositories/spi';
import { createStockQuantity, type PreorderShipEstimate } from '../../../../domain/commerce';
import { storeItemSlug } from '../../../../../test/support/commerce-value-objects';

function snapshot(overrides: Partial<StoreOfferListingPriceSnapshotRecord> = {}): StoreOfferListingPriceSnapshotRecord {
  return {
    availability: { status: 'available', canBuy: true },
    stock: {
      onlineQuantity: createStockQuantity(3),
      zeroStockState: 'sold_out',
      expectedMonth: null,
      showLowStock: false,
      preorder: null,
    },
    amountMinor: 2800,
    currencyCode: 'EUR',
    freshUntil: new Date('2026-07-16T13:00:00.000Z'),
    priceActive: true,
    productActive: true,
    storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
    ...overrides,
  };
}

describe('Store listing-price reader', () => {
  it('formats old active fixed-price snapshots without provider reconciliation', async () => {
    const snapshots = {
      listForListingPricePresentation: vi.fn(async () => [
        snapshot({ freshUntil: new Date('2020-01-01T00:00:00.000Z') }),
      ]),
    };

    await expect(readStoreListingPrices(snapshots)).resolves.toEqual([
      {
        availabilityState: 'stocked',
        displayPrice: '€28.00',
        preorder: null,
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
    expect(snapshots.listForListingPricePresentation).toHaveBeenCalledOnce();
  });

  it('presents valid null-amount snapshots as pay what you want', async () => {
    await expect(
      readStoreListingPrices({ listForListingPricePresentation: async () => [snapshot({ amountMinor: null })] }),
    ).resolves.toEqual([
      {
        availabilityState: 'stocked',
        displayPrice: 'Pay what you want',
        preorder: null,
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
  });

  it.each([
    ['negative amount', { amountMinor: -1 }],
    ['malformed currency', { currencyCode: 'EU' }],
    ['inactive price', { priceActive: false }],
    ['inactive product', { productActive: false }],
  ])('returns an explicit non-price state for %s', async (_case, overrides) => {
    await expect(
      readStoreListingPrices({ listForListingPricePresentation: async () => [snapshot(overrides)] }),
    ).resolves.toEqual([
      {
        availabilityState: 'stocked',
        presentationState: 'unavailable',
        preorder: null,
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
  });

  it('returns no guessed record when no snapshot exists', async () => {
    await expect(readStoreListingPrices({ listForListingPricePresentation: async () => [] })).resolves.toEqual([]);
  });

  it.each([
    ['stocked', 'available', true, 2, 'sold_out', 'stocked'],
    ['depleted', 'available', true, 0, 'sold_out', 'sold_out'],
    ['first pressing on the way', 'sold_out', false, 0, 'coming_soon', 'coming_soon'],
    ['repress on the way', 'available', true, 0, 'repressing', 'repressing'],
    ['Coming Soon with stock', 'available', true, 2, 'coming_soon', 'stocked'],
    ['paused and depleted', 'available', false, 0, 'coming_soon', 'unavailable'],
    ['paused with stock', 'available', false, 2, 'repressing', 'unavailable'],
    ['non-buyable with stock', 'sold_out', false, 2, 'sold_out', 'unavailable'],
    ['missing availability', null, false, 0, 'coming_soon', 'unavailable'],
    ['missing stock as zero stock', 'available', true, null, 'sold_out', 'sold_out'],
  ] as const)(
    'classifies %s without discarding a valid price',
    async (_case, status, canBuy, quantity, zeroStockState, expected) => {
      const [record] = await readStoreListingPrices({
        listForListingPricePresentation: async () => [
          snapshot({
            availability: status === null ? null : { status, canBuy },
            stock:
              quantity === null
                ? null
                : {
                    onlineQuantity: createStockQuantity(quantity),
                    zeroStockState,
                    expectedMonth: '2099-01',
                    showLowStock: false,
                    preorder: null,
                  },
          }),
        ],
      });
      expect(record).toEqual({
        availabilityState: expected,
        ...(expected === 'coming_soon' || expected === 'repressing' ? { expectedMonth: '2099-01' } : {}),
        preorder: null,
        displayPrice: '€28.00',
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      });
    },
  );

  it.each([
    ['notice off', false, 3, 'stocked', undefined],
    ['notice on with three left', true, 3, 'stocked', 3],
    ['notice on at the threshold', true, 5, 'stocked', 5],
    ['notice on with one left', true, 1, 'stocked', 1],
    ['notice on above the threshold', true, 6, 'stocked', undefined],
    ['notice on when sold out', true, 0, 'sold_out', undefined],
  ] as const)('exposes copies left only when %s qualifies', async (_case, showLowStock, quantity, state, expected) => {
    const [record] = await readStoreListingPrices({
      listForListingPricePresentation: async () => [
        snapshot({
          stock: {
            onlineQuantity: createStockQuantity(quantity),
            zeroStockState: 'sold_out',
            expectedMonth: null,
            showLowStock,
            preorder: null,
          },
        }),
      ],
    });

    expect(record).toEqual({
      availabilityState: state,
      preorder: null,
      displayPrice: '€28.00',
      ...(expected === undefined ? {} : { lowStockQuantity: expected }),
      presentationState: 'ready',
      storeItemSlug: 'disintegration-black-vinyl-lp',
    });
  });

  it('omits copies left when the price is not presentable', async () => {
    const [record] = await readStoreListingPrices({
      listForListingPricePresentation: async () => [
        snapshot({
          priceActive: false,
          stock: {
            onlineQuantity: createStockQuantity(2),
            zeroStockState: 'sold_out',
            expectedMonth: null,
            showLowStock: true,
            preorder: null,
          },
        }),
      ],
    });

    expect(record).not.toHaveProperty('lowStockQuantity');
  });

  it.each<{
    name: string;
    estimate: PreorderShipEstimate;
    quantity: number;
    priceActive: boolean;
    expected: { shipEstimate: PreorderShipEstimate | null } | null;
  }>([
    {
      name: 'stocked with copies left',
      estimate: { kind: 'month', month: '2026-10', part: 'late' },
      quantity: 2,
      priceActive: true,
      expected: { shipEstimate: { kind: 'month', month: '2026-10', part: 'late' } },
    },
    {
      name: 'depleted, so closed for shoppers',
      estimate: { kind: 'date', date: '2026-10-04' },
      quantity: 0,
      priceActive: true,
      expected: null,
    },
    {
      name: 'withheld and unpriced',
      estimate: { kind: 'month', month: '2026-09', part: null },
      quantity: 2,
      priceActive: false,
      expected: { shipEstimate: null },
    },
    {
      name: 'date reached in Athens',
      estimate: { kind: 'date', date: '2026-10-03' },
      quantity: 2,
      priceActive: true,
      expected: null,
    },
    {
      name: 'past date',
      estimate: { kind: 'date', date: '2026-10-01' },
      quantity: 2,
      priceActive: true,
      expected: null,
    },
  ])(
    'projects $name independently of price and availability in full and narrowed reads',
    async ({ estimate, quantity, priceActive, expected }) => {
      const snapshots = {
        listForListingPricePresentation: vi.fn(async () => [
          snapshot({
            priceActive,
            stock: {
              onlineQuantity: createStockQuantity(quantity),
              zeroStockState: 'sold_out',
              expectedMonth: null,
              showLowStock: true,
              preorder: { startedAt: '2026-09-01T10:00:00.000Z', shipEstimate: estimate },
            },
          }),
        ]),
      };
      const now = new Date('2026-10-02T21:01:00Z');
      const records = await readStoreListingPrices(snapshots, undefined, now);
      expect(snapshots.listForListingPricePresentation).toHaveBeenCalledOnce();
      expect(records[0]).toEqual({
        storeItemSlug: 'disintegration-black-vinyl-lp',
        availabilityState: quantity === 0 ? 'sold_out' : 'stocked',
        presentationState: priceActive ? 'ready' : 'unavailable',
        ...(priceActive ? { displayPrice: '€28.00', ...(quantity ? { lowStockQuantity: quantity } : {}) } : {}),
        preorder: expected,
      });
      expect(JSON.stringify(records)).not.toMatch(/startedAt|onlineQuantity|zeroStockState/);
      snapshots.listForListingPricePresentation.mockClear();
      expect(await readStoreListingPrices(snapshots, 'preorders', now)).toEqual(expected ? records : []);
      expect(snapshots.listForListingPricePresentation).toHaveBeenCalledExactlyOnceWith('preorders');
    },
  );

  it.each([
    ['an unpriced Coming Soon record', false, 'coming_soon', '2026-11', '2026-11'],
    ['a ready Repressing record', true, 'repressing', '2026-11', '2026-11'],
    ['a month passed in Athens', true, 'coming_soon', '2026-10', undefined],
    ['a Sold Out record', true, 'sold_out', '2026-11', undefined],
  ] as const)('carries the expected month for %s', async (_case, priceActive, zeroStockState, month, expected) => {
    const [record] = await readStoreListingPrices(
      {
        listForListingPricePresentation: async () => [
          snapshot({
            priceActive,
            stock: {
              onlineQuantity: createStockQuantity(0),
              zeroStockState,
              expectedMonth: month,
              showLowStock: true,
              preorder: null,
            },
          }),
        ],
      },
      undefined,
      new Date('2026-10-31T22:30:00Z'),
    );

    expect(record?.availabilityState).toBe(zeroStockState);
    expect(record?.expectedMonth).toBe(expected);
    // Only the reported state and month leave the Worker: never the choice key, quantities or alert counts.
    expect(Object.keys(record ?? {}).sort()).toEqual(
      [
        'availabilityState',
        'preorder',
        'presentationState',
        'storeItemSlug',
        ...(priceActive ? ['displayPrice'] : []),
        ...(expected ? ['expectedMonth'] : []),
      ].sort(),
    );
  });

  it('excludes ordinary stock and missing stock from the narrowed read', async () => {
    const snapshots = { listForListingPricePresentation: vi.fn(async () => [snapshot(), snapshot({ stock: null })]) };
    const records = await readStoreListingPrices(snapshots);
    expect(records.map((record) => record.preorder)).toEqual([null, null]);
    snapshots.listForListingPricePresentation.mockClear();
    expect(await readStoreListingPrices(snapshots, 'preorders')).toEqual([]);
    expect(snapshots.listForListingPricePresentation).toHaveBeenCalledExactlyOnceWith('preorders');
  });
});
