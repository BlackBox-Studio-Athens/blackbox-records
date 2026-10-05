import { describe, expect, it, vi } from 'vitest';

const catalog = vi.hoisted(() => ({
  clips: [] as { title: string; youtube_video_id: string }[],
}));

vi.mock('astro:assets', () => ({
  getImage: vi.fn(async () => ({ src: '/_astro/image.webp' })),
}));
vi.mock('@/lib/catalog-data', () => ({
  listStoreItems: async () => [
    {
      sourceKind: 'release',
      sourceId: 'lotus',
      slug: 'lotus-vinyl',
      title: 'LOTUS',
      subtitle: 'Sidus',
      metadata: ['October 2026', 'Vinyl'],
      storePath: '/store/lotus-vinyl/',
      embeddedPlayerData: null,
    },
  ],
  listReleaseCatalog: async () => [
    {
      id: 'lotus',
      data: { artist: { id: 'sidus' }, cover_image: '/cover.webp', clips: catalog.clips },
    },
  ],
  listArtistProfiles: async () => [{ id: 'sidus', data: { slug: 'sidus', image: '/artist.webp' } }],
}));

import { GET } from './preorder-showcase.json';

describe('published pre-order showcase response', () => {
  it('leaves cache policy to the publication-aware renderer and reflects clip additions, replacements and removal', async () => {
    const before = await GET();
    expect(before.headers.get('Content-Type')).toBe('application/json');
    expect(before.headers.get('Cache-Control')).toBeNull();
    expect(await before.json()).toEqual([expect.objectContaining({ firstClipId: null, clips: [] })]);

    catalog.clips = [{ title: 'Embrace The Void', youtube_video_id: 'MOA5YZDOR6A' }];
    const after = await GET();
    expect(after.headers.get('Cache-Control')).toBeNull();
    expect(await after.json()).toEqual([
      expect.objectContaining({
        firstClipId: 'MOA5YZDOR6A',
        clips: [{ id: 'MOA5YZDOR6A', title: 'Embrace The Void', posterUrl: '/_astro/image.webp' }],
      }),
    ]);

    catalog.clips = [{ title: 'Replacement', youtube_video_id: 'abcdefghijk' }];
    expect(await (await GET()).json()).toEqual([
      expect.objectContaining({
        firstClipId: 'abcdefghijk',
        clips: [{ id: 'abcdefghijk', title: 'Replacement', posterUrl: null }],
      }),
    ]);
    catalog.clips = [];
    expect(await (await GET()).json()).toEqual([expect.objectContaining({ firstClipId: null, clips: [] })]);
  });
});
