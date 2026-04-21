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
            merch_url: '/shop/',
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

import {
  createCatalogItemFromDistroEntry,
  createCatalogItemFromRelease,
  getCatalogItemBySlug,
  getCatalogItemForRelease,
  groupDistroEntries,
  hasNativeCatalogItemForRelease,
  listCatalogItems,
  listReleaseCatalog,
  mapCatalogItemsBySlug,
} from './catalog-data';

describe('groupDistroEntries', () => {
  it('returns distro groups in the intended editorial order and omits empty groups', () => {
    const entries = [
      { data: { group: 'Tapes', order: 5, title: 'C' } },
      { data: { group: 'Vinyls', order: 1, title: 'A' } },
      { data: { group: 'Clothes', order: 3, title: 'B' } },
    ] as any;

    const groups = groupDistroEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual(['Vinyls', 'Clothes', 'Tapes']);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.entries).toHaveLength(1);
    expect(groups[2]?.entries).toHaveLength(1);
  });
});

describe('CatalogItem projection contract', () => {
  it('creates a release-derived catalog item with stable shop and checkout paths', async () => {
    const catalogItem = await createCatalogItemFromRelease({
      id: 'caregivers',
      data: {
        artist: { id: 'afterwise' },
        cover_image: { src: '/cover.jpg' },
        cover_image_alt: 'Caregivers cover',
        formats: ['LP', 'Digital'],
        release_date: new Date('2024-11-02T00:00:00.000Z'),
        summary: 'Release summary',
        title: 'Caregivers',
      },
    } as any);

    expect(catalogItem).toEqual({
      slug: 'caregivers',
      sourceKind: 'release',
      sourceId: 'caregivers',
      title: 'Caregivers',
      subtitle: 'Afterwise',
      summary: 'Release summary',
      image: { src: '/cover.jpg' },
      imageAlt: 'Caregivers cover',
      eyebrow: 'Release',
      metadata: ['2024', 'LP', 'Digital'],
      shopPath: '/blackbox-records/shop/caregivers/',
      checkoutPath: '/blackbox-records/shop/caregivers/checkout/',
    });
  });

  it('creates a distro-derived catalog item without leaking external-shop fields', () => {
    const catalogItem = createCatalogItemFromDistroEntry({
      id: 'afterglow-tape',
      data: {
        artist_or_label: 'Afterglow',
        eyebrow: 'Tape',
        format: 'Cassette',
        fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
        group: 'Tapes',
        image: { src: '/afterglow.jpg' },
        image_alt: 'Afterglow tape',
        summary: 'Small-run cassette.',
        title: 'Afterglow Tape',
      },
    } as any);

    expect(catalogItem.sourceKind).toBe('distro');
    expect(catalogItem.shopPath).toBe('/blackbox-records/shop/afterglow-tape/');
    expect(catalogItem.checkoutPath).toBe('/blackbox-records/shop/afterglow-tape/checkout/');
    expect(catalogItem.metadata).toEqual(['Tapes', 'Cassette']);
    expect(catalogItem).not.toHaveProperty('fourthwall_url');
    expect(catalogItem).not.toHaveProperty('merch_url');
  });

  it('only treats releases with internal /shop/ merch_url as native catalog candidates', async () => {
    const [nativeRelease, externalRelease] = await listReleaseCatalog();

    expect(hasNativeCatalogItemForRelease(nativeRelease as any)).toBe(true);
    expect(hasNativeCatalogItemForRelease(externalRelease as any)).toBe(false);
  });

  it('lists native catalog items across releases and distro with stable slugs', async () => {
    const catalogItems = await listCatalogItems();

    expect(catalogItems.map((catalogItem) => [catalogItem.slug, catalogItem.sourceKind])).toEqual([
      ['barren-point', 'release'],
      ['afterglow-tape', 'distro'],
    ]);
  });

  it('maps and resolves catalog items by canonical slug', async () => {
    const catalogItems = await listCatalogItems();
    const catalogItemsBySlug = mapCatalogItemsBySlug(catalogItems);

    expect(catalogItemsBySlug.get('barren-point')?.sourceKind).toBe('release');
    await expect(getCatalogItemBySlug('afterglow-tape')).resolves.toMatchObject({
      slug: 'afterglow-tape',
      sourceKind: 'distro',
    });
    await expect(getCatalogItemBySlug('caregivers')).resolves.toBeNull();
  });

  it('returns null for releases that are not native catalog items', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getCatalogItemForRelease(externalRelease as any)).resolves.toBeNull();
  });
});
