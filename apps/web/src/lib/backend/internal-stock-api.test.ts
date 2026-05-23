import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { apiClientMswBaseUrl, internalStockFixtures } from '@blackbox/api-client/test/msw-handlers';
import { webMswServer } from '@/test/msw-server';
import {
  buildInternalStockApiUrl,
  createInternalStockApi,
  getInternalStockApiBaseUrl,
  InternalStockApiError,
  type InternalStockChangeBody,
} from './internal-stock-api';

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
    let receivedQuery = '';
    webMswServer.use(
      http.get<Record<string, never>, never, (typeof internalStockFixtures.variant)[]>(
        '*/api/internal/variants',
        ({ request }) => {
          receivedQuery = new URL(request.url).searchParams.toString();

          return HttpResponse.json([internalStockFixtures.variant]);
        },
      ),
    );
    const api = createInternalStockApi({ backendBaseUrl: apiClientMswBaseUrl });

    const result = await api.searchVariants('after', 10);

    expect(result).toEqual([internalStockFixtures.variant]);
    expect(receivedQuery).toBe('limit=10&q=after');
  });

  it('posts stock changes without client-submitted actor attribution', async () => {
    let receivedBody: InternalStockChangeBody | null = null;
    webMswServer.use(
      http.post<{ variantId: string }, InternalStockChangeBody>(
        '*/api/internal/variants/:variantId/stock/changes',
        async ({ request }) => {
          receivedBody = (await request.json()) as InternalStockChangeBody;

          return HttpResponse.json({
            entry: {
              actorEmail: 'operator@example.com',
              id: 'stock_change_test_123',
              notes: receivedBody.notes ?? null,
              quantityDelta: receivedBody.delta,
              reason: receivedBody.reason,
              recordedAt: '2026-05-23T10:20:00.000Z',
              type: 'change',
              variantId: internalStockFixtures.variant.variantId,
            },
            stock: internalStockFixtures.stockDetail.stock,
            variantId: internalStockFixtures.variant.variantId,
          });
        },
      ),
    );
    const api = createInternalStockApi({ backendBaseUrl: apiClientMswBaseUrl });

    await api.recordStockChange('variant_barren-point_standard', {
      delta: -1,
      notes: 'Table sale',
      reason: 'sale',
    });

    expect(receivedBody).toEqual({
      delta: -1,
      notes: 'Table sale',
      reason: 'sale',
    });
  });

  it('surfaces API error messages for operator-visible failure states', async () => {
    webMswServer.use(
      http.get<Record<string, never>, never, typeof internalStockFixtures.missingOperatorIdentity>(
        '*/api/internal/variants',
        () => HttpResponse.json(internalStockFixtures.missingOperatorIdentity, { status: 401 }),
      ),
    );
    const api = createInternalStockApi({ backendBaseUrl: apiClientMswBaseUrl });

    await expect(api.searchVariants()).rejects.toEqual(new InternalStockApiError(401, 'Missing operator identity.'));
  });

  it('falls back to status-based errors when a non-JSON response reaches the UI', async () => {
    webMswServer.use(http.get('*/api/internal/variants', () => HttpResponse.text('<!doctype html>', { status: 404 })));
    const api = createInternalStockApi({ backendBaseUrl: apiClientMswBaseUrl });

    await expect(api.searchVariants()).rejects.toEqual(
      new InternalStockApiError(404, 'Internal stock API request failed with 404.'),
    );
  });
});
