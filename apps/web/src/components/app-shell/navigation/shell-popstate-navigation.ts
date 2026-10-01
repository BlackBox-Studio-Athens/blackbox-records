import { normalizeAppPathname, parseOverlayRoute, parseShellSectionRoute } from '@/components/app-shell/routing';

import { isPlayerModalHistoryState } from '../player-shell/player-modal-history';
import type { ShellNavigationSource } from './shell-navigation';

type MaybePromise<T> = T | Promise<T>;

type ShellPopStateHistoryState = {
  __appShellOverlay?: unknown;
  backgroundHref?: unknown;
};

type ShellPopStateNavigationOptions = {
  closeMobileNavigation: () => void;
  closeOverlayState: (options: { restoreFocus: false }) => void;
  closePlayerModal: () => void;
  currentHref: string;
  currentPathname: string;
  hasCachedShellPage: (pathname: string) => boolean;
  historyState: unknown;
  isPlayerModalOpen: boolean;
  openOverlayHref: (href: string, options: { backgroundHref: string; replaceHistory: false }) => MaybePromise<boolean>;
  openShellSectionHref: (
    href: string,
    options: { historyMode: 'none'; source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  playerModalHistoryHref: { current: string | null };
  reopenPlayerModal: () => void;
  restoreCachedShellPage: (
    pathname: string,
    options: { source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
};

export type ShellPopStateNavigationResult =
  'cached-shell-page' | 'closed-overlay' | 'overlay' | 'player-modal' | 'shell-section';

export function routeShellPopStateNavigation({
  closeMobileNavigation,
  closeOverlayState,
  closePlayerModal,
  currentHref,
  currentPathname,
  hasCachedShellPage,
  historyState,
  isPlayerModalOpen,
  openOverlayHref,
  openShellSectionHref,
  playerModalHistoryHref,
  reopenPlayerModal,
  restoreCachedShellPage,
}: ShellPopStateNavigationOptions): ShellPopStateNavigationResult {
  closeMobileNavigation();

  // The open player's entry shares its page's URL: stepping off or back onto it only toggles the player,
  // because routing the same URL again would scroll the page to the top or re-apply its snapshot.
  const playerEntryHref = playerModalHistoryHref.current;
  const isPlayerEntry = isPlayerModalHistoryState(historyState);
  playerModalHistoryHref.current = isPlayerEntry ? currentHref : null;
  if (playerEntryHref !== null && !isPlayerEntry) {
    if (isPlayerModalOpen) closePlayerModal();
    if (currentHref === playerEntryHref) return 'player-modal';
  } else if (playerEntryHref === null && isPlayerEntry) {
    if (!isPlayerModalOpen) reopenPlayerModal();
    return 'player-modal';
  }

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
