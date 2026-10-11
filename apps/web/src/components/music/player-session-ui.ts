export type PlayerSessionStatus = 'minimized' | 'modal-open';

type DerivePlayerPresentationInput = {
  hasSession: boolean;
  hasEmbedInteraction: boolean;
  isLoaded: boolean;
  providerLabel?: string;
  status?: PlayerSessionStatus;
};

export type PlayerPresentationState = {
  closeActionAriaLabel: 'Close player' | 'Minimize player';
  closeActionLabel: 'Close' | 'Minimize';
  isLoading: boolean;
  isMiniPlayerVisible: boolean;
  miniPlayerStatusLabel: string;
  openPlayerActionLabel: 'Open Player';
};

export const OPEN_PLAYER_ACTION_LABEL = 'Open Player' as const;

export function derivePlayerPresentationState({
  hasSession,
  hasEmbedInteraction,
  isLoaded,
  providerLabel,
  status,
}: DerivePlayerPresentationInput): PlayerPresentationState {
  const isReadyToMinimize = hasSession && isLoaded && hasEmbedInteraction;

  return {
    closeActionAriaLabel: isReadyToMinimize ? 'Minimize player' : 'Close player',
    closeActionLabel: isReadyToMinimize ? 'Minimize' : 'Close',
    isLoading: hasSession && !isLoaded,
    isMiniPlayerVisible: Boolean(status === 'minimized' && isReadyToMinimize),
    miniPlayerStatusLabel: hasSession && providerLabel ? `Player Ready · ${providerLabel}` : 'Player Ready',
    openPlayerActionLabel: OPEN_PLAYER_ACTION_LABEL,
  };
}
