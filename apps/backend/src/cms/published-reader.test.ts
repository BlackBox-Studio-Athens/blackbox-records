import { describe, expect, it, vi } from 'vitest';
import { publishedCollection, type PublicContent } from '@blackbox/content-model';
import { getCollection, getEntry, publishedContext } from './published-reader';

// Same accepted Artist/image fixture as scripts/cms-content-schema.test.mjs.
function snapshot(title = 'Artist'): PublicContent {
  return {
    records: [
      {
        collection: 'artists',
        id: 'identity',
        slug: 'artist',
        data: {
          title,
          genre: 'Hardcore',
          bio: 'Biography',
          image: { id: 'image' },
          image_alt: 'Portrait',
        },
      },
    ],
    media: [
      {
        id: 'image',
        sha256: 'a'.repeat(64),
        filename: 'image.png',
        mimeType: 'image/png',
        size: 1,
        width: 1,
        height: 1,
      },
    ],
  };
}

describe('published reader projection reuse', () => {
  it('reuses snapshot/media projections and indexes IDs without exposing a mutable collection array', async () => {
    const accepted = snapshot();
    const expected = publishedCollection(accepted, 'artists', '/media');
    await publishedContext.run({ snapshot: accepted, mediaBase: '/media' }, async () => {
      const entries = await getCollection('artists');
      expect(entries).toEqual(expected);
      const traversal = vi.spyOn(accepted.records, 'filter');
      expect(await getEntry('artists', 'artist')).toBe(entries[0]);
      expect(await getEntry({ collection: 'artists', id: 'artist' })).toBe(entries[0]);
      expect(await getEntry('artists', 'identity')).toBeUndefined();
      expect(await getEntry('artists', 'missing')).toBeUndefined();
      const filtered = await getCollection('artists', (entry) => entry.id === 'artist');
      expect(filtered).toEqual(entries);
      entries.length = 0;
      expect(await getCollection('artists')).toHaveLength(1);
      expect(traversal).not.toHaveBeenCalled();
    });
  });

  it('isolates accepted snapshot objects, media origins, and concurrent render contexts', async () => {
    const first = snapshot('First');
    const second = snapshot('Second');
    const read = (accepted: PublicContent, mediaBase: string) =>
      publishedContext.run({ snapshot: accepted, mediaBase }, () => getEntry('artists', 'artist'));
    const [one, two, alternate] = await Promise.all([read(first, '/one'), read(second, '/one'), read(first, '/two')]);
    expect(one?.data.title).toBe('First');
    expect(two?.data.title).toBe('Second');
    expect(one?.data.image).toMatchObject({ src: `/one/${'a'.repeat(64)}` });
    expect(alternate?.data.image).toMatchObject({ src: `/two/${'a'.repeat(64)}` });
    expect(await read(first, '/one')).toBe(one);
  });

  it('bypasses both projection and entry reuse for any preview override object', async () => {
    const accepted = snapshot();
    const publicEntry = await publishedContext.run({ snapshot: accepted, mediaBase: '/media' }, () =>
      getEntry('artists', 'artist'),
    );
    const previews: NonNullable<Parameters<typeof publishedContext.run>[0]['images']>[] = [
      {},
      { image: { src: '/private', width: 2, height: 3, format: 'png' } },
    ];
    for (const images of previews) {
      await publishedContext.run({ snapshot: accepted, mediaBase: '/media', images }, async () => {
        const first = await getEntry('artists', 'artist');
        accepted.records[0]!.data.title = 'Edited preview';
        const second = await getEntry('artists', 'artist');
        expect(second).not.toBe(first);
        expect(second?.data.title).toBe('Edited preview');
        expect(publicEntry?.data.title).toBe('Artist');
        if ('image' in images) expect(second?.data.image).toBe(images.image);
      });
    }
  });

  it('preserves missing-context errors', async () => {
    await expect(getCollection('artists')).rejects.toThrow('Published content context required.');
    await expect(getEntry('artists')).rejects.toThrow('Published content context required.');
  });

  it('retains first-match entry semantics when singleton projections share the site ID', async () => {
    const accepted: PublicContent = {
      media: [],
      records: [
        { collection: 'settings', id: 'first', slug: 'first', data: { title: 'First' } },
        { collection: 'settings', id: 'second', slug: 'second', data: { title: 'Second' } },
      ],
    };
    await publishedContext.run({ snapshot: accepted, mediaBase: '/media' }, async () => {
      expect((await getEntry('settings', 'site'))?.data.title).toBe('First');
    });
  });
});
