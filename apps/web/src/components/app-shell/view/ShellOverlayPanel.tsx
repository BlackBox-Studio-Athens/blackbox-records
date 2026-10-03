import * as React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingStateBlock } from '@/components/ui/loading-feedback';
import type { OverlayRoute } from '@/components/app-shell/routing';

import type { ShellOverlayState } from '../overlay/shell-overlay-navigation';
import { acquireLenisModalLock } from '../lenis-scroll';

type ShellOverlayPanelProps = {
  closeButtonRef: { current: HTMLButtonElement | null };
  onClose: () => void;
  onExitComplete: () => void;
  onReady: () => void;
  overlayState: ShellOverlayState | null;
  scrollContainerRef: { current: HTMLDivElement | null };
};

const OVERLAY_KIND_LABELS: Record<OverlayRoute['kind'], string> = {
  artists: 'artist',
  news: 'news',
  releases: 'release',
};

// The longest close transition in global.css is 220 ms; a missed transitionend (a hidden tab) still unmounts.
const OVERLAY_EXIT_FALLBACK_MS = 400;

function hasRunningTransition(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const seconds = (value: string) => value.split(',').map((part) => Number.parseFloat(part) || 0);
  const durations = seconds(style.transitionDuration);
  const delays = seconds(style.transitionDelay);
  return durations.some((duration, index) => duration + (delays[index % delays.length] ?? 0) > 0);
}

export default function ShellOverlayPanel({
  closeButtonRef,
  onClose,
  onExitComplete,
  onReady,
  overlayState,
  scrollContainerRef,
}: ShellOverlayPanelProps) {
  const onReadyRef = React.useRef(onReady);
  const onExitCompleteRef = React.useRef(onExitComplete);
  const unlockScrollRef = React.useRef<(() => void) | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  // Closing keeps the last detail rendered with data-state="closed" until the CSS exit transition ends.
  const [previousOverlayState, setPreviousOverlayState] = React.useState(overlayState);
  const [exitingOverlayState, setExitingOverlayState] = React.useState<ShellOverlayState | null>(null);
  if (previousOverlayState !== overlayState) {
    setPreviousOverlayState(overlayState);
    setExitingOverlayState(overlayState ? null : previousOverlayState);
  }
  const renderedOverlayState = overlayState ?? exitingOverlayState;
  const isOpen = overlayState !== null;

  React.useEffect(() => {
    onReadyRef.current = onReady;
    onExitCompleteRef.current = onExitComplete;
  });

  React.useEffect(() => {
    onReadyRef.current();
  }, [overlayState?.href, overlayState?.html, overlayState?.isLoading]);

  React.useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (overlayState && scrollRoot && !unlockScrollRef.current) {
      unlockScrollRef.current = acquireLenisModalLock(scrollRoot);
    }
  }, [overlayState, scrollContainerRef]);

  React.useEffect(
    () => () => {
      unlockScrollRef.current?.();
      unlockScrollRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    if (isOpen || !exitingOverlayState) return;

    let finished = false;
    const root = rootRef.current;
    const finishExit = () => {
      if (finished) return;
      finished = true;
      setExitingOverlayState(null);
      unlockScrollRef.current?.();
      unlockScrollRef.current = null;
      onExitCompleteRef.current();
    };
    if (!root || !hasRunningTransition(root)) {
      finishExit();
      return;
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === root && event.propertyName === 'opacity') finishExit();
    };
    root.addEventListener('transitionend', handleTransitionEnd);
    const fallbackTimer = window.setTimeout(finishExit, OVERLAY_EXIT_FALLBACK_MS);
    return () => {
      finished = true;
      root.removeEventListener('transitionend', handleTransitionEnd);
      window.clearTimeout(fallbackTimer);
    };
  }, [exitingOverlayState, isOpen]);

  if (!renderedOverlayState) return null;

  return (
    <div
      ref={rootRef}
      className="app-shell-content-overlay"
      data-state={isOpen ? 'open' : 'closed'}
      aria-hidden={isOpen ? 'false' : 'true'}
      inert={!isOpen}
    >
      <div className="app-shell-content-overlay__backdrop" onClick={onClose}></div>
      <div
        className="app-shell-content-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-busy={renderedOverlayState.isLoading ? 'true' : 'false'}
      >
        <div className="app-shell-content-overlay__header">
          <span className="app-shell-content-overlay__eyebrow">
            {OVERLAY_KIND_LABELS[renderedOverlayState.route.kind]}
          </span>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="outline"
            size="icon"
            aria-label="Close detail view"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div ref={scrollContainerRef} className="app-shell-content-overlay__scroll-region" data-lenis-scroll-root>
          {renderedOverlayState.isLoading ? (
            <div className="app-shell-content-overlay__loading-state">
              <LoadingStateBlock
                className="min-h-64 w-full max-w-sm bg-background/70"
                title="Loading detail"
                description="Fetching the selected detail view."
              />
            </div>
          ) : (
            renderedOverlayState.html && (
              <div
                className="app-shell-content-overlay__content"
                dangerouslySetInnerHTML={{ __html: renderedOverlayState.html }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
