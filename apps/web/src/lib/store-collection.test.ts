import { afterEach, describe, expect, it, vi } from 'vitest';
import distroPage from '../content/distro-page/site.json';

const galleryFixture = vi.hoisted(() => ({
  gallery: undefined as { image: { src: string }; image_alt: string }[] | undefined,
}));

afterEach(() => {
  galleryFixture.gallery = undefined;
});

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
            gallery: galleryFixture.gallery,
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
            gallery: galleryFixture.gallery,
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
  getStoreDistroFormatGroup,
  isRecentBlackboxRelease,
  listStoreCollectionEntries,
  selectStoreCollectionEntries,
  sortStoreDistroCollectionEntries,
  type StoreCollectionEntry,
} from './store-collection';

describe('store collection entries', () => {
  it('selects the first different gallery source without changing primary or commerce projections', async () => {
    const baseline = await listStoreCollectionEntries();
    expect(baseline.every((entry) => entry.previewImage === null)).toBe(true);
    const primary = { image: { src: '/afterglow.jpg' }, image_alt: 'Primary duplicate' };
    const front = { image: { src: '/tape-front.jpg' }, image_alt: 'Cassette front' };
    const back = { image: { src: '/tape-back.jpg' }, image_alt: 'Cassette back' };

    for (const [gallery, expected] of [
      [[], null],
      [[primary, primary], null],
      [[primary, front, back], front],
      [[primary, back, front], back],
    ] as const) {
      galleryFixture.gallery = [...gallery];
      const entries = await listStoreCollectionEntries();
      expect(entries.find((entry) => entry.storeItem.sourceKind === 'distro')?.previewImage).toEqual(expected);
      expect(
        entries
          .filter((entry) => entry.storeItem.sourceKind === 'release')
          .every((entry) => entry.previewImage === null),
      ).toBe(true);
      expect(entries.map(({ previewImage: _preview, ...entry }) => entry)).toEqual(
        baseline.map(({ previewImage: _preview, ...entry }) => entry),
      );
    }
  });

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
      ['disintegration-black-vinyl-lp', ['blackbox-releases', 'distro']],
      ['caregivers-vinyl', ['blackbox-releases', 'distro']],
      ['afterglow-tape', ['distro']],
    ]);

    expect(collectionEntries[2]?.distro).toEqual({
      format: 'Cassette',
      group: 'Tapes',
      order: 1,
    });
  });

  it('derives faceted memberships without persisting All on an item', () => {
    expect(
      classifyStoreCatalogMembership({
        sourceId: 'disintegration',
        sourceKind: 'release',
      }),
    ).toEqual(['blackbox-releases', 'distro']);

    expect(
      classifyStoreCatalogMembership({
        sourceId: 'caregivers',
        sourceKind: 'release',
      }),
    ).toEqual(['blackbox-releases', 'distro']);

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
      'disintegration-black-vinyl-lp',
      'caregivers-vinyl',
      'afterglow-tape',
    ]);
    expect(selectStoreCollectionEntries(entries, 'merch')).toEqual([]);
    expect(() => selectStoreCollectionEntries([...entries, entries[0]!], 'all')).toThrow(
      'Store collection all contains Store Item disintegration-black-vinyl-lp more than once.',
    );
  });

  it('includes canonical BlackBox items in the shared format counts without fabricating Distro sources', async () => {
    const entries = await listStoreCollectionEntries('distro');

    expect(groupStoreDistroCollectionEntries(entries)).toEqual([
      {
        groupName: 'Vinyl 12-inch',
        introKey: 'vinyl_12_inch',
        entries: [
          expect.objectContaining({ distro: null, storeItem: expect.objectContaining({ slug: 'caregivers-vinyl' }) }),
          expect.objectContaining({
            distro: null,
            storeItem: expect.objectContaining({ slug: 'disintegration-black-vinyl-lp' }),
          }),
        ],
      },
      {
        groupName: 'Tapes',
        introKey: 'Tapes',
        entries: [expect.objectContaining({ storeItem: expect.objectContaining({ slug: 'afterglow-tape' }) })],
      },
    ]);
  });

  it('orders mixed formats by band with recent BlackBox releases first and stable title/slug ties', async () => {
    const [release, , distro] = await listStoreCollectionEntries();
    const entry = (
      slug: string,
      artist: string,
      title: string,
      group: NonNullable<StoreCollectionEntry['distro']>['group'] = 'Tapes',
    ): StoreCollectionEntry => ({
      ...distro!,
      distro: { format: group, group, order: slug.startsWith('alpha') ? 999 : 0 },
      storeItem: { ...distro!.storeItem, slug, subtitle: artist, title },
    });
    const own = (slug: string, artist: string, date?: string, upcoming = false): StoreCollectionEntry => ({
      ...release!,
      storeItem: {
        ...release!.storeItem,
        slug,
        subtitle: artist,
        releaseDate: date ? new Date(date) : undefined,
        releaseStage: upcoming ? 'upcoming' : 'released',
      },
    });
    const entries = [
      entry('zulu', 'Zulu', 'A title', 'CDs'),
      entry('alpha-title-z', 'Alpha', 'Z title', 'Vinyl 7-inch'),
      own('older', 'Aardvark', '2024-01-01'),
      entry('cafe-beta', '  Café   Band ', 'Beta'),
      own('recent-older', 'A band', '2026-08-01'),
      entry('alpha-tie-b', 'alpha', 'A title', 'Vinyl 10-inch'),
      own('undated', 'Band'),
      entry('cafe-alpha', 'CAFE\u0301 BAND', 'Alpha', 'CDs'),
      own('recent-newer', 'Z band', '2026-09-01'),
      entry('alpha-tie-a', 'ALPHA', 'A title', 'Other'),
      own('future', 'Future', '2026-12-01'),
      own('upcoming', 'Ahead', '2026-09-30', true),
    ];
    const original = [...entries];
    const sorted = sortStoreDistroCollectionEntries(entries, new Date('2026-10-02T23:00:00Z'));
    expect(sorted.map(({ storeItem }) => storeItem.slug)).toEqual([
      'recent-newer',
      'recent-older',
      'older',
      'upcoming',
      'alpha-tie-a',
      'alpha-tie-b',
      'alpha-title-z',
      'undated',
      'cafe-alpha',
      'cafe-beta',
      'future',
      'zulu',
    ]);
    expect(entries).toEqual(original);
    expect(new Set(sorted).size).toBe(entries.length);
    expect(() => sortStoreDistroCollectionEntries([...entries, entries[0]!])).toThrow('more than once');
    expect(release!.storeItem.releaseDate).toEqual(new Date('2026-09-01T00:00:00Z'));
  });

  it.each([
    ['2026-10-02T23:59:59Z', '2026-04-02', true],
    ['2026-10-02T23:59:59Z', '2026-04-01', false],
    ['2026-10-02T00:00:00Z', '2026-10-02T23:59:59Z', true],
    ['2026-10-02T23:59:59Z', '2026-10-03', false],
    ['2026-08-31', '2026-02-28', true],
    ['2026-08-31', '2026-02-27', false],
    ['2024-08-31', '2024-02-29', true],
    ['2024-08-31', '2024-02-28', false],
    ['2026-01-31', '2025-07-31', true],
    ['2026-01-31', '2025-07-30', false],
  ])('applies the UTC six-calendar-month window at %s for %s: %s', async (reference, date, expected) => {
    const [release] = await listStoreCollectionEntries();
    expect(isRecentBlackboxRelease({ ...release!.storeItem, releaseDate: new Date(date) }, new Date(reference))).toBe(
      expected,
    );
  });

  it('does not promote undated, explicitly upcoming, or external items', async () => {
    const [release, , distro] = await listStoreCollectionEntries();
    const reference = new Date('2026-10-02');
    expect(isRecentBlackboxRelease({ ...release!.storeItem, releaseDate: undefined }, reference)).toBe(false);
    expect(isRecentBlackboxRelease({ ...release!.storeItem, releaseStage: 'upcoming' }, reference)).toBe(false);
    expect(isRecentBlackboxRelease({ ...distro!.storeItem, releaseDate: new Date('2026-09-01') }, reference)).toBe(
      false,
    );
  });

  it.each([
    ['Black Vinyl LP', 'Vinyl 12-inch'],
    ['Vinyl 7-inch', 'Vinyl 7-inch'],
    ['10-inch vinyl', 'Vinyl 10-inch'],
    ['CD', 'CDs'],
    ['Cassette', 'Tapes'],
    ['T-shirt', 'Clothes'],
    ['Unknown', 'Other'],
  ] as const)('derives the existing primary option %s as %s', async (option, group) => {
    const [release, , distro] = await listStoreCollectionEntries();
    release!.primaryAvailability!.optionLabel = option;
    expect(getStoreDistroFormatGroup(release!)).toBe(group);
    distro!.primaryAvailability!.optionLabel = option;
    expect(getStoreDistroFormatGroup(distro!)).toBe('Tapes');
  });

  it('retains exact physical group order, separate small vinyl formats, intros, and title tie-breakers', () => {
    const createDistroEntry = (
      slug: string,
      group: NonNullable<StoreCollectionEntry['distro']>['group'],
      order: number,
      title = slug,
    ): StoreCollectionEntry => ({
      categoryIds: group === 'Clothes' ? ['distro', 'merch'] : ['distro'],
      distro: { format: group, group, order },
      previewImage: null,
      primaryAvailability: null,
      storeItem: {
        eyebrow: null,
        image: { format: 'jpg', height: 100, src: '/fixture.jpg', width: 100 },
        imageAlt: 'Fixture image',
        metadata: [],
        slug,
        sourceId: slug,
        sourceKind: 'distro',
        embeddedPlayerData: null,
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
      'Vinyl 10-inch',
      'Vinyl 7-inch',
      'CDs',
      'Tapes',
      'Clothes',
      'Other',
    ]);
    expect(groups.map((group) => group.introKey)).toEqual([
      'vinyl_12_inch',
      'vinyl_10_inch',
      'vinyl_7_inch',
      'CDs',
      'Tapes',
      'Clothes',
      'Other',
    ]);
    expect(distroPage.group_intros[groups[1]!.introKey]).toBe(distroPage.group_intros.vinyl_10_inch);
    expect(distroPage.group_intros[groups[2]!.introKey]).toBe(distroPage.group_intros.vinyl_7_inch);
    expect(groups[1]?.entries.map((entry) => entry.storeItem.title)).toEqual(['small-vinyl-10']);
    expect(groups[2]?.entries.map((entry) => entry.storeItem.title)).toEqual(['Alpha', 'Beta']);
    expect(groups.map((group) => group.entries.length)).toEqual([1, 1, 2, 1, 1, 1, 1]);
    expect(groups.flatMap((group) => group.entries).map((entry) => entry.storeItem.slug)).toHaveLength(entries.length);
    expect(groups.map((group) => createStoreDistroGroupHeadingId(group.groupName))).toEqual([
      'distro-group-vinyl-12-inch',
      'distro-group-vinyl-10-inch',
      'distro-group-vinyl-7-inch',
      'distro-group-cds',
      'distro-group-tapes',
      'distro-group-clothes',
      'distro-group-other',
    ]);
  });
});
