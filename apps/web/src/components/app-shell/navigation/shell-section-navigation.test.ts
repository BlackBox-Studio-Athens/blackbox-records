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
    mainContent: { markup: `<section>${pathname}</section>` } as unknown as DocumentFragment,
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
    getRenderedPathname: vi.fn(() => '/releases/'),
    hasOverlayState: vi.fn(() => false),
    href: 'https://example.test/blackbox-records/artists/',
    navigateDocumentTo: vi.fn(),
    onSectionActivationStart: vi.fn(),
    pushShellSectionHistoryState: vi.fn(),
    replaceShellSectionHistoryState: vi.fn(),
    scrollShellViewportToTarget: vi.fn(() => false),
    scrollShellViewportToTop: vi.fn(async () => undefined),
    setIsRouteLoading: vi.fn(),
    shellPageLoader: {
      fetchSnapshot: vi.fn(async () => createSnapshot('/artists/')),
      getCachedSnapshot: vi.fn(() => null),
      hasCachedSnapshot: vi.fn(() => false),
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
    expect(options.onSectionActivationStart).not.toHaveBeenCalled();
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
    expect(options.onSectionActivationStart).not.toHaveBeenCalled();
    expect(options.cacheDocumentSnapshot).not.toHaveBeenCalled();
  });

  it('snapshots the leaving page only after the veil frames, and starts the fetch before them', async () => {
    const order: string[] = [];
    const options = createOptions({
      cacheDocumentSnapshot: vi.fn(() => {
        order.push('snapshot');
        return createSnapshot('/releases/');
      }),
      shellPageLoader: {
        fetchSnapshot: vi.fn(async () => {
          order.push('fetch');
          return createSnapshot('/artists/');
        }),
        getCachedSnapshot: vi.fn(() => null),
        hasCachedSnapshot: vi.fn(() => false),
      },
      shellSectionTransition: {
        begin: vi.fn(() => {
          order.push('veil');
          return 7;
        }),
        finish: vi.fn(async () => undefined),
        reset: vi.fn(),
      },
      waitForAnimationFrames: vi.fn(async () => {
        order.push('frames');
      }),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(order).toEqual(['veil', 'fetch', 'frames', 'snapshot']);
    expect(options.shellPageLoader.hasCachedSnapshot).toHaveBeenCalledWith('/releases/');
  });

  it('skips the leaving-page snapshot when one is already cached', async () => {
    const options = createOptions({
      shellPageLoader: {
        fetchSnapshot: vi.fn(async () => createSnapshot('/artists/')),
        getCachedSnapshot: vi.fn(() => null),
        hasCachedSnapshot: vi.fn((pathname: string) => pathname === '/releases/'),
      },
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.cacheDocumentSnapshot).not.toHaveBeenCalled();
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(createSnapshot('/artists/'));
  });

  it('does not snapshot when the activation is superseded during the veil frames', async () => {
    const activeAbortControllerRef = { current: null as AbortController | null };
    const options = createOptions({
      activeAbortControllerRef,
      waitForAnimationFrames: vi.fn(async () => activeAbortControllerRef.current?.abort()),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.cacheDocumentSnapshot).not.toHaveBeenCalled();
  });

  it('warms the images a joined hover prefetch left cold before applying the fetched page', async () => {
    const order: string[] = [];
    const options = createOptions({
      applyShellPageSnapshot: vi.fn(() => {
        order.push('apply');
        return true;
      }),
      shellPageLoader: {
        fetchSnapshot: vi.fn(async () => createSnapshot('/artists/')),
        getCachedSnapshot: vi.fn(() => null),
        hasCachedSnapshot: vi.fn(() => false),
        warmSnapshotImages: vi.fn((pathname: string) => {
          order.push(`warm ${pathname}`);
        }),
      },
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(order).toEqual(['warm /artists/', 'apply']);
  });

  it('runs the scroll reset and the first-screen image wait together', async () => {
    const order: string[] = [];
    let finishScroll!: () => void;
    const options = createOptions({
      scrollShellViewportToTop: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            order.push('scroll-start');
            finishScroll = () => {
              order.push('scroll-end');
              resolve();
            };
          }),
      ),
      waitForFirstScreenImages: vi.fn(async () => {
        order.push('images');
        finishScroll();
      }),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(order).toEqual(['scroll-start', 'images', 'scroll-end']);
  });

  it('fetches uncached shell section snapshots through transition, history, and scroll reset', async () => {
    const sourceElement = {} as HTMLElement;
    const finishSectionActivation = vi.fn();
    const options = createOptions({
      historyMode: 'push',
      onSectionActivationStart: vi.fn(() => finishSectionActivation),
      source: 'header',
      sourceElement,
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.shellPageLoader.getCachedSnapshot).toHaveBeenCalledWith('/artists/');
    expect(options.setIsRouteLoading).toHaveBeenCalledWith(true);
    expect(options.onSectionActivationStart).toHaveBeenCalledWith({
      cached: false,
      kind: 'artists',
      pathname: '/artists/',
    });
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
    expect(finishSectionActivation).toHaveBeenCalledWith('complete');
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

  it('waits for first-screen images before the enter transition', async () => {
    const order: string[] = [];
    const options = createOptions({
      triggerShellPageEnterTransition: vi.fn(() => {
        order.push('enter');
      }),
      waitForFirstScreenImages: vi.fn(async () => {
        order.push('images');
      }),
    });

    await openShellSectionNavigation(options);

    expect(order).toEqual(['images', 'enter']);
  });

  it('uses cached snapshots without starting the route loading state', async () => {
    const cachedSnapshot = createSnapshot('/artists/');
    const finishSectionActivation = vi.fn();
    const options = createOptions({
      onSectionActivationStart: vi.fn(() => finishSectionActivation),
      shellPageLoader: {
        fetchSnapshot: vi.fn(),
        getCachedSnapshot: vi.fn(() => cachedSnapshot),
        hasCachedSnapshot: vi.fn(() => false),
        warmSnapshotImages: vi.fn(),
      },
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.setIsRouteLoading).not.toHaveBeenCalled();
    expect(options.onSectionActivationStart).toHaveBeenCalledWith({
      cached: true,
      kind: 'artists',
      pathname: '/artists/',
    });
    expect(options.shellPageLoader.fetchSnapshot).not.toHaveBeenCalled();
    expect(options.shellPageLoader.warmSnapshotImages).toHaveBeenCalledWith('/artists/');
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(cachedSnapshot);
    expect(finishSectionActivation).toHaveBeenCalledWith('complete');
  });

  it('falls back to document navigation when applying the snapshot fails', async () => {
    const finishSectionActivation = vi.fn();
    const options = createOptions({
      applyShellPageSnapshot: vi.fn(() => false),
      onSectionActivationStart: vi.fn(() => finishSectionActivation),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(false);

    expect(options.shellSectionTransition.reset).toHaveBeenCalledTimes(1);
    expect(options.navigateDocumentTo).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/');
    expect(finishSectionActivation).toHaveBeenCalledWith('failed');
    expect(options.stopRouteLoadingSoon).toHaveBeenCalledTimes(1);
  });

  it('aborts and finishes a superseded activation without applying its snapshot', async () => {
    const previousAbortController = new AbortController();
    const finishSectionActivation = vi.fn();
    const options = createOptions({
      activeAbortControllerRef: { current: previousAbortController },
      onSectionActivationStart: vi.fn(() => finishSectionActivation),
      shellPageLoader: {
        fetchSnapshot: vi.fn(async (_pathname, _href, signal) => {
          signal?.throwIfAborted();
          return createSnapshot('/artists/');
        }),
        getCachedSnapshot: vi.fn(() => null),
        hasCachedSnapshot: vi.fn(() => false),
      },
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(previousAbortController.signal.aborted).toBe(true);
    expect(finishSectionActivation).toHaveBeenCalledWith('complete');
  });

  it('reports an activation aborted during the transition and does not apply its snapshot', async () => {
    const activeAbortControllerRef = { current: null as AbortController | null };
    const finishSectionActivation = vi.fn();
    const options = createOptions({
      activeAbortControllerRef,
      onSectionActivationStart: vi.fn(() => finishSectionActivation),
      waitForAnimationFrames: vi.fn(async () => activeAbortControllerRef.current?.abort()),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.applyShellPageSnapshot).not.toHaveBeenCalled();
    expect(options.navigateDocumentTo).not.toHaveBeenCalled();
    expect(finishSectionActivation).toHaveBeenCalledWith('aborted');
  });

  it('collapses overlay history before section navigation', async () => {
    const options = createOptions({
      hasOverlayState: vi.fn(() => true),
    });

    await expect(openShellSectionNavigation(options)).resolves.toBe(true);

    expect(options.collapseOverlayHistoryToBackground).toHaveBeenCalledTimes(1);
  });
});
