import { reducePlayerSessionMachine } from '../player-session-machine';
import {
  readPlayerProvidersFromElement,
  readPlayerTitleFromElement,
  type PlayerProvider,
  type PlayerProviderId,
} from '../player-provider-data';
import {
  DEFAULT_MAX_CACHED_PLAYER_IFRAMES,
  markPlayerIframeAsActive,
  resolvePlayerIframe,
  retirePlayerSession,
  type ActivePlayerSession,
} from '../player-iframe-session';
import { warmPlayerProviderOrigins } from '../player-provider-warmup';
import { syncPlayerSessionFrameHost } from './shell-player-frame-host';
import { restoreConnectedPlayerTriggerFocus, schedulePlayerModalCloseButtonFocus } from './shell-player-focus';
import { resolvePlayerModalOpenRequest } from './shell-player-modal-open-request';
import { derivePlayerSessionMachineState } from './shell-player-session-machine-state';
import { derivePlayerShellViewState, type PlayerShellViewState } from './shell-player-view-state';

type MutableRef<T> = {
  current: T;
};

type PlayerFocusScheduler = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type PendingPlayerProvider = {
  nextStatus: ActivePlayerSession['status'] | undefined;
  provider: PlayerProvider;
  releaseTitle: string;
};

type ShellPlayerSessionControllerOptions = {
  activePlayerSessionRef: MutableRef<ActivePlayerSession | null>;
  activePlayerTriggerElementRef: MutableRef<HTMLElement | null>;
  getIsPlayerModalOpen: () => boolean;
  getScheduler: () => PlayerFocusScheduler;
  getTargetDocument: () => Document;
  iframeCacheByEmbedUrlRef: MutableRef<Map<string, HTMLIFrameElement>>;
  iframeFrameHostRef: MutableRef<HTMLElement | null>;
  modalCloseButtonRef: MutableRef<HTMLButtonElement | null>;
  pendingPlayerProviderRef: MutableRef<PendingPlayerProvider | null>;
  providerSelectionByTitleRef: MutableRef<Map<string, PlayerProviderId>>;
  setActivePlayerEmbedLayout: (layout: PlayerShellViewState['activePlayerEmbedLayout']) => void;
  setActivePlayerProviderId: (providerId: PlayerShellViewState['activePlayerProviderId']) => void;
  setActivePlayerTitle: (title: string) => void;
  setIsMiniPlayerVisible: (isVisible: boolean) => void;
  setIsPlayerLoading: (isLoading: boolean) => void;
  setIsPlayerModalOpen: (isOpen: boolean) => void;
  setMiniPlayerStatusLabel: (label: string) => void;
  setPlayerModalDismissActionLabel: (label: PlayerShellViewState['playerModalDismissActionLabel']) => void;
  setPlayerModalDismissAriaLabel: (label: PlayerShellViewState['playerModalDismissAriaLabel']) => void;
  setPlayerProviders: (providers: PlayerProvider[]) => void;
  warmedOriginsRef: MutableRef<Set<string>>;
};

