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
  if (event.type === 'stop-requested') return IDLE_PLAYER_SESSION_MACHINE_STATE;
  if (event.type === 'session-opened') {
    return { hasEmbedInteraction: false, hasSession: true, isLoaded: false, status: 'modal-open' };
  }
  if (!state.hasSession) return state;
  switch (event.type) {
    case 'iframe-loaded':
      return { ...state, isLoaded: true };
    case 'player-surface-interacted':
      return { ...state, hasEmbedInteraction: true };
    case 'reopen-requested':
      return { ...state, status: 'modal-open' };
    case 'dismiss-requested':
      return state.status !== 'minimized' && state.isLoaded && state.hasEmbedInteraction
        ? { ...state, status: 'minimized' }
        : IDLE_PLAYER_SESSION_MACHINE_STATE;
    default:
      return state;
  }
}
