import { describe, expect, it, vi } from 'vitest';

import { buildInternalStockApiUrl, createInternalStockApi, getInternalStockApiBaseUrl, InternalStockApiError } from './internal-stock-api';

describe('getInternalStockApiBaseUrl', () => {
    it('uses same-origin internal API calls when PUBLIC_BACKEND_BASE_URL is unset', () => {
        expect(getInternalStockApiBaseUrl(undefined)).toBe('');
    });

    it('normalizes the configured backend base URL for local split-port development', () => {
        expect(getInternalStockApiBaseUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787');
    });
});

describe('buildInternalStockApiUrl', () => {
    it('builds same-origin URLs by default', () => {
        expect(buildInternalStockApiUrl('', '/api/internal/variants', { limit: 25, q: 'barren' })).toBe(
            '/api/internal/variants?limit=25&q=barren',
        );
    });

    it('builds configured backend URLs for local development', () => {
        expect(buildInternalStockApiUrl('http://127.0.0.1:8787', '/api/internal/variants')).toBe(
            'http://127.0.0.1:8787/api/internal/variants',
        );
    });
});

describe('createInternalStockApi', () => {
    it('searches variants through the protected internal API', async () => {
        const fetcher = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
        const api = createInternalStockApi({ fetcher });

        await api.searchVariants('after', 10);

        expect(fetcher).toHaveBeenCalledWith('/api/internal/variants?limit=10&q=after', expect.objectContaining({ credentials: 'include' }));
    });

    it('posts stock changes without client-submitted actor attribution', async () => {
        const fetcher = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
        const api = createInternalStockApi({ fetcher });

        await api.recordStockChange('variant_barren-point_standard', {
            delta: -1,
            notes: 'Table sale',
            reason: 'sale',
        });

        const calls = fetcher.mock.calls as unknown as [string, RequestInit][];
        const request = calls[0]?.[1] as RequestInit;
        expect(request.method).toBe('POST');
        expect(JSON.parse(String(request.body))).toEqual({
            delta: -1,
            notes: 'Table sale',
            reason: 'sale',
        });
    });

    it('surfaces API error messages for operator-visible failure states', async () => {
        const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'Missing operator identity.' }), { status: 401 }));
        const api = createInternalStockApi({ fetcher });

        await expect(api.searchVariants()).rejects.toEqual(new InternalStockApiError(401, 'Missing operator identity.'));
    });

    it('falls back to status-based errors when a non-JSON response reaches the UI', async () => {
        const fetcher = vi.fn(async () => new Response('<!doctype html>', { status: 404 }));
        const api = createInternalStockApi({ fetcher });

        await expect(api.searchVariants()).rejects.toEqual(new InternalStockApiError(404, 'Internal stock API request failed with 404.'));
    });
});
