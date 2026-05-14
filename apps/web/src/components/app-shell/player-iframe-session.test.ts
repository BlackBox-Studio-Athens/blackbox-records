import { describe, expect, it, vi } from 'vitest';

import {
  markPlayerIframeAsActive,
  prunePlayerIframeCache,
  resolvePlayerIframe,
  retirePlayerSession,
  type ActivePlayerSession,
} from './player-iframe-session';
import type { PlayerProvider } from './player-provider-data';

type FakeIframe = HTMLIFrameElement & {
  listeners: Record<string, Array<() => void>>;
  parent: FakeFrameHost | null;
  removed: boolean;
};

type FakeFrameHost = {
  appendChild: ReturnType<typeof vi.fn<(iframe: FakeIframe) => FakeIframe>>;
  childIframes: FakeIframe[];
  contains: ReturnType<typeof vi.fn<(iframe: FakeIframe) => boolean>>;
  querySelectorAll: ReturnType<typeof vi.fn<() => FakeIframe[]>>;
};

function createFakeIframe(): FakeIframe {
  const listeners: FakeIframe['listeners'] = {};
  return {
    addEventListener: vi.fn((eventName: string, listener: () => void) => {
      listeners[eventName] = [...(listeners[eventName] || []), listener];
    }),
    allow: '',
    className: '',
    dataset: {},
    listeners,
    loading: 'lazy',
    parent: null,
    referrerPolicy: '',
    remove: vi.fn(function (this: FakeIframe) {
      this.removed = true;
      if (this.parent) {
        this.parent.childIframes = this.parent.childIframes.filter((child) => child !== this);
      }
      this.parent = null;
    }),
    removed: false,
    src: '',
    title: '',
  } as unknown as FakeIframe;
}

function createFakeFrameHost(): FakeFrameHost {
  const host = {
    appendChild: vi.fn((iframe: FakeIframe) => {
      if (!host.childIframes.includes(iframe)) {
        host.childIframes.push(iframe);
      }
      iframe.parent = host;
      return iframe;
    }),
    childIframes: [] as FakeIframe[],
    contains: vi.fn((iframe: FakeIframe) => host.childIframes.includes(iframe)),
    querySelectorAll: vi.fn(() => host.childIframes),
  };

  return host;
}

const bandcampProvider: PlayerProvider = {
  embedLayout: 'bandcamp-album',
  embedUrl: 'https://bandcamp.test/album',
  id: 'bandcamp',
};

const tidalProvider: PlayerProvider = {
  embedLayout: 'tidal',
  embedUrl: 'https://tidal.test/embed',
  id: 'tidal',
};

