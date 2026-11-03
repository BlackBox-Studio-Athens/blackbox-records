import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPreorderShowcaseCandidates, selectShowcaseChapters } from './preorder-showcase';

type Item = Parameters<typeof buildPreorderShowcaseCandidates>[0][number];
const item = (overrides: Partial<Item> = {}): Item => ({
  sourceKind: 'release',
  sourceId: 'release-a',
  slug: 'canonical-edition',
  title: 'Album',
  subtitle: 'Artist',
  metadata: ['October 2026', 'Digital', 'Black Vinyl LP'],
  summary: 'An album about the city. More release details.',
  embeddedPlayerData: null,
  releaseDate: new Date('2026-10-16T00:00:00Z'),
  storePath: '/blackbox-records/store/canonical-edition/',
  ...overrides,
});
const release = {
  id: 'release-a',
  data: {
    clips: [
      { title: 'First clip', youtube_video_id: 'abcdefghijk' },
      { title: 'Second clip', youtube_video_id: '01234567890' },
    ],
  },
};
const images: Parameters<typeof buildPreorderShowcaseCandidates>[2] = new Map([
  [
    'canonical-edition',
    {
      coverUrl: '/_astro/cover.webp',
      artistPhotoUrl: '/_astro/artist.webp',
      clipPosterUrls: new Map([['abcdefghijk', '/_astro/video.webp']]),
      clipBackgroundVideoUrls: new Map([['abcdefghijk', '/_astro/background.mp4']]),
    },
  ],
]);

