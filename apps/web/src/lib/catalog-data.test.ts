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
import type { DistroGroupName } from '@blackbox/content-model';

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
    embeddedPlayerData: null,
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
  it('keeps small-vinyl groups separate, sorts items, and omits empty groups', () => {
    const entries: Array<{ data: { group: DistroGroupName; order: number; title: string } }> = [
      { data: { group: 'Tapes', order: 5, title: 'C' } },
      { data: { group: 'Vinyl 7-inch', order: 2, title: 'B' } },
      { data: { group: 'Vinyl 7-inch', order: 2, title: 'A' } },
      { data: { group: 'CDs', order: 4, title: 'E' } },
      { data: { group: 'Vinyl 10-inch', order: 7, title: 'G' } },
      { data: { group: 'Vinyl 12-inch', order: 1, title: 'A' } },
    ];

    const groups = groupDistroEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual([
      'Vinyl 12-inch',
      'Vinyl 10-inch',
      'Vinyl 7-inch',
      'CDs',
      'Tapes',
    ]);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.entries.map((entry) => entry.data.title)).toEqual(['G']);
    expect(groups[2]?.entries.map((entry) => entry.data.title)).toEqual(['A', 'B']);
    expect(groups[3]?.entries).toHaveLength(1);
  });
});

describe('StoreItem projection contract', () => {
  it('keeps persisted Store Item identity when editorial title or format changes', async () => {
    const release = createReleaseEntry('stable-source', {
      artist: { collection: 'artists', id: 'afterwise' },
      cover_image: createTestImage('/new-cover.jpg'),
      cover_image_alt: 'New cover',
      release_date: new Date('2026-09-14'),
      title: 'Renamed release',
      formats: ['CD'],
      store_item: { storeItemSlug: 'original-store-slug', variantId: 'variant_persisted' },
    });
    expect(await getStoreItemForRelease(release)).toMatchObject({
      slug: 'original-store-slug',
      variantId: 'variant_persisted',
      storePath: '/blackbox-records/store/original-store-slug/',
    });
    release.data.store_item = null;
    expect(await getStoreItemForRelease(release)).toBeNull();
  });
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
      embeddedPlayerData: null,
      title: 'Caregivers',
      subtitle: 'Afterwise',
      summary: 'Release summary',
      summaryRich: null,
      image: { src: '/cover.jpg', width: 100, height: 100, format: 'jpg' },
      imageAlt: 'Caregivers cover',
      eyebrow: 'Release',
      metadata: ['Nov 2024', 'Vinyl', 'Digital'],
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
    expect(storeItem).not.toHaveProperty('checkoutPath');
  });

  it('keeps Release IDs and namespaces Distro player IDs for the same source ID', async () => {
    const bandcamp_embed_url =
      'https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/';
    const tidal_url = 'https://tidal.com/album/123456789';
    const releaseEntry = createReleaseEntry('shared-id', {
      artist: { collection: 'artists', id: 'afterwise' },
      bandcamp_embed_url,
      cover_image: createTestImage('/shared.jpg'),
      cover_image_alt: 'Shared release cover',
      formats: ['CD'],
      release_date: new Date('2024-11-02T00:00:00.000Z'),
      tidal_url,
      title: 'Shared release',
    });
    const distroEntry = createDistroEntry('shared-id', {
      artist_or_label: 'Afterwise',
      bandcamp_embed_url,
      eyebrow: 'Distro',
      format: 'CD',
      group: 'CDs',
      image: createTestImage('/shared.jpg'),
      image_alt: 'Shared Distro cover',
      order: 1,
      summary: 'Shared Distro summary.',
      tidal_url,
      title: 'Shared Distro item',
    });

    const releaseItem = await createStoreItemFromRelease(releaseEntry);
    const distroItem = createStoreItemFromDistroEntry(distroEntry);

    expect(releaseItem.embeddedPlayerData).toMatchObject({
      releaseId: 'shared-id',
      title: 'Shared release — Afterwise',
    });
    expect(releaseItem.embeddedPlayerData?.providers).toHaveLength(2);
    expect(distroItem.embeddedPlayerData).toMatchObject({ releaseId: 'distro:shared-id' });
    expect(distroItem.embeddedPlayerData?.providers).toHaveLength(2);
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
      src: '/blackbox-records/assets/catalog/releases/afterwise-album-cover-distro-mockup.webp',
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
      src: '/blackbox-records/assets/catalog/releases/ouranopithecus-album-cover-distro-mockup.webp',
      width: 3544,
      height: 3543,
      format: 'webp',
    });
  });

  it('uses the Caregivers mockup cover on its release-owned store item', async () => {
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
      image: {
        src: '/blackbox-records/assets/catalog/releases/chronoboros-album-cover-distro-mockup.webp',
        width: 3544,
        height: 3543,
        format: 'webp',
      },
      slug: 'caregivers-vinyl',
      sourceId: 'caregivers',
      sourceKind: 'release',
    });
  });

  it('creates a distro-derived store item without leaking external-shop fields', () => {
    const storeItem = createStoreItemFromDistroEntry(
      createDistroEntry('afterglow-tape', {
        artist_or_label: 'Afterglow',
        eyebrow: 'Tape',
        format: 'Cassette',
        group: 'Tapes',
        gallery: [
          {
            image: createTestImage('/afterglow-back.jpg'),
            image_alt: 'Afterglow tape back cover',
          },
        ],
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
    expect(storeItem).not.toHaveProperty('gallery');
    expect(storeItem.embeddedPlayerData).toBeNull();
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
      sourceId: 'caregivers',
      sourceKind: 'release',
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
  });

  it('lists native store items across releases and distro with stable slugs', async () => {
    const storeItems = await listStoreItems();

    expect(storeItems.map((storeItem) => [storeItem.slug, storeItem.sourceKind])).toEqual([
      ['disintegration-black-vinyl-lp', 'release'],
      ['caregivers-vinyl', 'release'],
      ['afterglow-tape', 'distro'],
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
      sourceKind: 'release',
      sourceId: 'caregivers',
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

  it('rejects every reserved Store route segment with its conflicting owner', () => {
    for (const slug of ['checkout', 'blackbox-releases', 'distro', 'merch']) {
      expect(() => mapStoreItemsBySlug([createStoreItemCollisionRecord('distro', slug, slug)])).toThrow(
        `Reserved Store Item slug detected for distro:${slug}: ${slug}`,
      );
    }
  });

  it('keeps legacy release ids separate from canonical item-option slugs', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getStoreItemForRelease(expectReleaseEntry(externalRelease))).resolves.toMatchObject({
      slug: 'caregivers-vinyl',
      sourceKind: 'release',
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
      sourceId: 'caregivers',
      sourceKind: 'release',
      storePath: '/blackbox-records/store/caregivers-vinyl/',
    });
  });
});
