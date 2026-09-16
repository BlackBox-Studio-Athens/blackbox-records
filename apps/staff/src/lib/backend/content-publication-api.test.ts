import { afterEach, expect, it, vi } from 'vitest';
import { readContentPublications, requestContentPublication } from './content-publication-api';

afterEach(() => vi.unstubAllGlobals());

it('retries the same publication identity after a lost response and reads server-owned status', async () => {
  const input = { id: 'request-one', requestedRevision: 'revision-one' };
  const publication = { id: input.id, status: 'pending', requestedAt: 123 };
  let first = true;
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe('/_emdash/api/blackbox/publications');
    expect(init.credentials).toBe('same-origin');
    expect(init.cache).toBe('no-store');
    if (init.method === 'POST') {
      expect(JSON.parse(String(init.body))).toEqual(input);
      expect(init.headers).toMatchObject({ 'X-EmDash-Request': '1', 'Content-Type': 'application/json' });
      if (first) {
        first = false;
        throw new TypeError('Lost reply');
      }
      return Response.json(publication, { status: 202 });
    }
    return Response.json({ items: [publication] });
  });
  vi.stubGlobal('fetch', fetch);
  await expect(requestContentPublication('', input)).rejects.toThrow('Lost reply');
  expect(await requestContentPublication('', input)).toEqual(publication);
  expect(await readContentPublications('')).toEqual({ items: [publication] });
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('preserves a publication conflict status so the form can stop retrying a stale request', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ error: 'REVISION_NOT_PUBLISHED' }, { status: 409 })),
  );
  await expect(
    requestContentPublication('', { id: 'request-one', requestedRevision: 'old-revision' }),
  ).rejects.toMatchObject({ status: 409 });
});
