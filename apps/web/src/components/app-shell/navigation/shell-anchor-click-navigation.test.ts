import { describe, expect, it, vi } from 'vitest';

import { routeShellAnchorClickNavigation } from './shell-anchor-click-navigation';

function createAnchor({ isMobile = false, reload = false } = {}) {
  return {
    closest: vi.fn((selector: string) => (selector === '[data-app-shell-mobile-navigation]' && isMobile ? {} : null)),
    hasAttribute: vi.fn((name: string) => name === 'data-astro-reload' && reload),
  } as unknown as HTMLAnchorElement;
}

function createOptions(overrides: Partial<Parameters<typeof routeShellAnchorClickNavigation>[0]> = {}) {
  return {
    anchorElement: createAnchor(),
    closeMobileNavigation: vi.fn(),
    collapseOverlayHistoryToBackground: vi.fn(),
    currentHref: 'https://example.test/blackbox-records/releases/',
    currentOrigin: 'https://example.test',
    getOverlayBackgroundHref: vi.fn(() => null),
    hasOverlayState: vi.fn(() => false),
    isNavigableOverlayAnchor: vi.fn(() => false),
    isNavigableShellSectionAnchor: vi.fn(() => false),
    navigateDocumentTo: vi.fn(),
    openOverlayHref: vi.fn(),
    openShellSectionHref: vi.fn(),
    preventDefault: vi.fn(),
    resolveInternalUrl: vi.fn(() => new URL('https://example.test/blackbox-records/about/')),
    resolveShellNavigationSource: vi.fn(() => 'header' as const),
    setOverlayTriggerElement: vi.fn(),
    ...overrides,
  };
}

describe('shell anchor click navigation', () => {
  it('ignores anchors that do not resolve to the current origin', () => {
    const options = createOptions({
      resolveInternalUrl: vi.fn(() => new URL('https://external.test/releases/')),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('ignored');

    expect(options.closeMobileNavigation).not.toHaveBeenCalled();
    expect(options.preventDefault).not.toHaveBeenCalled();
  });

  it('allows same-document fragment anchors to use native navigation', () => {
    const options = createOptions({
      currentHref: 'https://example.test/blackbox-records/distro/',
      isNavigableShellSectionAnchor: vi.fn(() => true),
      resolveInternalUrl: vi.fn(() => new URL('https://example.test/blackbox-records/distro/#distro-group-cds')),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('ignored');

    expect(options.preventDefault).not.toHaveBeenCalled();
    expect(options.openShellSectionHref).not.toHaveBeenCalled();
  });

  it('closes mobile navigation after internal URL validation', () => {
    const options = createOptions({
      anchorElement: createAnchor({ isMobile: true }),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('ignored');

    expect(options.closeMobileNavigation).toHaveBeenCalledTimes(1);
  });

  it('routes shell section anchors through shell section navigation', () => {
    const anchorElement = createAnchor({ isMobile: true });
    const options = createOptions({
      anchorElement,
      isNavigableShellSectionAnchor: vi.fn(() => true),
      resolveInternalUrl: vi.fn(() => new URL('https://example.test/blackbox-records/artists/')),
      resolveShellNavigationSource: vi.fn(() => 'mobile-nav' as const),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('shell-section');

    expect(options.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.openShellSectionHref).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/', {
      historyMode: 'push',
      source: 'mobile-nav',
      sourceElement: anchorElement,
    });
  });

  it('routes overlay anchors through overlay loading with trigger and background href', () => {
    const anchorElement = createAnchor();
    const options = createOptions({
      anchorElement,
      getOverlayBackgroundHref: vi.fn(() => 'https://example.test/blackbox-records/artists/'),
      isNavigableOverlayAnchor: vi.fn(() => true),
      resolveInternalUrl: vi.fn(() => new URL('https://example.test/blackbox-records/releases/disintegration/')),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('overlay');

    expect(options.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.setOverlayTriggerElement).toHaveBeenCalledWith(anchorElement);
    expect(options.openOverlayHref).toHaveBeenCalledWith(
      'https://example.test/blackbox-records/releases/disintegration/',
      {
        backgroundHref: 'https://example.test/blackbox-records/artists/',
        pushHistory: true,
      },
    );
  });

  it('collapses overlay history before document navigation from an overlay', () => {
    const options = createOptions({
      hasOverlayState: vi.fn(() => true),
      resolveInternalUrl: vi.fn(() => new URL('https://example.test/blackbox-records/services/')),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('document-navigation');

    expect(options.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.collapseOverlayHistoryToBackground).toHaveBeenCalledTimes(1);
    expect(options.navigateDocumentTo).toHaveBeenCalledWith('https://example.test/blackbox-records/services/');
  });

  it('allows data-astro-reload anchors to navigate normally from an overlay', () => {
    const options = createOptions({
      anchorElement: createAnchor({ reload: true }),
      hasOverlayState: vi.fn(() => true),
    });

    expect(routeShellAnchorClickNavigation(options)).toBe('ignored');

    expect(options.preventDefault).not.toHaveBeenCalled();
    expect(options.collapseOverlayHistoryToBackground).not.toHaveBeenCalled();
    expect(options.navigateDocumentTo).not.toHaveBeenCalled();
  });
});
