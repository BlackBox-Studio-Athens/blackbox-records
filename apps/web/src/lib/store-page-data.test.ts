import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCartLineItemSnapshotForStorePage,
  createPricedCartSeedForStorePage,
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
  hasStructuredItemPrice: (price: { amountMinor?: unknown; currencyCode?: unknown } | null | undefined) =>
    Boolean(price && typeof price.amountMinor === 'number' && typeof price.currencyCode === 'string'),
  isPricedItemAvailability: (availability: { availability?: { status?: string }; canBuy?: boolean; price?: unknown }) =>
    Boolean(
      availability?.canBuy &&
      availability.availability?.status === 'available' &&
      availability.price &&
      typeof (availability.price as { amountMinor?: unknown }).amountMinor === 'number' &&
      typeof (availability.price as { currencyCode?: unknown }).currencyCode === 'string',
    ),
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
        taxCategory: 'physical_goods',
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
        taxCategory: 'physical_goods',
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
        slug: 'caregivers-vinyl',
        taxCategory: 'physical_goods',
        sourceKind: 'release',
        sourceId: 'caregivers',
        title: 'Caregivers',
        subtitle: 'Chronoboros',
        summary: 'BlackBox release.',
        image: { src: '/caregivers.jpg', width: 1, height: 1, format: 'jpg' },
        imageAlt: 'Caregivers cover',
        eyebrow: 'Release',
        metadata: ['2026', 'Vinyl'],
        storePath: '/blackbox-records/store/caregivers-vinyl/',
        checkoutPath: '/blackbox-records/store/caregivers-vinyl/checkout/',
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
      })
      .mockResolvedValueOnce({
        variantId: 'variant_caregivers-vinyl_standard',
        storeItemSlug: 'caregivers-vinyl',
        optionLabel: null,
        price: { display: 'Price soon' },
        availability: { status: 'sold_out', label: 'Unavailable' },
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
      {
        params: { slug: 'caregivers-vinyl' },
        props: {
          entry: {
            storeItem: expect.objectContaining({
              slug: 'caregivers-vinyl',
              checkoutPath: '/blackbox-records/store/caregivers-vinyl/checkout/',
            }),
            primaryAvailability: expect.objectContaining({
              storeItemSlug: 'caregivers-vinyl',
              canBuy: false,
            }),
          },
        },
      },
    ]);
  });

  it('does not create a static CartLineItemSnapshot for an eligible store page', () => {
    const cartItem = createCartLineItemSnapshotForStorePage(
      {
        slug: 'disintegration-black-vinyl-lp',
        taxCategory: 'physical_goods',
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
        price: { display: 'Price confirmed at checkout' },
        availability: { status: 'available', label: 'Available' },
        canBuy: true,
      },
      '/blackbox-records/_astro/disintegration.webp',
    );

    expect(cartItem).toBeNull();
    expect(JSON.stringify(cartItem)).not.toContain('barren-point/checkout');
    expect(JSON.stringify(cartItem)).not.toContain('price_');
    expect(JSON.stringify(cartItem)).not.toContain('stockCount');
    expect(JSON.stringify(cartItem)).not.toContain('clientSecret');
  });

  it('does not create a CartLineItemSnapshot for unavailable store pages', () => {
    const cartItem = createCartLineItemSnapshotForStorePage(
      {
        slug: 'afterglow-tape',
        taxCategory: 'physical_goods',
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

  it('creates a priced cart seed for Worker-confirmed checkout without making sold out static pages buyable', () => {
    const storeItem = {
      slug: 'afterglow-tape',
      taxCategory: 'physical_goods' as const,
      sourceKind: 'distro' as const,
      sourceId: 'afterglow-tape',
      title: 'Afterglow Tape',
      subtitle: 'Various Artists',
      summary: 'Distributed release.',
      image: { src: '/afterglow.jpg', width: 1, height: 1, format: 'jpg' as const },
      imageAlt: 'Afterglow Tape cover',
      eyebrow: 'Distro',
      metadata: ['Cassette'],
      storePath: '/blackbox-records/store/afterglow-tape/',
      checkoutPath: '/blackbox-records/store/afterglow-tape/checkout/',
    };
    const availability = {
      variantId: 'variant_afterglow-tape_standard',
      storeItemSlug: 'afterglow-tape',
      optionLabel: 'Cassette',
      price: { amountMinor: 1400, currencyCode: 'EUR', display: 'EUR 14.00' },
      availability: { status: 'sold_out' as const, label: 'Sold Out' },
      canBuy: false as const,
    };

    expect(createCartLineItemSnapshotForStorePage(storeItem, availability, '/afterglow.webp')).toBeNull();
    const seed = createPricedCartSeedForStorePage(storeItem, availability, '/afterglow.webp');

    expect(seed).toMatchObject({
      availabilityLabel: 'Sold Out',
      image: '/afterglow.webp',
      optionLabel: 'Cassette',
      storeItemSlug: 'afterglow-tape',
      variantId: 'variant_afterglow-tape_standard',
    });
    expect(seed).not.toHaveProperty('priceAmountMinor');
    expect(seed).not.toHaveProperty('priceCurrencyCode');
    expect(seed).not.toHaveProperty('priceDisplay');
  });

  it('creates a metadata cart seed for Price soon store pages when a variant is known', () => {
    const storeItem = {
      slug: 'aftermaths',
      taxCategory: 'physical_goods' as const,
      sourceKind: 'distro' as const,
      sourceId: 'aftermaths',
      title: 'Aftermaths',
      subtitle: 'Indoctrinate',
      summary: 'Distributed release.',
      image: { src: '/aftermaths.jpg', width: 1, height: 1, format: 'jpg' as const },
      imageAlt: 'Aftermaths cover',
      eyebrow: 'Distro',
      metadata: [],
      storePath: '/blackbox-records/store/aftermaths/',
      checkoutPath: '/blackbox-records/store/aftermaths/checkout/',
    };

    expect(
      createPricedCartSeedForStorePage(
        storeItem,
        {
          variantId: 'variant_aftermaths_standard',
          storeItemSlug: 'aftermaths',
          optionLabel: null,
          price: { display: 'Price soon' },
          availability: { status: 'sold_out', label: 'Unavailable' },
          canBuy: false,
        },
        '/aftermaths.webp',
      ),
    ).toMatchObject({
      availabilityLabel: 'Unavailable',
      storeItemSlug: 'aftermaths',
      variantId: 'variant_aftermaths_standard',
    });
  });
});
