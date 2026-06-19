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

    return [];
  }),
  getEntry: vi.fn(async (reference: { id: string }) => ({
    collection: 'artists',
    id: reference.id,
    data: {
      slug: reference.id,
      title: reference.id,
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { listReleaseCatalog } from './catalog-data';
import { getReleaseCommerceLink } from './release-commerce';

type ReleaseEntry = CollectionEntry<'releases'>;

function expectReleaseEntry(releaseEntry: ReleaseEntry | undefined): ReleaseEntry {
  if (!releaseEntry) {
    throw new Error('Expected release catalog fixture to exist.');
  }

  return releaseEntry;
}

describe('release commerce link resolution', () => {
  it('prefers the native store path for mapped releases', async () => {
    const [nativeRelease] = await listReleaseCatalog();

    await expect(getReleaseCommerceLink(expectReleaseEntry(nativeRelease))).resolves.toEqual({
      href: '/blackbox-records/store/disintegration-black-vinyl-lp/',
      isNativeStoreLink: true,
      label: 'View In Store',
    });
  });

  it('prefers native store paths even when releases still carry legacy external merch metadata', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getReleaseCommerceLink(expectReleaseEntry(externalRelease))).resolves.toEqual({
      href: '/blackbox-records/store/caregivers-vinyl/',
      isNativeStoreLink: true,
      label: 'View In Store',
    });
  });
});
