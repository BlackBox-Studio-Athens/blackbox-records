import { afterEach, expect, it, vi } from 'vitest';
import {
  createEditorialDraft,
  editorialMediaUrl,
  editorialRequest,
  editorialSlug,
  editorialWriteData,
  staffThumbnailUrl,
  uploadArtwork,
} from './editorial-api';

afterEach(() => vi.unstubAllGlobals());

it('rejects unsupported artwork before decoding or uploading it', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(uploadArtwork('', new File(['image'], 'cover.avif', { type: 'image/avif' }))).rejects.toThrow(
    'Choose a JPG, PNG or WebP',
  );
  expect(fetch).not.toHaveBeenCalled();
});

it('resolves native media detail and list responses without loading foreign or private paths', () => {
  const media = { id: 'image', filename: 'cover.png', alt: null, storageKey: 'stored.png' };
  const origin = 'http://127.0.0.1:8799';
  const expected = `${origin}/_emdash/api/media/file/stored.png`;
  expect(editorialMediaUrl(media, origin)).toBe(expected);
  expect(editorialMediaUrl({ ...media, url: '/_emdash/api/media/file/stored.png' }, origin)).toBe(expected);
  expect(editorialMediaUrl({ ...media, url: 'https://foreign.invalid/image.png' }, origin)).toBe('');
  expect(editorialMediaUrl({ ...media, url: '/_emdash/api/media/file/../backup' }, origin)).toBe('');
});

it('builds private thumbnails only from approved native media identities', () => {
  const origin = 'http://127.0.0.1:8799';
  const media = { id: 'image', filename: 'cover.png', alt: null, storageKey: 'stored.png' };
  const { storageKey: _storageKey, ...mediaWithoutKey } = media;
  expect(staffThumbnailUrl(media, origin)).toBe(`${origin}/_emdash/api/blackbox/thumbnails/stored.png`);
  expect(staffThumbnailUrl({ ...mediaWithoutKey, meta: { storageKey: 'stored-2.webp' } }, origin)).toBe(
    `${origin}/_emdash/api/blackbox/thumbnails/stored-2.webp`,
  );
  expect(staffThumbnailUrl({ ...mediaWithoutKey, url: '/_emdash/api/media/file/stored-3.jpg' }, origin)).toBe(
    `${origin}/_emdash/api/blackbox/thumbnails/stored-3.jpg`,
  );
  expect(staffThumbnailUrl({ ...media, storageKey: 'café cover%2F.png' }, origin)).toBe(
    `${origin}/_emdash/api/blackbox/thumbnails/${encodeURIComponent('café cover%2F.png')}`,
  );
  expect(staffThumbnailUrl({ ...mediaWithoutKey, url: '/_emdash/api/media/file/caf%C3%A9%20cover.png' }, origin)).toBe(
    `${origin}/_emdash/api/blackbox/thumbnails/${encodeURIComponent('café cover.png')}`,
  );
  expect(staffThumbnailUrl({ ...media, storageKey: 'private/stored.png' }, origin)).toBe('');
  expect(staffThumbnailUrl({ ...mediaWithoutKey, url: 'https://foreign.invalid/file.png' }, origin)).toBe('');
  expect(staffThumbnailUrl({ ...mediaWithoutKey, url: '/_emdash/api/media/file/stored.png?x=1' }, origin)).toBe('');
});

it('uploads a PNG thumbnail capped at 96 pixels and 40 KiB', async () => {
  const bitmap = { width: 200, height: 100, close: vi.fn() };
  const context = { drawImage: vi.fn() };
  let thumbnailRenders = 0;
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: BlobCallback) => {
      thumbnailRenders++;
      callback(new Blob([thumbnailRenders === 1 ? new Uint8Array(40 * 1024 + 1) : 'png'], { type: 'image/png' }));
    }),
  } as unknown as HTMLCanvasElement;
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    const form = init.body as FormData;
    const thumbnail = form.get('thumbnail');
    expect(thumbnail).toBeInstanceOf(File);
    expect((thumbnail as File).type).toBe('image/png');
    expect((thumbnail as File).size).toBeLessThanOrEqual(40 * 1024);
    expect(canvas.width).toBe(76);
    expect(canvas.height).toBe(38);
    expect(await (form.get('file') as File).text()).toBe('original');
    return new Response(JSON.stringify({ success: true, data: { item: { id: 'image' } } }), { status: 201 });
  });
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => bitmap),
  );
  vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
  vi.stubGlobal('fetch', fetch);
  await uploadArtwork('', new File(['original'], 'cover.jpg', { type: 'image/jpeg' }));
  expect(thumbnailRenders).toBe(2);
  expect(bitmap.close).toHaveBeenCalledOnce();
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

it('prefers local problem details and ignores foreign problem documents', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          type: '/problems/invalid_editorial_save',
          title: 'Invalid editorial save.',
          status: 422,
          detail: 'The title is required.',
          code: 'invalid_editorial_save',
          error: { message: 'The title is required.' },
        }),
        { status: 422, headers: { 'content-type': 'application/problem+json' } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ type: 'https://provider.example/problems/internal', detail: 'Private provider detail.' }),
        { status: 422, headers: { 'content-type': 'application/problem+json' } },
      ),
    );
  vi.stubGlobal('fetch', fetch);

  await expect(editorialRequest('', 'content/artists/artist-one', { data: {} }, 'POST')).rejects.toMatchObject({
    status: 422,
    message: 'The title is required.',
  });
  await expect(editorialRequest('', 'content/artists/artist-one', { data: {} }, 'POST')).rejects.toMatchObject({
    status: 422,
    message: 'We could not confirm this request. Check your connection and try again.',
  });
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
