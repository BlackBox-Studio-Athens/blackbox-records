import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { openShellSectionNavigation, type OpenShellSectionNavigationOptions } from './shell-section-navigation';
import type { ShellPageSnapshot } from './shell-page-snapshot';

function createSnapshot(pathname: string): ShellPageSnapshot {
  return {
    canonicalHref: `https://example.test/blackbox-records${pathname}`,
    href: `https://example.test/blackbox-records${pathname}`,
    mainClassName: 'page-main-content-region',
    mainHtml: `<section>${pathname}</section>`,
    pageDescription: `${pathname} description`,
    pathname,
    title: `${pathname} | BlackBox`,
  };
}

function createOptions(overrides: Partial<OpenShellSectionNavigationOptions> = {}): OpenShellSectionNavigationOptions {
  return {
    activeAbortControllerRef: { current: null },
    applyShellPageSnapshot: vi.fn(() => true),
    cacheDocumentSnapshot: vi.fn(() => createSnapshot('/releases/')),
    collapseOverlayHistoryToBackground: vi.fn(),
    currentHref: 'https://example.test/blackbox-records/releases/',
    currentPathname: '/blackbox-records/releases/',
    hasOverlayState: vi.fn(() => false),
    href: 'https://example.test/blackbox-records/artists/',
    navigateDocumentTo: vi.fn(),
    pushShellSectionHistoryState: vi.fn(),
    replaceShellSectionHistoryState: vi.fn(),
    scrollShellViewportToTarget: vi.fn(() => false),
    scrollShellViewportToTop: vi.fn(async () => undefined),
    setIsRouteLoading: vi.fn(),
    shellPageLoader: {
      fetchSnapshot: vi.fn(async () => createSnapshot('/artists/')),
      getCachedSnapshot: vi.fn(() => null),
    },
    shellSectionTransition: {
      begin: vi.fn(() => 7),
      finish: vi.fn(async () => undefined),
      reset: vi.fn(),
    },
    stopRouteLoadingSoon: vi.fn(),
    syncShellNavigationState: vi.fn(),
    triggerShellPageEnterTransition: vi.fn(),
    waitForAnimationFrames: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('shell section navigation', () => {
  it('ignores hrefs that are not shell sections', async () => {
    const options = createOptions({
      href: 'https://example.test/blackbox-records/not-a-section/',
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(false);

    expect(options.cacheDocumentSnapshot).not.toHaveBeenCalled();
    expect(options.shellPageLoader.fetchSnapshot).not.toHaveBeenCalled();
    expect(options.navigateDocumentTo).not.toHaveBeenCalled();
  });

  it('scrolls and replaces history when navigating to the current rendered section', async () => {
    const options = createOptions({
      historyMode: 'replace',
      href: 'https://example.test/blackbox-records/releases/',
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.syncShellNavigationState).toHaveBeenCalledWith('/releases/');
    expect(options.scrollShellViewportToTop).toHaveBeenCalledTimes(1);
    expect(options.replaceShellSectionHistoryState).toHaveBeenCalledWith(
      '/releases/',
      'https://example.test/blackbox-records/releases/',
    );
    expect(options.shellPageLoader.fetchSnapshot).not.toHaveBeenCalled();
  });

  it('fetches uncached shell section snapshots through transition, history, and scroll reset', async () => {
    const sourceElement = {} as HTMLElement;
    const options = createOptions({
      historyMode: 'push',
      source: 'header',
      sourceElement,
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.shellPageLoader.getCachedSnapshot).toHaveBeenCalledWith('/artists/');
    expect(options.setIsRouteLoading).toHaveBeenCalledWith(true);
    expect(options.shellSectionTransition.begin).toHaveBeenCalledWith('Artists', 'header');
    expect(options.waitForAnimationFrames).toHaveBeenCalledWith(2);
    expect(options.shellPageLoader.fetchSnapshot).toHaveBeenCalledWith(
      '/artists/',
      'https://example.test/blackbox-records/artists/',
      expect.any(AbortSignal),
    );
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(createSnapshot('/artists/'));
    expect(options.pushShellSectionHistoryState).toHaveBeenCalledWith(
      '/artists/',
      'https://example.test/blackbox-records/artists/',
    );
    expect(options.scrollShellViewportToTop).toHaveBeenCalledWith({ sourceElement });
    expect(options.triggerShellPageEnterTransition).toHaveBeenCalledTimes(1);
    expect(options.shellSectionTransition.finish).toHaveBeenCalledWith(7);
    expect(options.stopRouteLoadingSoon).toHaveBeenCalledTimes(1);
    expect(options.activeAbortControllerRef.current).toBeNull();
  });

  it('scrolls a cross-section hash target after applying the destination snapshot', async () => {
    const sourceElement = {} as HTMLElement;
    const options = createOptions({
      historyMode: 'push',
      href: 'https://example.test/blackbox-records/artists/#featured-artists',
      scrollShellViewportToTarget: vi.fn(() => true),
      sourceElement,
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.scrollShellViewportToTarget).toHaveBeenCalledWith('featured-artists', sourceElement);
    expect(options.scrollShellViewportToTop).not.toHaveBeenCalled();
  });

  it('uses cached snapshots without starting the route loading state', async () => {
    const cachedSnapshot = createSnapshot('/artists/');
    const options = createOptions({
      shellPageLoader: {
        fetchSnapshot: vi.fn(),
        getCachedSnapshot: vi.fn(() => cachedSnapshot),
      },
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.setIsRouteLoading).not.toHaveBeenCalled();
    expect(options.shellPageLoader.fetchSnapshot).not.toHaveBeenCalled();
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(cachedSnapshot);
  });

  it('falls back to document navigation when applying the snapshot fails', async () => {
    const options = createOptions({
      applyShellPageSnapshot: vi.fn(() => false),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(false);

    expect(options.shellSectionTransition.reset).toHaveBeenCalledTimes(1);
    expect(options.navigateDocumentTo).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/');
    expect(options.stopRouteLoadingSoon).toHaveBeenCalledTimes(1);
  });

  it('collapses overlay history before section navigation', async () => {
    const options = createOptions({
      hasOverlayState: vi.fn(() => true),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.collapseOverlayHistoryToBackground).toHaveBeenCalledTimes(1);
  });
});
