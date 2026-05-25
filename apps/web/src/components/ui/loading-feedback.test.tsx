import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LoadingButtonContent, LoadingInline, LoadingStateBlock } from './loading-feedback';

describe('loading feedback primitives', () => {
  it('renders inline visible status copy with polite live semantics', () => {
    const html = renderToStaticMarkup(<LoadingInline label="Checking availability" />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Checking availability');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('loading-feedback-mark');
    expect(html).toContain('loading-feedback-mark__scale');
    expect(html).toContain('animate-spin');
  });

  it('renders button loading content without adding another live region', () => {
    const html = renderToStaticMarkup(<LoadingButtonContent label="Opening Stripe Checkout" />);

    expect(html).toContain('Opening Stripe Checkout');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('loading-feedback-mark');
    expect(html).not.toContain('role="status"');
  });

  it('renders a busy loading block for empty pending panels', () => {
    const html = renderToStaticMarkup(
      <LoadingStateBlock title="Confirming payment status" description="Keep this tab open." />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Confirming payment status');
    expect(html).toContain('Keep this tab open.');
    expect(html).toContain('loading-feedback-mark');
  });
});
