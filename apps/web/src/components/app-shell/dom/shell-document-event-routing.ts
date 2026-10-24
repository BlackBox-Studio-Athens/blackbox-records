import type { ActivePlayerSession } from '../../music/player-iframe-session';
import type { PlayerProvider } from '../../music/player-provider-data';
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
import {
  createShellHoverPrefetchDwell,
  primeShellPrefetchIntent,
  type ShellPrefetchOptions,
} from '../navigation/shell-prefetch-intent';
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
  closeOverlayState: (options: { restoreFocus: boolean }) => void;
  closeOverlayWithHistoryBack: () => void;
  closePlayerModal: () => void;
  closePlayerModalWithHistoryBack: () => void;
  closeShellSheets: () => void;
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
  openOverlayHref: (
    href: string,
    options: { backgroundHref: string; pushHistory?: true; replaceHistory?: false },
  ) => MaybePromise<boolean>;
  openPlayerModal: (triggerElement: HTMLElement, playerElement: HTMLElement) => void;
  // Capture-phase click target; the cart drawer returns focus to the tapped control (iOS does not focus it).
  rememberClickTarget: (target: EventTarget | null) => void;
  reopenPlayerModal: () => void;
  reopenShellSheet: Parameters<typeof routeShellPopStateNavigation>[0]['reopenShellSheet'];
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
  playerModalHistoryHrefRef: { current: string | null };
  prefetchOverlayHref: (href: string) => Promise<void> | void;
  prefetchShellSectionHref: (href: string, options?: ShellPrefetchOptions) => Promise<void> | void;
  readPlayerProvidersFromElement: Parameters<ShellDocumentClickIntentResolver>[1]['readPlayerProvidersFromElement'];
  restoreCachedShellPage: (
    pathname: string,
    options: { source: Extract<ShellNavigationSource, 'history'> },
  ) => MaybePromise<boolean>;
  scheduler: Pick<Window, 'setTimeout'>;
  scrollToTargetId: (targetId: string, triggerElement: HTMLElement) => boolean;
  shellSheetHistoryHrefRef: { current: string | null };
  setOverlayTriggerElement: (element: HTMLAnchorElement) => void;
  stopPlayerSession: (options?: { restoreFocus?: boolean }) => void;
  toggleMobileNavigation: () => void;
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
  closePlayerModalWithHistoryBack,
  closeShellSheets,
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
  openOverlayHref,
  openPlayerModal,
  reopenPlayerModal,
  reopenShellSheet,
  openShellSectionHref,
  playerModalHistoryHrefRef,
  prefetchOverlayHref,
  prefetchShellSectionHref,
  readPlayerProvidersFromElement,
  rememberClickTarget,
  restoreCachedShellPage,
  scheduler,
  scrollToTargetId,
  setOverlayTriggerElement,
  shellSheetHistoryHrefRef,
  stopPlayerSession,
  toggleMobileNavigation,
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
    rememberClickTarget(event.target);
    if (event.defaultPrevented) return 'ignored';

    const clickIntent = resolveClickIntent(event.target, {
      readPlayerProvidersFromElement,
    });

    if (clickIntent.kind === 'mobile-navigation-trigger') {
      event.preventDefault();
      toggleMobileNavigation();
      return clickIntent.kind;
    }

    if (clickIntent.kind === 'player-modal-dismiss') {
      event.preventDefault();
      closePlayerModalWithHistoryBack();
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
      clickIntent.kind === 'anchor' || clickIntent.kind === 'scroll-target' ? clickIntent.anchorElement : null;

    // A modified link click keeps the browser's own new-tab or new-window behaviour. Buttons have none, so the
    // player, Menu and button scroll targets above and below still act while Shift, Ctrl, Alt or Meta is held.
    if (anchorElement && isModifiedEvent(event)) return 'ignored';

    if (clickIntent.kind === 'scroll-target') {
      if (clickIntent.targetId === 'services-inquiry') {
        const inquiryContainer =
          clickIntent.triggerElement.ownerDocument.querySelector<HTMLElement>('[data-services-inquiry-form]');
        if (inquiryContainer) {
          inquiryContainer.dataset.servicesInquiryTargetService =
            clickIntent.triggerElement.dataset.servicesInquiryTargetService || 'General';
        }
      }
      if (scrollToTargetId(clickIntent.targetId, clickIntent.triggerElement)) {
        event.preventDefault();
        return clickIntent.kind;
      }
    }

    if (!anchorElement) return clickIntent.kind;

    return routeAnchorClick({
      anchorElement,
      closeMobileNavigation,
      currentHref: currentHref(),
      currentOrigin: currentOrigin(),
      getOverlayBackgroundHref,
      isNavigableOverlayAnchor,
      isNavigableShellSectionAnchor,
      openOverlayHref,
      openShellSectionHref,
      preventDefault: () => event.preventDefault(),
      resolveInternalUrl,
      resolveShellNavigationSource,
      setOverlayTriggerElement,
    });
  }

  const hoverPrefetchDwell = createShellHoverPrefetchDwell();
  let lastPointerAt = -Infinity;

  function primeMusicAndOverlayPrefetch(
    eventTarget: EventTarget | null,
    hoverDwell?: typeof hoverPrefetchDwell,
    speculative = false,
  ) {
    primePrefetchIntent({
      eventTarget,
      hoverDwell,
      speculative,
      isNavigableOverlayAnchor,
      isNavigableShellSectionAnchor,
      prefetchOverlayHref,
      prefetchShellSectionHref,
      readPlayerProvidersFromElement,
      warmProviderOrigins,
    });
  }

  // Touch and pen pointerover can be the start of a swipe; only a deliberate mouse dwell warms a destination.
  function handleDocumentPointerOver(event: PointerEvent) {
    lastPointerAt = performance.now();
    if (event.pointerType !== 'mouse') {
      hoverPrefetchDwell.cancel();
      return;
    }
    primeMusicAndOverlayPrefetch(event.target, hoverPrefetchDwell);
  }

  function handleDocumentPointerActivity() {
    lastPointerAt = performance.now();
  }

  function handleDocumentFocusIn(event: FocusEvent) {
    // A press can generate focus before click, or after touchend in embedded browsers.
    if (performance.now() - lastPointerAt < 1000) return;
    primeMusicAndOverlayPrefetch(event.target, undefined, true);
  }

  function handleKeyDown(event: KeyboardEvent): ShellEscapeDismissalResult {
    lastPointerAt = -Infinity;
    return handleEscapeDismissal({
      closeOverlayWithHistoryBack,
      closePlayerModal: closePlayerModalWithHistoryBack,
      hasOverlayState,
      isPlayerModalOpen: isPlayerModalOpen(),
      key: event.key,
      preventDefault: () => event.preventDefault(),
    });
  }

  function handlePopState(): ShellPopStateNavigationResult {
    return routePopState({
      closeOverlayState,
      closePlayerModal,
      closeShellSheets,
      currentHref: currentHref(),
      currentPathname: currentPathname(),
      getOverlayBackgroundHref,
      hasCachedShellPage,
      historyState: getHistoryState(),
      isPlayerModalOpen: isPlayerModalOpen(),
      openOverlayHref,
      openShellSectionHref,
      playerModalHistoryHref: playerModalHistoryHrefRef,
      reopenPlayerModal,
      reopenShellSheet,
      restoreCachedShellPage,
      shellSheetHistoryHref: shellSheetHistoryHrefRef,
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

  const disconnectListeners = connectShellDocumentListeners({
    documentTarget,
    onBlur: handleWindowBlur,
    onClick: handleDocumentClick,
    onFocusIn: handleDocumentFocusIn,
    onKeyDown: handleKeyDown,
    onPointerOver: handleDocumentPointerOver,
    onPointerActivity: handleDocumentPointerActivity,
    onPopState: handlePopState,
    windowTarget,
  });

  return () => {
    hoverPrefetchDwell.cancel();
    disconnectListeners();
  };
}
