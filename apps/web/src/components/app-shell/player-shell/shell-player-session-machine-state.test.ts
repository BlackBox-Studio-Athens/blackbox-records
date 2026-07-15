import { describe, expect, it } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import { IDLE_PLAYER_SESSION_MACHINE_STATE } from '../player-session-machine';
import { derivePlayerSessionMachineState } from './shell-player-session-machine-state';

function createActiveSession({
  hasEmbedInteraction = false,
  isLoaded = false,
  status = 'modal-open',
}: {
  hasEmbedInteraction?: boolean;
  isLoaded?: boolean;
  status?: ActivePlayerSession['status'];
} = {}): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://example.com/embed',
    hasEmbedInteraction,
    iframeElement: {
      dataset: {
        musicStreamingServiceEmbeddedPlayerLoadState: isLoaded ? 'loaded' : 'idle',
      },
    } as unknown as HTMLIFrameElement,
    providerId: 'bandcamp',
    releaseId: 'test-release',
    releaseTitle: 'Test Release',
    status,
  };
}

describe('derivePlayerSessionMachineState', () => {
  it('returns the idle machine state when there is no active player session', () => {
    expect(derivePlayerSessionMachineState(null)).toEqual(IDLE_PLAYER_SESSION_MACHINE_STATE);
  });

  it('derives an unloaded modal-open state from an active player session', () => {
    expect(derivePlayerSessionMachineState(createActiveSession())).toEqual({
      hasEmbedInteraction: false,
      hasSession: true,
      isLoaded: false,
      status: 'modal-open',
    });
  });

  it('derives loaded, interacted, minimized state from an active player session', () => {
    expect(
      derivePlayerSessionMachineState(
        createActiveSession({
          hasEmbedInteraction: true,
          isLoaded: true,
          status: 'minimized',
        }),
      ),
    ).toEqual({
      hasEmbedInteraction: true,
      hasSession: true,
      isLoaded: true,
      status: 'minimized',
    });
  });
});
