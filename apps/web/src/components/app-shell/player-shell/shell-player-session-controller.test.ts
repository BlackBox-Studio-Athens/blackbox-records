import { describe, expect, it, vi } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import type { PlayerProvider } from '../player-provider-data';
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

function createController(overrides: Partial<Parameters<typeof createShellPlayerSessionController>[0]> = {}) {
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
});
