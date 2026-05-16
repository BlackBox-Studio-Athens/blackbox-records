import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  openShellOverlayNavigation,
  type OpenShellOverlayNavigationOptions,
  type ShellOverlayState,
} from './shell-overlay-navigation';

function createOptions(overrides: Partial<OpenShellOverlayNavigationOptions> = {}): OpenShellOverlayNavigationOptions {
  return {
    activeAbortControllerRef: { current: null },
    closeOverlayState: vi.fn(),
    currentHref: 'https://example.test/blackbox-records/releases/',
    getCurrentOverlayState: vi.fn(() => null),
    history: {
      back: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
      state: {},
    },
    href: 'https://example.test/blackbox-records/releases/disintegration/',
    navigateDocumentTo: vi.fn(),
    overlayFragmentLoader: {
      fetchHtml: vi.fn(async () => '<article>Disintegration</article>'),
      getCachedHtml: vi.fn(() => ''),
    },
    scheduleOverlayContentFocus: vi.fn(),
    setOverlayState: vi.fn(),
    writeOverlayHistoryState: vi.fn(),
    ...overrides,
  };
}

function latestState(options: OpenShellOverlayNavigationOptions) {
  const setOverlayState = options.setOverlayState as ReturnType<typeof vi.fn>;
  return setOverlayState.mock.calls[0]?.[0] as ShellOverlayState;
}

describe('shell overlay navigation', () => {
  it('ignores hrefs that are not overlay routes', async () => {
    const options = createOptions({
      href: 'https://example.test/blackbox-records/store/',
    });

    await expect(openShellOverlayNavigation(options)).resolves.toBe(false);

    expect(options.overlayFragmentLoader.fetchHtml).not.toHaveBeenCalled();
    expect(options.setOverlayState).not.toHaveBeenCalled();
    expect(options.navigateDocumentTo).not.toHaveBeenCalled();
  });

  it('seeds loading state, writes push history, fetches html, and schedules focus', async () => {
    const options = createOptions({
      backgroundHref: 'https://example.test/blackbox-records/artists/',
      pushHistory: true,
    });

    await expect(openShellOverlayNavigation(options)).resolves.toBe(true);

    expect(options.overlayFragmentLoader.getCachedHtml).toHaveBeenCalledWith('/releases/disintegration/');
    expect(options.setOverlayState).toHaveBeenCalledWith({
      backgroundHref: 'https://example.test/blackbox-records/artists/',
      href: 'https://example.test/blackbox-records/releases/disintegration/',
      html: '',
      isLoading: true,
      route: {
        kind: 'releases',
        pathname: '/releases/disintegration/',
        slug: 'disintegration',
      },
    });
    expect(options.writeOverlayHistoryState).toHaveBeenCalledWith(options.history, {
      backgroundHref: 'https://example.test/blackbox-records/artists/',
      historyMode: 'push',
      href: 'https://example.test/blackbox-records/releases/disintegration/',
      pathname: '/releases/disintegration/',
    });
    expect(options.overlayFragmentLoader.fetchHtml).toHaveBeenCalledWith(
      '/releases/disintegration/',
      expect.any(AbortSignal),
    );
    expect(options.scheduleOverlayContentFocus).toHaveBeenCalledTimes(1);
  });

  it('uses cached html without entering loading state or fetching', async () => {
    const options = createOptions({
      overlayFragmentLoader: {
        fetchHtml: vi.fn(),
        getCachedHtml: vi.fn(() => '<article>Cached</article>'),
      },
    });

    await expect(openShellOverlayNavigation(options)).resolves.toBe(true);

    const seededState = (options.setOverlayState as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as ShellOverlayState;
    expect(seededState.html).toBe('<article>Cached</article>');
    expect(seededState.isLoading).toBe(false);
    expect(options.overlayFragmentLoader.fetchHtml).not.toHaveBeenCalled();
  });

  it('keeps newer overlay state when an older request resolves after route changed', async () => {
    const options = createOptions();

    await expect(openShellOverlayNavigation(options)).resolves.toBe(true);

    const updateState = (options.setOverlayState as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as (
      currentState: ShellOverlayState | null,
    ) => ShellOverlayState | null;
    const currentState = latestState(options);
    const changedState = {
      ...currentState,
      route: {
        kind: 'artists',
        pathname: '/artists/afterwise/',
        slug: 'afterwise',
      } as const,
    };

    expect(updateState(changedState)).toBe(changedState);
    expect(updateState(currentState)).toEqual({
      ...currentState,
      html: '<article>Disintegration</article>',
      isLoading: false,
    });
  });

  it('falls back to document navigation when loading fails without abort', async () => {
    const options = createOptions({
      overlayFragmentLoader: {
        fetchHtml: vi.fn(async () => {
          throw new Error('fragment unavailable');
        }),
        getCachedHtml: vi.fn(() => ''),
      },
    });

    await expect(openShellOverlayNavigation(options)).resolves.toBe(false);

    expect(options.closeOverlayState).toHaveBeenCalledWith({ restoreFocus: false });
    expect(options.navigateDocumentTo).toHaveBeenCalledWith(
      'https://example.test/blackbox-records/releases/disintegration/',
    );
  });

  it('treats aborted loading as handled without document fallback', async () => {
    const activeAbortControllerRef: OpenShellOverlayNavigationOptions['activeAbortControllerRef'] = { current: null };
    const options = createOptions({
      activeAbortControllerRef,
      overlayFragmentLoader: {
        fetchHtml: vi.fn(async () => {
          activeAbortControllerRef.current?.abort();
          throw new Error('aborted');
        }),
        getCachedHtml: vi.fn(() => ''),
      },
    });

    await expect(openShellOverlayNavigation(options)).resolves.toBe(true);

    expect(options.closeOverlayState).not.toHaveBeenCalled();
    expect(options.navigateDocumentTo).not.toHaveBeenCalled();
  });
});
