import { describe, expect, it, vi } from 'vitest';

import { readStoreListingPrices } from '../../../../src/application/commerce/readers';
import type { StoreOfferListingPriceSnapshotRecord } from '../../../../src/domain/commerce/repositories/spi';
import { storeItemSlug } from '../../../support/commerce-value-objects';

const now = new Date('2026-07-16T12:00:00.000Z');

function snapshot(overrides: Partial<StoreOfferListingPriceSnapshotRecord> = {}): StoreOfferListingPriceSnapshotRecord {
  return {
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
  it('formats fresh active snapshots without provider reconciliation', async () => {
    const snapshots = {
      listForListingPricePresentation: vi.fn(async () => [snapshot()]),
    };

    await expect(readStoreListingPrices(snapshots, now)).resolves.toEqual([
      {
        displayPrice: '€28.00',
        presentationState: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
    expect(snapshots.listForListingPricePresentation).toHaveBeenCalledOnce();
  });

  it.each([
    ['missing amount', { amountMinor: null }],
    ['stale snapshot', { freshUntil: now }],
    ['inactive price', { priceActive: false }],
    ['inactive product', { productActive: false }],
  ])('returns an explicit non-price state for %s', async (_case, overrides) => {
    await expect(
      readStoreListingPrices({ listForListingPricePresentation: async () => [snapshot(overrides)] }, now),
    ).resolves.toEqual([
      {
        presentationState: 'unavailable',
        storeItemSlug: 'disintegration-black-vinyl-lp',
      },
    ]);
  });

  it('returns no guessed record when no snapshot exists', async () => {
    await expect(readStoreListingPrices({ listForListingPricePresentation: async () => [] }, now)).resolves.toEqual([]);
  });
});
