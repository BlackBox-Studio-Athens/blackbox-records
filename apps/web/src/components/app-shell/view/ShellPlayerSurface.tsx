import { Square } from 'lucide-react';
import * as React from 'react';
import type { MouseEvent } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { type PlayerEmbedLayout, type PlayerProvider, type PlayerProviderId } from '../player-provider-data';
import { OPEN_PLAYER_ACTION_LABEL } from '../player-session-ui';
import { PLAYER_PROVIDER_LABELS } from '../player-shell/shell-player-view-state';

type ProviderLogoUrls = Record<PlayerProviderId, string>;

type ShellPlayerSurfaceProps = {
  activePlayerEmbedLayout: PlayerEmbedLayout | '';
  activePlayerProviderId: PlayerProviderId | '';
  activePlayerTitle: string;
  applyPlayerProvider: (provider: PlayerProvider, releaseTitle: string) => void;
  iframeFrameHostRef: { current: HTMLDivElement | null };
  isMiniPlayerVisible: boolean;
  isPlayerLoading: boolean;
  isPlayerModalOpen: boolean;
  markActivePlayerSurfaceAsInteracted: () => void;
  miniPlayerStatusLabel: string;
  modalCloseButtonRef: { current: HTMLButtonElement | null };
  onModalBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
  playerModalDismissActionLabel: 'Close' | 'Minimize';
  playerModalDismissAriaLabel: 'Close player' | 'Minimize player';
  playerProviders: PlayerProvider[];
  providerLogoUrls: ProviderLogoUrls;
};

export default function ShellPlayerSurface({
  activePlayerEmbedLayout,
  activePlayerProviderId,
  activePlayerTitle,
  applyPlayerProvider,
  iframeFrameHostRef,
  isMiniPlayerVisible,
  isPlayerLoading,
  isPlayerModalOpen,
  markActivePlayerSurfaceAsInteracted,
  miniPlayerStatusLabel,
  modalCloseButtonRef,
  onModalBackdropClick,
  playerModalDismissActionLabel,
  playerModalDismissAriaLabel,
  playerProviders,
  providerLogoUrls,
}: ShellPlayerSurfaceProps) {
  return (
    <>
      <div
        className="music-streaming-service-embedded-player-modal-overlay"
        data-state={isPlayerModalOpen ? 'open' : 'closed'}
        onClick={onModalBackdropClick}
      >
        <div
          aria-labelledby="music-streaming-service-embedded-player-modal-title"
          aria-modal="true"
          aria-busy={isPlayerLoading ? 'true' : 'false'}
          className="music-streaming-service-embedded-player-modal-card"
          role="dialog"
          data-music-streaming-service-embedded-player-active-provider={activePlayerProviderId}
          data-music-streaming-service-embedded-player-embed-layout={activePlayerEmbedLayout}
          data-music-streaming-service-embedded-player-loading={isPlayerLoading ? 'true' : 'false'}
        >
          <h2 className="accessibility-visually-hidden-text" id="music-streaming-service-embedded-player-modal-title">
            Music player
          </h2>
          <div className="music-streaming-service-embedded-player-modal-header">
            <div className="music-streaming-service-embedded-player-modal-topbar">
              <button
                ref={modalCloseButtonRef}
                aria-label={playerModalDismissAriaLabel}
                className="music-streaming-service-embedded-player-modal-close-button"
                data-music-streaming-service-embedded-player-modal-dismiss
                type="button"
              >
                {playerModalDismissActionLabel}
              </button>
            </div>
            <div
              className="music-streaming-service-embedded-player-provider-switcher grid grid-cols-2 gap-2"
              hidden={playerProviders.length < 2}
            >
              {(['bandcamp', 'tidal'] as PlayerProviderId[]).map((providerId) => {
                const provider = playerProviders.find((item) => item.id === providerId);

                return (
                  <button
                    key={providerId}
                    className="music-streaming-service-embedded-player-provider-button music-streaming-service-embedded-player-provider-button--has-logo inline-flex min-h-10 items-center justify-center rounded-md px-4 transition-colors"
                    type="button"
                    data-state={activePlayerProviderId === providerId ? 'active' : 'inactive'}
                    aria-label={PLAYER_PROVIDER_LABELS[providerId]}
                    hidden={!provider}
                    aria-pressed={activePlayerProviderId === providerId}
                    onClick={() => {
                      if (!provider) return;
                      applyPlayerProvider(provider, activePlayerTitle);
                    }}
                  >
                    <img
                      className="music-streaming-service-embedded-player-provider-button-logo h-4 w-auto"
                      src={providerLogoUrls[providerId]}
                      alt=""
                      aria-hidden="true"
                    />
                    <span className="accessibility-visually-hidden-text">{PLAYER_PROVIDER_LABELS[providerId]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="music-streaming-service-embedded-player-modal-frame"
            onPointerDownCapture={markActivePlayerSurfaceAsInteracted}
            onMouseDownCapture={markActivePlayerSurfaceAsInteracted}
            onTouchStartCapture={markActivePlayerSurfaceAsInteracted}
          >
            <div
              className="music-streaming-service-embedded-player-modal-loading-state absolute inset-0 flex items-center justify-center bg-background/92 px-3 py-3 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="music-streaming-service-embedded-player-loading-card">
                <div className="music-streaming-service-embedded-player-loading-card-status">
                  <Spinner className="size-3.5 text-foreground/72" />
                  <span>loading</span>
                </div>
                <div className="music-streaming-service-embedded-player-loading-card-bars" aria-hidden="true">
                  <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--long"></span>
                  <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--short"></span>
                </div>
              </div>
            </div>
            <div
              ref={iframeFrameHostRef}
              className="music-streaming-service-embedded-player-modal-frame-host flex w-full justify-center"
            ></div>
          </div>
        </div>
      </div>

      <div
        className="music-streaming-service-embedded-player-mini-player"
        data-state={isMiniPlayerVisible ? 'open' : 'closed'}
      >
        <div className="music-streaming-service-embedded-player-mini-player-copy">
          <p className="music-streaming-service-embedded-player-mini-player-provider uppercase text-muted-foreground">
            {miniPlayerStatusLabel}
          </p>
          <p className="music-streaming-service-embedded-player-mini-player-title text-foreground/92">
            {activePlayerTitle}
          </p>
        </div>
        <div className="music-streaming-service-embedded-player-mini-player-actions">
          <button
            aria-label="Open player"
            className="music-streaming-service-embedded-player-mini-player-action inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-border/80 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/78 transition-colors hover:bg-accent hover:text-accent-foreground"
            data-music-streaming-service-embedded-player-mini-player-open
            type="button"
          >
            {OPEN_PLAYER_ACTION_LABEL}
          </button>
          <button
            aria-label="Stop player"
            className="music-streaming-service-embedded-player-mini-player-action music-streaming-service-embedded-player-mini-player-action--icon inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-border/80 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            data-music-streaming-service-embedded-player-mini-player-stop
            type="button"
          >
            <Square className="size-3 fill-current" aria-hidden="true" strokeWidth={0} />
          </button>
        </div>
      </div>
    </>
  );
}
