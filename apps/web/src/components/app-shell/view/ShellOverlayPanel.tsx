import * as React from 'react';
import { X } from 'lucide-react';

import { LoadingStateBlock } from '@/components/ui/loading-feedback';
import type { OverlayRoute } from '@/lib/app-shell/routing';

import type { ShellOverlayState } from '../overlay/shell-overlay-navigation';

type ShellOverlayPanelProps = {
  closeButtonRef: { current: HTMLButtonElement | null };
  onClose: () => void;
  onReady: () => void;
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
  onReady,
  overlayState,
  scrollContainerRef,
}: ShellOverlayPanelProps) {
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;

  React.useEffect(() => {
    onReadyRef.current();
  }, []);

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
            <div className="app-shell-content-overlay__loading-state">
              <LoadingStateBlock
                className="min-h-64 w-full max-w-sm bg-background/70"
                title="Loading detail"
                description="Fetching the selected detail view."
              />
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
