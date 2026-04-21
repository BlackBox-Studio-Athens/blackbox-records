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
  getPrimaryVariantSnapshotForCatalogItem,
  listVariantSnapshotsForCatalogItem,
} from './variant-snapshot';

describe('VariantSnapshot adapter', () => {
  it('resolves one stable temporary variant snapshot for a native catalog item slug', async () => {
    await expect(listVariantSnapshotsForCatalogItem('barren-point')).resolves.toEqual([
      {
        variantId: 'variant_barren-point_standard',
        catalogItemSlug: 'barren-point',
        title: 'Disintegration',
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
        canPurchase: true,
      },
    ]);
  });

  it('returns null and an empty list cleanly for an unknown slug', async () => {
    await expect(listVariantSnapshotsForCatalogItem('unknown-slug')).resolves.toEqual([]);
    await expect(getPrimaryVariantSnapshotForCatalogItem('unknown-slug')).resolves.toBeNull();
  });

  it('creates a fallback snapshot for known catalog items without explicit fixture pricing', async () => {
    await expect(getPrimaryVariantSnapshotForCatalogItem('aftermaths')).resolves.toMatchObject({
      variantId: 'variant_aftermaths_standard',
      catalogItemSlug: 'aftermaths',
      title: 'Aftermaths',
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
      canPurchase: false,
    });
  });

  it('exposes structured price data and a stable display label', async () => {
    const variantSnapshot = await getPrimaryVariantSnapshotForCatalogItem('barren-point');

    expect(variantSnapshot?.price).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
      display: '€28.00',
    });
  });

  it('marks sold-out variants as non-purchasable', async () => {
    await expect(getPrimaryVariantSnapshotForCatalogItem('afterglow-tape')).resolves.toMatchObject({
      availability: {
        status: 'sold_out',
        label: 'Sold Out',
      },
      canPurchase: false,
    });
  });

  it('keeps backend and order state out of the snapshot contract', async () => {
    const variantSnapshot = await getPrimaryVariantSnapshotForCatalogItem('barren-point');

    expect(variantSnapshot).not.toHaveProperty('stripePriceId');
    expect(variantSnapshot).not.toHaveProperty('stripeProductId');
    expect(variantSnapshot).not.toHaveProperty('d1VariantId');
    expect(variantSnapshot).not.toHaveProperty('inventoryCount');
    expect(variantSnapshot).not.toHaveProperty('orderState');
  });

  it('returns the first snapshot as the stable primary variant while the list API stays array-based', async () => {
    const variantSnapshots = await listVariantSnapshotsForCatalogItem('barren-point');
    const primaryVariantSnapshot = await getPrimaryVariantSnapshotForCatalogItem('barren-point');

    expect(variantSnapshots).toHaveLength(1);
    expect(primaryVariantSnapshot).toEqual(variantSnapshots[0]);
  });
});
