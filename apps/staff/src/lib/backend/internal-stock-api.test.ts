import { describe, expect, it, vi } from 'vitest';

import {
  buildInternalStockApiUrl,
  createInternalStockApi,
  getInternalStockApiBaseUrl,
  InternalStockApiError,
} from './internal-stock-api';

const variant = {
  sourceId: 'disintegration-black-vinyl-lp',
  sourceKind: 'release',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
} as const;

describe('getInternalStockApiBaseUrl', () => {
  it('uses same-origin internal API calls when PUBLIC_BACKEND_BASE_URL is unset', () => {
    expect(getInternalStockApiBaseUrl(undefined)).toBe('');
  });

  it('normalizes the configured backend base URL for local split-port development', () => {
    expect(getInternalStockApiBaseUrl(' http://127.0.0.1:8787/// ')).toBe('http://127.0.0.1:8787');
  });
});

describe('buildInternalStockApiUrl', () => {
  it('builds same-origin and configured URLs', () => {
    expect(buildInternalStockApiUrl('', '/api/internal/variants', { limit: 25, q: 'barren' })).toBe(
      '/api/internal/variants?limit=25&q=barren',
    );
    expect(buildInternalStockApiUrl('http://127.0.0.1:8787', '/api/internal/variants')).toBe(
      'http://127.0.0.1:8787/api/internal/variants',
    );
  });
});

describe('createInternalStockApi', () => {
  it('uses the injected fetcher with operator request defaults', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify([variant]), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    );
    const api = createInternalStockApi({ backendBaseUrl: 'http://127.0.0.1:8787', fetcher });

    await expect(api.searchVariants('after', 10)).resolves.toEqual([variant]);
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8787/api/internal/variants?limit=10&q=after', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {},
    });
  });

  it('posts stock changes without client-submitted actor attribution', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    const api = createInternalStockApi({ fetcher });

    await api.recordStockChange(variant.variantId, {
      delta: -1,
      notes: 'Table sale',
      reason: 'sale',
    });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/changes',
      {
        body: JSON.stringify({ delta: -1, notes: 'Table sale', reason: 'sale' }),
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
    );
  });

  it('updates the per-item restock plan with the revision from stock detail', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ...variant, stock: {} }), { status: 200 }));
    const api = createInternalStockApi({ fetcher });

    await api.setRestockPlanned(variant.variantId, { expectedRevision: null, restockPlanned: true });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/restock-plan',
      {
        body: JSON.stringify({ expectedRevision: null, restockPlanned: true }),
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      },
    );
  });

  it('surfaces JSON and status-based API errors', async () => {
    const jsonErrorApi = createInternalStockApi({
      fetcher: async () => new Response(JSON.stringify({ error: 'Missing operator identity.' }), { status: 401 }),
    });
    const htmlErrorApi = createInternalStockApi({
      fetcher: async () => new Response('<!doctype html>', { status: 404 }),
    });

    await expect(jsonErrorApi.searchVariants()).rejects.toEqual(
      new InternalStockApiError(401, 'Missing operator identity.'),
    );
    await expect(htmlErrorApi.searchVariants()).rejects.toEqual(
      new InternalStockApiError(404, 'Internal stock API request failed with 404.'),
    );
  });

  it('prefers local RFC problem details and ignores foreign extensions', async () => {
    const problemApi = createInternalStockApi({
      fetcher: async () =>
        new Response(
          JSON.stringify({
            type: '/problems/not_found',
            title: 'Not Found',
            status: 404,
            detail: 'Variant not found.',
            code: 'not_found',
            error: 'Variant not found.',
          }),
          { status: 404, headers: { 'content-type': 'application/problem+json' } },
        ),
    });
    const foreignApi = createInternalStockApi({
      fetcher: async () =>
        new Response(
          JSON.stringify({ type: 'https://provider.example/problems/internal', detail: 'Private detail.' }),
          {
            status: 503,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
    });

    await expect(problemApi.searchVariants()).rejects.toEqual(new InternalStockApiError(404, 'Variant not found.'));
    await expect(foreignApi.searchVariants()).rejects.toEqual(
      new InternalStockApiError(503, 'Internal stock API request failed with 503.'),
    );
  });
});
