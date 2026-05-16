import type { ShellNavigationSource } from './shell-navigation';

type MaybePromise<T> = T | Promise<T>;

type ShellAnchorClickNavigationOptions = {
  anchorElement: HTMLAnchorElement;
  closeMobileNavigation: () => void;
  collapseOverlayHistoryToBackground: () => void;
  currentHref: string;
  currentOrigin: string;
  getOverlayBackgroundHref: () => string | null | undefined;
  hasOverlayState: () => boolean;
  isNavigableOverlayAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  isNavigableShellSectionAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  navigateDocumentTo: (href: string) => void;
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

export type ShellAnchorClickNavigationResult = 'document-navigation' | 'ignored' | 'overlay' | 'shell-section';

export function routeShellAnchorClickNavigation({
  anchorElement,
  closeMobileNavigation,
  collapseOverlayHistoryToBackground,
  currentHref,
  currentOrigin,
  getOverlayBackgroundHref,
  hasOverlayState,
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  navigateDocumentTo,
  openOverlayHref,
  openShellSectionHref,
  preventDefault,
  resolveInternalUrl,
  resolveShellNavigationSource,
  setOverlayTriggerElement,
}: ShellAnchorClickNavigationOptions): ShellAnchorClickNavigationResult {
  const resolvedUrl = resolveInternalUrl(anchorElement);
  if (!resolvedUrl || resolvedUrl.origin !== currentOrigin) return 'ignored';

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

  if (hasOverlayState() && !anchorElement.hasAttribute('data-astro-reload')) {
    preventDefault();
    collapseOverlayHistoryToBackground();
    navigateDocumentTo(resolvedUrl.toString());
    return 'document-navigation';
  }

  return 'ignored';
}
