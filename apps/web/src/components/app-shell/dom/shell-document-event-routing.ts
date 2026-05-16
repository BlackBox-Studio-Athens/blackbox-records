import type { ActivePlayerSession } from '../player-iframe-session';
import type { PlayerProvider } from '../player-provider-data';
import {
  isModifiedEvent,
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  resolveInternalUrl,
  resolveShellNavigationSource,
  type ShellNavigationSource,
} from '../navigation/shell-navigation';
import {
  routeShellAnchorClickNavigation,
  type ShellAnchorClickNavigationResult,
} from '../navigation/shell-anchor-click-navigation';
import {
  resolveShellDocumentClickIntent,
  type ShellDocumentClickIntent,
} from '../navigation/shell-document-click-intent';
import {
  routeShellPopStateNavigation,
  type ShellPopStateNavigationResult,
} from '../navigation/shell-popstate-navigation';
import { primeShellPrefetchIntent } from '../navigation/shell-prefetch-intent';
import { schedulePlayerIframeBlurInteractionCheck } from '../player-shell/shell-player-iframe-blur-interaction';
import { connectShellDocumentListeners } from './shell-document-listeners';
import { handleShellEscapeDismissal, type ShellEscapeDismissalResult } from './shell-escape-dismissal';

type MaybePromise<T> = T | Promise<T>;
type ShellDocumentListenerTargets = Parameters<typeof connectShellDocumentListeners>[0];
type ShellDocumentClickIntentResolver = typeof resolveShellDocumentClickIntent;
type ShellDocumentEventRoutingDependencies = {
  handleShellEscapeDismissal?: typeof handleShellEscapeDismissal;
  primeShellPrefetchIntent?: typeof primeShellPrefetchIntent;
  resolveShellDocumentClickIntent?: ShellDocumentClickIntentResolver;
  routeShellAnchorClickNavigation?: typeof routeShellAnchorClickNavigation;
  routeShellPopStateNavigation?: typeof routeShellPopStateNavigation;
  schedulePlayerIframeBlurInteractionCheck?: typeof schedulePlayerIframeBlurInteractionCheck;
};

