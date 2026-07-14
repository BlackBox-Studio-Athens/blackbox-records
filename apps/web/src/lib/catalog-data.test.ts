import type { CollectionEntry } from 'astro:content';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          collection: 'releases',
          id: 'disintegration',
          data: {
            artist: { collection: 'artists', id: 'afterwise' },
            cover_image: { src: '/disintegration.jpg', width: 100, height: 100, format: 'jpg' },
            cover_image_alt: 'Disintegration cover',
            formats: ['Black Vinyl LP'],
            merch_url: '/store/',
            release_date: new Date('2026-09-01T00:00:00.000Z'),
            summary: 'Native-shop release',
            title: 'Disintegration',
          },
        },
        {
          collection: 'releases',
          id: 'caregivers',
          data: {
            artist: { collection: 'artists', id: 'chronoboros' },
            cover_image: { src: '/caregivers.jpg', width: 100, height: 100, format: 'jpg' },
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
          collection: 'distro',
          id: 'afterglow-tape',
          data: {
            artist_or_label: 'Afterglow',
            eyebrow: 'Tape',
            format: 'Cassette',
            group: 'Tapes',
            image: { src: '/afterglow.jpg', width: 100, height: 100, format: 'jpg' },
            image_alt: 'Afterglow tape',
            order: 1,
            summary: 'Small-run cassette.',
            title: 'Afterglow Tape',
          },
        },
        {
          collection: 'distro',
          id: 'chronoboros-caregivers-vinyl',
          data: {
            artist_or_label: 'Chronoboros',
            eyebrow: 'Distro',
            format: 'Vinyl',
            group: 'Vinyl 12-inch',
            image: { src: '/caregivers-distro.webp', width: 100, height: 100, format: 'webp' },
            image_alt: 'Caregivers vinyl',
            order: 2,
            release_date: new Date('2026-03-13T00:00:00.000Z'),
            summary: 'Caregivers vinyl edition.',
            title: 'Caregivers',
          },
        },
      ];
    }

    return [];
  }),
  getEntry: vi.fn(async (reference: { id: string }) => ({
    collection: 'artists',
    id: reference.id,
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
  createStoreItemFromDistroEntry,
  createStoreItemFromRelease,
  getStoreItemBySlug,
  getStoreItemForRelease,
  groupDistroEntries,
  listStoreItems,
  listReleaseCatalog,
  mapStoreItemsBySlug,
  type StoreItem,
} from './catalog-data';
import type { DistroGroupName } from './distro-data';

type ReleaseEntry = CollectionEntry<'releases'>;
type ReleaseEntryData = ReleaseEntry['data'];
type DistroEntry = CollectionEntry<'distro'>;
type DistroEntryData = DistroEntry['data'];
type TestImageMetadata = ReleaseEntryData['cover_image'];

function createTestImage(src: string): TestImageMetadata {
  return { src, width: 100, height: 100, format: 'jpg' };
}

function createReleaseEntry(id: string, data: ReleaseEntryData): ReleaseEntry {
  return {
    collection: 'releases',
    id,
    data,
  };
}

function createDistroEntry(id: string, data: DistroEntryData): DistroEntry {
  return {
    collection: 'distro',
    id,
    data,
  };
}

function expectReleaseEntry(releaseEntry: ReleaseEntry | undefined): ReleaseEntry {
  if (!releaseEntry) {
    throw new Error('Expected release catalog fixture to exist.');
  }

  return releaseEntry;
}

function createStoreItemCollisionRecord(
  sourceKind: StoreItem['sourceKind'],
  sourceId: string,
  slug: string,
): StoreItem {
  return {
    slug,
    taxCategory: 'physical_goods',
    sourceKind,
    sourceId,
    title: sourceId,
    subtitle: 'Fixture artist',
    summary: null,
    image: createTestImage('/fixture.jpg'),
    imageAlt: 'Fixture image',
    eyebrow: null,
    metadata: [],
    storePath: `/blackbox-records/store/${slug}/`,
  };
}

describe('groupDistroEntries', () => {
  it('combines small-vinyl groups, sorts items, and omits empty groups', () => {
    const entries: Array<{ data: { group: DistroGroupName; order: number; title: string } }> = [
      { data: { group: 'Tapes', order: 5, title: 'C' } },
      { data: { group: 'Vinyl 7-inch', order: 2, title: 'B' } },
      { data: { group: 'Vinyl 7-inch', order: 2, title: 'A' } },
      { data: { group: 'CDs', order: 4, title: 'E' } },
      { data: { group: 'Vinyl 10-inch', order: 7, title: 'G' } },
      { data: { group: 'Vinyl 12-inch', order: 1, title: 'A' } },
    ];

    const groups = groupDistroEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual(['Vinyl 12-inch', '7-inch & 10-inch Vinyl', 'CDs', 'Tapes']);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.entries).toHaveLength(3);
    expect(groups[2]?.entries).toHaveLength(1);
    expect(groups[1]?.entries.map((entry) => entry.data.title)).toEqual(['A', 'B', 'G']);
    expect(groups[1]?.entries.map((entry) => entry.data.group)).toEqual([
      'Vinyl 7-inch',
      'Vinyl 7-inch',
      'Vinyl 10-inch',
    ]);
  });
});

describe('StoreItem projection contract', () => {
  it('creates a release-derived store item with a stable store path', async () => {
    const storeItem = await createStoreItemFromRelease(
      createReleaseEntry('caregivers-control', {
        artist: { collection: 'artists', id: 'afterwise' },
        cover_image: createTestImage('/cover.jpg'),
        cover_image_alt: 'Caregivers cover',
        formats: ['Vinyl', 'Digital'],
        release_date: new Date('2024-11-02T00:00:00.000Z'),
        summary: 'Release summary',
        title: 'Caregivers',
      }),
    );

    expect(storeItem).toEqual({
      slug: 'caregivers-vinyl',
      taxCategory: 'physical_goods',
      sourceKind: 'release',
      sourceId: 'caregivers-control',
      title: 'Caregivers',
      subtitle: 'Afterwise',
      summary: 'Release summary',
      image: { src: '/cover.jpg', width: 100, height: 100, format: 'jpg' },
      imageAlt: 'Caregivers cover',
      eyebrow: 'Release',
      metadata: ['Nov 2024', 'Vinyl', 'Digital'],
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
    expect(storeItem).not.toHaveProperty('checkoutPath');
  });

  it('uses the disintegration mockup cover override only for the store item', async () => {
    const storeItem = await getStoreItemForRelease(
      createReleaseEntry('disintegration', {
        artist: { collection: 'artists', id: 'afterwise' },
        cover_image: createTestImage('/disintegration.jpg'),
        cover_image_alt: 'Disintegration cover',
        formats: ['Black Vinyl LP'],
        merch_url: '/store/',
        release_date: new Date('2026-09-01T00:00:00.000Z'),
        summary: 'Native-shop release',
        title: 'Disintegration',
      }),
    );

    expect(storeItem?.image).toEqual({
      src: '/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
      width: 3544,
      height: 3543,
      format: 'webp',
    });
  });

  it('uses the anarchotribal mockup cover override only for the store item', async () => {
    const storeItem = await getStoreItemForRelease(
      createReleaseEntry('anarchotribal', {
        artist: { collection: 'artists', id: 'ouranopithecus' },
        cover_image: createTestImage('/anarchotribal-cover.webp'),
        cover_image_alt: 'Anarchotribal cover',
        formats: ['Vinyl'],
        merch_url: '/store/',
        release_date: new Date('2026-12-01T00:00:00.000Z'),
        summary: 'Native-shop release',
        title: 'Anarchotribal',
      }),
    );

    expect(storeItem?.image).toEqual({
      src: '/blackbox-records/admin/media/releases/ouranopithecus-album-cover-distro-mockup.webp',
      width: 3544,
      height: 3543,
      format: 'webp',
    });
  });

  it('resolves Caregivers release commerce to the Distro-owned store item', async () => {
    const storeItem = await getStoreItemForRelease(
      createReleaseEntry('caregivers', {
        artist: { collection: 'artists', id: 'chronoboros' },
        cover_image: createTestImage('/caregivers.jpg'),
        cover_image_alt: 'Caregivers cover',
        formats: ['Vinyl'],
        merch_url: 'https://chronoboros.bandcamp.com/merch',
        release_date: new Date('2026-03-13T00:00:00.000Z'),
        summary: 'External merch release',
        title: 'Caregivers',
      }),
    );

    expect(storeItem).toMatchObject({
      image: { src: '/caregivers-distro.webp', width: 100, height: 100, format: 'webp' },
      slug: 'caregivers-vinyl',
      sourceId: 'chronoboros-caregivers-vinyl',
      sourceKind: 'distro',
    });
  });

  it('creates a distro-derived store item without leaking external-shop fields', () => {
    const storeItem = createStoreItemFromDistroEntry(
      createDistroEntry('afterglow-tape', {
        artist_or_label: 'Afterglow',
        eyebrow: 'Tape',
        format: 'Cassette',
        group: 'Tapes',
        image: createTestImage('/afterglow.jpg'),
        image_alt: 'Afterglow tape',
        order: 1,
        release_date: new Date('2021-06-07T00:00:00.000Z'),
        summary: 'Small-run cassette.',
        title: 'Afterglow Tape',
      }),
    );

    expect(storeItem.sourceKind).toBe('distro');
    expect(storeItem.taxCategory).toBe('physical_goods');
    expect(storeItem.storePath).toBe('/blackbox-records/store/afterglow-tape/');
    expect(storeItem.metadata).toEqual(['Tapes', 'Jun 2021', 'Cassette']);
    expect(storeItem).not.toHaveProperty('merch_url');
    expect(storeItem).not.toHaveProperty('checkoutPath');
  });

  it('omits unknown distro release dates from store item metadata', () => {
    const storeItem = createStoreItemFromDistroEntry(
      createDistroEntry('afterglow-tape', {
        artist_or_label: 'Afterglow',
        eyebrow: 'Tape',
        format: 'Cassette',
        group: 'Tapes',
        image: createTestImage('/afterglow.jpg'),
        image_alt: 'Afterglow tape',
        order: 1,
        summary: 'Small-run cassette.',
        title: 'Afterglow Tape',
      }),
    );

    expect(storeItem.metadata).toEqual(['Tapes', 'Cassette']);
    expect(storeItem.metadata).not.toContain('Unknown');
    expect(storeItem.metadata).not.toContain('TBA');
  });

  it('treats current releases as native store candidates regardless of legacy merch metadata', async () => {
    const [nativeRelease, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(expectReleaseEntry(nativeRelease))).resolves.toMatchObject({
      slug: 'disintegration-black-vinyl-lp',
      sourceId: 'disintegration',
      storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
    });
    await expect(getStoreItemForRelease(expectReleaseEntry(externalRelease))).resolves.toMatchObject({
      slug: 'caregivers-vinyl',
      sourceId: 'chronoboros-caregivers-vinyl',
      sourceKind: 'distro',
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
  });

  it('lists native store items across releases and distro with stable slugs', async () => {
    const storeItems = await listStoreItems();

    expect(storeItems.map((storeItem) => [storeItem.slug, storeItem.sourceKind])).toEqual([
      ['disintegration-black-vinyl-lp', 'release'],
      ['afterglow-tape', 'distro'],
      ['caregivers-vinyl', 'distro'],
    ]);
    expect(storeItems.map((storeItem) => storeItem.taxCategory)).toEqual([
      'physical_goods',
      'physical_goods',
      'physical_goods',
    ]);
  });

  it('maps and resolves store items by canonical slug', async () => {
    const storeItems = await listStoreItems();
    const storeItemsBySlug = mapStoreItemsBySlug(storeItems);

    expect(storeItemsBySlug.get('disintegration-black-vinyl-lp')?.sourceKind).toBe('release');
    await expect(getStoreItemBySlug('afterglow-tape')).resolves.toMatchObject({
      slug: 'afterglow-tape',
      sourceKind: 'distro',
    });
    await expect(getStoreItemBySlug('caregivers-vinyl')).resolves.toMatchObject({
      slug: 'caregivers-vinyl',
      sourceKind: 'distro',
      sourceId: 'chronoboros-caregivers-vinyl',
    });
    await expect(getStoreItemBySlug('caregivers')).resolves.toBeNull();
  });

  it('detects store item slug collisions without suffixing public slugs', () => {
    expect(() =>
      mapStoreItemsBySlug([
        createStoreItemCollisionRecord('release', 'caregivers', 'caregivers-vinyl'),
        createStoreItemCollisionRecord('distro', 'caregivers-vinyl', 'caregivers-vinyl'),
      ]),
    ).toThrow('Slug collision detected: caregivers-vinyl: release:caregivers, distro:caregivers-vinyl');
  });

  it('rejects checkout as a reserved store item slug', () => {
    expect(() => mapStoreItemsBySlug([createStoreItemCollisionRecord('distro', 'checkout', 'checkout')])).toThrow(
      'Reserved Store Item slug detected: checkout',
    );
  });

  it('keeps legacy release ids separate from canonical item-option slugs', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(expectReleaseEntry(externalRelease))).resolves.toMatchObject({
      slug: 'caregivers-vinyl',
      sourceKind: 'distro',
    });
    await expect(getStoreItemBySlug('caregivers')).resolves.toBeNull();
  });

  it('resolves native store paths for mapped releases instead of legacy merch links', async () => {
    const [nativeRelease, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(expectReleaseEntry(nativeRelease))).resolves.toMatchObject({
      slug: 'disintegration-black-vinyl-lp',
      sourceId: 'disintegration',
      storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
    });

    await expect(getStoreItemForRelease(expectReleaseEntry(externalRelease))).resolves.toMatchObject({
      slug: 'caregivers-vinyl',
      sourceId: 'chronoboros-caregivers-vinyl',
      sourceKind: 'distro',
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
  });
});
