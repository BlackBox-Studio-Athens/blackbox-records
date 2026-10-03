import { describe, expect, it, vi } from 'vitest';

import type { ActivePlayerSession } from '../../music/player-iframe-session';
import type { PlayerProvider } from '../../music/player-provider-data';
import { createShellPlayerSessionController } from './shell-player-session-controller';

const bandcampEmbedUrl =
  'https://bandcamp.com/EmbeddedPlayer/album=1012756998/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/';

function createIframe(loadState: 'loaded' | 'loading' = 'loaded') {
  return {
    addEventListener: vi.fn(),
    dataset: {
      musicStreamingServiceEmbeddedPlayerLoadState: loadState,
      state: 'inactive',
    },
    remove: vi.fn(),
  } as unknown as HTMLIFrameElement;
}

function createFrameHost(iframeElement = createIframe()) {
  return {
    appendChild: vi.fn(),
    contains: vi.fn(() => true),
    querySelectorAll: vi.fn(() => [iframeElement]),
  } as unknown as HTMLElement;
}

function createTargetDocument() {
  return {
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({}) as HTMLLinkElement),
    head: {
      appendChild: vi.fn(),
      querySelector: vi.fn(() => null),
    },
  } as unknown as Document;
}

function createPlayerElement() {
  return {
    dataset: {
      musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl: bandcampEmbedUrl,
      musicStreamingServiceEmbeddedPlayerReleaseId: 'disintegration',
      musicStreamingServiceEmbeddedPlayerTitle: 'Disintegration',
    },
  } as unknown as HTMLElement;
}

function createTriggerElement() {
  return {
    focus: vi.fn(),
    isConnected: true,
  } as unknown as HTMLElement;
}

const releasesHref = 'https://example.test/blackbox-records/releases/';

function createHistory(initialState: unknown = null) {
  const history = {
    state: initialState,
    back: vi.fn(),
    pushState: vi.fn((state: unknown) => {
      history.state = state;
    }),
  };

  return history;
}

function createController(overrides: Partial<Parameters<typeof createShellPlayerSessionController>[0]> = {}) {
  const history = createHistory();
  const iframeElement = createIframe();
  const provider: PlayerProvider = {
    embedLayout: 'bandcamp-album',
    embedUrl: bandcampEmbedUrl,
    id: 'bandcamp',
  };
  const activePlayerSessionRef = { current: null as ActivePlayerSession | null };
  const activePlayerTriggerElementRef = { current: createTriggerElement() };
  const iframeCacheByEmbedUrlRef = { current: new Map([[provider.embedUrl, iframeElement]]) };
  const options = {
    activePlayerSessionRef,
    activePlayerTriggerElementRef,
    getCurrentHref: vi.fn(() => releasesHref),
    getHistory: vi.fn(() => history),
    getIsPlayerModalOpen: vi.fn(() => false),
    getScheduler: vi.fn(() => ({
      requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    })),
    getTargetDocument: vi.fn(createTargetDocument),
    iframeCacheByEmbedUrlRef,
    iframeFrameHostRef: { current: createFrameHost(iframeElement) },
    modalCloseButtonRef: { current: { focus: vi.fn() } as unknown as HTMLButtonElement },
    pendingPlayerProviderRef: { current: null },
    playerModalHistoryHrefRef: { current: null as string | null },
    providerSelectionByReleaseIdRef: { current: new Map() },
    setActivePlayerEmbedLayout: vi.fn(),
    setActivePlayerProviderId: vi.fn(),
    setActivePlayerTitle: vi.fn(),
    setIsMiniPlayerVisible: vi.fn(),
    setIsPlayerLoading: vi.fn(),
    setIsPlayerModalOpen: vi.fn(),
    setMiniPlayerStatusLabel: vi.fn(),
    setPlayerModalDismissActionLabel: vi.fn(),
    setPlayerModalDismissAriaLabel: vi.fn(),
    setPlayerProviders: vi.fn(),
    warmedOriginsRef: { current: new Set<string>() },
    ...overrides,
  };

  return {
    controller: createShellPlayerSessionController(options),
    history,
    iframeElement,
    options,
    provider,
  };
}

function createActiveSession(iframeElement = createIframe()): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: bandcampEmbedUrl,
    hasEmbedInteraction: false,
    iframeElement,
    providerId: 'bandcamp',
    releaseId: 'disintegration',
    releaseTitle: 'Disintegration',
    status: 'modal-open',
  };
}

