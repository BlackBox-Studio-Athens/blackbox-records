import { createPortal } from 'react-dom';
import { Square } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import MusicEqualizer from '@/components/music/MusicEqualizer';
import { type PlayerProvider, type PlayerProviderId } from '../../music/player-provider-data';
import { OPEN_PLAYER_ACTION_LABEL } from '../../music/player-session-ui';
import { PLAYER_PROVIDER_LABELS } from '../player-shell/shell-player-view-state';

type ProviderLogoUrls = Record<PlayerProviderId, string>;

// Stop destroys the session and cannot be undone, so it asks once in place: a first press arms it for this long.
export const STOP_CONFIRM_WINDOW_MS = 3000;
export const STOP_ARMED_LABEL = 'Stop?';
export const STOP_ARMED_ANNOUNCEMENT = 'Press Stop again to end the player.';

type ShellPlayerSurfaceProps = {
  activePlayerProviderId: PlayerProviderId | '';
  activePlayerTitle: string;
  applyPlayerProvider: (provider: PlayerProvider) => void;
  headerContainer: HTMLElement | null;
  isMiniPlayerVisible: boolean;
  isPlayerLoading: boolean;
  miniPlayerStatusLabel: string;
  modalCloseButtonRef: { current: HTMLButtonElement | null };
  onReady: () => void;
  playerModalDismissActionLabel: 'Close' | 'Minimize';
  playerModalDismissAriaLabel: 'Close player' | 'Minimize player';
  playerProviders: PlayerProvider[];
  providerLogoUrls: ProviderLogoUrls;
};

export default function ShellPlayerSurface({
  activePlayerProviderId,
  activePlayerTitle,
  applyPlayerProvider,
  headerContainer,
  isMiniPlayerVisible,
  isPlayerLoading,
  miniPlayerStatusLabel,
  modalCloseButtonRef,
  onReady,
  playerModalDismissActionLabel,
  playerModalDismissAriaLabel,
  playerProviders,
  providerLogoUrls,
}: ShellPlayerSurfaceProps) {
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;
  const [isStopArmed, setIsStopArmed] = React.useState(false);

  React.useEffect(() => {
    if (!isStopArmed) return;
    const timer = window.setTimeout(() => setIsStopArmed(false), STOP_CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [isStopArmed]);

  React.useEffect(() => {
    if (!isMiniPlayerVisible) setIsStopArmed(false);
  }, [isMiniPlayerVisible]);

  React.useEffect(() => {
    onReadyRef.current();
  }, []);

  const header = (
    <div className="music-streaming-service-embedded-player-modal-header">
      <div className="music-streaming-service-embedded-player-modal-topbar">
        <div className="music-player-heading">
          <MusicEqualizer />
          <div className="music-player-heading__copy">
            <p className="music-player-heading__title">{activePlayerTitle}</p>
            <p className="music-player-heading__status" role="status">
              {isPlayerLoading ? 'Loading player' : miniPlayerStatusLabel}
            </p>
          </div>
        </div>
        <Button
          ref={modalCloseButtonRef}
          aria-label={playerModalDismissAriaLabel}
          data-music-streaming-service-embedded-player-modal-dismiss
          type="button"
          variant="outline"
        >
          {playerModalDismissActionLabel}
        </Button>
      </div>
      <div
        className="music-streaming-service-embedded-player-provider-switcher grid grid-cols-2 gap-2"
        hidden={playerProviders.length < 2}
      >
        {(['bandcamp', 'tidal'] as PlayerProviderId[]).map((providerId) => {
          const provider = playerProviders.find((item) => item.id === providerId);

          return (
            <Button
              key={providerId}
              className="music-streaming-service-embedded-player-provider-button"
              type="button"
              variant="chip"
              aria-pressed={activePlayerProviderId === providerId}
              data-state={activePlayerProviderId === providerId ? 'active' : 'inactive'}
              aria-label={PLAYER_PROVIDER_LABELS[providerId]}
              hidden={!provider}
              onClick={() => {
                if (!provider) return;
                applyPlayerProvider(provider);
              }}
            >
              <img
                className="music-streaming-service-embedded-player-provider-button-logo h-4 w-auto"
                src={providerLogoUrls[providerId]}
                alt=""
                aria-hidden="true"
              />
              <span className="accessibility-visually-hidden-text">{PLAYER_PROVIDER_LABELS[providerId]}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
  return (
    <>
      {headerContainer ? createPortal(header, headerContainer) : header}
      <div
        className="music-streaming-service-embedded-player-mini-player"
        data-state={isMiniPlayerVisible ? 'open' : 'closed'}
        aria-hidden={!isMiniPlayerVisible}
        inert={!isMiniPlayerVisible}
      >
        <div className="music-streaming-service-embedded-player-mini-player-copy">
          <p className="music-streaming-service-embedded-player-mini-player-provider uppercase text-muted-foreground">
            <MusicEqualizer />
            <span>{miniPlayerStatusLabel}</span>
          </p>
          <p className="music-streaming-service-embedded-player-mini-player-title text-foreground/92">
            {activePlayerTitle}
          </p>
        </div>
        <div className="music-streaming-service-embedded-player-mini-player-actions">
          <Button
            aria-label="Open player"
            data-music-streaming-service-embedded-player-mini-player-open
            type="button"
            variant="outline"
          >
            {OPEN_PLAYER_ACTION_LABEL}
          </Button>
          {/* Unarmed, the button carries no stop attribute, so the shell's document router ignores the first press
              and this handler arms it; armed, the attribute routes the second press to the existing Stop. */}
          <Button
            aria-label="Stop player"
            data-music-streaming-service-embedded-player-mini-player-stop={isStopArmed ? '' : undefined}
            data-stop-armed={isStopArmed ? '' : undefined}
            size="icon"
            type="button"
            variant={isStopArmed ? 'default' : 'outline'}
            className={isStopArmed ? 'text-[13px] tracking-[0.04em]' : undefined}
            onClick={(event) => {
              if (!isStopArmed && !event.defaultPrevented) setIsStopArmed(true);
            }}
          >
            {isStopArmed ? (
              STOP_ARMED_LABEL
            ) : (
              <Square className="size-3 fill-current" aria-hidden="true" strokeWidth={0} />
            )}
          </Button>
          <span className="sr-only" aria-live="polite">
            {isStopArmed ? STOP_ARMED_ANNOUNCEMENT : ''}
          </span>
        </div>
      </div>
    </>
  );
}
