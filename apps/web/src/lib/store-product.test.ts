import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStoreProductStaticPaths, getStoreProductEntryBySlug } from './store-product';

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

describe('store product helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a store product entry for a known slug', async () => {
    mockCatalogData.getStoreItemBySlug.mockResolvedValue({
      slug: 'barren-point',
      sourceKind: 'release',
      sourceId: 'barren-point',
      title: 'Barren Point',
      subtitle: 'Mass Culture',
      summary: 'BlackBox release.',
      image: '/cover.jpg',
      imageAlt: 'Barren Point cover',
      eyebrow: 'Release',
      metadata: ['2024', 'LP'],
      shopPath: '/blackbox-records/store/barren-point/',
      checkoutPath: '/blackbox-records/store/barren-point/checkout/',
    });

    mockItemAvailability.getPrimaryAvailabilityForStoreItem.mockResolvedValue({
      variantId: 'variant_barren-point_standard',
      storeItemSlug: 'barren-point',
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

    await expect(getStoreProductEntryBySlug('barren-point')).resolves.toMatchObject({
      storeItem: {
        slug: 'barren-point',
        shopPath: '/blackbox-records/store/barren-point/',
        checkoutPath: '/blackbox-records/store/barren-point/checkout/',
      },
      primaryAvailability: {
        variantId: 'variant_barren-point_standard',
        canBuy: true,
      },
    });
  });

  it('returns null for an unknown slug', async () => {
    mockCatalogData.getStoreItemBySlug.mockResolvedValue(null);

    await expect(getStoreProductEntryBySlug('unknown-slug')).resolves.toBeNull();
    expect(mockItemAvailability.getPrimaryAvailabilityForStoreItem).not.toHaveBeenCalled();
  });

  it('creates static paths for every store item with matching checkout links', async () => {
    mockCatalogData.listStoreItems.mockResolvedValue([
      {
        slug: 'barren-point',
        sourceKind: 'release',
        sourceId: 'barren-point',
        title: 'Barren Point',
        subtitle: 'Mass Culture',
        summary: 'BlackBox release.',
        image: '/cover.jpg',
        imageAlt: 'Barren Point cover',
        eyebrow: 'Release',
        metadata: ['2024', 'LP'],
        shopPath: '/blackbox-records/store/barren-point/',
        checkoutPath: '/blackbox-records/store/barren-point/checkout/',
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
        shopPath: '/blackbox-records/store/afterglow-tape/',
        checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
      },
    ]);

    mockItemAvailability.getPrimaryAvailabilityForStoreItem
      .mockResolvedValueOnce({
        variantId: 'variant_barren-point_standard',
        storeItemSlug: 'barren-point',
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

    await expect(createStoreProductStaticPaths()).resolves.toEqual([
      {
        params: { slug: 'barren-point' },
        props: {
          entry: {
            storeItem: expect.objectContaining({
              slug: 'barren-point',
              checkoutPath: '/blackbox-records/store/barren-point/checkout/',
            }),
            primaryAvailability: expect.objectContaining({
              storeItemSlug: 'barren-point',
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
