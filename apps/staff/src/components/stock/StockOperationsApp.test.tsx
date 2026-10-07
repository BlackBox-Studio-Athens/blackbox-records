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
  saveZeroStockState,
} from './StockOperationsApp';
import ZeroStockStateControl, { waitingShoppersText } from './ZeroStockStateControl';

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
    availabilityAlertCount: 0,
    stock: {
      revision: 7,
      quantity: 10,
      onlineQuantity: 10,
      zeroStockState: 'sold_out',
      expectedMonth: null,
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

describe('Stock operations zero-stock state', () => {
  const ok = () => new Response(JSON.stringify({}), { status: 200 });

  it('offers the three shopper states, the help text and a month only for Coming Soon or Repressing', () => {
    const render = (value: 'coming_soon' | 'repressing' | 'sold_out', waitingCount = 0) =>
      renderToStaticMarkup(
        <ZeroStockStateControl
          idPrefix="test"
          value={value}
          month="2026-11"
          waitingCount={waitingCount}
          onMonthChange={() => {}}
          onValueChange={() => {}}
        />,
      );
    const comingSoon = render('coming_soon', 12);
    expect(comingSoon).toContain('When sold out online, show');
    for (const label of ['Coming Soon', 'Repressing', 'Sold Out']) expect(comingSoon).toContain(label);
    expect(comingSoon).toContain('Shown only while no copies are available online.');
    expect(comingSoon).toMatch(/<input[^>]*type="month"[^>]*value="2026-11"/);
    expect(comingSoon).toContain('12 shoppers waiting for an email');
    expect(render('repressing')).toContain('type="month"');
    const soldOut = render('sold_out');
    expect(soldOut).not.toContain('type="month"');
    expect(soldOut).not.toContain('waiting for an email');
    expect(soldOut).not.toMatch(/Restock planned|Out of Stock/);
  });

  it('words the waiting count and hides it at zero', () => {
    expect(waitingShoppersText(0)).toBe('');
    expect(waitingShoppersText(undefined)).toBe('');
    expect(waitingShoppersText(1)).toBe('1 shopper waiting for an email');
    expect(waitingShoppersText(3)).toBe('3 shoppers waiting for an email');
  });

  it('saves the choice and month with the fresh revision, then rereads stock', async () => {
    const fetcher = vi.fn(async () => ok());
    const refresh = vi.fn(async () => {});
    const api = createInternalStockApi({ fetcher });
    expect(
      await saveZeroStockState(
        api,
        'variant_one',
        { expectedRevision: 7, zeroStockState: 'coming_soon', expectedMonth: '2026-11' },
        refresh,
      ),
    ).toEqual({ statusMessage: 'Saved what shoppers see when sold out.', errorMessage: null });
    expect(fetcher).toHaveBeenCalledWith('/api/internal/variants/variant_one/stock/zero-stock-state', {
      body: JSON.stringify({ expectedRevision: 7, zeroStockState: 'coming_soon', expectedMonth: '2026-11' }),
      method: 'PATCH',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('clears the month when staff choose Sold Out', async () => {
    const fetcher = vi.fn(async () => ok());
    await saveZeroStockState(
      createInternalStockApi({ fetcher }),
      'variant_one',
      { expectedRevision: 7, zeroStockState: 'sold_out', expectedMonth: '2026-11' },
      async () => {},
    );
    expect(fetcher).toHaveBeenCalledWith(
      '/api/internal/variants/variant_one/stock/zero-stock-state',
      expect.objectContaining({
        body: JSON.stringify({ expectedRevision: 7, zeroStockState: 'sold_out', expectedMonth: null }),
      }),
    );
  });

  it.each([
    [409, 'Stock changed. Review the current item before choosing again.'],
    [400, 'Choose a month that has not passed, or leave it empty.'],
  ] satisfies [number, string][])('refreshes after a %s failure with actionable feedback', async (status, message) => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify({ type: '/problems/conflict', detail: 'Rejected.', status }), { status }),
    );
    const refresh = vi.fn(async () => {});
    expect(
      await saveZeroStockState(
        createInternalStockApi({ fetcher }),
        'variant_one',
        { expectedRevision: 6, zeroStockState: 'repressing', expectedMonth: '2025-01' },
        refresh,
      ),
    ).toEqual({ statusMessage: message, errorMessage: 'Rejected.' });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
