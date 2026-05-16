import { describe, expect, it } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import { derivePlayerShellViewState } from './shell-player-view-state';

function createActiveSession({
  hasEmbedInteraction = false,
  loadState = 'loading',
  providerId = 'bandcamp',
  status = 'modal-open',
}: {
  hasEmbedInteraction?: boolean;
  loadState?: 'loaded' | 'loading';
  providerId?: ActivePlayerSession['providerId'];
  status?: ActivePlayerSession['status'];
} = {}): ActivePlayerSession {
  return {
    embedLayout: providerId === 'bandcamp' ? 'bandcamp-album' : 'tidal',
    embedUrl: `https://${providerId}.test/embed`,
    hasEmbedInteraction,
    iframeElement: {
      dataset: {
        musicStreamingServiceEmbeddedPlayerLoadState: loadState,
      },
    } as unknown as HTMLIFrameElement,
    providerId,
    releaseTitle: 'Disintegration',
    status,
  };
}

describe('derivePlayerShellViewState', () => {
  it('returns the idle shell view state when there is no active session', () => {
    expect(derivePlayerShellViewState(null)).toEqual({
      activePlayerEmbedLayout: '',
      activePlayerProviderId: '',
      activePlayerTitle: '',
      isMiniPlayerVisible: false,
      isPlayerLoading: false,
      miniPlayerStatusLabel: 'Player Ready',
      playerModalDismissActionLabel: 'Close',
      playerModalDismissAriaLabel: 'Close player',
    });
  });

  it('keeps an active loading session out of the mini player state', () => {
    expect(derivePlayerShellViewState(createActiveSession())).toEqual({
      activePlayerEmbedLayout: 'bandcamp-album',
      activePlayerProviderId: 'bandcamp',
      activePlayerTitle: 'Disintegration',
      isMiniPlayerVisible: false,
      isPlayerLoading: true,
      miniPlayerStatusLabel: 'Player Ready · Bandcamp',
      playerModalDismissActionLabel: 'Close',
      playerModalDismissAriaLabel: 'Close player',
    });
  });

  it('shows the mini player for a loaded, interacted, minimized session', () => {
    expect(
      derivePlayerShellViewState(
        createActiveSession({
          hasEmbedInteraction: true,
          loadState: 'loaded',
          providerId: 'tidal',
          status: 'minimized',
        }),
      ),
    ).toEqual({
      activePlayerEmbedLayout: 'tidal',
      activePlayerProviderId: 'tidal',
      activePlayerTitle: 'Disintegration',
      isMiniPlayerVisible: true,
      isPlayerLoading: false,
      miniPlayerStatusLabel: 'Player Ready · Tidal',
      playerModalDismissActionLabel: 'Minimize',
      playerModalDismissAriaLabel: 'Minimize player',
    });
  });
});