export type ShellDocumentEventRoutingOptions = {
  closeMobileNavigation: () => void;
  closeOverlayState: (options: { restoreFocus: false }) => void;
  closeOverlayWithHistoryBack: () => void;
  closePlayerModal: () => void;
  collapseOverlayHistoryToBackground: () => void;
  currentHref: () => string;
  currentOrigin: () => string;
  currentPathname: () => string;
  dependencies?: ShellDocumentEventRoutingDependencies;
  documentTarget: ShellDocumentListenerTargets['documentTarget'];
  getActiveElement: () => Element | null;
  getActivePlayerSession: () => ActivePlayerSession | null;
  getHistoryState: () => unknown;
  getOverlayBackgroundHref: () => string | null | undefined;
  hasCachedShellPage: (pathname: string) => boolean;
  hasOverlayState: () => boolean;
  isPlayerModalOpen: () => boolean;
  markActivePlayerSessionAsInteracted: (embedUrl: string) => void;
  navigateDocumentTo: (href: string) => void;
  openOverlayHref: (
    href: string,
    options: { backgroundHref: string; pushHistory?: true; replaceHistory?: false },
  ) => MaybePromise<boolean>;
  openPlayerModal: (triggerElement: HTMLElement, playerElement: HTMLElement) => void;
  reopenPlayerModal: () => void;
  openShellSectionHref: (
    href: string,
    options:
      | {
          historyMode: 'push';
          source: ShellNavigationSource;
          sourceElement: HTMLAnchorElement;
        }
      | { historyMode: 'none'; source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  prefetchOverlayHref: (href: string) => Promise<void> | void;
  prefetchShellSectionHref: (href: string) => Promise<void> | void;
  readPlayerProvidersFromElement: Parameters<ShellDocumentClickIntentResolver>[1]['readPlayerProvidersFromElement'];
  restoreCachedShellPage: (
    pathname: string,
    options: { source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  scheduler: Pick<Window, 'setTimeout'>;
  scrollToTargetId: (targetId: string, triggerElement: HTMLElement) => boolean;
  setMobileNavigationOpen: (updater: (currentState: boolean) => boolean) => void;
  setOverlayTriggerElement: (element: HTMLAnchorElement) => void;
  stopPlayerSession: (options?: { restoreFocus?: boolean }) => void;
  warmProviderOrigins: (providers: PlayerProvider[]) => void;
  windowTarget: ShellDocumentListenerTargets['windowTarget'];
};

export type ShellDocumentEventRoutingResult =
  | ShellAnchorClickNavigationResult
  | ShellDocumentClickIntent['kind']
  | ShellEscapeDismissalResult
  | ShellPopStateNavigationResult
  | 'ignored';

export function connectShellDocumentEventRouting({
  closeMobileNavigation,
  closeOverlayState,
  closeOverlayWithHistoryBack,
  closePlayerModal,
  collapseOverlayHistoryToBackground,
  currentHref,
  currentOrigin,
  currentPathname,
  dependencies = {},
  documentTarget,
  getActiveElement,
  getActivePlayerSession,
  getHistoryState,
  getOverlayBackgroundHref,
  hasCachedShellPage,
  hasOverlayState,
  isPlayerModalOpen,
  markActivePlayerSessionAsInteracted,
  navigateDocumentTo,
  openOverlayHref,
  openPlayerModal,
  reopenPlayerModal,
  openShellSectionHref,
  prefetchOverlayHref,
  prefetchShellSectionHref,
  readPlayerProvidersFromElement,
  restoreCachedShellPage,
  scheduler,
  scrollToTargetId,
  setMobileNavigationOpen,
  setOverlayTriggerElement,
  stopPlayerSession,
  warmProviderOrigins,
  windowTarget,
}: ShellDocumentEventRoutingOptions) {
  const resolveClickIntent = dependencies.resolveShellDocumentClickIntent ?? resolveShellDocumentClickIntent;
  const routeAnchorClick = dependencies.routeShellAnchorClickNavigation ?? routeShellAnchorClickNavigation;
  const primePrefetchIntent = dependencies.primeShellPrefetchIntent ?? primeShellPrefetchIntent;
  const handleEscapeDismissal = dependencies.handleShellEscapeDismissal ?? handleShellEscapeDismissal;
  const routePopState = dependencies.routeShellPopStateNavigation ?? routeShellPopStateNavigation;
  const scheduleIframeBlurInteractionCheck =
    dependencies.schedulePlayerIframeBlurInteractionCheck ?? schedulePlayerIframeBlurInteractionCheck;

  function handleDocumentClick(event: MouseEvent): ShellDocumentEventRoutingResult {
    if (event.defaultPrevented || isModifiedEvent(event)) return 'ignored';

    const clickIntent = resolveClickIntent(event.target, {
      readPlayerProvidersFromElement,
    });

    if (clickIntent.kind === 'mobile-navigation-trigger') {
      event.preventDefault();
      setMobileNavigationOpen((currentState) => !currentState);
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'player-modal-dismiss') {
      event.preventDefault();
      closePlayerModal();
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'mini-player-open') {
      event.preventDefault();
      reopenPlayerModal();
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'mini-player-stop') {
      event.preventDefault();
      stopPlayerSession({ restoreFocus: true });
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'player-trigger') {
      event.preventDefault();
      openPlayerModal(clickIntent.triggerElement, clickIntent.playerElement);
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'player-trigger-without-providers') {
      return clickIntent.kind;
    }

    const anchorElement =
      clickIntent.kind === 'anchor'
        ? clickIntent.anchorElement
        : clickIntent.kind === 'scroll-target'
          ? clickIntent.anchorElement
          : null;

    if (clickIntent.kind === 'scroll-target') {
      if (scrollToTargetId(clickIntent.targetId, clickIntent.triggerElement)) {
        event.preventDefault();
        return clickIntent.kind;
      }
    }

    if (!anchorElement) return clickIntent.kind;

    return routeAnchorClick({
      anchorElement,
      closeMobileNavigation,
      collapseOverlayHistoryToBackground,
      currentHref: currentHref(),
      currentOrigin: currentOrigin(),
      getOverlayBackgroundHref,
      hasOverlayState,
      isNavigableOverlayAnchor,
      isNavigableShellSectionAnchor,
      navigateDocumentTo,
      openOverlayHref,
      openShellSectionHref,
      preventDefault: () => event.preventDefault(),
      resolveInternalUrl,
      resolveShellNavigationSource,
      setOverlayTriggerElement,
    });
  }

  function primeMusicAndOverlayPrefetch(eventTarget: EventTarget | null) {
    primePrefetchIntent({
      eventTarget,
      isNavigableOverlayAnchor,
      isNavigableShellSectionAnchor,
      prefetchOverlayHref,
      prefetchShellSectionHref,
      readPlayerProvidersFromElement,
      warmProviderOrigins,
    });
  }

  function handleDocumentPointerOver(event: PointerEvent) {
    primeMusicAndOverlayPrefetch(event.target);
  }

  function handleDocumentFocusIn(event: FocusEvent) {
    primeMusicAndOverlayPrefetch(event.target);
  }

  function handleKeyDown(event: KeyboardEvent): ShellEscapeDismissalResult {
    return handleEscapeDismissal({
      closeOverlayWithHistoryBack,
      closePlayerModal,
      hasOverlayState,
      isPlayerModalOpen: isPlayerModalOpen(),
      key: event.key,
      preventDefault: () => event.preventDefault(),
    });
  }

  function handlePopState(): ShellPopStateNavigationResult {
    return routePopState({
      closeMobileNavigation,
      closeOverlayState,
      currentHref: currentHref(),
      currentPathname: currentPathname(),
      hasCachedShellPage,
      historyState: getHistoryState(),
      openOverlayHref,
      openShellSectionHref,
      restoreCachedShellPage,
    });
  }

  function handleWindowBlur() {
    scheduleIframeBlurInteractionCheck({
      getActiveElement,
      getActiveSession: getActivePlayerSession,
      markPlayerSessionAsInteracted: markActivePlayerSessionAsInteracted,
      scheduler,
    });
  }

  return connectShellDocumentListeners({
    documentTarget,
    onBlur: handleWindowBlur,
    onClick: handleDocumentClick,
    onFocusIn: handleDocumentFocusIn,
    onKeyDown: handleKeyDown,
    onPointerOver: handleDocumentPointerOver,
    onPopState: handlePopState,
    windowTarget,
  });
}
