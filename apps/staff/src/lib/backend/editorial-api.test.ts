import { afterEach, expect, it, vi } from 'vitest';
import { createEditorialDraft, editorialSlug } from './editorial-api';

afterEach(() => vi.unstubAllGlobals());

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
