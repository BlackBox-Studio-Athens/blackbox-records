import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ShellOverlayPanel from './ShellOverlayPanel';

const refs = {
  closeButtonRef: { current: null },
  scrollContainerRef: { current: null },
};

describe('ShellOverlayPanel', () => {
  it('renders the closed overlay shell without detail content', () => {
    const html = renderToStaticMarkup(<ShellOverlayPanel {...refs} overlayState={null} onClose={vi.fn()} />);

    expect(html).toContain('data-state="closed"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('>detail</span>');
    expect(html).not.toContain('app-shell-content-overlay__content');
  });

  it('renders loaded overlay content with the route kind label', () => {
    const html = renderToStaticMarkup(
      <ShellOverlayPanel
        {...refs}
        onClose={vi.fn()}
        overlayState={{
          backgroundHref: 'https://example.test/blackbox-records/',
          href: 'https://example.test/blackbox-records/releases/disintegration/',
          html: '<article>Disintegration</article>',
          isLoading: false,
          route: {
            kind: 'releases',
            pathname: '/releases/disintegration/',
            slug: 'disintegration',
          },
        }}
      />,
    );

    expect(html).toContain('data-state="open"');
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain('>release</span>');
    expect(html).toContain('<article>Disintegration</article>');
  });

  it('renders a loading state without stale overlay html', () => {
    const html = renderToStaticMarkup(
      <ShellOverlayPanel
        {...refs}
        onClose={vi.fn()}
        overlayState={{
          backgroundHref: 'https://example.test/blackbox-records/',
          href: 'https://example.test/blackbox-records/artists/afterwise/',
          html: '',
          isLoading: true,
          route: {
            kind: 'artists',
            pathname: '/artists/afterwise/',
            slug: 'afterwise',
          },
        }}
      />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('>artist</span>');
    expect(html).not.toContain('<article>');
  });
});
