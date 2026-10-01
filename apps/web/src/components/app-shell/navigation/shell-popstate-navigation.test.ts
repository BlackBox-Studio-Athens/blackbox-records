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
    closePlayerModal: vi.fn(),
    currentHref: 'https://example.test/blackbox-records/releases/disintegration/',
    currentPathname: '/blackbox-records/releases/disintegration/',
    hasCachedShellPage: vi.fn(() => false),
    historyState: {},
    isPlayerModalOpen: false,
    openOverlayHref: vi.fn(),
    openShellSectionHref: vi.fn(),
    playerModalHistoryHref: { current: null as string | null },
    reopenPlayerModal: vi.fn(),
    restoreCachedShellPage: vi.fn(),
    ...overrides,
  };
}

const releasesHref = 'https://example.test/blackbox-records/releases/';

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

  it('closes the open player when Back steps off its entry, without routing the unchanged page', () => {
    const options = createOptions({
      currentHref: releasesHref,
      currentPathname: '/blackbox-records/releases/',
      historyState: { __appShellSection: true, pathname: '/releases/' },
      isPlayerModalOpen: true,
      playerModalHistoryHref: { current: releasesHref },
    });

    expect(routeShellPopStateNavigation(options)).toBe('player-modal');

    expect(options.closePlayerModal).toHaveBeenCalledTimes(1);
    expect(options.playerModalHistoryHref.current).toBeNull();
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
    expect(options.openOverlayHref).not.toHaveBeenCalled();
    expect(options.restoreCachedShellPage).not.toHaveBeenCalled();
  });

  it('keeps a release overlay open when Back closes a player opened over it', () => {
    const overlayHref = 'https://example.test/blackbox-records/releases/disintegration/';
    const options = createOptions({
      historyState: { __appShellOverlay: true, backgroundHref: releasesHref },
      isPlayerModalOpen: true,
      playerModalHistoryHref: { current: overlayHref },
    });

    expect(routeShellPopStateNavigation(options)).toBe('player-modal');

    expect(options.closePlayerModal).toHaveBeenCalledTimes(1);
    expect(options.openOverlayHref).not.toHaveBeenCalled();
  });

  it('closes the player and still routes when history jumps past its entry to another page', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/artists/',
      currentPathname: '/blackbox-records/artists/',
      isPlayerModalOpen: true,
      playerModalHistoryHref: { current: releasesHref },
    });

    expect(routeShellPopStateNavigation(options)).toBe('shell-section');

    expect(options.closePlayerModal).toHaveBeenCalledTimes(1);
    expect(options.openShellSectionHref).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/', {
      historyMode: 'none',
      source: 'history',
    });
  });

  it('only steps off a player entry left behind by a reload, without routing the unchanged page', () => {
    const options = createOptions({
      currentHref: releasesHref,
      currentPathname: '/blackbox-records/releases/',
      playerModalHistoryHref: { current: releasesHref },
    });

    expect(routeShellPopStateNavigation(options)).toBe('player-modal');

    expect(options.closePlayerModal).not.toHaveBeenCalled();
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
  });

  it('reopens a closed player when Forward returns to its entry, without routing the unchanged page', () => {
    const options = createOptions({
      currentHref: releasesHref,
      currentPathname: '/blackbox-records/releases/',
      historyState: { __appShellPlayerModal: true, __appShellSection: true, pathname: '/releases/' },
    });

    expect(routeShellPopStateNavigation(options)).toBe('player-modal');

    expect(options.reopenPlayerModal).toHaveBeenCalledTimes(1);
    expect(options.playerModalHistoryHref.current).toBe(releasesHref);
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
  });

  it('leaves the player alone on ordinary history navigation', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/artists/',
      currentPathname: '/blackbox-records/artists/',
    });

    expect(routeShellPopStateNavigation(options)).toBe('shell-section');

    expect(options.closePlayerModal).not.toHaveBeenCalled();
    expect(options.reopenPlayerModal).not.toHaveBeenCalled();
    expect(options.playerModalHistoryHref.current).toBeNull();
  });
});