describe('shell player session controller', () => {
  it('marks matching sources across surfaces and resets stale cached labels on sync and Stop', () => {
    const labels = [{ textContent: 'Listen' }, { textContent: 'Listen' }, { textContent: 'Listen' }];
    const triggers = ['disintegration', 'disintegration', 'distro:disintegration'].map((id, index) => ({
      dataset: { musicListenSourceId: id, musicListenDefaultLabel: 'Listen', musicListenSession: 'idle' },
      querySelector: vi.fn(() => labels[index]),
      disabled: false,
      hasAttribute() {
        return this.disabled;
      },
      toggleAttribute: vi.fn(function (this: { disabled: boolean }, _name: string, value: boolean) {
        this.disabled = value;
      }),
    }));
    const targetDocument = {
      ...createTargetDocument(),
      querySelectorAll: vi.fn(() => triggers),
    } as unknown as Document;
    const { controller, options } = createController({ getTargetDocument: () => targetDocument });
    options.activePlayerSessionRef.current = createActiveSession();
    controller.syncPlayerTriggers();
    expect(labels.map((label) => label.textContent)).toEqual(['In player', 'In player', 'Listen']);
    expect(triggers[0]?.toggleAttribute).toHaveBeenLastCalledWith('disabled', true);
    expect(triggers[2]?.toggleAttribute).not.toHaveBeenCalled();
    controller.syncPlayerTriggers();
    expect(triggers[0]?.toggleAttribute).toHaveBeenCalledTimes(1);

    options.activePlayerSessionRef.current.releaseId = 'distro:disintegration';
    controller.syncPlayerTriggers();
    expect(labels.map((label) => label.textContent)).toEqual(['Listen', 'Listen', 'In player']);
    controller.stopPlayerSession();
    expect(labels.map((label) => label.textContent)).toEqual(['Listen', 'Listen', 'Listen']);
    expect(triggers.every((trigger) => trigger.dataset.musicListenSession === 'idle')).toBe(true);
    expect(triggers[2]?.toggleAttribute).toHaveBeenLastCalledWith('disabled', false);
  });

  it('opens a player modal with the preferred provider and cached iframe', () => {
    const { controller, iframeElement, options, provider } = createController();
    const triggerElement = createTriggerElement();

    controller.openPlayerModal(triggerElement, createPlayerElement());

    expect(options.activePlayerTriggerElementRef.current).toBe(triggerElement);
    expect(options.activePlayerSessionRef.current).toEqual({
      embedLayout: 'bandcamp-album',
      embedUrl: provider.embedUrl,
      hasEmbedInteraction: false,
      iframeElement,
      providerId: 'bandcamp',
      releaseId: 'disintegration',
      releaseTitle: 'Disintegration',
      status: 'modal-open',
    });
    expect(options.setPlayerProviders).toHaveBeenCalledWith([provider]);
    expect(options.setIsPlayerModalOpen).toHaveBeenCalledWith(true);
    expect(options.setIsPlayerLoading).toHaveBeenCalledWith(false);
  });

  it('creates the first player session after a lazy surface connects', () => {
    const iframeFrameHostRef = { current: null as HTMLElement | null };
    const closeButton = { focus: vi.fn() } as unknown as HTMLButtonElement;
    const { controller, options } = createController({
      getIsPlayerModalOpen: vi.fn(() => true),
      iframeFrameHostRef,
      modalCloseButtonRef: { current: closeButton },
    });

    controller.openPlayerModal(createTriggerElement(), createPlayerElement());
    expect(options.activePlayerSessionRef.current).toBeNull();
    expect(options.pendingPlayerProviderRef.current).not.toBeNull();

    iframeFrameHostRef.current = createFrameHost();
    controller.connectPlayerSurface();

    expect(options.activePlayerSessionRef.current?.releaseTitle).toBe('Disintegration');
    expect(options.pendingPlayerProviderRef.current).toBeNull();
    expect(closeButton.focus).toHaveBeenCalled();
  });

  it('marks active sessions as interacted only when the embed URL matches', () => {
    const activeSession = createActiveSession();
    const { controller, options } = createController({
      activePlayerSessionRef: { current: activeSession },
    });

    controller.markActivePlayerSessionAsInteracted('https://other.example/embed');
    expect(activeSession.hasEmbedInteraction).toBe(false);

    controller.markActivePlayerSessionAsInteracted(activeSession.embedUrl);

    expect(activeSession.hasEmbedInteraction).toBe(true);
    expect(options.setMiniPlayerStatusLabel).toHaveBeenCalled();
  });

  it('minimizes interacted player sessions on modal dismiss', () => {
    const activeSession = createActiveSession();
    activeSession.hasEmbedInteraction = true;
    const { controller, options } = createController({
      activePlayerSessionRef: { current: activeSession },
    });

    controller.closePlayerModal();

    expect(activeSession.status).toBe('minimized');
    expect(options.setIsPlayerModalOpen).toHaveBeenCalledWith(false);
    expect(options.activePlayerSessionRef.current).toBe(activeSession);
  });

  it('stops inactive player sessions on modal dismiss and restores trigger focus', () => {
    const iframeElement = createIframe();
    const activeSession = createActiveSession(iframeElement);
    const triggerElement = createTriggerElement();
    const { controller, options } = createController({
      activePlayerSessionRef: { current: activeSession },
      activePlayerTriggerElementRef: { current: triggerElement },
      iframeCacheByEmbedUrlRef: { current: new Map([[activeSession.embedUrl, iframeElement]]) },
    });

    controller.closePlayerModal();

    expect(iframeElement.remove).toHaveBeenCalledTimes(1);
    expect(options.activePlayerSessionRef.current).toBeNull();
    expect(options.setIsPlayerModalOpen).toHaveBeenCalledWith(false);
    expect(triggerElement.focus).toHaveBeenCalledTimes(1);
  });

  it('reopens minimized sessions into the frame host and focuses the close button', () => {
    const iframeElement = createIframe();
    const activeSession = createActiveSession(iframeElement);
    activeSession.status = 'minimized';
    const closeButton = { focus: vi.fn() } as unknown as HTMLButtonElement;
    const { controller, options } = createController({
      activePlayerSessionRef: { current: activeSession },
      iframeFrameHostRef: { current: createFrameHost(iframeElement) },
      modalCloseButtonRef: { current: closeButton },
    });

    controller.reopenPlayerModal();

    expect(activeSession.status).toBe('modal-open');
    expect(options.setIsPlayerModalOpen).toHaveBeenCalledWith(true);
    expect(closeButton.focus).toHaveBeenCalledTimes(1);
  });

  it('opens the player on its own history entry at the current URL', () => {
    const { controller, history, options } = createController();

    controller.openPlayerModal(createTriggerElement(), createPlayerElement());

    expect(history.pushState).toHaveBeenCalledTimes(1);
    expect(history.pushState).toHaveBeenCalledWith({ __appShellPlayerModal: true }, '', releasesHref);
    expect(options.playerModalHistoryHrefRef.current).toBe(releasesHref);
  });

  it('adds no history entry when the release has no player provider', () => {
    const { controller, history, options } = createController();
    const playerElement = {
      dataset: {
        musicStreamingServiceEmbeddedPlayerReleaseId: 'disintegration',
        musicStreamingServiceEmbeddedPlayerTitle: 'Disintegration',
      },
    } as unknown as HTMLElement;

    controller.openPlayerModal(createTriggerElement(), playerElement);

    expect(options.setIsPlayerModalOpen).not.toHaveBeenCalled();
    expect(history.pushState).not.toHaveBeenCalled();
    expect(options.playerModalHistoryHrefRef.current).toBeNull();
  });

  it('reopens from the mini player with one history entry and adds none when already on it', () => {
    const activeSession = createActiveSession();
    activeSession.status = 'minimized';
    const { controller, history, options } = createController({
      activePlayerSessionRef: { current: activeSession },
    });

    controller.reopenPlayerModal();
    controller.reopenPlayerModal();

    expect(history.pushState).toHaveBeenCalledTimes(1);
    expect(options.playerModalHistoryHrefRef.current).toBe(releasesHref);
  });

  it('closes through Back on the player entry and directly elsewhere', () => {
    const activeSession = createActiveSession();
    activeSession.hasEmbedInteraction = true;
    const { controller, history, options } = createController({
      activePlayerSessionRef: { current: activeSession },
    });

    history.state = { __appShellPlayerModal: true };
    controller.closePlayerModalWithHistoryBack();
    expect(history.back).toHaveBeenCalledTimes(1);
    expect(options.setIsPlayerModalOpen).not.toHaveBeenCalled();

    history.state = { __appShellSection: true };
    controller.closePlayerModalWithHistoryBack();
    expect(history.back).toHaveBeenCalledTimes(1);
    expect(activeSession.status).toBe('minimized');
    expect(options.setIsPlayerModalOpen).toHaveBeenCalledWith(false);
  });
});