export function createShellPlayerSessionController({
  activePlayerSessionRef,
  activePlayerTriggerElementRef,
  getIsPlayerModalOpen,
  getScheduler,
  getTargetDocument,
  iframeCacheByEmbedUrlRef,
  iframeFrameHostRef,
  modalCloseButtonRef,
  pendingPlayerProviderRef,
  providerSelectionByTitleRef,
  setActivePlayerEmbedLayout,
  setActivePlayerProviderId,
  setActivePlayerTitle,
  setIsMiniPlayerVisible,
  setIsPlayerLoading,
  setIsPlayerModalOpen,
  setMiniPlayerStatusLabel,
  setPlayerModalDismissActionLabel,
  setPlayerModalDismissAriaLabel,
  setPlayerProviders,
  warmedOriginsRef,
}: ShellPlayerSessionControllerOptions) {
  function retireActivePlayerSession(activeSession: ActivePlayerSession | null) {
    retirePlayerSession(iframeCacheByEmbedUrlRef.current, activeSession);
  }

  function updatePlayerUiFromSession(activeSession: ActivePlayerSession | null) {
    if (!activeSession) {
      setPlayerProviders([]);
    }

    const viewState = derivePlayerShellViewState(activeSession);
    setActivePlayerProviderId(viewState.activePlayerProviderId);
    setActivePlayerEmbedLayout(viewState.activePlayerEmbedLayout);
    setActivePlayerTitle(viewState.activePlayerTitle);
    setIsPlayerLoading(viewState.isPlayerLoading);
    setIsMiniPlayerVisible(viewState.isMiniPlayerVisible);
    setMiniPlayerStatusLabel(viewState.miniPlayerStatusLabel);
    setPlayerModalDismissActionLabel(viewState.playerModalDismissActionLabel);
    setPlayerModalDismissAriaLabel(viewState.playerModalDismissAriaLabel);
  }

  function markActivePlayerSessionAsInteracted(embedUrl: string) {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession || activeSession.embedUrl !== embedUrl || activeSession.hasEmbedInteraction) return;

    activeSession.hasEmbedInteraction = true;
    updatePlayerUiFromSession(activeSession);
  }

  function markActivePlayerSurfaceAsInteracted() {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession) return;

    markActivePlayerSessionAsInteracted(activeSession.embedUrl);
  }

  function syncActivePlayerSessionIntoFrameHost() {
    syncPlayerSessionFrameHost({
      activeSession: activePlayerSessionRef.current,
      frameHostElement: iframeFrameHostRef.current,
      markIframeAsActive: markPlayerIframeAsActive,
      updatePlayerUiFromSession,
    });
  }

  function resolveIframe(provider: PlayerProvider, releaseTitle: string) {
    const frameHostElement = iframeFrameHostRef.current;
    if (!frameHostElement) return null;

    return resolvePlayerIframe({
      callbacks: {
        onInteraction: markActivePlayerSessionAsInteracted,
        onLoadStateChange: (embedUrl) => {
          if (activePlayerSessionRef.current?.embedUrl !== embedUrl) return;
          setIsPlayerLoading(false);
          updatePlayerUiFromSession(activePlayerSessionRef.current);
        },
      },
      frameHostElement,
      iframeCache: iframeCacheByEmbedUrlRef.current,
      maxCachedIframes: DEFAULT_MAX_CACHED_PLAYER_IFRAMES,
      provider,
      releaseTitle,
    });
  }

  function warmProviderOrigins(providers: PlayerProvider[]) {
    warmPlayerProviderOrigins({
      providers,
      targetDocument: getTargetDocument(),
      warmedOrigins: warmedOriginsRef.current,
    });
  }

  function applyPlayerProvider(
    provider: PlayerProvider,
    releaseTitle: string,
    options?: {
      nextStatus?: ActivePlayerSession['status'];
    },
  ) {
    const activeSession = activePlayerSessionRef.current;
    if (activeSession && activeSession.embedUrl && activeSession.embedUrl !== provider.embedUrl) {
      retireActivePlayerSession(activeSession);
      activePlayerSessionRef.current = null;
    }

    const iframeElement = resolveIframe(provider, releaseTitle);
    if (!iframeElement) {
      pendingPlayerProviderRef.current = { nextStatus: options?.nextStatus, provider, releaseTitle };
      return;
    }

    pendingPlayerProviderRef.current = null;

    const nextSession: ActivePlayerSession = {
      embedUrl: provider.embedUrl,
      embedLayout: provider.embedLayout,
      hasEmbedInteraction: false,
      iframeElement,
      providerId: provider.id,
      releaseTitle,
      status: options?.nextStatus ?? (getIsPlayerModalOpen() ? 'modal-open' : 'minimized'),
    };

    activePlayerSessionRef.current = nextSession;
    providerSelectionByTitleRef.current.set(releaseTitle, provider.id);
    setActivePlayerProviderId(provider.id);
    setActivePlayerEmbedLayout(provider.embedLayout);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerLoading(iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState !== 'loaded');
    updatePlayerUiFromSession(nextSession);
  }

  function stopPlayerSession({ restoreFocus = true } = {}) {
    retireActivePlayerSession(activePlayerSessionRef.current);
    activePlayerSessionRef.current = null;
    pendingPlayerProviderRef.current = null;
    setIsPlayerModalOpen(false);
    updatePlayerUiFromSession(null);

    if (restoreFocus) {
      restoreConnectedPlayerTriggerFocus(activePlayerTriggerElementRef.current);
    }
  }

  function minimizePlayerSession() {
    if (!activePlayerSessionRef.current) return;
    activePlayerSessionRef.current.status = 'minimized';
    setIsPlayerModalOpen(false);
    updatePlayerUiFromSession(activePlayerSessionRef.current);
  }

  function closePlayerModal() {
    const activeSession = activePlayerSessionRef.current;
    const nextSessionState = reducePlayerSessionMachine(derivePlayerSessionMachineState(activeSession), {
      type: 'dismiss-requested',
    });

    if (activeSession && nextSessionState.hasSession && nextSessionState.status === 'minimized') {
      minimizePlayerSession();
      return;
    }

    stopPlayerSession({ restoreFocus: true });
  }

  function focusPlayerModalCloseButtonSoon() {
    schedulePlayerModalCloseButtonFocus({
      getCloseButton: () => modalCloseButtonRef.current,
      scheduler: getScheduler(),
    });
  }

  function connectPlayerSurface() {
    const pendingProvider = pendingPlayerProviderRef.current;
    if (pendingProvider) {
      applyPlayerProvider(
        pendingProvider.provider,
        pendingProvider.releaseTitle,
        pendingProvider.nextStatus ? { nextStatus: pendingProvider.nextStatus } : undefined,
      );
    } else {
      syncActivePlayerSessionIntoFrameHost();
    }

    if (getIsPlayerModalOpen()) focusPlayerModalCloseButtonSoon();
  }

  function reopenPlayerModal() {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession) return;

    activeSession.status = reducePlayerSessionMachine(derivePlayerSessionMachineState(activeSession), {
      type: 'reopen-requested',
    }).status as ActivePlayerSession['status'];
    setIsPlayerModalOpen(true);
    syncActivePlayerSessionIntoFrameHost();
    focusPlayerModalCloseButtonSoon();
  }

  function openPlayerModal(triggerElement: HTMLElement, playerElement: HTMLElement) {
    const providers = readPlayerProvidersFromElement(playerElement);
    const releaseTitle = readPlayerTitleFromElement(playerElement);
    const playerModalOpenRequest = resolvePlayerModalOpenRequest({
      activeSession: activePlayerSessionRef.current,
      cachedProviderId: providerSelectionByTitleRef.current.get(releaseTitle),
      providers,
      releaseTitle,
    });
    if (playerModalOpenRequest.kind === 'without-provider') return;

    if (playerModalOpenRequest.kind === 'new-provider' && playerModalOpenRequest.shouldStopActiveSession) {
      stopPlayerSession({ restoreFocus: false });
    }

    activePlayerTriggerElementRef.current = triggerElement;
    warmProviderOrigins(providers);
    setPlayerProviders(providers);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerModalOpen(true);

    if (playerModalOpenRequest.kind === 'reuse-active-session') {
      playerModalOpenRequest.activeSession.status = 'modal-open';
      syncActivePlayerSessionIntoFrameHost();
      focusPlayerModalCloseButtonSoon();
      return;
    }

    applyPlayerProvider(playerModalOpenRequest.nextProvider, releaseTitle, { nextStatus: 'modal-open' });
    focusPlayerModalCloseButtonSoon();
  }

  return {
    applyPlayerProvider,
    closePlayerModal,
    connectPlayerSurface,
    markActivePlayerSessionAsInteracted,
    markActivePlayerSurfaceAsInteracted,
    openPlayerModal,
    reopenPlayerModal,
    stopPlayerSession,
    warmProviderOrigins,
  };
}
