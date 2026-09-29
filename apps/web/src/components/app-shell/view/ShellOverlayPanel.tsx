import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

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
  const shouldReduceMotion = useReducedMotion() === true;
  onReadyRef.current = onReady;
  onExitCompleteRef.current = onExitComplete;

  React.useEffect(() => {
    onReadyRef.current();
  }, []);

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

  return (
    <AnimatePresence
      onExitComplete={() => {
        unlockScrollRef.current?.();
        unlockScrollRef.current = null;
        onExitCompleteRef.current();
      }}
    >
      {overlayState && (
        <motion.div
          key="detail-overlay"
          className="app-shell-content-overlay"
          data-state="open"
          aria-hidden="false"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="app-shell-content-overlay__backdrop" onClick={onClose}></div>
          <motion.div
            className="app-shell-content-overlay__panel"
            role="dialog"
            aria-modal="true"
            aria-busy={overlayState.isLoading ? 'true' : 'false'}
            initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="app-shell-content-overlay__header">
              <span className="app-shell-content-overlay__eyebrow">{OVERLAY_KIND_LABELS[overlayState.route.kind]}</span>
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
            <div ref={scrollContainerRef} className="app-shell-content-overlay__scroll-region" data-lenis-scroll-root>
              {overlayState.isLoading ? (
                <div className="app-shell-content-overlay__loading-state">
                  <LoadingStateBlock
                    className="min-h-64 w-full max-w-sm bg-background/70"
                    title="Loading detail"
                    description="Fetching the selected detail view."
                  />
                </div>
              ) : (
                overlayState.html && (
                  <div
                    className="app-shell-content-overlay__content"
                    dangerouslySetInnerHTML={{ __html: overlayState.html }}
                  />
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
