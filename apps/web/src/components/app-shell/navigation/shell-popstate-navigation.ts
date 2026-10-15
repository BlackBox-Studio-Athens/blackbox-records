import { normalizeAppPathname, parseOverlayRoute, parseShellSectionRoute } from '@/components/app-shell/routing';
import { togglePageSurfaceHistoryEntry } from '@/platform/lib/surface-history';

import {
  isPlayerModalHistoryState,
  readHistoryEntryMarker,
  SHELL_SHEET_HISTORY_KEY,
  type ShellSheetKind,
} from '../player-shell/player-modal-history';
import type { ShellNavigationSource } from './shell-navigation';

type MaybePromise<T> = T | Promise<T>;

type ShellPopStateHistoryState = {
  __appShellOverlay?: unknown;
  backgroundHref?: unknown;
};

type ShellPopStateNavigationOptions = {
  closeOverlayState: (options: { restoreFocus: boolean }) => void;
  closePlayerModal: () => void;
  closeShellSheets: () => void;
  currentHref: string;
  currentPathname: string;
  getOverlayBackgroundHref: () => string | null | undefined;
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
  reopenShellSheet: (kind: ShellSheetKind) => void;
  restoreCachedShellPage: (
    pathname: string,
    options: { source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  shellSheetHistoryHref: { current: string | null };
};

export type ShellPopStateNavigationResult =
  | 'cached-shell-page'
  | 'closed-overlay'
  | 'overlay'
  | 'page-surface'
  | 'player-modal'
  | 'shell-section'
  | 'shell-sheet';

// A surface entry shares its page's URL: stepping off or back onto it only toggles the surface, because routing the
// same URL again would scroll the page to the top or re-apply its snapshot. `entryHref` holds the href of the entry
// the shell is on, or null. Returns true when the popstate is fully handled.
function toggleSurfaceHistoryEntry(
  entryHref: { current: string | null },
  isEntry: boolean,
  currentHref: string,
  close: () => void,
  reopen: () => void,
) {
  const previousEntryHref = entryHref.current;
  entryHref.current = isEntry ? currentHref : null;
  if (previousEntryHref !== null && !isEntry) {
    close();
    return currentHref === previousEntryHref;
  }
  if (previousEntryHref === null && isEntry) {
    reopen();
    return true;
  }
  return false;
}

export function routeShellPopStateNavigation({
  closeOverlayState,
  closePlayerModal,
  closeShellSheets,
  currentHref,
  currentPathname,
  getOverlayBackgroundHref,
  hasCachedShellPage,
  historyState,
  isPlayerModalOpen,
  openOverlayHref,
  openShellSectionHref,
  playerModalHistoryHref,
  reopenPlayerModal,
  reopenShellSheet,
  restoreCachedShellPage,
  shellSheetHistoryHref,
}: ShellPopStateNavigationOptions): ShellPopStateNavigationResult {
  if (
    toggleSurfaceHistoryEntry(
      playerModalHistoryHref,
      isPlayerModalHistoryState(historyState),
      currentHref,
      () => isPlayerModalOpen && closePlayerModal(),
      () => isPlayerModalOpen || reopenPlayerModal(),
    )
  ) {
    return 'player-modal';
  }

  const sheetKind = readHistoryEntryMarker(historyState, SHELL_SHEET_HISTORY_KEY) as ShellSheetKind;
  if (
    toggleSurfaceHistoryEntry(shellSheetHistoryHref, Boolean(sheetKind), currentHref, closeShellSheets, () =>
      reopenShellSheet(sheetKind),
    )
  ) {
    return 'shell-sheet';
  }

  if (togglePageSurfaceHistoryEntry(historyState, currentHref)) return 'page-surface';

  const nextOverlayRoute = parseOverlayRoute(currentPathname);
  const nextShellSectionRoute = parseShellSectionRoute(currentPathname);
  const nextNormalizedPathname = normalizeAppPathname(currentPathname);
  const shellHistoryState = readShellPopStateHistoryState(historyState);
  const overlayBackgroundHref = getOverlayBackgroundHref();

  // Back to the open overlay's own background page only closes the overlay: the list keeps its scroll position and
  // focus returns to the card that opened it.
  if (
    overlayBackgroundHref &&
    !shellHistoryState.isOverlayHistory &&
    normalizeAppPathname(new URL(overlayBackgroundHref).pathname) === nextNormalizedPathname
  ) {
    closeOverlayState({ restoreFocus: true });
    return 'closed-overlay';
  }

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
