import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ReleaseDateMetadata from './ReleaseDateMetadata';

describe('shared direct/overlay release date metadata SSR', () => {
  it('renders the catalog alone when the optional digital date is absent', () => {
    const html = renderToStaticMarkup(<ReleaseDateMetadata catalogNumber="BBR#003" />);
    expect(html).toContain('Catalog number ');
    expect(html).toContain('BBR#003');
    expect(html).not.toMatch(/Digital release|<time|Date to be announced|aria-hidden/);
  });

  it('retains the dated label, semantic time and independent catalog', () => {
    const html = renderToStaticMarkup(
      <ReleaseDateMetadata date={new Date('2026-06-06T00:00:00Z')} catalogNumber="BBR#003" />,
    );
    expect(html).toContain('<span>Digital release</span>');
    expect(html).toContain('<time dateTime="2026-06-06">');
    expect(html.match(/data-release-catalog-number=/g)).toHaveLength(1);
    expect(html).toContain('BBR#003');
  });
});
