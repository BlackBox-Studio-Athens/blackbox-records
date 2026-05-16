import { parseOverlayRoute, type OverlayRoute } from '@/lib/app-shell/routing';

import { writeOverlayHistoryState as writeBrowserOverlayHistoryState } from './overlay-history';

type MutableRef<T> = {
  current: T;
};

type OverlayFragmentLoader = {
  fetchHtml: (pathname: string, signal?: AbortSignal) => Promise<string>;
  getCachedHtml: (pathname: string) => string;
};

type OverlayHistoryTarget = Parameters<typeof writeBrowserOverlayHistoryState>[0];
type WriteOverlayHistoryState = typeof writeBrowserOverlayHistoryState;

export type ShellOverlayState = {
  backgroundHref: string;
  href: string;
  html: string;
  isLoading: boolean;
  route: OverlayRoute;
};

export type OpenShellOverlayNavigationOptions = {
  activeAbortControllerRef: MutableRef<AbortController | null>;
  backgroundHref?: string | undefined;
  closeOverlayState: (options?: { restoreFocus?: boolean }) => void;
  currentHref: string;
  getCurrentOverlayState: () => ShellOverlayState | null;
  history: OverlayHistoryTarget;
  href: string;
  navigateDocumentTo: (href: string) => void;
  overlayFragmentLoader: OverlayFragmentLoader;
  pushHistory?: boolean | undefined;
  replaceHistory?: boolean | undefined;
  scheduleOverlayContentFocus: () => void;
  setOverlayState: (
    nextState: ShellOverlayState | ((currentState: ShellOverlayState | null) => ShellOverlayState | null),
  ) => void;
  writeOverlayHistoryState?: WriteOverlayHistoryState | undefined;
};

export async function openShellOverlayNavigation({
  activeAbortControllerRef,
  backgroundHref: requestedBackgroundHref,
  closeOverlayState,
  currentHref,
  getCurrentOverlayState,
  history,
  href,
  navigateDocumentTo,
  overlayFragmentLoader,
  pushHistory,
  replaceHistory,
  scheduleOverlayContentFocus,
  setOverlayState,
  writeOverlayHistoryState = writeBrowserOverlayHistoryState,
}: OpenShellOverlayNavigationOptions) {
  const resolvedUrl = new URL(href, currentHref);
  const route = parseOverlayRoute(resolvedUrl.pathname);
  if (!route) return false;

  activeAbortControllerRef.current?.abort();
  const abortController = new AbortController();
  activeAbortControllerRef.current = abortController;

  const backgroundHref = requestedBackgroundHref || getCurrentOverlayState()?.backgroundHref || currentHref;
  const cachedHtml = overlayFragmentLoader.getCachedHtml(route.pathname);
  setOverlayState({
    backgroundHref,
    href: resolvedUrl.toString(),
    html: cachedHtml,
    isLoading: !cachedHtml,
    route,
  });

  if (pushHistory || replaceHistory) {
    writeOverlayHistoryState(history, {
      backgroundHref,
      historyMode: pushHistory ? 'push' : 'replace',
      href: resolvedUrl.toString(),
      pathname: route.pathname,
    });
  }

  try {
    const html = cachedHtml || (await overlayFragmentLoader.fetchHtml(route.pathname, abortController.signal));
    setOverlayState((currentState) =>
      currentState?.route.pathname === route.pathname
        ? {
            ...currentState,
            html,
            isLoading: false,
          }
        : currentState,
    );
    scheduleOverlayContentFocus();
    return true;
  } catch {
    if (abortController.signal.aborted) {
      return true;
    }

    closeOverlayState({ restoreFocus: false });
    navigateDocumentTo(resolvedUrl.toString());
    return false;
  }
}
