import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import StockOperationsApp, {
  canSubmitStockMutation,
  readStockLoadingLabel,
  shouldApplyStockLoadResult,
} from './StockOperationsApp';

describe('Stock operations loading feedback', () => {
  it('renders initial stock workspace loading as a visible busy state', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" />);

    expect(html).toContain('Loading items.');
    expect(html).toContain('Choose an item to see its stock.');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Searching items"');
    expect(html).toContain('animate-spin');
  });

  it('uses canonical operator labels for stock read intents', () => {
    expect(readStockLoadingLabel('workspace')).toBe('Loading stock workspace');
    expect(readStockLoadingLabel('search')).toBe('Searching items');
    expect(readStockLoadingLabel('variant')).toBe('Loading selected stock');
    expect(readStockLoadingLabel('refresh')).toBe('Refreshing stock');
  });

  it('ignores stale variant load responses after a newer request starts', () => {
    expect(shouldApplyStockLoadResult(2, 1)).toBe(false);
    expect(shouldApplyStockLoadResult(2, 2)).toBe(true);
  });

  it('blocks stock mutations until selected Variant and loaded Stock detail match', () => {
    expect(canSubmitStockMutation('variant_b', { variantId: 'variant_a' })).toBe(false);
    expect(canSubmitStockMutation('variant_b', null)).toBe(false);
    expect(canSubmitStockMutation('variant_b', { variantId: 'variant_b' })).toBe(true);
  });

  it('keeps Items read-only for stock and focused on catalog work', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" mode="items" />);

    expect(html).toContain('Prepare catalog items, set prices, and publish them when ready.');
    expect(html).not.toContain('Adjust stock');
    expect(html).not.toContain('Count stock');
    expect(html).not.toContain('Recent history');
  });

  it('keeps Stock focused on inventory operations without catalog publishing controls', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" mode="stock" />);

    expect(html).toContain('Keep physical and online stock aligned.');
    expect(html).toContain('Adjust stock');
    expect(html).toContain('Count stock');
    expect(html).toContain('Recent history');
    expect(html).not.toContain('Prepare catalog items, set prices, and publish them when ready.');
  });
});
