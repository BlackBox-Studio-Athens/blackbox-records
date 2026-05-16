import { normalizeAppPathname, parseOverlayRoute, parseShellSectionRoute } from '@/lib/app-shell/routing';

import type { ShellNavigationSource } from './shell-navigation';

type MaybePromise<T> = T | Promise<T>;

type ShellPopStateHistoryState = {
  __appShellOverlay?: unknown;
  backgroundHref?: unknown;
};

type ShellPopStateNavigationOptions = {
  closeMobileNavigation: () => void;
  closeOverlayState: (options: { restoreFocus: false }) => void;
  currentHref: string;
  currentPathname: string;
  hasCachedShellPage: (pathname: string) => boolean;
  historyState: unknown;
  openOverlayHref: (href: string, options: { backgroundHref: string; replaceHistory: false }) => MaybePromise<boolean>;
  openShellSectionHref: (
    href: string,
    options: { historyMode: 'none'; source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  restoreCachedShellPage: (
    pathname: string,
    options: { source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
};

export type ShellPopStateNavigationResult = 'cached-shell-page' | 'closed-overlay' | 'overlay' | 'shell-section';

export function routeShellPopStateNavigation({
  closeMobileNavigation,
  closeOverlayState,
  currentHref,
  currentPathname,
  hasCachedShellPage,
  historyState,
  openOverlayHref,
  openShellSectionHref,
  restoreCachedShellPage,
}: ShellPopStateNavigationOptions): ShellPopStateNavigationResult {
  closeMobileNavigation();

  const nextOverlayRoute = parseOverlayRoute(currentPathname);
  const nextShellSectionRoute = parseShellSectionRoute(currentPathname);
  const nextNormalizedPathname = normalizeAppPathname(currentPathname);
  const shellHistoryState = readShellPopStateHistoryState(historyState);

  if (shellHistoryState.isOverlayHistory && nextOverlayRoute) {
    void openOverlayHref(currentHref, {
      backgroundHref: shellHistoryState.backgroundHref || currentHref,
      replaceHistory: false,
    });
    return 'overlay';
  }

  if (nextShellSectionRoute) {
    void openShellSectionHref(currentHref, {
      historyMode: 'none',
      source: 'history',
    });
    return 'shell-section';
  }

  if (hasCachedShellPage(nextNormalizedPathname)) {
    void restoreCachedShellPage(nextNormalizedPathname, {
      source: 'history',
    });
    return 'cached-shell-page';
  }

  closeOverlayState({ restoreFocus: false });
  return 'closed-overlay';
}

function readShellPopStateHistoryState(historyState: unknown) {
  const shellHistoryState =
    historyState && typeof historyState === 'object' ? (historyState as ShellPopStateHistoryState) : {};

  return {
    backgroundHref: typeof shellHistoryState.backgroundHref === 'string' ? shellHistoryState.backgroundHref : '',
    isOverlayHistory: Boolean(shellHistoryState.__appShellOverlay),
  };
}
