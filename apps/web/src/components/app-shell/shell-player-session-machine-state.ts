import type { ActivePlayerSession } from './player-iframe-session';
import { IDLE_PLAYER_SESSION_MACHINE_STATE, type PlayerSessionMachineState } from './player-session-machine';

export function derivePlayerSessionMachineState(activeSession: ActivePlayerSession | null): PlayerSessionMachineState {
  if (!activeSession) return IDLE_PLAYER_SESSION_MACHINE_STATE;

  return {
    hasEmbedInteraction: activeSession.hasEmbedInteraction,
    hasSession: true,
    isLoaded: activeSession.iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState === 'loaded',
    status: activeSession.status,
  };
}
