import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import StockOperationsApp, { canSubmitStockMutation, readStockLoadingLabel } from './StockOperationsApp';

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
