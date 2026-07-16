import { normalizeAppPathname, parseShellSectionRoute } from '@/lib/app-shell/routing';

import {
  markCurrentHistoryEntryForShellSection,
  SHELL_SECTION_LABELS,
  type ShellNavigationSource,
  type ShellSectionHistoryState,
  waitForAnimationFrames,
} from './shell-navigation';
import type { ShellPageSnapshot } from './shell-page-snapshot';

type MutableRef<T> = {
  current: T;
};

type ShellPageSnapshotLoader = {
  fetchSnapshot: (pathname: string, href: string, signal?: AbortSignal) => Promise<ShellPageSnapshot>;
  getCachedSnapshot: (pathname: string) => ShellPageSnapshot | null;
};

type ShellSectionTransitionController = {
  begin: (target: string, source: ShellNavigationSource) => number;
  finish: (transitionToken: number) => Promise<void>;
  reset: () => void;
};

export type OpenShellSectionNavigationOptions = {
  activeAbortControllerRef: MutableRef<AbortController | null>;
  applyShellPageSnapshot: (pageSnapshot: ShellPageSnapshot) => boolean;
  cacheDocumentSnapshot: () => ShellPageSnapshot | null;
  collapseOverlayHistoryToBackground: () => void;
  currentHref: string;
  currentPathname: string;
  hasOverlayState: () => boolean;
  historyMode?: 'push' | 'replace' | 'none' | undefined;
  href: string;
  navigateDocumentTo: (href: string) => void;
  pushShellSectionHistoryState?: ((pathname: string, href: string) => void) | undefined;
  replaceShellSectionHistoryState?: ((pathname: string, href: string) => void) | undefined;
  scrollShellViewportToTarget: (targetId: string, sourceElement?: HTMLElement | null) => boolean;
  scrollShellViewportToTop: (options?: { sourceElement?: HTMLElement | null | undefined }) => Promise<void>;
  setIsRouteLoading: (isRouteLoading: boolean) => void;
  shellPageLoader: ShellPageSnapshotLoader;
  shellSectionTransition: ShellSectionTransitionController;
  source?: ShellNavigationSource | undefined;
  sourceElement?: HTMLElement | null | undefined;
  stopRouteLoadingSoon: () => void;
  syncShellNavigationState: (pathname: string) => void;
  triggerShellPageEnterTransition: () => void;
  waitForAnimationFrames?: ((count?: number) => Promise<void>) | undefined;
};

export async function openShellSectionNavigation({
  activeAbortControllerRef,
  applyShellPageSnapshot,
  cacheDocumentSnapshot,
  collapseOverlayHistoryToBackground,
  currentHref,
  currentPathname,
  hasOverlayState,
  historyMode,
  href,
  navigateDocumentTo,
  pushShellSectionHistoryState = pushBrowserShellSectionHistoryState,
  replaceShellSectionHistoryState = markCurrentHistoryEntryForShellSection,
  scrollShellViewportToTarget,
  scrollShellViewportToTop,
  setIsRouteLoading,
  shellPageLoader,
  shellSectionTransition,
  source = 'programmatic',
  sourceElement,
  stopRouteLoadingSoon,
  syncShellNavigationState,
  triggerShellPageEnterTransition,
  waitForAnimationFrames: waitForAnimationFramesCallback = waitForAnimationFrames,
}: OpenShellSectionNavigationOptions) {
  const resolvedUrl = new URL(href, currentHref);
  const route = parseShellSectionRoute(resolvedUrl.pathname);
  if (!route) return false;

  const scrollToDestination = async () => {
    const targetId = decodeURIComponent(resolvedUrl.hash.slice(1));
    if (targetId && scrollShellViewportToTarget(targetId, sourceElement)) return;

    await scrollShellViewportToTop({ sourceElement });
  };

  if (hasOverlayState()) {
    collapseOverlayHistoryToBackground();
  }

  const currentSnapshot = cacheDocumentSnapshot();
  const activePathname = currentSnapshot?.pathname || normalizeAppPathname(currentPathname);
  if (route.pathname === activePathname) {
    syncShellNavigationState(activePathname);
    await scrollToDestination();
    if (historyMode === 'replace') {
      replaceShellSectionHistoryState(route.pathname, resolvedUrl.toString());
    }
    return true;
  }

  activeAbortControllerRef.current?.abort();
  const abortController = new AbortController();
  activeAbortControllerRef.current = abortController;

  const cachedSnapshot = shellPageLoader.getCachedSnapshot(route.pathname);
  if (!cachedSnapshot) {
    setIsRouteLoading(true);
  }

  const sectionTransitionToken = shellSectionTransition.begin(SHELL_SECTION_LABELS[route.kind], source);
  await waitForAnimationFramesCallback(2);

  try {
    const pageSnapshot =
      cachedSnapshot ||
      (await shellPageLoader.fetchSnapshot(route.pathname, resolvedUrl.toString(), abortController.signal));

    if (abortController.signal.aborted) {
      return true;
    }

    const applied = applyShellPageSnapshot(pageSnapshot);
    if (!applied) {
      throw new Error(`Unable to apply shell page snapshot for ${route.pathname}`);
    }

    if (historyMode === 'push') {
      pushShellSectionHistoryState(route.pathname, resolvedUrl.toString());
    } else if (historyMode === 'replace') {
      replaceShellSectionHistoryState(route.pathname, resolvedUrl.toString());
    }

    await scrollToDestination();
    triggerShellPageEnterTransition();
    await shellSectionTransition.finish(sectionTransitionToken);

    return true;
  } catch {
    if (abortController.signal.aborted) {
      return true;
    }

    shellSectionTransition.reset();
    navigateDocumentTo(resolvedUrl.toString());
    return false;
  } finally {
    if (activeAbortControllerRef.current === abortController) {
      activeAbortControllerRef.current = null;
    }
    stopRouteLoadingSoon();
  }
}

function pushBrowserShellSectionHistoryState(pathname: string, href: string) {
  window.history.pushState({ __appShellSection: true, pathname } satisfies ShellSectionHistoryState, '', href);
}
