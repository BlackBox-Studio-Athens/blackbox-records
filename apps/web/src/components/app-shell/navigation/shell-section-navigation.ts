import { normalizeAppPathname, parseShellSectionRoute, type ShellSectionRoute } from '@/components/app-shell/routing';

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
  hasCachedSnapshot: (pathname: string) => boolean;
  warmSnapshotImages?: ((pathname: string) => void) | undefined;
};

type ShellSectionTransitionController = {
  begin: (target: string, source: ShellNavigationSource) => number;
  finish: (transitionToken: number) => Promise<void>;
  reset: () => void;
};

export type ShellSectionActivationOutcome = 'aborted' | 'complete' | 'failed';

type ShellSectionActivation = {
  cached: boolean;
  kind: ShellSectionRoute['kind'];
  pathname: string;
};

export type OpenShellSectionNavigationOptions = {
  activeAbortControllerRef: MutableRef<AbortController | null>;
  applyShellPageSnapshot: (pageSnapshot: ShellPageSnapshot) => boolean;
  cacheDocumentSnapshot: () => ShellPageSnapshot | null;
  collapseOverlayHistoryToBackground: () => void;
  currentHref: string;
  currentPathname: string;
  // Pathname of the page the shell currently renders, which can differ from the URL while an overlay is open.
  getRenderedPathname?: (() => string) | undefined;
  hasOverlayState: () => boolean;
  historyMode?: 'push' | 'replace' | 'none' | undefined;
  href: string;
  navigateDocumentTo: (href: string) => void;
  onSectionActivationStart?:
    | ((activation: ShellSectionActivation) => ((outcome: ShellSectionActivationOutcome) => void) | undefined)
    | undefined;
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
  waitForFirstScreenImages?: (() => Promise<unknown>) | undefined;
};

export async function openShellSectionNavigation({
  activeAbortControllerRef,
  applyShellPageSnapshot,
  cacheDocumentSnapshot,
  collapseOverlayHistoryToBackground,
  currentHref,
  currentPathname,
  getRenderedPathname = () => normalizeAppPathname(currentPathname),
  hasOverlayState,
  historyMode,
  href,
  navigateDocumentTo,
  onSectionActivationStart,
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
  waitForFirstScreenImages = async () => undefined,
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

  // The leaving page is snapshotted only after the veil has painted, and only when no snapshot exists yet: reading
  // and sanitizing a large main element takes tens of milliseconds and must not sit inside the click task.
  const activePathname = getRenderedPathname();
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
  const finishSectionActivation = onSectionActivationStart?.({
    cached: Boolean(cachedSnapshot),
    kind: route.kind,
    pathname: route.pathname,
  });
  let activationOutcome: ShellSectionActivationOutcome = 'aborted';
  if (!cachedSnapshot) {
    setIsRouteLoading(true);
  }

  const sectionTransitionToken = shellSectionTransition.begin(SHELL_SECTION_LABELS[route.kind], source);
  // An uncached page starts loading now, while the veil paints, instead of after the frame wait.
  const pageSnapshotRequest = cachedSnapshot
    ? Promise.resolve(cachedSnapshot)
    : shellPageLoader.fetchSnapshot(route.pathname, resolvedUrl.toString(), abortController.signal);
  // Awaited below; this only keeps a rejection during the frame wait from surfacing as unhandled.
  pageSnapshotRequest.catch(() => undefined);
  if (cachedSnapshot) shellPageLoader.warmSnapshotImages?.(route.pathname);
  await waitForAnimationFramesCallback(2);

  try {
    if (abortController.signal.aborted) {
      return true;
    }

    // Read at this point, not at click time: another activation may have replaced main during the frame wait.
    if (!shellPageLoader.hasCachedSnapshot(getRenderedPathname())) {
      cacheDocumentSnapshot();
    }

    const pageSnapshot = await pageSnapshotRequest;

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

    // The scroll reset waits three frames; the first-screen images decode meanwhile instead of afterwards.
    await Promise.all([scrollToDestination(), waitForFirstScreenImages()]);
    if (abortController.signal.aborted) {
      return true;
    }

    triggerShellPageEnterTransition();
    await shellSectionTransition.finish(sectionTransitionToken);
    activationOutcome = 'complete';

    return true;
  } catch {
    if (abortController.signal.aborted) {
      return true;
    }

    shellSectionTransition.reset();
    activationOutcome = 'failed';
    navigateDocumentTo(resolvedUrl.toString());
    return false;
  } finally {
    finishSectionActivation?.(activationOutcome);
    if (activeAbortControllerRef.current === abortController) {
      activeAbortControllerRef.current = null;
    }
    stopRouteLoadingSoon();
  }
}

function pushBrowserShellSectionHistoryState(pathname: string, href: string) {
  window.history.pushState({ __appShellSection: true, pathname } satisfies ShellSectionHistoryState, '', href);
}
