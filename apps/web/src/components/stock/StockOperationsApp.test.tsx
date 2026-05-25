import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import StockOperationsApp, { readStockLoadingLabel } from './StockOperationsApp';

describe('StockOperationsApp loading feedback', () => {
  it('renders initial stock workspace loading as a visible busy state', () => {
    const html = renderToStaticMarkup(<StockOperationsApp backendBaseUrl="http://127.0.0.1:8787" />);

    expect(html).toContain('Loading stock workspace.');
    expect(html).toContain('Loading stock workspace');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Searching variants"');
    expect(html).toContain('animate-spin');
  });

  it('uses canonical operator labels for stock read intents', () => {
    expect(readStockLoadingLabel('workspace')).toBe('Loading stock workspace');
    expect(readStockLoadingLabel('search')).toBe('Searching variants');
    expect(readStockLoadingLabel('variant')).toBe('Loading selected stock');
    expect(readStockLoadingLabel('refresh')).toBe('Refreshing stock');
  });
});
