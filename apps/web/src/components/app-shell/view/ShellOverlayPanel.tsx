import * as React from 'react';
import { X } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import type { OverlayRoute } from '@/lib/app-shell/routing';

import type { ShellOverlayState } from '../overlay/shell-overlay-navigation';

type ShellOverlayPanelProps = {
  closeButtonRef: { current: HTMLButtonElement | null };
  onClose: () => void;
  overlayState: ShellOverlayState | null;
  scrollContainerRef: { current: HTMLDivElement | null };
};

const OVERLAY_KIND_LABELS: Record<OverlayRoute['kind'], string> = {
  artists: 'artist',
  news: 'news',
  releases: 'release',
};

export default function ShellOverlayPanel({
  closeButtonRef,
  onClose,
  overlayState,
  scrollContainerRef,
}: ShellOverlayPanelProps) {
  return (
    <div
      className="app-shell-content-overlay"
      data-state={overlayState ? 'open' : 'closed'}
      aria-hidden={overlayState ? 'false' : 'true'}
    >
      <div className="app-shell-content-overlay__backdrop" onClick={onClose}></div>
      <div
        className="app-shell-content-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-busy={overlayState?.isLoading ? 'true' : 'false'}
      >
        <div className="app-shell-content-overlay__header">
          <span className="app-shell-content-overlay__eyebrow">
            {overlayState ? OVERLAY_KIND_LABELS[overlayState.route.kind] : 'detail'}
          </span>
          <button
            ref={closeButtonRef}
            className="app-shell-content-overlay__close-button"
            type="button"
            aria-label="Close detail view"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div ref={scrollContainerRef} className="app-shell-content-overlay__scroll-region">
          {overlayState?.isLoading ? (
            <div className="app-shell-content-overlay__loading-state" role="status" aria-live="polite">
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
          ) : (
            overlayState?.html && (
              <div
                className="app-shell-content-overlay__content"
                dangerouslySetInnerHTML={{ __html: overlayState.html }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
