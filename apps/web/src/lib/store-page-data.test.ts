import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createStoreCartItemForStorePage,
  createStorePageStaticPaths,
  getStorePageEntryBySlug,
} from './store-page-data';

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
        image: { src: '/cover.jpg', width: 1, height: 1, format: 'jpg' },
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
        image: { src: '/afterglow.jpg', width: 1, height: 1, format: 'jpg' },
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

  it('creates a browser-safe cart item for an eligible store page', () => {
    const cartItem = createStoreCartItemForStorePage(
      {
        slug: 'disintegration-black-vinyl-lp',
        sourceKind: 'release',
        sourceId: 'barren-point',
        title: 'Disintegration',
        subtitle: 'Afterwise',
        summary: 'BlackBox release.',
        image: { src: '/cover.jpg', width: 1, height: 1, format: 'jpg' },
        imageAlt: 'Disintegration cover',
        eyebrow: 'Release',
        metadata: ['2024', 'LP'],
        storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
        checkoutPath: '/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
      },
      {
        variantId: 'variant_barren-point_standard',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        optionLabel: 'Black Vinyl LP',
        price: { amountMinor: 2800, currencyCode: 'EUR', display: 'EUR 28.00' },
        availability: { status: 'available', label: 'Available' },
        canBuy: true,
      },
      '/blackbox-records/_astro/disintegration.webp',
    );

    expect(cartItem).toEqual({
      availabilityLabel: 'Available',
      image: '/blackbox-records/_astro/disintegration.webp',
      imageAlt: 'Disintegration cover',
      optionLabel: 'Black Vinyl LP',
      priceDisplay: 'EUR 28.00',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      subtitle: 'Afterwise',
      title: 'Disintegration',
      variantId: 'variant_barren-point_standard',
    });
    expect(JSON.stringify(cartItem)).not.toContain('barren-point/checkout');
    expect(JSON.stringify(cartItem)).not.toContain('price_');
    expect(JSON.stringify(cartItem)).not.toContain('stockCount');
    expect(JSON.stringify(cartItem)).not.toContain('clientSecret');
  });

  it('does not create a cart item for unavailable store pages', () => {
    const cartItem = createStoreCartItemForStorePage(
      {
        slug: 'afterglow-tape',
        sourceKind: 'distro',
        sourceId: 'afterglow-tape',
        title: 'Afterglow Tape',
        subtitle: 'Various Artists',
        summary: 'Distributed release.',
        image: { src: '/afterglow.jpg', width: 1, height: 1, format: 'jpg' },
        imageAlt: 'Afterglow Tape cover',
        eyebrow: 'Distro',
        metadata: ['Cassette'],
        storePath: '/blackbox-records/store/afterglow-tape/',
        checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
      },
      {
        variantId: 'variant_afterglow-tape_standard',
        storeItemSlug: 'afterglow-tape',
        optionLabel: 'Cassette',
        price: { amountMinor: 1400, currencyCode: 'EUR', display: 'EUR 14.00' },
        availability: { status: 'sold_out', label: 'Sold Out' },
        canBuy: false,
      },
      '/blackbox-records/_astro/afterglow.webp',
    );

    expect(cartItem).toBeNull();
  });
});
