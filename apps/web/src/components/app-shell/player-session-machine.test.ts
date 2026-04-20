import { describe, expect, it } from 'vitest';

import { derivePlayerPresentationState } from './player-session-ui';
import {
  IDLE_PLAYER_SESSION_MACHINE_STATE,
  reducePlayerSessionMachine,
  type PlayerSessionMachineState,
} from './player-session-machine';

function deriveUi(state: PlayerSessionMachineState) {
  const input = {
    hasEmbedInteraction: state.hasEmbedInteraction,
    hasSession: state.hasSession,
    isLoaded: state.isLoaded,
    providerLabel: 'Bandcamp',
    ...(state.status === 'idle' ? {} : { status: state.status }),
  };

  return derivePlayerPresentationState(input);
}

describe('player session machine', () => {
  it('destroys the session when the modal is closed before interaction', () => {
    const openState = reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' });
    const loadedState = reducePlayerSessionMachine(openState, { type: 'iframe-loaded' });
    const dismissedState = reducePlayerSessionMachine(loadedState, { type: 'dismiss-requested' });

    expect(dismissedState).toEqual(IDLE_PLAYER_SESSION_MACHINE_STATE);
    expect(deriveUi(dismissedState).isMiniPlayerVisible).toBe(false);
  });

  it('minimizes the session after player-surface interaction', () => {
    const openState = reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' });
    const loadedState = reducePlayerSessionMachine(openState, { type: 'iframe-loaded' });
    const interactedState = reducePlayerSessionMachine(loadedState, { type: 'player-surface-interacted' });
    const minimizedState = reducePlayerSessionMachine(interactedState, { type: 'dismiss-requested' });

    expect(minimizedState).toMatchObject({
      hasEmbedInteraction: true,
      hasSession: true,
      isLoaded: true,
      status: 'minimized',
    });
    expect(deriveUi(minimizedState).isMiniPlayerVisible).toBe(true);
  });

  it('keeps the dismiss label aligned with the session flow', () => {
    const openState = reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' });
    const loadedState = reducePlayerSessionMachine(openState, { type: 'iframe-loaded' });
    const interactedState = reducePlayerSessionMachine(loadedState, { type: 'player-surface-interacted' });

    expect(deriveUi(loadedState).closeActionLabel).toBe('Close');
    expect(deriveUi(interactedState).closeActionLabel).toBe('Minimize');
  });

  it('reopens a minimized session without losing the interaction state', () => {
    const minimizedState = reducePlayerSessionMachine(
      reducePlayerSessionMachine(
        reducePlayerSessionMachine(
          reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' }),
          { type: 'iframe-loaded' },
        ),
        { type: 'player-surface-interacted' },
      ),
      { type: 'dismiss-requested' },
    );
    const reopenedState = reducePlayerSessionMachine(minimizedState, { type: 'reopen-requested' });

    expect(reopenedState).toMatchObject({
      hasEmbedInteraction: true,
      hasSession: true,
      isLoaded: true,
      status: 'modal-open',
    });
    expect(deriveUi(reopenedState).isMiniPlayerVisible).toBe(false);
  });

  it('clears the session completely when stopped', () => {
    const minimizedState = reducePlayerSessionMachine(
      reducePlayerSessionMachine(
        reducePlayerSessionMachine(
          reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' }),
          { type: 'iframe-loaded' },
        ),
        { type: 'player-surface-interacted' },
      ),
      { type: 'dismiss-requested' },
    );
    const stoppedState = reducePlayerSessionMachine(minimizedState, { type: 'stop-requested' });

    expect(stoppedState).toEqual(IDLE_PLAYER_SESSION_MACHINE_STATE);
    expect(deriveUi(stoppedState).miniPlayerStatusLabel).toBe('Player Ready');
  });
});
