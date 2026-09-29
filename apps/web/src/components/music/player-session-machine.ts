import { createMachine, guard, interpret, reduce as robotReduce, state as robotState, transition } from 'robot3';
import type { Action, Guard, Reducer, Transition } from 'robot3';

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

type PlayerSessionRobotState = 'idle' | 'modalOpen' | 'minimized';

type PlayerSessionRobotContext = {
  hasEmbedInteraction: boolean;
  isLoaded: boolean;
};

type PlayerSessionRobotTransitionStep =
  | Action<PlayerSessionRobotContext, PlayerSessionMachineEvent>
  | Guard<PlayerSessionRobotContext, PlayerSessionMachineEvent>
  | Reducer<PlayerSessionRobotContext, PlayerSessionMachineEvent>;

const PLAYER_SESSION_MACHINE_EVENT_TYPES = new Set<PlayerSessionMachineEvent['type']>([
  'session-opened',
  'iframe-loaded',
  'player-surface-interacted',
  'dismiss-requested',
  'reopen-requested',
  'stop-requested',
]);

const resetPlayerSessionContext = robotReduce<PlayerSessionRobotContext, PlayerSessionMachineEvent>(() => ({
  hasEmbedInteraction: false,
  isLoaded: false,
}));

const markPlayerSessionAsLoaded = robotReduce<PlayerSessionRobotContext, PlayerSessionMachineEvent>((context) => ({
  ...context,
  isLoaded: true,
}));

const markPlayerSessionAsInteracted = robotReduce<PlayerSessionRobotContext, PlayerSessionMachineEvent>((context) => ({
  ...context,
  hasEmbedInteraction: true,
}));

const canMinimizePlayerSession = guard<PlayerSessionRobotContext, PlayerSessionMachineEvent>(
  (context) => context.isLoaded && context.hasEmbedInteraction,
);

function playerSessionTransition(
  eventType: PlayerSessionMachineEvent['type'],
  nextState: PlayerSessionRobotState,
  ...steps: PlayerSessionRobotTransitionStep[]
): Transition<PlayerSessionMachineEvent['type']> {
  return transition<PlayerSessionMachineEvent['type'], PlayerSessionRobotContext, PlayerSessionMachineEvent>(
    eventType,
    nextState,
    ...steps,
  );
}

const playerSessionRobotStates = {
  idle: robotState(playerSessionTransition('session-opened', 'modalOpen', resetPlayerSessionContext)),
  modalOpen: robotState(
    playerSessionTransition('session-opened', 'modalOpen', resetPlayerSessionContext),
    playerSessionTransition('iframe-loaded', 'modalOpen', markPlayerSessionAsLoaded),
    playerSessionTransition('player-surface-interacted', 'modalOpen', markPlayerSessionAsInteracted),
    playerSessionTransition('dismiss-requested', 'minimized', canMinimizePlayerSession),
    playerSessionTransition('dismiss-requested', 'idle', resetPlayerSessionContext),
    playerSessionTransition('reopen-requested', 'modalOpen'),
    playerSessionTransition('stop-requested', 'idle', resetPlayerSessionContext),
  ),
  minimized: robotState(
    playerSessionTransition('session-opened', 'modalOpen', resetPlayerSessionContext),
    playerSessionTransition('iframe-loaded', 'minimized', markPlayerSessionAsLoaded),
    playerSessionTransition('player-surface-interacted', 'minimized', markPlayerSessionAsInteracted),
    playerSessionTransition('dismiss-requested', 'idle', resetPlayerSessionContext),
    playerSessionTransition('reopen-requested', 'modalOpen'),
    playerSessionTransition('stop-requested', 'idle', resetPlayerSessionContext),
  ),
};

function resolveRobotState(state: PlayerSessionMachineState): PlayerSessionRobotState {
  if (!state.hasSession) return 'idle';
  if (state.status === 'minimized') return 'minimized';
  return 'modalOpen';
}

function mapRobotStateToPlayerSessionState(
  robotStateName: PlayerSessionRobotState,
  context: PlayerSessionRobotContext,
): PlayerSessionMachineState {
  if (robotStateName === 'idle') return IDLE_PLAYER_SESSION_MACHINE_STATE;

  return {
    hasEmbedInteraction: context.hasEmbedInteraction,
    hasSession: true,
    isLoaded: context.isLoaded,
    status: robotStateName === 'minimized' ? 'minimized' : 'modal-open',
  };
}

export function reducePlayerSessionMachine(
  state: PlayerSessionMachineState,
  event: PlayerSessionMachineEvent,
): PlayerSessionMachineState {
  if (!PLAYER_SESSION_MACHINE_EVENT_TYPES.has(event.type)) return state;
  if (event.type === 'stop-requested') return IDLE_PLAYER_SESSION_MACHINE_STATE;
  if (!state.hasSession && event.type !== 'session-opened') return state;

  const machine = createMachine(resolveRobotState(state), playerSessionRobotStates, () => ({
    hasEmbedInteraction: state.hasEmbedInteraction,
    isLoaded: state.isLoaded,
  }));
  const service = interpret(machine, () => undefined);
  service.send(event);

  return mapRobotStateToPlayerSessionState(service.machine.current as PlayerSessionRobotState, service.context);
}
