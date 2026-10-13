import { getImage } from 'astro:assets';
import { statSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sidusBackgroundVideoUrl from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';
import sidusBackgroundVideoDesktopUrl from './_assets/video-posters/sidus-embrace-the-void-loop-desktop.mp4?url';
import afterwiseBackgroundVideoUrl from './_assets/video-posters/afterwise-equilibrium-loop.mp4?url';
import afterwiseBackgroundVideoDesktopUrl from './_assets/video-posters/afterwise-equilibrium-loop-desktop.mp4?url';

const catalog = vi.hoisted(() => ({
  clips: [] as { title: string; youtube_video_id: string }[],
  artistSlug: 'sidus',
  hasArtist: true,
  cover: { src: '/accepted-cover.webp', width: 1200, height: 1200, format: 'webp' },
  photo: { src: '/accepted-artist.webp', width: 2048, height: 1536, format: 'webp' },
}));

vi.mock('astro:assets', () => ({
  getImage: vi.fn(
    async ({
      src,
      width,
      widths,
      format,
    }: {
      src: string | { src: string };
      width: number;
      widths?: number[];
      format: string;
    }) => {
      const url = (w: number) => `${typeof src === 'string' ? src : src.src}?width=${w}&format=${format}`;
      return { src: url(width), srcSet: { attribute: (widths ?? []).map((w) => `${url(w)} ${w}w`).join(', ') } };
    },
  ),
}));
vi.mock('@/lib/catalog-data', () => ({
  listStoreItems: async () => [
    {
      sourceKind: 'release',
      sourceId: 'lotus',
      slug: 'lotus-vinyl',
      title: 'LOTUS',
      subtitle: 'Sidus',
      ...(catalog.hasArtist ? { artistPath: '/artists/' + catalog.artistSlug + '/' } : {}),
      metadata: ['October 2026', 'Vinyl'],
      storePath: '/store/lotus-vinyl/',
      embeddedPlayerData: null,
    },
  ],
  listReleaseCatalog: async () => [
    {
      id: 'lotus',
      data: { artist: { id: 'sidus' }, cover_image: catalog.cover, clips: catalog.clips },
    },
  ],
  listArtistProfiles: async () =>
    catalog.hasArtist ? [{ id: 'sidus', data: { slug: catalog.artistSlug, image: catalog.photo } }] : [],
}));

import { preorderShowcaseItems } from './_preorder-showcase';

const projected = [
  { storeItemSlug: 'lotus-vinyl', displayPrice: '€28.00', shipEstimate: { kind: 'date' as const, date: '2026-12-04' } },
];
const items = () => preorderShowcaseItems(projected);

describe('Home pre-order showcase items', () => {
  beforeEach(() => {
    catalog.clips = [];
    catalog.artistSlug = 'sidus';
    catalog.hasArtist = true;
    catalog.cover.width = catalog.cover.height = 1200;
    catalog.photo.width = 2048;
    catalog.photo.height = 1536;
    vi.clearAllMocks();
  });

  it('lists only projected release items, with the projected price and estimate, and prepares nothing without one', async () => {
    expect(await preorderShowcaseItems([])).toEqual([]);
    expect(await preorderShowcaseItems([{ ...projected[0]!, storeItemSlug: 'other-vinyl' }])).toEqual([]);
    expect(getImage).not.toHaveBeenCalled();
    expect(await items()).toEqual([
      expect.objectContaining({
        slug: 'lotus-vinyl',
        displayPrice: '€28.00',
        shipEstimate: { kind: 'date', date: '2026-12-04' },
      }),
    ]);
  });

  it('reflects clip additions, replacements and removal from the accepted snapshot', async () => {
    expect(await items()).toEqual([
      expect.objectContaining({ artistPath: '/artists/sidus/', firstClipId: null, clips: [] }),
    ]);

    catalog.clips = [{ title: 'Embrace The Void', youtube_video_id: 'MOA5YZDOR6A' }];
    expect(await items()).toEqual([
      expect.objectContaining({
        firstClipId: 'MOA5YZDOR6A',
        clips: [
          {
            id: 'MOA5YZDOR6A',
            title: 'Embrace The Void',
            posterUrl: expect.any(String),
            backgroundVideoUrl: sidusBackgroundVideoUrl,
            backgroundVideoDesktopUrl: sidusBackgroundVideoDesktopUrl,
          },
        ],
      }),
    ]);

    catalog.clips = [{ title: 'Replacement', youtube_video_id: 'abcdefghijk' }];
    expect(await items()).toEqual([
      expect.objectContaining({
        firstClipId: 'abcdefghijk',
        clips: [{ id: 'abcdefghijk', title: 'Replacement', posterUrl: null, backgroundVideoUrl: null }],
      }),
    ]);
    catalog.clips = [];
    expect(await items()).toEqual([expect.objectContaining({ firstClipId: null, clips: [] })]);
  });

  it('associates prepared media only by accepted official video ID, independent of title and artist slug', async () => {
    catalog.artistSlug = 'renamed-artist';
    catalog.clips = [
      { title: 'Revised official title', youtube_video_id: 'MOA5YZDOR6A' },
      { title: 'Embrace The Void', youtube_video_id: 'abcdefghijk' },
    ];
    expect(await items()).toEqual([
      expect.objectContaining({
        artistPath: '/artists/renamed-artist/',
        clips: [
          {
            id: 'MOA5YZDOR6A',
            title: 'Revised official title',
            posterUrl: expect.any(String),
            backgroundVideoUrl: sidusBackgroundVideoUrl,
            backgroundVideoDesktopUrl: sidusBackgroundVideoDesktopUrl,
          },
          { id: 'abcdefghijk', title: 'Embrace The Void', posterUrl: null, backgroundVideoUrl: null },
        ],
      }),
    ]);

    catalog.artistSlug = 'sidus';
    catalog.clips = [{ title: 'Embrace The Void', youtube_video_id: 'abcdefghijk' }];
    vi.clearAllMocks();
    expect(await items()).toEqual([
      expect.objectContaining({
        clips: [{ id: 'abcdefghijk', title: 'Embrace The Void', posterUrl: null, backgroundVideoUrl: null }],
      }),
    ]);
    expect(getImage).toHaveBeenCalledTimes(2);
  });

  it('projects accepted original artwork through existing profiles without upscaling small sources', async () => {
    catalog.cover.width = catalog.cover.height = 1440;
    catalog.photo.width = 3000;
    expect(await items()).toEqual([
      expect.objectContaining({
        coverUrl: '/accepted-cover.webp?width=720&format=webp',
        coverSrcSet: '/accepted-cover.webp?width=360&format=webp 360w, /accepted-cover.webp?width=720&format=webp 720w',
        artistPhotoUrl: '/accepted-artist.webp?width=1800&format=webp',
        artistPhotoSrcSet: expect.stringMatching(/ 800w, .* 1200w, .* 1800w$/),
      }),
    ]);
    expect(getImage).toHaveBeenCalledWith({ src: catalog.cover, widths: [360, 720], width: 720, format: 'webp' });
    expect(getImage).toHaveBeenCalledWith({
      src: catalog.photo,
      widths: [800, 1200, 1800],
      width: 1800,
      format: 'webp',
    });

    catalog.cover.width = catalog.cover.height = 600;
    catalog.photo.width = 960;
    expect(await items()).toEqual([
      expect.objectContaining({
        coverUrl: '/accepted-cover.webp?width=600&format=webp',
        artistPhotoUrl: '/accepted-artist.webp?width=960&format=webp',
      }),
    ]);

    catalog.hasArtist = false;
    expect(await items()).toEqual([
      expect.objectContaining({
        artistPath: null,
        coverUrl: '/accepted-cover.webp?width=600&format=webp',
        artistPhotoUrl: null,
      }),
    ]);
  });

  it('projects both prepared performance backdrops in accepted clip order without matching titles', async () => {
    catalog.artistSlug = 'renamed-artist';
    catalog.clips = [
      { title: 'Revised performance title', youtube_video_id: 'Cl7rWCTGEqY' },
      { title: 'Embrace The Void', youtube_video_id: 'MOA5YZDOR6A' },
      { title: 'Equilibrium - Live at Fuzz Club Athens', youtube_video_id: 'abcdefghijk' },
    ];
    expect(await items()).toEqual([
      expect.objectContaining({
        firstClipId: 'Cl7rWCTGEqY',
        clips: [
          {
            id: 'Cl7rWCTGEqY',
            title: 'Revised performance title',
            posterUrl: expect.any(String),
            backgroundVideoUrl: afterwiseBackgroundVideoUrl,
            backgroundVideoDesktopUrl: afterwiseBackgroundVideoDesktopUrl,
          },
          {
            id: 'MOA5YZDOR6A',
            title: 'Embrace The Void',
            posterUrl: expect.any(String),
            backgroundVideoUrl: sidusBackgroundVideoUrl,
            backgroundVideoDesktopUrl: sidusBackgroundVideoDesktopUrl,
          },
          {
            id: 'abcdefghijk',
            title: 'Equilibrium - Live at Fuzz Club Athens',
            posterUrl: null,
            backgroundVideoUrl: null,
          },
        ],
      }),
    ]);
  });

  it('keeps each compiled native backdrop below the 900 kB delivery budget', () => {
    for (const filename of ['sidus-embrace-the-void-loop.mp4', 'afterwise-equilibrium-loop.mp4']) {
      const asset = new URL('./_assets/video-posters/' + filename, import.meta.url);
      expect(statSync(asset).size).toBeLessThan(900_000);
    }
  });
  it('bounds the separately selected desktop backdrops to 4 MiB each', () => {
    for (const filename of ['sidus-embrace-the-void-loop-desktop.mp4', 'afterwise-equilibrium-loop-desktop.mp4']) {
      expect(statSync(new URL('./_assets/video-posters/' + filename, import.meta.url)).size).toBeLessThan(
        4 * 1024 * 1024,
      );
    }
  });
});
