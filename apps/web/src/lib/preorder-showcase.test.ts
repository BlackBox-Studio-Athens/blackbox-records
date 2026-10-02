import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPreorderShowcaseCandidates } from './preorder-showcase';

type Item = Parameters<typeof buildPreorderShowcaseCandidates>[0][number];
const item = (overrides: Partial<Item> = {}): Item => ({
  sourceKind: 'release',
  sourceId: 'release-a',
  slug: 'canonical-edition',
  title: 'Album',
  subtitle: 'Artist',
  metadata: ['October 2026', 'Digital', 'Black Vinyl LP'],
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
  ['canonical-edition', { coverUrl: '/_astro/cover.webp', artistPhotoUrl: '/_astro/artist.webp' }],
]);

describe('pre-order showcase candidates', () => {
  it('uses canonical release Store facts and supplied optimized images without commerce or player data', () => {
    expect(
      buildPreorderShowcaseCandidates([item(), item({ sourceKind: 'distro', slug: 'distro' })], [release], images),
    ).toEqual([
      {
        slug: 'canonical-edition',
        title: 'Album',
        artist: 'Artist',
        option: 'Black Vinyl LP',
        storePath: '/blackbox-records/store/canonical-edition/',
        releaseDate: '2026-10-16',
        coverUrl: '/_astro/cover.webp',
        firstClipId: 'abcdefghijk',
        artistPhotoUrl: '/_astro/artist.webp',
      },
    ]);
  });

  it('preserves input order and emits explicit nulls for missing dates, clips and photos', () => {
    const records = buildPreorderShowcaseCandidates(
      [item({ slug: 'second', releaseDate: undefined, metadata: [] }), item()],
      [{ id: 'release-a', data: {} }],
      new Map([...images, ['second', { coverUrl: '/_astro/second.webp', artistPhotoUrl: null }]]),
    );
    expect(records.map((record) => record.slug)).toEqual(['second', 'canonical-edition']);
    expect(records[0]).toMatchObject({
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

  it('mounts the idle island between Hero and News and keeps the static endpoint outside the explicit sitemap', () => {
    const home = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
    const endpoint = readFileSync(new URL('../pages/preorder-showcase.json.ts', import.meta.url), 'utf8');
    const sitemap = readFileSync(new URL('../pages/sitemap.xml.ts', import.meta.url), 'utf8');
    expect(home.indexOf('<HomeHero')).toBeLessThan(home.indexOf('<StorePreorderShowcase'));
    expect(home.indexOf('<StorePreorderShowcase')).toBeLessThan(home.indexOf('id="news"'));
    expect(home).toContain('client:idle');
    expect(home).toContain("createProjectRelativeUrl('/preorder-showcase.json')");
    expect(endpoint).toContain('export const prerender = true');
    expect(endpoint).toContain("getImage({ src: item.image, width: 720, format: 'webp' })");
    expect(endpoint).toContain("getImage({ src: artist.data.image, width: 1200, format: 'webp' })");
    expect(sitemap).not.toContain('preorder-showcase.json');
  });
});
