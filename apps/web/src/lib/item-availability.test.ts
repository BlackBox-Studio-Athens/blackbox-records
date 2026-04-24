import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          id: 'barren-point',
          data: {
            artist: { id: 'afterwise' },
            cover_image: { src: '/barren-point.jpg' },
            cover_image_alt: 'Barren Point cover',
            formats: ['Vinyl LP'],
            merch_url: '/store/',
            release_date: new Date('2026-09-01T00:00:00.000Z'),
            summary: 'Native-shop release',
            title: 'Disintegration',
          },
        },
      ];
    }

    if (collectionName === 'distro') {
      return [
        {
          id: 'aftermaths',
          data: {
            artist_or_label: 'Indoctrinate',
            eyebrow: null,
            format: 'Vinyl',
            fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
            group: 'Vinyls',
            image: { src: '/aftermaths.jpg' },
            image_alt: 'Aftermaths front',
            order: 1,
            summary: 'Raw hardcore punk release.',
            title: 'Aftermaths',
          },
        },
        {
          id: 'afterglow-tape',
          data: {
            artist_or_label: 'North Sea Tapes',
            eyebrow: 'Small Run',
            format: 'Cassette',
            fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
            group: 'Tapes',
            image: { src: '/afterglow.jpg' },
            image_alt: 'Afterglow tape',
            order: 2,
            summary: 'Small-run cassette.',
            title: 'Afterglow Tape',
          },
        },
      ];
    }

    return [];
  }),
  getEntry: vi.fn(async (reference: { id: string }) => ({
    data: {
      slug: reference.id,
      title: reference.id === 'afterwise' ? 'Afterwise' : 'Artist',
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  getPrimaryAvailabilityForStoreItem,
  listAvailabilityForStoreItem,
} from './item-availability';

describe('ItemAvailability adapter', () => {
  it('resolves one stable temporary item availability record for a native store item slug', async () => {
    await expect(listAvailabilityForStoreItem('disintegration-black-vinyl-lp')).resolves.toEqual([
      {
        variantId: 'variant_barren-point_standard',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        optionLabel: 'Black Vinyl LP',
        price: {
          amountMinor: 2800,
          currencyCode: 'EUR',
          display: '€28.00',
        },
        availability: {
          status: 'available',
          label: 'Available',
        },
        canBuy: true,
      },
    ]);
  });

  it('returns null and an empty list cleanly for an unknown slug', async () => {
    await expect(listAvailabilityForStoreItem('unknown-slug')).resolves.toEqual([]);
    await expect(getPrimaryAvailabilityForStoreItem('unknown-slug')).resolves.toBeNull();
  });

  it('creates fallback availability for known store items without explicit fixture pricing', async () => {
    await expect(getPrimaryAvailabilityForStoreItem('aftermaths')).resolves.toMatchObject({
      variantId: 'variant_aftermaths_standard',
      storeItemSlug: 'aftermaths',
      optionLabel: null,
      price: {
        amountMinor: 0,
        currencyCode: 'EUR',
        display: 'Price soon',
      },
      availability: {
          status: 'sold_out',
          label: 'Unavailable',
      },
      canBuy: false,
    });
  });

  it('exposes structured price data and a stable display label', async () => {
    const itemAvailability = await getPrimaryAvailabilityForStoreItem('disintegration-black-vinyl-lp');

    expect(itemAvailability?.price).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
      display: '€28.00',
    });
  });

  it('marks sold-out variants as unavailable to buy', async () => {
    await expect(getPrimaryAvailabilityForStoreItem('afterglow-tape')).resolves.toMatchObject({
      availability: {
        status: 'sold_out',
        label: 'Sold Out',
      },
      canBuy: false,
    });
  });

  it('keeps backend and order state out of the availability contract', async () => {
    const itemAvailability = await getPrimaryAvailabilityForStoreItem('disintegration-black-vinyl-lp');

    expect(itemAvailability).not.toHaveProperty('stripePriceId');
    expect(itemAvailability).not.toHaveProperty('d1VariantId');
    expect(itemAvailability).not.toHaveProperty('stockCount');
    expect(itemAvailability).not.toHaveProperty('orderState');
  });

  it('returns the first availability record as the stable primary variant while the list API stays array-based', async () => {
    const itemAvailability = await listAvailabilityForStoreItem('disintegration-black-vinyl-lp');
    const primaryAvailability = await getPrimaryAvailabilityForStoreItem('disintegration-black-vinyl-lp');

    expect(itemAvailability).toHaveLength(1);
    expect(primaryAvailability).toEqual(itemAvailability[0]);
  });
});
