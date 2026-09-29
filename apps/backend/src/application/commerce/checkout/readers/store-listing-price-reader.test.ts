import { describe, expect, it, vi } from 'vitest';

import { readStoreListingPrices } from './';
import type { StoreOfferListingPriceSnapshotRecord } from '../../../../domain/commerce/repositories/spi';
import { createStockQuantity } from '../../../../domain/commerce';
import { storeItemSlug } from '../../../../../test/support/commerce-value-objects';

function snapshot(overrides: Partial<StoreOfferListingPriceSnapshotRecord> = {}): StoreOfferListingPriceSnapshotRecord {
  return {
    availability: { status: 'available', canBuy: true },
    stock: { onlineQuantity: createStockQuantity(3), restockPlanned: false },
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
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
  });

  it('returns no guessed record when no snapshot exists', async () => {
    await expect(readStoreListingPrices({ listForListingPricePresentation: async () => [] })).resolves.toEqual([]);
  });

  it.each([
    ['stocked', 'available', true, 2, false, 'stocked'],
    ['depleted', 'available', true, 0, false, 'sold_out'],
    ['restocking', 'sold_out', false, 0, true, 'out_of_stock'],
    ['restock with stock', 'available', true, 2, true, 'stocked'],
    ['paused and depleted', 'available', false, 0, false, 'unavailable'],
    ['paused with stock', 'available', false, 2, true, 'unavailable'],
    ['non-buyable with stock', 'sold_out', false, 2, false, 'unavailable'],
    ['missing availability', null, false, 0, false, 'unavailable'],
    ['missing stock', 'available', true, null, false, 'unavailable'],
  ] as const)(
    'classifies %s without discarding a valid price',
    async (_case, status, canBuy, quantity, restockPlanned, expected) => {
      const [record] = await readStoreListingPrices({
        listForListingPricePresentation: async () => [
          snapshot({
            availability: status === null ? null : { status, canBuy },
            stock: quantity === null ? null : { onlineQuantity: createStockQuantity(quantity), restockPlanned },
          }),
        ],
      });
      expect(record).toEqual({
        availabilityState: expected,
        displayPrice: '€28.00',
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      });
    },
  );
});
