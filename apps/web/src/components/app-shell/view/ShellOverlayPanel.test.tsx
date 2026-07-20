import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ShellOverlayPanel from './ShellOverlayPanel';

const globalCss = readFileSync(fileURLToPath(new URL('../../../styles/global.css', import.meta.url)), 'utf8');
const headerSource = readFileSync(fileURLToPath(new URL('../../header/HeaderShell.astro', import.meta.url)), 'utf8');

const refs = {
  closeButtonRef: { current: null },
  scrollContainerRef: { current: null },
};

describe('ShellOverlayPanel', () => {
  it('stacks above the fixed site header so its controls remain clickable', () => {
    const overlayZIndex = Number(/\.app-shell-content-overlay\s*\{[^}]*z-index:\s*(\d+)/s.exec(globalCss)?.[1]);
    const headerZIndex = Number(/z-\[(\d+)\]/.exec(headerSource)?.[1]);

    expect(overlayZIndex).toBeGreaterThan(headerZIndex);
  });

  it('renders the closed overlay shell without detail content', () => {
    const html = renderToStaticMarkup(
      <ShellOverlayPanel {...refs} overlayState={null} onClose={vi.fn()} onReady={vi.fn()} />,
    );

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
        onReady={vi.fn()}
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
        onReady={vi.fn()}
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
    expect(html).toContain('Loading detail');
    expect(html).toContain('Fetching the selected detail view.');
    expect(html).toContain('>artist</span>');
    expect(html).not.toContain('<article>');
  });
});
