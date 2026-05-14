import type { PlayerEmbedLayout, PlayerProvider, PlayerProviderId } from './player-provider-data';

export const DEFAULT_MAX_CACHED_PLAYER_IFRAMES = 6;

export type ActivePlayerSession = {
  embedUrl: string;
  embedLayout: PlayerEmbedLayout;
  hasEmbedInteraction: boolean;
  iframeElement: HTMLIFrameElement;
  providerId: PlayerProviderId;
  releaseTitle: string;
  status: 'minimized' | 'modal-open';
};

type PlayerIframeCallbacks = {
  createIframeElement?: () => HTMLIFrameElement;
  onInteraction: (embedUrl: string) => void;
  onLoadStateChange: (embedUrl: string, state: 'error' | 'loaded') => void;
};

export function markPlayerIframeAsActive(frameHostElement: HTMLElement, activeIframeElement: HTMLIFrameElement) {
  Array.from(
    frameHostElement.querySelectorAll<HTMLIFrameElement>('[data-music-streaming-service-embedded-player-iframe]'),
  ).forEach((iframeElement) => {
    iframeElement.dataset.state = iframeElement === activeIframeElement ? 'active' : 'inactive';
  });
}

export function prunePlayerIframeCache(
  iframeCache: Map<string, HTMLIFrameElement>,
  { activeEmbedUrl = '', maxCachedIframes = DEFAULT_MAX_CACHED_PLAYER_IFRAMES } = {},
) {
  if (iframeCache.size <= maxCachedIframes) return;

  for (const [embedUrl, iframeElement] of iframeCache) {
    if (embedUrl === activeEmbedUrl) continue;
    iframeElement.remove();
    iframeCache.delete(embedUrl);

    if (iframeCache.size <= maxCachedIframes) {
      return;
    }
  }
}

export function retirePlayerSession(
  iframeCache: Map<string, HTMLIFrameElement>,
  activeSession: ActivePlayerSession | null,
) {
  if (!activeSession) return;
  iframeCache.delete(activeSession.embedUrl);
  activeSession.iframeElement.remove();
}

export function resolvePlayerIframe({
  callbacks,
  frameHostElement,
  iframeCache,
  maxCachedIframes = DEFAULT_MAX_CACHED_PLAYER_IFRAMES,
  provider,
  releaseTitle,
}: {
  callbacks: PlayerIframeCallbacks;
  frameHostElement: HTMLElement;
  iframeCache: Map<string, HTMLIFrameElement>;
  maxCachedIframes?: number;
  provider: PlayerProvider;
  releaseTitle: string;
}) {
  const cachedIframeElement = iframeCache.get(provider.embedUrl) || null;
  if (cachedIframeElement) {
    if (!frameHostElement.contains(cachedIframeElement)) {
      frameHostElement.appendChild(cachedIframeElement);
    }
    markPlayerIframeAsActive(frameHostElement, cachedIframeElement);
    iframeCache.delete(provider.embedUrl);
    iframeCache.set(provider.embedUrl, cachedIframeElement);
    return cachedIframeElement;
  }

  const iframeElement = createPlayerIframe(provider, releaseTitle, callbacks);
  frameHostElement.appendChild(iframeElement);
  markPlayerIframeAsActive(frameHostElement, iframeElement);
  iframeCache.set(provider.embedUrl, iframeElement);
  prunePlayerIframeCache(iframeCache, { activeEmbedUrl: provider.embedUrl, maxCachedIframes });
  return iframeElement;
}

function createPlayerIframe(provider: PlayerProvider, releaseTitle: string, callbacks: PlayerIframeCallbacks) {
  const iframeElement = callbacks.createIframeElement?.() ?? document.createElement('iframe');
  iframeElement.allow =
    provider.id === 'bandcamp'
      ? 'autoplay; encrypted-media; fullscreen; web-share'
      : 'autoplay; encrypted-media; fullscreen; clipboard-write https://embed.tidal.com https://tidal.com; web-share';
  iframeElement.className = 'music-streaming-service-embedded-player-iframe border-0';
  iframeElement.dataset.musicStreamingServiceEmbeddedPlayerIframe = '';
  iframeElement.dataset.musicStreamingServiceEmbeddedPlayerEmbedUrl = provider.embedUrl;
  iframeElement.dataset.musicStreamingServiceEmbeddedPlayerProvider = provider.id;
  iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'loading';
  iframeElement.dataset.state = 'inactive';
  iframeElement.loading = 'eager';
  iframeElement.referrerPolicy = 'strict-origin-when-cross-origin';
  iframeElement.title = releaseTitle ? `${releaseTitle} player` : 'Music player';
  iframeElement.src = provider.embedUrl;

  iframeElement.addEventListener('load', () => {
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'loaded';
    callbacks.onLoadStateChange(provider.embedUrl, 'loaded');
  });

  iframeElement.addEventListener('error', () => {
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'error';
    callbacks.onLoadStateChange(provider.embedUrl, 'error');
  });

  iframeElement.addEventListener('focus', () => {
    callbacks.onInteraction(provider.embedUrl);
  });

  return iframeElement;
}
