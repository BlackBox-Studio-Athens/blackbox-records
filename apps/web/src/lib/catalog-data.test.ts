import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getEntry: vi.fn(async (reference: { id: string }) => ({
    data: {
      slug: 'afterwise',
      title: reference.id === 'afterwise' ? 'Afterwise' : 'Artist',
    },
  })),
}));

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  createCatalogItemFromDistroEntry,
  createCatalogItemFromRelease,
  groupDistroEntries,
} from './catalog-data';

describe('groupDistroEntries', () => {
  it('returns distro groups in the intended editorial order and omits empty groups', () => {
    const entries = [
      { data: { group: 'Tapes', order: 5, title: 'C' } },
      { data: { group: 'Vinyls', order: 1, title: 'A' } },
      { data: { group: 'Clothes', order: 3, title: 'B' } },
    ] as any;

    const groups = groupDistroEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual(['Vinyls', 'Clothes', 'Tapes']);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.entries).toHaveLength(1);
    expect(groups[2]?.entries).toHaveLength(1);
  });
});

describe('CatalogItem projection contract', () => {
  it('creates a release-derived catalog item with stable shop and checkout paths', async () => {
    const catalogItem = await createCatalogItemFromRelease({
      id: 'caregivers',
      data: {
        artist: { id: 'afterwise' },
        cover_image: { src: '/cover.jpg' },
        cover_image_alt: 'Caregivers cover',
        formats: ['LP', 'Digital'],
        release_date: new Date('2024-11-02T00:00:00.000Z'),
        summary: 'Release summary',
        title: 'Caregivers',
      },
    } as any);

    expect(catalogItem).toEqual({
      slug: 'caregivers',
      sourceKind: 'release',
      sourceId: 'caregivers',
      title: 'Caregivers',
      subtitle: 'Afterwise',
      summary: 'Release summary',
      image: { src: '/cover.jpg' },
      imageAlt: 'Caregivers cover',
      eyebrow: 'Release',
      metadata: ['2024', 'LP', 'Digital'],
      shopPath: '/blackbox-records/shop/caregivers/',
      checkoutPath: '/blackbox-records/shop/caregivers/checkout/',
    });
  });

  it('creates a distro-derived catalog item without leaking external-shop fields', () => {
    const catalogItem = createCatalogItemFromDistroEntry({
      id: 'afterglow-tape',
      data: {
        artist_or_label: 'Afterglow',
        eyebrow: 'Tape',
        format: 'Cassette',
        fourthwall_url: 'https://blackboxrecords-shop.fourthwall.com/collections/all',
        group: 'Tapes',
        image: { src: '/afterglow.jpg' },
        image_alt: 'Afterglow tape',
        summary: 'Small-run cassette.',
        title: 'Afterglow Tape',
      },
    } as any);

    expect(catalogItem.sourceKind).toBe('distro');
    expect(catalogItem.shopPath).toBe('/blackbox-records/shop/afterglow-tape/');
    expect(catalogItem.checkoutPath).toBe('/blackbox-records/shop/afterglow-tape/checkout/');
    expect(catalogItem.metadata).toEqual(['Tapes', 'Cassette']);
    expect(catalogItem).not.toHaveProperty('fourthwall_url');
    expect(catalogItem).not.toHaveProperty('merch_url');
  });
});
