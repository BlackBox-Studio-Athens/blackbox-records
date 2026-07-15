import { describe, expect, it } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import type { PlayerProvider } from '../player-provider-data';
import { resolvePlayerModalOpenRequest } from './shell-player-modal-open-request';

function createProvider(id: PlayerProvider['id'], embedUrl = `https://${id}.test/embed`): PlayerProvider {
  if (id === 'tidal') return { embedLayout: 'tidal', embedUrl, id };

  return {
    embedLayout: 'bandcamp-album',
    embedUrl,
    id,
  };
}

function createActiveSession(releaseId: string, releaseTitle = 'Shared title'): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://bandcamp.test/embed',
    hasEmbedInteraction: true,
    iframeElement: {} as HTMLIFrameElement,
    providerId: 'bandcamp',
    releaseId,
    releaseTitle,
    status: 'minimized',
  };
}

describe('player modal open request', () => {
  it('ignores modal open requests without providers', () => {
    expect(
      resolvePlayerModalOpenRequest({
        activeSession: null,
        providers: [],
        releaseId: 'disintegration',
      }),
    ).toEqual({ kind: 'without-provider' });
  });

  it('reuses the active session when opening the same release', () => {
    const activeSession = createActiveSession('disintegration');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession,
        providers: [createProvider('bandcamp')],
        releaseId: 'disintegration',
      }),
    ).toEqual({ activeSession, kind: 'reuse-active-session' });
  });

  it('stops the active session before opening a different Release with the same display title', () => {
    const nextProvider = createProvider('bandcamp', 'https://bandcamp.test/next');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession: createActiveSession('caregivers'),
        providers: [nextProvider],
        releaseId: 'disintegration',
      }),
    ).toEqual({
      kind: 'new-provider',
      nextProvider,
      shouldStopActiveSession: true,
    });
  });

  it('prefers a cached provider selection for the release', () => {
    const bandcampProvider = createProvider('bandcamp');
    const tidalProvider = createProvider('tidal');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession: null,
        cachedProviderId: 'tidal',
        providers: [bandcampProvider, tidalProvider],
        releaseId: 'disintegration',
      }),
    ).toEqual({
      kind: 'new-provider',
      nextProvider: tidalProvider,
      shouldStopActiveSession: false,
    });
  });

  it('falls back to the default provider when the cached provider is unavailable', () => {
    const bandcampProvider = createProvider('bandcamp');
    const tidalProvider = createProvider('tidal');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession: null,
        cachedProviderId: 'tidal',
        providers: [bandcampProvider],
        releaseId: 'disintegration',
      }),
    ).toEqual({
      kind: 'new-provider',
      nextProvider: bandcampProvider,
      shouldStopActiveSession: false,
    });

    expect(
      resolvePlayerModalOpenRequest({
        activeSession: null,
        providers: [tidalProvider],
        releaseId: 'disintegration',
      }),
    ).toEqual({
      kind: 'new-provider',
      nextProvider: tidalProvider,
      shouldStopActiveSession: false,
    });
  });
});
