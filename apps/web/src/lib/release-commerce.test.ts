import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collectionName: string) => {
    if (collectionName === 'releases') {
      return [
        {
          id: 'barren-point',
          data: {
            artist: { id: 'afterwise' },
            cover_image: { src: '/barren-point.jpg' },
            cover_image_alt: 'Barren Point cover',
            formats: ['Vinyl LP'],
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

    return [];
  }),
  getEntry: vi.fn(async (reference: { id: string }) => ({
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

describe('release commerce link resolution', () => {
  it('prefers the native store path for mapped releases', async () => {
    const [nativeRelease] = await listReleaseCatalog();

    await expect(getReleaseCommerceLink(nativeRelease as any)).resolves.toEqual({
      href: '/blackbox-records/store/disintegration-black-vinyl-lp/',
      isNativeStoreLink: true,
      label: 'View In Store',
    });
  });

  it('prefers native store paths even when releases still carry legacy external merch metadata', async () => {
    const [, externalRelease] = await listReleaseCatalog();

    await expect(getReleaseCommerceLink(externalRelease as any)).resolves.toEqual({
      href: '/blackbox-records/store/caregivers-vinyl/',
      isNativeStoreLink: true,
      label: 'View In Store',
    });
  });
});
