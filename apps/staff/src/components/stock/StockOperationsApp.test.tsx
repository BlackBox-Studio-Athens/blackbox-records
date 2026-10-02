import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  createInternalStockApi,
  type InternalStockDetail,
  type SetStockPreorderBody,
} from '../../lib/backend/internal-stock-api';
import StockOperationsApp, {
  canSubmitStockMutation,
  readStockLoadingLabel,
  saveStockPreorder,
} from './StockOperationsApp';

describe('Stock operations loading feedback', () => {
  it('renders initial stock workspace loading as a visible busy state', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" />);

    expect(html).toContain('Loading items.');
    expect(html).not.toContain('Current stock');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Inventory"');
    expect(html).toContain('aria-label="Inventory pages"');
  });

  it('uses canonical operator labels for stock read intents', () => {
    expect(readStockLoadingLabel('workspace')).toBe('Loading stock workspace');
    expect(readStockLoadingLabel('search')).toBe('Searching items');
    expect(readStockLoadingLabel('variant')).toBe('Loading selected stock');
    expect(readStockLoadingLabel('refresh')).toBe('Refreshing stock');
  });

  it('blocks stock mutations until selected Variant and loaded Stock detail match', () => {
    expect(canSubmitStockMutation('variant_b', { variantId: 'variant_a' })).toBe(false);
    expect(canSubmitStockMutation('variant_b', null)).toBe(false);
    expect(canSubmitStockMutation('variant_b', { variantId: 'variant_b' })).toBe(true);
  });

  it('keeps Stock focused on inventory operations without catalog publishing controls', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" />);

    expect(html).toContain('Count stock');
    expect(html).toContain('All formats');
    expect(html).not.toContain('Adjust stock');
    expect(html).not.toContain('stock-count-quantity');
    expect(html).not.toContain('Recent history');
    expect(html).not.toContain('Prepare catalog items, set prices, and publish them when ready.');
  });
});

describe('Stock operations pre-order writes', () => {
  const detail: InternalStockDetail = {
    variantId: 'variant_one',
    sourceId: 'one',
    sourceKind: 'release',
    storeItemSlug: 'one',
    stock: {
      revision: 7,
      quantity: 10,
      onlineQuantity: 10,
      restockPlanned: false,
      showLowStock: true,
      updatedAt: null,
      preorder: null,
    },
  };

  it.each([
    ['start', { kind: 'month', month: '2026-10', part: null }],
    ['change', { kind: 'date', date: '2026-10-20' }],
    ['Copies arrived / switch off', null],
  ] satisfies [string, SetStockPreorderBody['shipEstimate']][])(
    'saves %s with the fresh revision, then rereads stock',
    async (_action, shipEstimate) => {
      const fetcher = vi.fn(async () => new Response(JSON.stringify(detail), { status: 200 }));
      const api = createInternalStockApi({ fetcher });
      const refresh = vi.fn(async () => {
        await api.readStock(detail.variantId);
      });
      const result = await saveStockPreorder(
        api,
        detail.variantId,
        { expectedRevision: detail.stock.revision, shipEstimate },
        refresh,
      );
      expect(result).toEqual({
        statusMessage: shipEstimate ? 'Pre-order saved.' : 'Pre-order ended.',
        errorMessage: null,
      });
      expect(fetcher).toHaveBeenNthCalledWith(1, '/api/internal/variants/variant_one/stock/preorder', {
        body: JSON.stringify({ expectedRevision: 7, shipEstimate }),
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
      });
      expect(fetcher).toHaveBeenNthCalledWith(2, '/api/internal/variants/variant_one/stock', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {},
      });
      expect(refresh).toHaveBeenCalledOnce();
    },
  );

  it.each([
    [409, 'Stock revision changed.', 'Stock changed. Review the current item before retrying the pre-order.'],
    [400, 'Choose a future ship date.', 'Pre-order was not confirmed. Review the refreshed item before trying again.'],
  ] satisfies [number, string, string][])(
    'refreshes after a %s failure and gives actionable feedback',
    async (status, errorMessage, statusMessage) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              type: status === 409 ? '/problems/conflict' : '/problems/validation_error',
              detail: errorMessage,
              status,
            }),
            { status },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ...detail, stock: { ...detail.stock, revision: 8 } }), { status: 200 }),
        );
      const api = createInternalStockApi({ fetcher });
      let refreshed: InternalStockDetail | null = null;
      const refresh = vi.fn(async () => {
        refreshed = await api.readStock(detail.variantId);
      });
      expect(
        await saveStockPreorder(
          api,
          detail.variantId,
          {
            expectedRevision: 7,
            shipEstimate: { kind: 'date', date: '2026-10-20' },
          },
          refresh,
        ),
      ).toEqual({ statusMessage, errorMessage });
      expect(refreshed).toMatchObject({ stock: { revision: 8, showLowStock: true } });
      expect(refresh).toHaveBeenCalledOnce();
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );
});
