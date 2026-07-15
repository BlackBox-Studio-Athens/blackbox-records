import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  markCurrentHistoryEntryForShellSection,
  resolveShellNavigationSource,
} from './shell-navigation';

const windowOrigin = 'https://blackbox-studio-athens.github.io';
let replaceState: ReturnType<typeof vi.fn>;

beforeEach(() => {
  replaceState = vi.fn();
  vi.stubGlobal('window', {
    history: {
      state: null,
      replaceState,
    },
    location: {
      href: `${windowOrigin}/blackbox-records/`,
      origin: windowOrigin,
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function createAnchor(href: string, options: { container?: 'footer' | 'header' | 'mobile'; reload?: boolean } = {}) {
  const anchor = {
    dataset: {},
    hasAttribute(name: string) {
      return name === 'data-astro-reload' ? Boolean(options.reload) : false;
    },
    href,
    target: '',
    closest(selector: string) {
      if (selector === 'footer') return options.container === 'footer' ? {} : null;
      if (selector === 'header') return options.container === 'header' ? {} : null;
      if (selector === '[data-app-shell-mobile-navigation]') return options.container === 'mobile' ? {} : null;
      return null;
    },
  };

  return anchor as unknown as HTMLAnchorElement;
}

describe('shell navigation helpers', () => {
  it('classifies header, footer, mobile, and programmatic navigation sources', () => {
    expect(
      resolveShellNavigationSource(createAnchor('/blackbox-records/releases/', { container: 'header' }), false),
    ).toBe('header');
    expect(resolveShellNavigationSource(createAnchor('/blackbox-records/about/', { container: 'footer' }), false)).toBe(
      'footer',
    );
    expect(resolveShellNavigationSource(createAnchor('/blackbox-records/store/', { container: 'mobile' }), true)).toBe(
      'mobile-nav',
    );
    expect(resolveShellNavigationSource(createAnchor('/blackbox-records/store/'), false)).toBe('programmatic');
  });

  it('recognizes shell section anchors but rejects reload anchors', () => {
    expect(
      isNavigableShellSectionAnchor(
        createAnchor(`${windowOrigin}/blackbox-records/releases/`),
        `${windowOrigin}/blackbox-records/`,
      ),
    ).toBe(true);
    expect(
      isNavigableShellSectionAnchor(
        createAnchor(`${windowOrigin}/blackbox-records/releases/`, { reload: true }),
        `${windowOrigin}/blackbox-records/`,
      ),
    ).toBe(false);
    for (const pathname of ['/store/', '/store/blackbox-releases/', '/store/distro/', '/store/merch/']) {
      expect(
        isNavigableShellSectionAnchor(
          createAnchor(`${windowOrigin}/blackbox-records${pathname}`),
          `${windowOrigin}/blackbox-records/`,
        ),
      ).toBe(true);
    }
  });

  it('recognizes detail route anchors that can open as overlays', () => {
    expect(
      isNavigableOverlayAnchor(
        createAnchor(`${windowOrigin}/blackbox-records/releases/disintegration/`),
        `${windowOrigin}/blackbox-records/releases/`,
      ),
    ).toBe(true);
  });

  it('marks only shell section routes as shell-managed history entries', () => {
    markCurrentHistoryEntryForShellSection('/blackbox-records/store/', `${windowOrigin}/blackbox-records/store/`);
    markCurrentHistoryEntryForShellSection(
      '/blackbox-records/releases/disintegration/',
      `${windowOrigin}/blackbox-records/releases/disintegration/`,
    );

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(
      expect.objectContaining({ __appShellSection: true, pathname: '/store/' }),
      '',
      `${windowOrigin}/blackbox-records/store/`,
    );
  });

  it('keeps every Store category as a distinct shell history path', () => {
    const categories = ['/store/', '/store/blackbox-releases/', '/store/distro/', '/store/merch/'];

    for (const pathname of categories) {
      markCurrentHistoryEntryForShellSection(
        `/blackbox-records${pathname}`,
        `${windowOrigin}/blackbox-records${pathname}`,
      );
    }

    expect(replaceState.mock.calls.map(([state]) => state.pathname)).toEqual(categories);
  });
});