describe('pre-order showcase candidates', () => {
  it('uses canonical release Store facts and supplied optimized images without commerce state', () => {
    expect(
      buildPreorderShowcaseCandidates(
        [item({ artistPath: '/blackbox-records/artists/artist/' }), item({ sourceKind: 'distro', slug: 'distro' })],
        [release],
        images,
      ),
    ).toEqual([
      {
        slug: 'canonical-edition',
        title: 'Album',
        artist: 'Artist',
        artistPath: '/blackbox-records/artists/artist/',
        option: 'Black Vinyl LP',
        storePath: '/blackbox-records/store/canonical-edition/',
        releaseDate: '2026-10-16',
        coverUrl: '/_astro/cover.webp',
        firstClipId: 'abcdefghijk',
        clips: [
          {
            id: 'abcdefghijk',
            title: 'First clip',
            posterUrl: '/_astro/video.webp',
            backgroundVideoUrl: '/_astro/background.mp4',
          },
          { id: '01234567890', title: 'Second clip', posterUrl: null, backgroundVideoUrl: null },
        ],
        artistPhotoUrl: '/_astro/artist.webp',
        summary: 'An album about the city.',
        trackCount: null,
        recording: null,
        listen: null,
      },
    ]);
  });

  it('projects format-matching tracks, the recording location and the existing Listen source', () => {
    const bandcampEmbedUrl = 'https://bandcamp.com/EmbeddedPlayer/album=1/size=large/';
    const records = buildPreorderShowcaseCandidates(
      [
        item({
          embeddedPlayerData: {
            releaseId: 'release-a',
            title: 'Album — Artist',
            providers: [{ id: 'bandcamp', embedLayout: 'bandcamp-album', embedUrl: bandcampEmbedUrl }],
          },
        }),
      ],
      [
        {
          ...release,
          data: {
            ...release.data,
            credits: [
              { role: 'Recorded and mixed by', name: 'Engineer' },
              { role: 'Recorded and mixed at', name: 'BlackBox Studio' },
            ],
            tracklist: { format: 'vinyl', sides: [{ label: 'A', tracks: [{ title: 'One' }, { title: 'Two' }] }] },
          },
        },
      ],
      images,
    );
    expect(records[0]).toMatchObject({
      trackCount: 2,
      recording: 'BlackBox Studio',
      listen: { releaseId: 'release-a', bandcampEmbedUrl, tidalEmbedUrl: null },
    });
  });

  it('preserves input order and emits explicit nulls for missing dates, clips and photos', () => {
    const records = buildPreorderShowcaseCandidates(
      [item({ slug: 'second', releaseDate: undefined, metadata: [] }), item()],
      [{ id: 'release-a', data: {} }],
      new Map([...images, ['second', { coverUrl: '/_astro/second.webp', artistPhotoUrl: null }]]),
    );
    expect(records.map((record) => record.slug)).toEqual(['second', 'canonical-edition']);
    expect(records[0]).toMatchObject({
      artistPath: null,
      releaseDate: null,
      firstClipId: null,
      artistPhotoUrl: null,
      option: 'Physical release',
    });
    expect(records[1]?.firstClipId).toBeNull();
    expect(buildPreorderShowcaseCandidates([], [], new Map())).toEqual([]);
  });

  it('rejects missing source or media rather than emitting a broken candidate', () => {
    expect(() => buildPreorderShowcaseCandidates([item()], [], images)).toThrow('Missing pre-order showcase');
    expect(() => buildPreorderShowcaseCandidates([item()], [release], new Map())).toThrow('Missing pre-order showcase');
  });

  it('retains official clip identity with explicit still fallback when native media is absent', () => {
    const [record] = buildPreorderShowcaseCandidates(
      [item()],
      [release],
      new Map([['canonical-edition', { coverUrl: '/accepted-cover.webp', artistPhotoUrl: null }]]),
    );
    expect(record).toMatchObject({
      coverUrl: '/accepted-cover.webp',
      firstClipId: 'abcdefghijk',
      clips: [
        { id: 'abcdefghijk', title: 'First clip', posterUrl: null, backgroundVideoUrl: null },
        { id: '01234567890', title: 'Second clip', posterUrl: null, backgroundVideoUrl: null },
      ],
    });
  });

  it('renders the island between Hero and News only with projected items, and publishes no candidate route', () => {
    const home = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
    expect(home.indexOf('<HomeHero')).toBeLessThan(home.indexOf('<StorePreorderShowcase'));
    expect(home.indexOf('<StorePreorderShowcase')).toBeLessThan(home.indexOf('id="news"'));
    expect(home).toMatch(
      /preorderItems\.length > 0 && \(\s*<StorePreorderShowcase\s+client:load\s+items=\{preorderItems\}/,
    );
    expect(home).toContain("from '@/lib/open-preorders'");
    expect(existsSync(new URL('../pages/preorder-showcase.json.ts', import.meta.url))).toBe(false);
  });
});

describe('Home chapter selection', () => {
  const entry = (slug: string, date: string | undefined, sourceId = slug) => ({
    sourceKind: 'release' as const,
    sourceId,
    slug,
    releaseDate: date ? new Date(date + 'T00:00:00Z') : undefined,
  });
  const releases = ['open', 'old', 'new', 'tie-a', 'tie-b', 'off', 'sold'].map((id) => ({
    id,
    data: { show_on_home: id !== 'off' },
  }));
  const storeItems = [
    entry('old', '2026-01-01'),
    entry('open', '2026-05-01'),
    entry('new', '2026-09-01'),
    entry('tie-b', '2026-03-01'),
    entry('tie-a', '2026-03-01'),
    entry('off', '2026-08-01'),
    entry('sold', undefined),
    entry('unflagged-distro', '2026-08-01'),
    { ...entry('merch', '2026-08-01'), sourceKind: 'distro' as const },
  ];
  const preorders = [{ storeItemSlug: 'open', displayPrice: '€28.00', shipEstimate: null }];
  const homeOffers = [
    { storeItemSlug: 'open', availability: 'stocked' as const, displayPrice: '€1.00' },
    { storeItemSlug: 'old', availability: 'stocked' as const, displayPrice: '€25.00' },
    { storeItemSlug: 'new', availability: 'stocked' as const, displayPrice: '€30.00' },
    { storeItemSlug: 'tie-a', availability: 'stocked' as const, displayPrice: null },
    { storeItemSlug: 'tie-b', availability: 'stocked' as const, displayPrice: null },
    { storeItemSlug: 'off', availability: 'stocked' as const, displayPrice: '€20.00' },
    { storeItemSlug: 'sold', availability: 'sold_out' as const, displayPrice: null },
    { storeItemSlug: 'merch', availability: 'stocked' as const, displayPrice: '€5.00' },
  ];

  it('lists open pre-orders first, then switched-on releases newest first with a slug tie-break', () => {
    const chapters = selectShowcaseChapters(storeItems, releases, preorders, homeOffers);
    expect(chapters.map(({ item, chapter }) => [item.slug, chapter.offer])).toEqual([
      ['open', 'preorder'],
      ['new', 'stocked'],
      ['tie-a', 'stocked'],
      ['tie-b', 'stocked'],
      ['old', 'stocked'],
      ['sold', 'sold_out'],
    ]);
  });

  it('shows a release on an open pre-order once, as a pre-order with its projected price', () => {
    const chapters = selectShowcaseChapters(storeItems, releases, preorders, homeOffers);
    expect(chapters.filter(({ item }) => item.slug === 'open')).toEqual([
      { item: storeItems[1], chapter: { offer: 'preorder', displayPrice: '€28.00', shipEstimate: null } },
    ]);
  });

  it('leaves out releases that are switched off, have no Home offer, or are not releases', () => {
    const slugs = selectShowcaseChapters(storeItems, releases, [], homeOffers).map(({ item }) => item.slug);
    expect(slugs).not.toContain('off');
    expect(slugs).not.toContain('unflagged-distro');
    expect(slugs).not.toContain('merch');
    expect(selectShowcaseChapters(storeItems, releases, [], [])).toEqual([]);
  });
});
