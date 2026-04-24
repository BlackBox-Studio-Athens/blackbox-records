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
        {
          id: 'caregivers',
          data: {
            artist: { id: 'chronoboros' },
            cover_image: { src: '/caregivers.jpg' },
            cover_image_alt: 'Caregivers cover',
            formats: ['Vinyl'],
            merch_url: 'https://chronoboros.bandcamp.com/merch',
            release_date: new Date('2026-03-13T00:00:00.000Z'),
            summary: 'External merch release',
            title: 'Caregivers',
          },
        },
      ];
    }

    if (collectionName === 'distro') {
      return [
        {
          id: 'afterglow-tape',
          data: {
            artist_or_label: 'Afterglow',
            eyebrow: 'Tape',
            format: 'Cassette',
            fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
            group: 'Tapes',
            image: { src: '/afterglow.jpg' },
            image_alt: 'Afterglow tape',
            order: 1,
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
      slug: 'afterwise',
      title: reference.id === 'afterwise' ? 'Afterwise' : 'Artist',
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { listStoreCollectionEntries } from './store-collection';

describe('store collection entries', () => {
  it('returns a unified collection with primary availability for native store items only', async () => {
    const collectionEntries = await listStoreCollectionEntries();

    expect(collectionEntries.map((entry) => [entry.storeItem.slug, entry.storeItem.sourceKind])).toEqual([
      ['disintegration-black-vinyl-lp', 'release'],
      ['afterglow-tape', 'distro'],
    ]);

    expect(collectionEntries[0]?.primaryAvailability).toMatchObject({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      price: { display: '€28.00' },
      canBuy: true,
    });

    expect(collectionEntries[1]?.primaryAvailability).toMatchObject({
      storeItemSlug: 'afterglow-tape',
      price: { display: '€14.00' },
      availability: { status: 'sold_out', label: 'Sold Out' },
      canBuy: false,
    });
  });
});
