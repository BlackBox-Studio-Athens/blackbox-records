import type { ShellNavigationSource } from './shell-navigation';

type MaybePromise<T> = T | Promise<T>;

type ShellAnchorClickNavigationOptions = {
  anchorElement: HTMLAnchorElement;
  closeMobileNavigation: () => void;
  currentHref: string;
  currentOrigin: string;
  getOverlayBackgroundHref: () => string | null | undefined;
  isNavigableOverlayAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  isNavigableShellSectionAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  openOverlayHref: (href: string, options: { backgroundHref: string; pushHistory: true }) => MaybePromise<boolean>;
  openShellSectionHref: (
    href: string,
    options: {
      historyMode: 'push';
      source: ShellNavigationSource;
      sourceElement: HTMLAnchorElement;
    },
  ) => MaybePromise<boolean>;
  preventDefault: () => void;
  resolveInternalUrl: (anchorElement: HTMLAnchorElement) => URL | null;
  resolveShellNavigationSource: (
    anchorElement: HTMLAnchorElement,
    isMobileNavigationLink: boolean,
  ) => ShellNavigationSource;
  setOverlayTriggerElement: (anchorElement: HTMLAnchorElement) => void;
};

export type ShellAnchorClickNavigationResult = 'ignored' | 'overlay' | 'shell-section';

export function routeShellAnchorClickNavigation({
  anchorElement,
  closeMobileNavigation,
  currentHref,
  currentOrigin,
  getOverlayBackgroundHref,
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  openOverlayHref,
  openShellSectionHref,
  preventDefault,
  resolveInternalUrl,
  resolveShellNavigationSource,
  setOverlayTriggerElement,
}: ShellAnchorClickNavigationOptions): ShellAnchorClickNavigationResult {
  const resolvedUrl = resolveInternalUrl(anchorElement);
  if (!resolvedUrl || resolvedUrl.origin !== currentOrigin) return 'ignored';

  const currentUrl = new URL(currentHref);
  if (resolvedUrl.hash && resolvedUrl.pathname === currentUrl.pathname && resolvedUrl.search === currentUrl.search) {
    return 'ignored';
  }

  const isMobileNavigationLink = Boolean(anchorElement.closest('[data-app-shell-mobile-navigation]'));
  if (isMobileNavigationLink) {
    closeMobileNavigation();
  }

  if (isNavigableShellSectionAnchor(anchorElement)) {
    preventDefault();
    const navigationSource = resolveShellNavigationSource(anchorElement, isMobileNavigationLink);
    void openShellSectionHref(resolvedUrl.toString(), {
      historyMode: 'push',
      source: navigationSource,
      sourceElement: anchorElement,
    });
    return 'shell-section';
  }

  if (isNavigableOverlayAnchor(anchorElement)) {
    preventDefault();
    setOverlayTriggerElement(anchorElement);
    void openOverlayHref(resolvedUrl.toString(), {
      backgroundHref: getOverlayBackgroundHref() || currentHref,
      pushHistory: true,
    });
    return 'overlay';
  }

  // Other links, including ones inside an open overlay, navigate natively: the overlay keeps its own history entry,
  // so Back returns to the detail.
  return 'ignored';
}
