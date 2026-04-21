import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStoreProductStaticPaths, getStoreProductEntryBySlug } from './store-product';

const mockCatalogData = vi.hoisted(() => ({
  getCatalogItemBySlug: vi.fn(),
  listCatalogItems: vi.fn(),
}));

const mockVariantSnapshot = vi.hoisted(() => ({
  getPrimaryVariantSnapshotForCatalogItem: vi.fn(),
}));

vi.mock('./catalog-data', () => ({
  getCatalogItemBySlug: mockCatalogData.getCatalogItemBySlug,
  listCatalogItems: mockCatalogData.listCatalogItems,
}));

vi.mock('./variant-snapshot', () => ({
  getPrimaryVariantSnapshotForCatalogItem: mockVariantSnapshot.getPrimaryVariantSnapshotForCatalogItem,
}));

describe('store product helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a store product entry for a known slug', async () => {
    mockCatalogData.getCatalogItemBySlug.mockResolvedValue({
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

    mockVariantSnapshot.getPrimaryVariantSnapshotForCatalogItem.mockResolvedValue({
      variantId: 'variant_barren-point_standard',
      catalogItemSlug: 'barren-point',
      title: 'Barren Point LP',
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
      canPurchase: true,
    });

    await expect(getStoreProductEntryBySlug('barren-point')).resolves.toMatchObject({
      catalogItem: {
        slug: 'barren-point',
        shopPath: '/blackbox-records/store/barren-point/',
        checkoutPath: '/blackbox-records/store/barren-point/checkout/',
      },
      primaryVariantSnapshot: {
        variantId: 'variant_barren-point_standard',
        canPurchase: true,
      },
    });
  });

  it('returns null for an unknown slug', async () => {
    mockCatalogData.getCatalogItemBySlug.mockResolvedValue(null);

    await expect(getStoreProductEntryBySlug('unknown-slug')).resolves.toBeNull();
    expect(mockVariantSnapshot.getPrimaryVariantSnapshotForCatalogItem).not.toHaveBeenCalled();
  });

  it('creates static paths for every catalog item with matching checkout links', async () => {
    mockCatalogData.listCatalogItems.mockResolvedValue([
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

    mockVariantSnapshot.getPrimaryVariantSnapshotForCatalogItem
      .mockResolvedValueOnce({
        variantId: 'variant_barren-point_standard',
        catalogItemSlug: 'barren-point',
        title: 'Barren Point LP',
        optionLabel: 'Black Vinyl LP',
        price: { amountMinor: 2800, currencyCode: 'EUR', display: 'EUR 28.00' },
        availability: { status: 'available', label: 'Available' },
        canPurchase: true,
      })
      .mockResolvedValueOnce({
        variantId: 'variant_afterglow-tape_standard',
        catalogItemSlug: 'afterglow-tape',
        title: 'Afterglow Tape',
        optionLabel: 'Cassette',
        price: { amountMinor: 1400, currencyCode: 'EUR', display: 'EUR 14.00' },
        availability: { status: 'sold_out', label: 'Sold Out' },
        canPurchase: false,
      });

    await expect(createStoreProductStaticPaths()).resolves.toEqual([
      {
        params: { slug: 'barren-point' },
        props: {
          entry: {
            catalogItem: expect.objectContaining({
              slug: 'barren-point',
              checkoutPath: '/blackbox-records/store/barren-point/checkout/',
            }),
            primaryVariantSnapshot: expect.objectContaining({
              catalogItemSlug: 'barren-point',
            }),
          },
        },
      },
      {
        params: { slug: 'afterglow-tape' },
        props: {
          entry: {
            catalogItem: expect.objectContaining({
              slug: 'afterglow-tape',
              checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
            }),
            primaryVariantSnapshot: expect.objectContaining({
              catalogItemSlug: 'afterglow-tape',
            }),
          },
        },
      },
    ]);
  });
});
