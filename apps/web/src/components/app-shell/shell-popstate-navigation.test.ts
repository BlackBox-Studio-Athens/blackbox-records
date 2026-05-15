import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { routeShellPopStateNavigation } from './shell-popstate-navigation';

function createOptions(overrides: Partial<Parameters<typeof routeShellPopStateNavigation>[0]> = {}) {
  return {
    closeMobileNavigation: vi.fn(),
    closeOverlayState: vi.fn(),
    currentHref: 'https://example.test/blackbox-records/releases/disintegration/',
    currentPathname: '/blackbox-records/releases/disintegration/',
    hasCachedShellPage: vi.fn(() => false),
    historyState: {},
    openOverlayHref: vi.fn(),
    openShellSectionHref: vi.fn(),
    restoreCachedShellPage: vi.fn(),
    ...overrides,
  };
}

describe('shell popstate navigation', () => {
  it('restores overlay history entries before shell section navigation', () => {
    const options = createOptions({
      historyState: {
        __appShellOverlay: true,
        backgroundHref: 'https://example.test/blackbox-records/releases/',
      },
    });

    expect(routeShellPopStateNavigation(options)).toBe('overlay');

    expect(options.closeMobileNavigation).toHaveBeenCalledTimes(1);
    expect(options.openOverlayHref).toHaveBeenCalledWith(
      'https://example.test/blackbox-records/releases/disintegration/',
      {
        backgroundHref: 'https://example.test/blackbox-records/releases/',
        replaceHistory: false,
      },
    );
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
    expect(options.closeOverlayState).not.toHaveBeenCalled();
  });

  it('uses the current href as overlay background fallback when history state has no background href', () => {
    const options = createOptions({
      historyState: {
        __appShellOverlay: true,
      },
    });

    expect(routeShellPopStateNavigation(options)).toBe('overlay');

    expect(options.openOverlayHref).toHaveBeenCalledWith(
      'https://example.test/blackbox-records/releases/disintegration/',
      {
        backgroundHref: 'https://example.test/blackbox-records/releases/disintegration/',
        replaceHistory: false,
      },
    );
  });

  it('routes shell section history entries through shell section navigation', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/artists/',
      currentPathname: '/blackbox-records/artists/',
    });

    expect(routeShellPopStateNavigation(options)).toBe('shell-section');

    expect(options.openShellSectionHref).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/', {
      historyMode: 'none',
      source: 'history',
    });
    expect(options.openOverlayHref).not.toHaveBeenCalled();
    expect(options.restoreCachedShellPage).not.toHaveBeenCalled();
  });

  it('restores cached non-section shell pages after route checks', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/legacy-page/',
      currentPathname: '/blackbox-records/legacy-page/',
      hasCachedShellPage: vi.fn(() => true),
    });

    expect(routeShellPopStateNavigation(options)).toBe('cached-shell-page');

    expect(options.hasCachedShellPage).toHaveBeenCalledWith('/legacy-page/');
    expect(options.restoreCachedShellPage).toHaveBeenCalledWith('/legacy-page/', {
      source: 'history',
    });
    expect(options.closeOverlayState).not.toHaveBeenCalled();
  });

  it('closes overlay state without focus restoration when no shell route can handle the popstate', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/external-page/',
      currentPathname: '/blackbox-records/external-page/',
    });

    expect(routeShellPopStateNavigation(options)).toBe('closed-overlay');

    expect(options.closeOverlayState).toHaveBeenCalledWith({ restoreFocus: false });
    expect(options.openOverlayHref).not.toHaveBeenCalled();
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
    expect(options.restoreCachedShellPage).not.toHaveBeenCalled();
  });
});
