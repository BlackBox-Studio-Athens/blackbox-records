import { getImage } from 'astro:assets';
import { statSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sidusBackgroundVideoUrl from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';

const catalog = vi.hoisted(() => ({
  clips: [] as { title: string; youtube_video_id: string }[],
  artistSlug: 'sidus',
  hasArtist: true,
  cover: { src: '/accepted-cover.webp', width: 1200, height: 1200, format: 'webp' },
  photo: { src: '/accepted-artist.webp', width: 2048, height: 1536, format: 'webp' },
}));

vi.mock('astro:assets', () => ({
  getImage: vi.fn(async ({ src, width, format }: { src: string | { src: string }; width: number; format: string }) => ({
    src: `${typeof src === 'string' ? src : src.src}?width=${width}&format=${format}`,
  })),
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

import { GET } from './preorder-showcase.json';

describe('published pre-order showcase response', () => {
  beforeEach(() => {
    catalog.clips = [];
    catalog.artistSlug = 'sidus';
    catalog.hasArtist = true;
    catalog.cover.width = catalog.cover.height = 1200;
    catalog.photo.width = 2048;
    catalog.photo.height = 1536;
    vi.clearAllMocks();
  });

  it('leaves cache policy to the publication-aware renderer and reflects clip additions, replacements and removal', async () => {
    const before = await GET();
    expect(before.headers.get('Content-Type')).toBe('application/json');
    expect(before.headers.get('Cache-Control')).toBeNull();
    expect(await before.json()).toEqual([
      expect.objectContaining({ artistPath: '/artists/sidus/', firstClipId: null, clips: [] }),
    ]);

    catalog.clips = [{ title: 'Embrace The Void', youtube_video_id: 'MOA5YZDOR6A' }];
    const after = await GET();
    expect(after.headers.get('Cache-Control')).toBeNull();
    expect(await after.json()).toEqual([
      expect.objectContaining({
        firstClipId: 'MOA5YZDOR6A',
        clips: [
          {
            id: 'MOA5YZDOR6A',
            title: 'Embrace The Void',
            posterUrl: expect.any(String),
            backgroundVideoUrl: sidusBackgroundVideoUrl,
          },
        ],
      }),
    ]);

    catalog.clips = [{ title: 'Replacement', youtube_video_id: 'abcdefghijk' }];
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        firstClipId: 'abcdefghijk',
        clips: [{ id: 'abcdefghijk', title: 'Replacement', posterUrl: null, backgroundVideoUrl: null }],
      }),
    ]);
    catalog.clips = [];
    expect(await (await GET()).json()).toEqual([expect.objectContaining({ firstClipId: null, clips: [] })]);
  });

  it('associates prepared media only by accepted official video ID, independent of title and artist slug', async () => {
    catalog.artistSlug = 'renamed-artist';
    catalog.clips = [
      { title: 'Revised official title', youtube_video_id: 'MOA5YZDOR6A' },
      { title: 'Embrace The Void', youtube_video_id: 'abcdefghijk' },
    ];
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        artistPath: '/artists/renamed-artist/',
        clips: [
          {
            id: 'MOA5YZDOR6A',
            title: 'Revised official title',
            posterUrl: expect.any(String),
            backgroundVideoUrl: sidusBackgroundVideoUrl,
          },
          { id: 'abcdefghijk', title: 'Embrace The Void', posterUrl: null, backgroundVideoUrl: null },
        ],
      }),
    ]);

    catalog.artistSlug = 'sidus';
    catalog.clips = [{ title: 'Embrace The Void', youtube_video_id: 'abcdefghijk' }];
    vi.clearAllMocks();
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        clips: [{ id: 'abcdefghijk', title: 'Embrace The Void', posterUrl: null, backgroundVideoUrl: null }],
      }),
    ]);
    expect(getImage).toHaveBeenCalledTimes(2);
  });

  it('projects accepted original artwork through existing profiles without upscaling small sources', async () => {
    catalog.cover.width = catalog.cover.height = 1440;
    catalog.photo.width = 3000;
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        coverUrl: '/accepted-cover.webp?width=1200&format=webp',
        artistPhotoUrl: '/accepted-artist.webp?width=1800&format=webp',
      }),
    ]);
    expect(getImage).toHaveBeenCalledWith({ src: catalog.cover, width: 1200, format: 'webp' });
    expect(getImage).toHaveBeenCalledWith({ src: catalog.photo, width: 1800, format: 'webp' });

    catalog.cover.width = catalog.cover.height = 600;
    catalog.photo.width = 960;
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        coverUrl: '/accepted-cover.webp?width=600&format=webp',
        artistPhotoUrl: '/accepted-artist.webp?width=960&format=webp',
      }),
    ]);

    catalog.hasArtist = false;
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        artistPath: null,
        coverUrl: '/accepted-cover.webp?width=600&format=webp',
        artistPhotoUrl: null,
      }),
    ]);
  });

  it('keeps the compiled native backdrop below the 900 kB delivery budget', () => {
    const asset = new URL('./_assets/video-posters/sidus-embrace-the-void-loop.mp4', import.meta.url);
    expect(statSync(asset).size).toBeLessThan(900_000);
  });
});
