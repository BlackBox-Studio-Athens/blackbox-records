import type { ActivePlayerSession } from './player-iframe-session';

type PlayerIframeBlurScheduler = Pick<Window, 'setTimeout'>;

type PlayerIframeBlurInteractionOptions = {
  getActiveElement: () => Element | null;
  getActiveSession: () => ActivePlayerSession | null;
  markPlayerSessionAsInteracted: (embedUrl: string) => void;
  scheduler: PlayerIframeBlurScheduler;
};

export function schedulePlayerIframeBlurInteractionCheck({
  getActiveElement,
  getActiveSession,
  markPlayerSessionAsInteracted,
  scheduler,
}: PlayerIframeBlurInteractionOptions) {
  scheduler.setTimeout(() => {
    const activeSession = getActiveSession();
    if (!activeSession || activeSession.status !== 'modal-open') return;

    if (getActiveElement() === activeSession.iframeElement) {
      markPlayerSessionAsInteracted(activeSession.embedUrl);
    }
  }, 0);
}
