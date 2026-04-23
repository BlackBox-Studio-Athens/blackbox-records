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

import {
  createStoreItemFromDistroEntry,
  createStoreItemFromRelease,
  getStoreItemBySlug,
  getStoreItemForRelease,
  groupDistroEntries,
  hasNativeStoreItemForRelease,
  listStoreItems,
  listReleaseCatalog,
  mapStoreItemsBySlug,
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

describe('StoreItem projection contract', () => {
  it('creates a release-derived store item with stable shop and checkout paths', async () => {
    const storeItem = await createStoreItemFromRelease({
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

    expect(storeItem).toEqual({
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
      shopPath: '/blackbox-records/store/caregivers/',
      checkoutPath: '/blackbox-records/store/caregivers/checkout/',
    });
  });

  it('creates a distro-derived store item without leaking external-shop fields', () => {
    const storeItem = createStoreItemFromDistroEntry({
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

    expect(storeItem.sourceKind).toBe('distro');
    expect(storeItem.shopPath).toBe('/blackbox-records/store/afterglow-tape/');
    expect(storeItem.checkoutPath).toBe('/blackbox-records/store/afterglow-tape/checkout/');
    expect(storeItem.metadata).toEqual(['Tapes', 'Cassette']);
    expect(storeItem).not.toHaveProperty('fourthwall_url');
    expect(storeItem).not.toHaveProperty('merch_url');
  });

  it('only treats releases with internal /store/ merch_url as native store candidates', async () => {
    const [nativeRelease, externalRelease] = await listReleaseCatalog();

    expect(hasNativeStoreItemForRelease(nativeRelease as any)).toBe(true);
    expect(hasNativeStoreItemForRelease(externalRelease as any)).toBe(false);
  });

  it('lists native store items across releases and distro with stable slugs', async () => {
    const storeItems = await listStoreItems();

    expect(storeItems.map((storeItem) => [storeItem.slug, storeItem.sourceKind])).toEqual([
      ['barren-point', 'release'],
      ['afterglow-tape', 'distro'],
    ]);
  });

  it('maps and resolves store items by canonical slug', async () => {
    const storeItems = await listStoreItems();
    const storeItemsBySlug = mapStoreItemsBySlug(storeItems);

    expect(storeItemsBySlug.get('barren-point')?.sourceKind).toBe('release');
    await expect(getStoreItemBySlug('afterglow-tape')).resolves.toMatchObject({
      slug: 'afterglow-tape',
      sourceKind: 'distro',
    });
    await expect(getStoreItemBySlug('caregivers')).resolves.toBeNull();
  });

  it('returns null for releases that are not native store items', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(externalRelease as any)).resolves.toBeNull();
  });

  it('resolves native store paths for mapped releases instead of legacy external merch links', async () => {
    const [nativeRelease, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(nativeRelease as any)).resolves.toMatchObject({
      slug: 'barren-point',
      shopPath: '/blackbox-records/store/barren-point/',
    });

    await expect(getStoreItemForRelease(externalRelease as any)).resolves.toBeNull();
  });
});
