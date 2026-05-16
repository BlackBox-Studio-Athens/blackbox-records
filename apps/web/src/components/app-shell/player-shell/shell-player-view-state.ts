import type { ActivePlayerSession } from '../player-iframe-session';
import type { PlayerEmbedLayout, PlayerProviderId } from '../player-provider-data';
import { derivePlayerPresentationState } from '../player-session-ui';

export const PLAYER_PROVIDER_LABELS: Record<PlayerProviderId, string> = {
  bandcamp: 'Bandcamp',
  tidal: 'Tidal',
};

export type PlayerShellViewState = {
  activePlayerEmbedLayout: PlayerEmbedLayout | '';
  activePlayerProviderId: PlayerProviderId | '';
  activePlayerTitle: string;
  isMiniPlayerVisible: boolean;
  isPlayerLoading: boolean;
  miniPlayerStatusLabel: string;
  playerModalDismissAriaLabel: 'Close player' | 'Minimize player';
  playerModalDismissActionLabel: 'Close' | 'Minimize';
};

export function derivePlayerShellViewState(activeSession: ActivePlayerSession | null): PlayerShellViewState {
  if (!activeSession) {
    const presentation = derivePlayerPresentationState({
      hasEmbedInteraction: false,
      hasSession: false,
      isLoaded: false,
    });

    return {
      activePlayerEmbedLayout: '',
      activePlayerProviderId: '',
      activePlayerTitle: '',
      isMiniPlayerVisible: presentation.isMiniPlayerVisible,
      isPlayerLoading: presentation.isLoading,
      miniPlayerStatusLabel: presentation.miniPlayerStatusLabel,
      playerModalDismissActionLabel: presentation.closeActionLabel,
      playerModalDismissAriaLabel: presentation.closeActionAriaLabel,
    };
  }

  const isLoaded = activeSession.iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState === 'loaded';
  const presentation = derivePlayerPresentationState({
    hasEmbedInteraction: activeSession.hasEmbedInteraction,
    hasSession: true,
    isLoaded,
    providerLabel: PLAYER_PROVIDER_LABELS[activeSession.providerId],
    status: activeSession.status,
  });

  return {
    activePlayerEmbedLayout: activeSession.embedLayout,
    activePlayerProviderId: activeSession.providerId,
    activePlayerTitle: activeSession.releaseTitle,
    isMiniPlayerVisible: presentation.isMiniPlayerVisible,
    isPlayerLoading: presentation.isLoading,
    miniPlayerStatusLabel: presentation.miniPlayerStatusLabel,
    playerModalDismissActionLabel: presentation.closeActionLabel,
    playerModalDismissAriaLabel: presentation.closeActionAriaLabel,
  };
}
