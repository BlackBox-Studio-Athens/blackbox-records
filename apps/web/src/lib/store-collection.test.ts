import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          id: 'disintegration',
          data: {
            artist: { id: 'afterwise' },
            cover_image: { src: '/disintegration.jpg' },
            cover_image_alt: 'Disintegration cover',
            formats: ['Black Vinyl LP'],
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
      title: reference.id === 'afterwise' ? 'Afterwise' : reference.id === 'chronoboros' ? 'Chronoboros' : 'Artist',
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  classifyStoreCatalogMembership,
  createStoreDistroGroupHeadingId,
  groupStoreDistroCollectionEntries,
  listStoreCollectionEntries,
  selectStoreCollectionEntries,
  type StoreCollectionEntry,
} from './store-collection';

describe('store collection entries', () => {
  it('returns a unified collection with primary availability for all release and distro store candidates', async () => {
    const collectionEntries = await listStoreCollectionEntries();

    expect(collectionEntries.map((entry) => [entry.storeItem.slug, entry.storeItem.sourceKind])).toEqual([
      ['disintegration-black-vinyl-lp', 'release'],
      ['caregivers-vinyl', 'release'],
      ['afterglow-tape', 'distro'],
    ]);

    expect(collectionEntries[0]?.primaryAvailability).toMatchObject({
      storeItemSlug: 'disintegration-black-vinyl-lp',
      price: { display: 'Worker-confirmed at checkout' },
      canBuy: true,
    });

    expect(collectionEntries[1]?.primaryAvailability).toMatchObject({
      storeItemSlug: 'caregivers-vinyl',
      price: { display: 'Worker-confirmed at checkout' },
      availability: { status: 'available', label: 'Available' },
      canBuy: true,
    });

    expect(collectionEntries[2]?.primaryAvailability).toMatchObject({
      storeItemSlug: 'afterglow-tape',
      price: { display: 'Worker-confirmed at checkout' },
      availability: { status: 'available', label: 'Available' },
      canBuy: true,
    });

    expect(collectionEntries.map((entry) => [entry.storeItem.slug, entry.categoryIds])).toEqual([
      ['disintegration-black-vinyl-lp', ['blackbox-releases']],
      ['caregivers-vinyl', ['blackbox-releases']],
      ['afterglow-tape', ['distro']],
    ]);

    expect(collectionEntries[2]?.distro).toEqual({
      format: 'Cassette',
      group: 'Tapes',
      order: 1,
      searchText: 'Afterglow Tape Afterglow Tapes Cassette',
    });
  });

  it('derives faceted memberships without persisting All on an item', () => {
    expect(
      classifyStoreCatalogMembership({
        sourceId: 'disintegration',
        sourceKind: 'release',
      }),
    ).toEqual(['blackbox-releases']);

    expect(
      classifyStoreCatalogMembership({
        sourceId: 'caregivers',
        sourceKind: 'release',
      }),
    ).toEqual(['blackbox-releases']);

    expect(
      classifyStoreCatalogMembership({
        distroGroup: 'Tapes',
        sourceId: 'afterglow-tape',
        sourceKind: 'distro',
      }),
    ).toEqual(['distro']);

    expect(
      classifyStoreCatalogMembership({
        distroGroup: 'Clothes',
        sourceId: 'shirt',
        sourceKind: 'distro',
      }),
    ).toEqual(['distro', 'merch']);

    expect(() =>
      classifyStoreCatalogMembership({
        sourceId: 'unsupported',
        sourceKind: 'unsupported' as StoreCollectionEntry['storeItem']['sourceKind'],
      }),
    ).toThrow('Unsupported Store Item source kind: unsupported.');

    expect(() =>
      classifyStoreCatalogMembership({
        sourceId: 'missing-group',
        sourceKind: 'distro',
      }),
    ).toThrow('Distro Store Item missing-group is missing its Distro group.');
  });

  it('selects each category without duplicate Store Items when memberships overlap', async () => {
    const entries = await listStoreCollectionEntries();

    expect(selectStoreCollectionEntries(entries, 'all').map((entry) => entry.storeItem.slug)).toEqual([
      'disintegration-black-vinyl-lp',
      'caregivers-vinyl',
      'afterglow-tape',
    ]);
    expect(selectStoreCollectionEntries(entries, 'blackbox-releases').map((entry) => entry.storeItem.slug)).toEqual([
      'disintegration-black-vinyl-lp',
      'caregivers-vinyl',
    ]);
    expect(selectStoreCollectionEntries(entries, 'distro').map((entry) => entry.storeItem.slug)).toEqual([
      'afterglow-tape',
    ]);
    expect(selectStoreCollectionEntries(entries, 'merch')).toEqual([]);
    expect(() => selectStoreCollectionEntries([...entries, entries[0]!], 'all')).toThrow(
      'Store collection all contains Store Item disintegration-black-vinyl-lp more than once.',
    );
  });

  it('keeps classified Distro entries in the authored group and item order', async () => {
    const entries = await listStoreCollectionEntries('distro');

    expect(groupStoreDistroCollectionEntries(entries)).toEqual([
      {
        groupName: 'Tapes',
        introGroupName: 'Tapes',
        entries: [expect.objectContaining({ storeItem: expect.objectContaining({ slug: 'afterglow-tape' }) })],
      },
    ]);
  });

  it('retains physical group order, combined small vinyl, Clothes, and title tie-breakers', () => {
    const createDistroEntry = (
      slug: string,
      group: NonNullable<StoreCollectionEntry['distro']>['group'],
      order: number,
      title = slug,
    ): StoreCollectionEntry => ({
      categoryIds: group === 'Clothes' ? ['distro', 'merch'] : ['distro'],
      distro: { format: group, group, order, searchText: `${title} ${group}` },
      primaryAvailability: null,
      storeItem: {
        eyebrow: null,
        image: { format: 'jpg', height: 100, src: '/fixture.jpg', width: 100 },
        imageAlt: 'Fixture image',
        metadata: [],
        slug,
        sourceId: slug,
        sourceKind: 'distro',
        storePath: `/store/${slug}/`,
        subtitle: 'Fixture',
        summary: null,
        taxCategory: 'physical_goods',
        title,
      },
    });
    const entries = [
      createDistroEntry('vinyl-12', 'Vinyl 12-inch', 1),
      createDistroEntry('small-vinyl-b', 'Vinyl 7-inch', 2, 'Beta'),
      createDistroEntry('small-vinyl-a', 'Vinyl 7-inch', 2, 'Alpha'),
      createDistroEntry('small-vinyl-10', 'Vinyl 10-inch', 3),
      createDistroEntry('cd', 'CDs', 1),
      createDistroEntry('tape', 'Tapes', 1),
      createDistroEntry('shirt', 'Clothes', 1),
      createDistroEntry('other', 'Other', 1),
    ];

    const groups = groupStoreDistroCollectionEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual([
      'Vinyl 12-inch',
      '7-inch & 10-inch Vinyl',
      'CDs',
      'Tapes',
      'Clothes',
      'Other',
    ]);
    expect(groups[1]?.entries.map((entry) => entry.storeItem.title)).toEqual(['Alpha', 'Beta', 'small-vinyl-10']);
    expect(groups.flatMap((group) => group.entries).map((entry) => entry.storeItem.slug)).toHaveLength(entries.length);
    expect(groups.map((group) => createStoreDistroGroupHeadingId(group.groupName))).toEqual([
      'distro-group-vinyl-12-inch',
      'distro-group-7-inch-10-inch-vinyl',
      'distro-group-cds',
      'distro-group-tapes',
      'distro-group-clothes',
      'distro-group-other',
    ]);
  });
});
