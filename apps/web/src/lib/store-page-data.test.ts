import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStorePageStaticPaths, getStorePageEntryBySlug } from './store-page-data';

const mockCatalogData = vi.hoisted(() => ({
  getStoreItemBySlug: vi.fn(),
  listStoreItems: vi.fn(),
}));

const mockItemAvailability = vi.hoisted(() => ({
  getPrimaryAvailabilityForStoreItem: vi.fn(),
}));

vi.mock('./catalog-data', () => ({
  getStoreItemBySlug: mockCatalogData.getStoreItemBySlug,
  listStoreItems: mockCatalogData.listStoreItems,
}));

vi.mock('./item-availability', () => ({
  getPrimaryAvailabilityForStoreItem: mockItemAvailability.getPrimaryAvailabilityForStoreItem,
}));

describe('store page data helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a store page entry for a known slug', async () => {
    mockCatalogData.getStoreItemBySlug.mockResolvedValue({
      slug: 'disintegration-black-vinyl-lp',
      sourceKind: 'release',
      sourceId: 'barren-point',
      title: 'Disintegration',
      subtitle: 'Afterwise',
      summary: 'BlackBox release.',
      image: '/cover.jpg',
      imageAlt: 'Disintegration cover',
      eyebrow: 'Release',
      metadata: ['2024', 'LP'],
      storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
      checkoutPath: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
    });

    mockItemAvailability.getPrimaryAvailabilityForStoreItem.mockResolvedValue({
      variantId: 'variant_barren-point_standard',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      optionLabel: 'Black Vinyl LP',
      price: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        display: 'EUR 28.00',
      },
      availability: {
        status: 'available',
        label: 'Available',
      },
      canBuy: true,
    });

    await expect(getStorePageEntryBySlug('disintegration-black-vinyl-lp')).resolves.toMatchObject({
      storeItem: {
        slug: 'disintegration-black-vinyl-lp',
        storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
        checkoutPath: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      },
      primaryAvailability: {
        variantId: 'variant_barren-point_standard',
        canBuy: true,
      },
    });
  });

  it('returns null for an unknown slug', async () => {
    mockCatalogData.getStoreItemBySlug.mockResolvedValue(null);

    await expect(getStorePageEntryBySlug('unknown-slug')).resolves.toBeNull();
    expect(mockItemAvailability.getPrimaryAvailabilityForStoreItem).not.toHaveBeenCalled();
  });

  it('creates static paths for every store item with matching checkout links', async () => {
    mockCatalogData.listStoreItems.mockResolvedValue([
      {
        slug: 'disintegration-black-vinyl-lp',
        sourceKind: 'release',
        sourceId: 'barren-point',
        title: 'Disintegration',
        subtitle: 'Afterwise',
        summary: 'BlackBox release.',
        image: '/cover.jpg',
        imageAlt: 'Disintegration cover',
        eyebrow: 'Release',
        metadata: ['2024', 'LP'],
        storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
        checkoutPath: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      },
      {
        slug: 'afterglow-tape',
        sourceKind: 'distro',
        sourceId: 'afterglow-tape',
        title: 'Afterglow Tape',
        subtitle: 'Various Artists',
        summary: 'Distributed release.',
        image: '/afterglow.jpg',
        imageAlt: 'Afterglow Tape cover',
        eyebrow: 'Distro',
        metadata: ['Cassette'],
        storePath: '/blackbox-records/store/afterglow-tape/',
        checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
      },
    ]);

    mockItemAvailability.getPrimaryAvailabilityForStoreItem
      .mockResolvedValueOnce({
        variantId: 'variant_barren-point_standard',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        optionLabel: 'Black Vinyl LP',
        price: { amountMinor: 2800, currencyCode: 'EUR', display: 'EUR 28.00' },
        availability: { status: 'available', label: 'Available' },
        canBuy: true,
      })
      .mockResolvedValueOnce({
        variantId: 'variant_afterglow-tape_standard',
        storeItemSlug: 'afterglow-tape',
        optionLabel: 'Cassette',
        price: { amountMinor: 1400, currencyCode: 'EUR', display: 'EUR 14.00' },
        availability: { status: 'sold_out', label: 'Sold Out' },
        canBuy: false,
      });

    await expect(createStorePageStaticPaths()).resolves.toEqual([
      {
        params: { slug: 'disintegration-black-vinyl-lp' },
        props: {
          entry: {
            storeItem: expect.objectContaining({
              slug: 'disintegration-black-vinyl-lp',
              checkoutPath: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
            }),
            primaryAvailability: expect.objectContaining({
              storeItemSlug: 'disintegration-black-vinyl-lp',
            }),
          },
        },
      },
      {
        params: { slug: 'afterglow-tape' },
        props: {
          entry: {
            storeItem: expect.objectContaining({
              slug: 'afterglow-tape',
              checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
            }),
            primaryAvailability: expect.objectContaining({
              storeItemSlug: 'afterglow-tape',
            }),
          },
        },
      },
    ]);
  });
});
