import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { InternalStockDetail } from '../../lib/backend/internal-stock-api';
import PreorderControl from './PreorderControl';

type Preorder = NonNullable<InternalStockDetail['stock']['preorder']>;
const preorder: Preorder = {
  startedAt: '2026-10-01T10:00:00Z',
  open: true,
  shipEstimate: { kind: 'month', month: '2026-10', part: null },
};
const render = (value: Preorder | null, disabled = false, busy = false) =>
  renderToStaticMarkup(
    <PreorderControl preorder={value} today="2026-10-02" disabled={disabled} busy={busy} onSave={vi.fn()} />,
  );

describe('PreorderControl', () => {
  it('renders a labelled native switch and ordinary state when ended', () => {
    const html = render(null);
    expect(html).toContain('role="switch"');
    expect(html).toContain('Take orders before the copies are on the shelf.');
    expect(html).toContain('What shoppers see');
    expect(html).toContain('Not on pre-order');
    expect(html).not.toContain('Save pre-order');
    expect(html).not.toContain('Copies arrived');
  });

  it('offers eighteen Athens months with native labelled month and part selectors', () => {
    const html = render(preorder);
    expect(html.match(/value="20\d{2}-\d{2}"/g)).toHaveLength(18);
    expect(html).toContain('value="2026-10" selected=""');
    expect(html).toContain('value="2028-03"');
    expect(html).not.toContain('value="2028-04"');
    expect(html).toContain('When it ships');
    expect(html).toContain('About a month');
    expect(html).toContain('Exact date');
    expect(html).toContain('Any time in the month');
    for (const label of ['Early', 'Mid', 'Late']) expect(html).toContain('>' + label + '</option>');
    expect(html).toContain('Shoppers see &quot;ships around October 2026&quot;.');
    expect(html).toContain('Copies: enter the number you expect as the stock quantity.');
    expect(html).toContain('Save pre-order');
    expect(html).toContain('Copies arrived');
    expect(html).toContain(
      'Ends the pre-order now. If the plant slips, change the estimate instead: every waiting order gets an email.',
    );
    expect(html.match(/<label[^>]*for=/g)).toHaveLength(3);
  });

  it('retains a passed stored month with its warning and withheld preview', () => {
    const html = render({ ...preorder, shipEstimate: { kind: 'month', month: '2026-09', part: 'mid' } });
    expect(html).toContain('value="2026-09" selected=""');
    expect(html.match(/value="20\d{2}-\d{2}"/g)).toHaveLength(19);
    expect(html).toContain('This month has passed. Shoppers see Pre-order without a date until you update it.');
    expect(html).toContain('<li>Pre-order</li>');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Save pre-order<\/button>/);
    expect(html).toContain('Copies arrived');
  });

  it('uses a required native exact date after today and warns about automatic ending', () => {
    const html = render({ ...preorder, shipEstimate: { kind: 'date', date: '2026-10-20' } });
    expect(html).toContain('type="date"');
    expect(html).toContain('required=""');
    expect(html).toContain('min="2026-10-03"');
    expect(html).toContain('value="2026-10-20"');
    expect(html).toContain('On this date the pre-order ends by itself.');
    expect(html).toContain(
      'Enter an exact date only when you are sure of it. It ends the pre-order whether or not the copies arrived.',
    );
    expect(html).toContain('Pre-order · ships 20 Oct 2026');
  });

  it('disables the whole native fieldset while saving or without fresh stock', () => {
    expect(render(preorder, true)).toContain('<fieldset disabled=""');
    const saving = render(preorder, false, true);
    expect(saving).toContain('<fieldset disabled="" aria-busy="true"');
    expect(saving).toContain('Saving pre-order');
  });

  it('shows an automatically ended pre-order as off', () => {
    const html = render({ ...preorder, open: false, shipEstimate: { kind: 'date', date: '2026-10-01' } });
    expect(html).toContain('Not on pre-order');
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain('Save pre-order');
  });
});
