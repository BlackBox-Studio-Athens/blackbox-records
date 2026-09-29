import { describe, expect, it } from 'vitest';

import { derivePlayerPresentationState, OPEN_PLAYER_ACTION_LABEL } from './player-session-ui';

describe('player session UI state', () => {
  it('keeps the mini player hidden when the session was never interacted with', () => {
    const state = derivePlayerPresentationState({
      hasSession: true,
      hasEmbedInteraction: false,
      isLoaded: true,
      providerLabel: 'Bandcamp',
      status: 'minimized',
    });

    expect(state.isMiniPlayerVisible).toBe(false);
    expect(state.closeActionLabel).toBe('Close');
  });

  it('shows the mini player only after embed interaction and minimize', () => {
    const state = derivePlayerPresentationState({
      hasSession: true,
      hasEmbedInteraction: true,
      isLoaded: true,
      providerLabel: 'Bandcamp',
      status: 'minimized',
    });

    expect(state.isMiniPlayerVisible).toBe(true);
    expect(state.miniPlayerStatusLabel).toBe('Player Ready · Bandcamp');
  });

  it('changes the modal dismissal copy to minimize after interaction', () => {
    const state = derivePlayerPresentationState({
      hasSession: true,
      hasEmbedInteraction: true,
      isLoaded: true,
      providerLabel: 'Tidal',
      status: 'modal-open',
    });

    expect(state.closeActionLabel).toBe('Minimize');
    expect(state.closeActionAriaLabel).toBe('Minimize player');
  });

  it('keeps the open player action label stable', () => {
    const state = derivePlayerPresentationState({
      hasSession: true,
      hasEmbedInteraction: true,
      isLoaded: true,
      providerLabel: 'Bandcamp',
      status: 'minimized',
    });

    expect(state.openPlayerActionLabel).toBe(OPEN_PLAYER_ACTION_LABEL);
  });
});