describe('player iframe session helpers', () => {
  it('creates player iframes with the existing embed attributes and callbacks', () => {
    const iframe = createFakeIframe();
    const onInteraction = vi.fn();
    const onLoadStateChange = vi.fn();
    const host = createFakeFrameHost();
    const iframeCache = new Map<string, HTMLIFrameElement>();

    resolvePlayerIframe({
      callbacks: {
        createIframeElement: () => iframe,
        onInteraction,
        onLoadStateChange,
      },
      frameHostElement: host as unknown as HTMLElement,
      iframeCache,
      provider: bandcampProvider,
      releaseTitle: 'Disintegration',
    });

    expect(iframe.allow).toBe('autoplay; encrypted-media; fullscreen; web-share');
    expect(iframe.className).toBe('music-streaming-service-embedded-player-iframe border-0');
    expect(iframe.dataset.musicStreamingServiceEmbeddedPlayerEmbedUrl).toBe(bandcampProvider.embedUrl);
    expect(iframe.dataset.musicStreamingServiceEmbeddedPlayerLoadState).toBe('loading');
    expect(iframe.dataset.musicStreamingServiceEmbeddedPlayerProvider).toBe('bandcamp');
    expect(iframe.dataset.state).toBe('active');
    expect(iframe.loading).toBe('eager');
    expect(iframe.referrerPolicy).toBe('strict-origin-when-cross-origin');
    expect(iframe.title).toBe('Disintegration player');
    expect(iframe.src).toBe(bandcampProvider.embedUrl);

    expect(iframe.listeners.load).toHaveLength(1);
    expect(iframe.listeners.focus).toHaveLength(1);
    iframe.listeners.load?.[0]?.();
    iframe.listeners.focus?.[0]?.();

    expect(iframe.dataset.musicStreamingServiceEmbeddedPlayerLoadState).toBe('loaded');
    expect(onLoadStateChange).toHaveBeenCalledWith(bandcampProvider.embedUrl, 'loaded');
    expect(onInteraction).toHaveBeenCalledWith(bandcampProvider.embedUrl);
  });

  it('uses the Tidal iframe allow policy', () => {
    const iframe = createFakeIframe();
    resolvePlayerIframe({
      callbacks: {
        createIframeElement: () => iframe,
        onInteraction: vi.fn(),
        onLoadStateChange: vi.fn(),
      },
      frameHostElement: createFakeFrameHost() as unknown as HTMLElement,
      iframeCache: new Map(),
      provider: tidalProvider,
      releaseTitle: '',
    });

    expect(iframe.allow).toBe(
      'autoplay; encrypted-media; fullscreen; clipboard-write https://embed.tidal.com https://tidal.com; web-share',
    );
    expect(iframe.title).toBe('Music player');
  });

  it('reuses cached iframes, appends detached cached iframes, and marks only the active iframe active', () => {
    const host = createFakeFrameHost();
    const cachedIframe = createFakeIframe();
    const inactiveIframe = createFakeIframe();
    host.appendChild(inactiveIframe);
    const iframeCache = new Map<string, HTMLIFrameElement>([
      [tidalProvider.embedUrl, inactiveIframe as unknown as HTMLIFrameElement],
      [bandcampProvider.embedUrl, cachedIframe as unknown as HTMLIFrameElement],
    ]);

    const resolvedIframe = resolvePlayerIframe({
      callbacks: {
        createIframeElement: createFakeIframe,
        onInteraction: vi.fn(),
        onLoadStateChange: vi.fn(),
      },
      frameHostElement: host as unknown as HTMLElement,
      iframeCache,
      provider: bandcampProvider,
      releaseTitle: 'Disintegration',
    });

    expect(resolvedIframe).toBe(cachedIframe);
    expect(host.childIframes).toContain(cachedIframe);
    expect(cachedIframe.dataset.state).toBe('active');
    expect(inactiveIframe.dataset.state).toBe('inactive');
    expect([...iframeCache.keys()]).toEqual([tidalProvider.embedUrl, bandcampProvider.embedUrl]);
  });

  it('prunes the oldest inactive iframes without removing the active embed', () => {
    const activeIframe = createFakeIframe();
    const firstInactiveIframe = createFakeIframe();
    const secondInactiveIframe = createFakeIframe();
    const iframeCache = new Map<string, HTMLIFrameElement>([
      ['active', activeIframe as unknown as HTMLIFrameElement],
      ['first-inactive', firstInactiveIframe as unknown as HTMLIFrameElement],
      ['second-inactive', secondInactiveIframe as unknown as HTMLIFrameElement],
    ]);

    prunePlayerIframeCache(iframeCache, { activeEmbedUrl: 'active', maxCachedIframes: 1 });

    expect(activeIframe.remove).not.toHaveBeenCalled();
    expect(firstInactiveIframe.remove).toHaveBeenCalledTimes(1);
    expect(secondInactiveIframe.remove).toHaveBeenCalledTimes(1);
    expect([...iframeCache.keys()]).toEqual(['active']);
  });

  it('retires an active session by removing its iframe and cache entry', () => {
    const iframe = createFakeIframe();
    const iframeCache = new Map<string, HTMLIFrameElement>([
      [bandcampProvider.embedUrl, iframe as unknown as HTMLIFrameElement],
    ]);
    const activeSession = {
      embedLayout: bandcampProvider.embedLayout,
      embedUrl: bandcampProvider.embedUrl,
      hasEmbedInteraction: false,
      iframeElement: iframe,
      providerId: bandcampProvider.id,
      releaseTitle: 'Disintegration',
      status: 'modal-open',
    } satisfies ActivePlayerSession;

    retirePlayerSession(iframeCache, activeSession);

    expect(iframeCache.has(bandcampProvider.embedUrl)).toBe(false);
    expect(iframe.remove).toHaveBeenCalledTimes(1);
  });

  it('marks one iframe active and the rest inactive', () => {
    const host = createFakeFrameHost();
    const activeIframe = createFakeIframe();
    const inactiveIframe = createFakeIframe();
    host.appendChild(activeIframe);
    host.appendChild(inactiveIframe);

    markPlayerIframeAsActive(host as unknown as HTMLElement, activeIframe);

    expect(activeIframe.dataset.state).toBe('active');
    expect(inactiveIframe.dataset.state).toBe('inactive');
  });
});
