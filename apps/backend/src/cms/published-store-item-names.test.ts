import { describe, expect, it, vi } from 'vitest';

import { createPublishedStoreItemNameReader, publishedStoreItemNames } from './published-store-item-names';

const record = (collection: string, id: string, slug: string, data: Record<string, unknown>) => ({
  collection,
  id,
  revisionId: `${id}-rev`,
  slug,
  data,
});

const snapshot = {
  records: [
    record('artists', 'artist-1', 'ouranopithecus', { title: 'Ouranopithecus' }),
    record('releases', 'release-1', 'anarchotribal', { title: 'Anarchotribal', artist: 'artist-1' }),
    record('distro', 'distro-1', 'grey-tape', { title: ' Grey Tape ', artist_or_label: 'Some Label' }),
    record('distro', 'distro-2', 'blank', { title: '  ', artist_or_label: 'Nobody' }),
  ],
  storeItems: [
    {
      sourceKind: 'release' as const,
      sourceId: 'anarchotribal',
      storeItemSlug: 'anarchotribal-vinyl',
      variantId: 'variant_a',
    },
    { sourceKind: 'distro' as const, sourceId: 'grey-tape', storeItemSlug: 'grey-tape', variantId: 'variant_b' },
    { sourceKind: 'distro' as const, sourceId: 'blank', storeItemSlug: 'blank', variantId: 'variant_c' },
    { sourceKind: 'release' as const, sourceId: 'missing', storeItemSlug: 'missing', variantId: 'variant_d' },
  ],
};

describe('published Store Item names', () => {
  it('names each published Store Item with its CMS title and artist', () => {
    expect(
      Object.fromEntries(publishedStoreItemNames(snapshot as Parameters<typeof publishedStoreItemNames>[0])),
    ).toEqual({
      'anarchotribal-vinyl': { title: 'Anarchotribal', artist: 'Ouranopithecus' },
      'grey-tape': { title: 'Grey Tape', artist: 'Some Label' },
    });
  });

  it('reads the accepted publication once per reader and names nothing before one is accepted', async () => {
    const sha = 'a'.repeat(64);
    // The manifest is fully validated on read; the naming itself is covered above.
    const manifest = JSON.stringify({ schemaVersion: 1, environment: 'uat', media: [], records: [], storeItems: [] });
    const object = (body: string, sha256?: string) => ({
      size: body.length,
      etag: 'etag',
      checksums: { toJSON: () => ({ sha256 }) },
      body: { cancel: vi.fn() },
      json: async () => JSON.parse(body),
      text: async () => body,
    });
    const pointer = JSON.stringify({ id: crypto.randomUUID(), snapshotSha256: sha, generation: 1 });
    const get = vi.fn(async (key: string) =>
      key === 'snapshots/uat/current.json'
        ? object(pointer)
        : key === `snapshots/uat/manifest/${sha}`
          ? object(manifest, sha)
          : null,
    );
    const read = createPublishedStoreItemNameReader({ get } as unknown as R2Bucket, 'uat');

    await expect(read('anarchotribal-vinyl')).resolves.toBeNull();
    await expect(read('missing')).resolves.toBeNull();
    expect(get).toHaveBeenCalledTimes(2);

    const empty = createPublishedStoreItemNameReader({ get: async () => null } as unknown as R2Bucket, 'uat');
    await expect(empty('anarchotribal-vinyl')).resolves.toBeNull();
  });
});
