import { describe, expect, it } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import type { PlayerProvider } from '../player-provider-data';
import { resolvePlayerModalOpenRequest } from './shell-player-modal-open-request';

function createProvider(id: PlayerProvider['id'], embedUrl = `https://${id}.test/embed`): PlayerProvider {
  return {
    embedLayout: id === 'tidal' ? 'tidal' : 'bandcamp-album',
    embedUrl,
    id,
  };
}

function createActiveSession(releaseTitle: string): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://bandcamp.test/embed',
    hasEmbedInteraction: true,
    iframeElement: {} as HTMLIFrameElement,
    providerId: 'bandcamp',
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
        releaseTitle: 'Disintegration',
      }),
    ).toEqual({ kind: 'without-provider' });
  });

  it('reuses the active session when opening the same release', () => {
    const activeSession = createActiveSession('Disintegration');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession,
        providers: [createProvider('bandcamp')],
        releaseTitle: 'Disintegration',
      }),
    ).toEqual({ activeSession, kind: 'reuse-active-session' });
  });

  it('stops the active session before opening a different release', () => {
    const nextProvider = createProvider('bandcamp', 'https://bandcamp.test/next');

    expect(
      resolvePlayerModalOpenRequest({
        activeSession: createActiveSession('Caregivers'),
        providers: [nextProvider],
        releaseTitle: 'Disintegration',
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
        releaseTitle: 'Disintegration',
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
        releaseTitle: 'Disintegration',
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
        releaseTitle: 'Disintegration',
      }),
    ).toEqual({
      kind: 'new-provider',
      nextProvider: tidalProvider,
      shouldStopActiveSession: false,
    });
  });
});
