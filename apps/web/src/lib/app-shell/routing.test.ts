import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { buildOverlayFragmentUrl, normalizeAppPathname, parseOverlayRoute, parseShellSectionRoute } from './routing';

describe('app shell routing helpers', () => {
  it('normalizes project base paths and index documents', () => {
    expect(normalizeAppPathname('/blackbox-records/releases/index.html')).toBe('/releases/');
    expect(normalizeAppPathname('/blackbox-records/')).toBe('/');
    expect(normalizeAppPathname('artists/')).toBe('/artists/');
  });

  it('recognizes top-level shell section routes', () => {
    expect(parseShellSectionRoute('/blackbox-records/store/')).toEqual({
      kind: 'store',
      pathname: '/store/',
    });
    expect(parseShellSectionRoute('/blackbox-records/store/disintegration-black-vinyl-lp/')).toBeNull();
  });

  it('recognizes detail routes that can render as overlays', () => {
    expect(parseOverlayRoute('/blackbox-records/releases/disintegration/')).toEqual({
      kind: 'releases',
      pathname: '/releases/disintegration/',
      slug: 'disintegration',
    });
    expect(parseOverlayRoute('/blackbox-records/services/')).toBeNull();
  });

  it('builds overlay fragment URLs from normalized detail routes', () => {
    expect(buildOverlayFragmentUrl('/blackbox-records/news/launch-note/')).toBe(
      '/blackbox-records/app-shell-overlay/news/launch-note/',
    );
  });
});
