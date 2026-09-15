import { describe, expect, it } from 'vitest';
import {
  createPreviewContext,
  getCollection,
  previewContext,
  previewInputSchema,
  readBoundedText,
} from '../../src/cms/preview-content';

const input = {
  collection: 'socials' as const,
  id: 'social-a',
  slug: 'bandcamp',
  data: { title: 'Unsaved Bandcamp', url: 'https://bandcamp.com', order: 0 },
};
const read = async (path: string) => {
  if (path === 'content/socials/social-a') return { item: { id: 'social-a', slug: 'bandcamp' } };
  if (path === 'content/socials?limit=100')
    return {
      items: [
        { id: 'social-a', slug: 'bandcamp', status: 'published', liveRevisionId: 'revision-a' },
        {
          id: 'social-b',
          slug: 'tidal',
          status: 'published',
          liveRevisionId: 'revision-b',
          data: { title: 'Another private draft' },
        },
        { id: 'social-c', slug: 'hidden', status: 'draft' },
      ],
    };
  if (path === 'revisions/revision-b')
    return {
      item: {
        id: 'revision-b',
        entryId: 'social-b',
        collection: 'socials',
        data: { title: 'Published Tidal', url: 'https://tidal.com', order: 1 },
      },
    };
  throw new Error(`Unexpected read: ${path}`);
};

describe('private preview content', () => {
  it('overlays only the selected unsaved record and reads surrounding published revisions', async () => {
    const context = await createPreviewContext(input, 'local', read);
    const items = await previewContext.run(context, () => getCollection('socials'));
    expect(items.map((item) => item.data.title)).toEqual(['Published Tidal', 'Unsaved Bandcamp']);
    expect(JSON.stringify(items)).not.toContain('Another private draft');
    expect(() => getCollection('socials')).toThrow('Private preview context is required');
  });

  it('isolates simultaneous unsaved edits across async rendering', async () => {
    const first = await createPreviewContext(input, 'uat', read);
    const second = await createPreviewContext(
      { ...input, data: { ...input.data, title: 'Second editor' } },
      'prd',
      read,
    );
    const titles = await Promise.all(
      [first, second].map((context) =>
        previewContext.run(context, async () => {
          await Promise.resolve();
          return (await getCollection('socials')).find((item) => item.id === 'bandcamp')?.data.title;
        }),
      ),
    );
    expect(titles).toEqual(['Unsaved Bandcamp', 'Second editor']);
  });

  it('rejects forged identities, unknown fields, and unsafe links', async () => {
    await expect(createPreviewContext({ ...input, slug: 'forged' }, 'local', read)).rejects.toThrow('Reload');
    await expect(createPreviewContext({ ...input, data: { ...input.data, stock: 99 } }, 'local', read)).rejects.toThrow(
      'Unsupported field',
    );
    await expect(
      createPreviewContext({ ...input, data: { ...input.data, url: 'javascript:alert(1)' } }, 'local', read),
    ).rejects.toThrow();
    expect(previewInputSchema.safeParse({ ...input, environment: 'prd' }).success).toBe(false);
    expect(previewInputSchema.safeParse({ ...input, id: '../secret' }).success).toBe(false);
  });

  it('rejects mismatched published revisions rather than displaying a different record', async () => {
    const context = await createPreviewContext(input, 'local', async (path) =>
      path.startsWith('revisions/')
        ? { item: { id: 'revision-b', entryId: 'wrong', collection: 'socials', data: {} } }
        : read(path),
    );
    await expect(context.getCollection('socials')).rejects.toThrow('Published content changed');
  });

  it('caps streamed input even without Content-Length', async () => {
    await expect(readBoundedText(new Response('12345').body, 4)).rejects.toThrow('size limit');
    await expect(readBoundedText(new Response('1234').body, 4)).resolves.toBe('1234');
  });

  it('rejects missing media and unpublished artist relationships', async () => {
    const release = {
      collection: 'releases' as const,
      id: 'release-a',
      slug: 'record',
      data: {
        title: 'Record',
        artist: 'artist-a',
        release_date: '2026-09-15',
        cover_image: { id: 'image-a' },
        cover_image_alt: 'Record sleeve',
      },
    };
    const readRelease = async (path: string) => {
      if (path === 'content/releases/release-a') return { item: { id: 'release-a', slug: 'record' } };
      if (path.startsWith('content/releases?') || path.startsWith('content/artists?')) return { items: [] };
      if (path === 'content/artists/artist-a')
        return { item: { id: 'artist-a', slug: 'private-artist', status: 'draft' } };
      if (path === 'media/image-a')
        return { item: { id: 'image-a', storageKey: 'cover.jpg', width: 1000, height: 1000, mimeType: 'image/jpeg' } };
      throw new Error('Image is unavailable.');
    };
    const context = await createPreviewContext(release, 'local', readRelease);
    await expect(context.getCollection('releases')).rejects.toThrow('Publish the linked Artist');
    const missing = await createPreviewContext(
      { ...release, data: { ...release.data, cover_image: { id: 'missing' } } },
      'local',
      readRelease,
    );
    await expect(missing.getCollection('releases')).rejects.toThrow('Image is unavailable');
  });
});
