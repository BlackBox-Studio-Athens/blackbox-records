import { afterEach, expect, it, vi } from 'vitest';
import {
  createEditorialDraft,
  editorialMediaUrl,
  editorialRequest,
  editorialSlug,
  editorialWriteData,
} from './editorial-api';

afterEach(() => vi.unstubAllGlobals());

it('resolves native media detail and list responses without loading foreign or private paths', () => {
  const media = { id: 'image', filename: 'cover.png', alt: null, storageKey: 'stored.png' };
  const origin = 'http://127.0.0.1:8799';
  const expected = `${origin}/_emdash/api/media/file/stored.png`;
  expect(editorialMediaUrl(media, origin)).toBe(expected);
  expect(editorialMediaUrl({ ...media, url: '/_emdash/api/media/file/stored.png' }, origin)).toBe(expected);
  expect(editorialMediaUrl({ ...media, url: 'https://foreign.invalid/image.png' }, origin)).toBe('');
  expect(editorialMediaUrl({ ...media, url: '/_emdash/api/media/file/../backup' }, origin)).toBe('');
});

it('keeps native media identities and rich text while removing read-only image delivery metadata', () => {
  const image = { id: 'image-one', provider: 'local', width: 100, meta: { storageKey: 'private/image.png' } };
  const data = {
    title: 'Artist',
    image,
    gallery: [{ image, image_alt: 'Cover' }],
    body: [{ _type: 'block', children: [{ _type: 'span', text: 'Music' }] }],
  };
  expect(editorialWriteData(data)).toEqual({
    ...data,
    image: { id: 'image-one' },
    gallery: [{ image: { id: 'image-one' }, image_alt: 'Cover' }],
  });
  expect(data.image).toBe(image);
});

it('sends the exact saved revision and surfaces a stale save without retrying a write', async () => {
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({ _rev: 'saved-revision', data: { title: 'Changed title' } });
    return new Response(JSON.stringify({ error: { message: 'Conflict' } }), { status: 409 });
  });
  vi.stubGlobal('fetch', fetch);
  await expect(
    editorialRequest(
      '',
      'content/artists/artist-one',
      { _rev: 'saved-revision', data: { title: 'Changed title' } },
      'PUT',
    ),
  ).rejects.toMatchObject({ status: 409, message: expect.stringContaining('Your text is still here') });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('recovers a lost create reply by reading the same stable slug without another write', async () => {
  let created = false;
  let writes = 0;
  const command = { slug: editorialSlug('Áfterwise', 'stable-identity'), data: { title: 'Áfterwise' } };
  const item = { id: 'artist-one', ...command };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      expect(init.credentials).toBe('same-origin');
      if (init.method === 'POST') {
        expect(url).toBe('/_emdash/api/content/artists');
        expect(JSON.parse(String(init.body))).toEqual(command);
        expect(init.headers).toMatchObject({ 'X-EmDash-Request': '1' });
        writes++;
        created = true;
        throw new TypeError('Lost reply');
      }
      expect(url).toBe('/_emdash/api/content/artists/afterwise-stable-identity');
      return new Response(JSON.stringify({ success: created, data: { item } }), { status: created ? 200 : 404 });
    }),
  );
  await expect(createEditorialDraft('', 'artists', command)).rejects.toThrow('Lost reply');
  expect(await createEditorialDraft('', 'artists', command)).toEqual({ item });
  expect(writes).toBe(1);
  expect(editorialSlug('Ελληνικά', 'stable-identity')).toBe('item-stable-identity');
});
