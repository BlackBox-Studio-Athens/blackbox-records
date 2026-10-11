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
    for (const pathname of ['/store/', '/store/blackbox-releases/', '/store/distro/', '/store/merch/']) {
      expect(parseShellSectionRoute(`/blackbox-records${pathname}`)).toEqual({
        kind: 'store',
        pathname,
      });
    }
  });

  it('routes Store Items and purchase information through the shell so the player survives', () => {
    expect(parseShellSectionRoute('/blackbox-records/store/disintegration-black-vinyl-lp')).toEqual({
      kind: 'store-item',
      pathname: '/store/disintegration-black-vinyl-lp/',
    });
    for (const pathname of ['/terms/', '/privacy/', '/withdrawal/']) {
      expect(parseShellSectionRoute(`/blackbox-records${pathname}`)).toEqual({ kind: 'information', pathname });
    }
  });

  it('does not treat checkout routes, nested Store paths, or legacy Distro as shell sections', () => {
    for (const pathname of [
      '/store/checkout/',
      '/store/checkout/return/',
      '/store/disintegration-black-vinyl-lp/checkout/',
      '/store/disintegration-black-vinyl-lp/checkout/return/',
      '/distro/',
    ]) {
      expect(parseShellSectionRoute(`/blackbox-records${pathname}`)).toBeNull();
    }
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
