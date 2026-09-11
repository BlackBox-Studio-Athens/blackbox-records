import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInternalOrderApi, InternalOrderApiError } from './internal-order-api';
import { exampleOrder } from '../../components/orders/order-fixtures.test-support';

afterEach(() => vi.unstubAllGlobals());

describe('Protected order reads', () => {
  it('uses the generated client for bounded filters, encoded exact lookup and private GETs', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json([exampleOrder]))
      .mockResolvedValueOnce(Response.json(exampleOrder));
    vi.stubGlobal('fetch', fetcher);
    const api = createInternalOrderApi();
    await expect(api.list('needs_review')).resolves.toEqual([exampleOrder]);
    await expect(api.detail('cs_unsafe/path ?&')).resolves.toEqual(exampleOrder);
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/internal/orders?limit=100&status=needs_review');
    expect(fetcher.mock.calls[1]?.[0]).toBe('/api/internal/orders/checkout-sessions/cs_unsafe%2Fpath%20%3F%26');
    for (const [, init] of fetcher.mock.calls)
      expect(init).toMatchObject({ method: 'GET', cache: 'no-store', credentials: 'same-origin' });
  });
  it.each([401, 403, 404, 500, 503])('preserves status %i without exposing the response body', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>private provider details</html>', { status })),
    );
    const api = createInternalOrderApi();
    await expect(api.detail('cs_example')).rejects.toEqual(new InternalOrderApiError(status));
    expect(new InternalOrderApiError(status).message).not.toContain('private provider');
  });
  it.each([401, 403])('preserves denial %i even when its JSON is malformed', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{broken', { status, headers: { 'content-type': 'application/json' } })),
    );
    await expect(createInternalOrderApi().list()).rejects.toEqual(new InternalOrderApiError(status));
  });
  it('rejects an Access login document returned instead of order JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('<html>Sign in</html>')),
    );
    await expect(createInternalOrderApi().list()).rejects.toBeInstanceOf(InternalOrderApiError);
    await expect(createInternalOrderApi().detail('cs_example')).rejects.toBeInstanceOf(InternalOrderApiError);
  });
});
