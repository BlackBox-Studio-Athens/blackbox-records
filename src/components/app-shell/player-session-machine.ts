import type { PlayerSessionStatus } from './player-session-ui';

export type PlayerSessionMachineState = {
  hasEmbedInteraction: boolean;
  hasSession: boolean;
  isLoaded: boolean;
  status: PlayerSessionStatus | 'idle';
};

export type PlayerSessionMachineEvent =
  | { type: 'session-opened' }
  | { type: 'iframe-loaded' }
  | { type: 'player-surface-interacted' }
  | { type: 'dismiss-requested' }
  | { type: 'reopen-requested' }
  | { type: 'stop-requested' };

export const IDLE_PLAYER_SESSION_MACHINE_STATE: PlayerSessionMachineState = {
  hasEmbedInteraction: false,
  hasSession: false,
  isLoaded: false,
  status: 'idle',
};

export function reducePlayerSessionMachine(
  state: PlayerSessionMachineState,
  event: PlayerSessionMachineEvent,
): PlayerSessionMachineState {
  switch (event.type) {
    case 'session-opened':
      return {
        hasEmbedInteraction: false,
        hasSession: true,
        isLoaded: false,
        status: 'modal-open',
      };

    case 'iframe-loaded':
      if (!state.hasSession) return state;

      return {
        ...state,
        isLoaded: true,
      };

    case 'player-surface-interacted':
      if (!state.hasSession) return state;

      return {
        ...state,
        hasEmbedInteraction: true,
      };

    case 'dismiss-requested':
      if (!state.hasSession) return state;

      if (state.status === 'modal-open' && state.isLoaded && state.hasEmbedInteraction) {
        return {
          ...state,
          status: 'minimized',
        };
      }

      return IDLE_PLAYER_SESSION_MACHINE_STATE;

    case 'reopen-requested':
      if (!state.hasSession) return state;

      return {
        ...state,
        status: 'modal-open',
      };

    case 'stop-requested':
      return IDLE_PLAYER_SESSION_MACHINE_STATE;

    default:
      return state;
  }
}
